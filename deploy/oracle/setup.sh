#!/usr/bin/env bash
# One-time setup and every later update of the IFFI Consultant website on an Oracle Cloud Ubuntu server.
#
#   sudo ./deploy/oracle/setup.sh                      # no domain yet: serve on http://<server-ip>
#   sudo ./deploy/oracle/setup.sh ifficonsultant.com   # https://www.ifficonsultant.com (apex redirects to www)
#
# Safe to run again: it pulls nothing by itself (run `git pull` first), rebuilds the site and restarts it.
set -euo pipefail

DOMAIN="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$HERE/../../iffi-consultant" && pwd)"
ENV_FILE="$APP_DIR/.env.production"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run with sudo: sudo $0 $*" >&2
  exit 1
fi

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "==> Installing Docker"
  curl -fsSL https://get.docker.com | sh
  if [ -n "${SUDO_USER:-}" ]; then usermod -aG docker "$SUDO_USER"; fi
fi

# 2. Firewall. Oracle's Ubuntu images block every port except SSH in iptables, on top of the
#    VCN security list, so ports 80 and 443 have to be opened here as well.
for port in 80 443; do
  if ! iptables -C INPUT -p tcp --dport "$port" -j ACCEPT 2>/dev/null; then
    echo "==> Opening port $port"
    iptables -I INPUT 1 -p tcp --dport "$port" -j ACCEPT
  fi
done
iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null || iptables -I INPUT 1 -p udp --dport 443 -j ACCEPT
if command -v netfilter-persistent >/dev/null 2>&1; then
  netfilter-persistent save >/dev/null
else
  apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables-persistent >/dev/null && netfilter-persistent save >/dev/null
fi

# 3. Swap on small servers, so the production build does not run out of memory
if [ "$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)" -lt 3500 ] && ! swapon --show | grep -q /swapfile; then
  echo "==> Adding a 4 GB swap file"
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# 4. Settings
if [ ! -f "$ENV_FILE" ]; then
  cp "$APP_DIR/.env.example" "$ENV_FILE"
  echo
  echo "Created $ENV_FILE from .env.example."
  echo "Fill in the values (Supabase keys, SMTP password, ...) with:  nano $ENV_FILE"
  echo "then run this script again."
  exit 1
fi

# 5. Web server configuration
if [ -n "$DOMAIN" ]; then
  DOMAIN="${DOMAIN#www.}"
  cat > "$HERE/Caddyfile" <<CADDY
www.$DOMAIN {
	encode zstd gzip
	reverse_proxy app:3000
}

$DOMAIN {
	redir https://www.$DOMAIN{uri} permanent
}
CADDY
  URL="https://www.$DOMAIN"
else
  cat > "$HERE/Caddyfile" <<CADDY
:80 {
	encode zstd gzip
	reverse_proxy app:3000
}
CADDY
  URL="http://$(curl -fsS -4 https://ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
fi

# 6. Build and start
echo "==> Building the site (the first build takes a few minutes)"
docker compose -f "$HERE/docker-compose.yml" up -d --build --remove-orphans
docker image prune -f >/dev/null

echo
echo "Done. The site is live at $URL"
if [ -n "$DOMAIN" ]; then
  echo "(HTTPS starts working once www.$DOMAIN and $DOMAIN point at this server.)"
fi
