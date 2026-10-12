/**
 * Regenerates public/og-image.png (1200 x 630, the link preview on WhatsApp, Facebook, LinkedIn, X).
 * Brand, domain, phone and counts come from src/data, the map from the same geometry as the site.
 *
 *   CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" PUPPETEER_PATH=<path to puppeteer-core> node scripts/og-image.mjs
 *
 * Needs any local Chrome plus puppeteer-core (not a project dependency: install it anywhere and point
 * PUPPETEER_PATH at it, or run `npm i -D puppeteer-core`). Re-run after the brand, domain or counts change.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = (f) => JSON.parse(fs.readFileSync(path.join(root, 'src/data', f), 'utf8'));
const site = data('site.json');
const meta = data('meta.json');
const geo = data('china-provinces.geo.json');
const provinces = data('provinces.json');

/* map: plain Mercator fitted into the right-hand panel (same projection as src/components/map/geo.ts) */
const W = 600;
const H = 540;
const RAD = Math.PI / 180;
const mx = (lng) => lng * RAD;
const my = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));
let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
for (const f of geo.features)
  for (const poly of f.geometry.coordinates)
    for (const [lng, lat] of poly[0]) {
      x0 = Math.min(x0, mx(lng)); x1 = Math.max(x1, mx(lng));
      y0 = Math.min(y0, my(lat)); y1 = Math.max(y1, my(lat));
    }
const k = Math.min(W / (x1 - x0), H / (y1 - y0));
const ox = (W - (x1 - x0) * k) / 2;
const oy = (H - (y1 - y0) * k) / 2;
const project = ([lng, lat]) => [ox + (mx(lng) - x0) * k, oy + (y1 - my(lat)) * k];
const d = (f) =>
  f.geometry.coordinates
    .map((poly) => poly.map((ring) => 'M' + ring.map((p) => project(p).map((v) => v.toFixed(1)).join(',')).join('L') + 'Z').join(''))
    .join('');
const has = new Set(provinces.map((p) => p.name));
const shapes = geo.features
  .sort((a, b) => Number(has.has(a.properties.name)) - Number(has.has(b.properties.name)))
  .map((f) => {
    const on = has.has(f.properties.name);
    return `<path d="${d(f)}" fill="${on ? '#c8a24c' : '#1c3a6b'}" stroke="${on ? '#e0bd6b' : '#2a4a80'}" stroke-width="1" stroke-linejoin="round"/>`;
  })
  .join('');
const dots = provinces
  .flatMap((p) => p.cities)
  .map((c) => {
    const [x, y] = project([c.lng, c.lat]);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#fff6dc" stroke="#0d1f3f" stroke-width="1.2"/>`;
  })
  .join('');

const crest = fs.readFileSync(path.join(root, 'src/assets/brand/logo-mark-gold.png')).toString('base64');
const domain = site.seo.siteUrl.replace(/^https?:\/\/(www\.)?/, '');
const c = meta.counts;

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,600&family=Poppins:wght@400;500&display=block" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;overflow:hidden;font-family:Poppins,sans-serif;color:#cdd6e6;
    background:radial-gradient(circle at 92% 8%,rgba(224,189,107,.22),transparent 45%),linear-gradient(135deg,#0d1f3f 0%,#13294f 55%,#1c3a6b 100%)}
  .copy{position:absolute;left:66px;top:62px;width:560px}
  .brand{display:flex;align-items:center;gap:16px}
  .brand img{width:58px;height:58px}
  .word b{display:block;font:600 34px/1 Fraunces,serif;color:#fff;letter-spacing:-.01em}
  .word small{display:block;margin-top:6px;font:500 12.5px/1 Poppins,sans-serif;letter-spacing:.32em;color:#e0bd6b}
  h1{margin-top:66px;font:600 64px/1.05 Fraunces,serif;color:#fff;letter-spacing:-.015em}
  h1 em{display:block;font-style:italic;color:#e0bd6b}
  .sub{margin-top:26px;font-size:21px;color:#cdd6e6}
  .pills{display:flex;gap:14px;margin-top:28px}
  .pills span{border:1.5px solid rgba(224,189,107,.7);border-radius:999px;padding:9px 20px;font-size:21px;color:#fff}
  .foot{position:absolute;left:66px;bottom:44px;width:460px;padding-top:18px;border-top:1px solid rgba(205,214,230,.25);font-size:16px;color:#cdd6e6}
  .map{position:absolute;right:20px;top:46px;filter:drop-shadow(0 18px 30px rgba(5,12,28,.55))}
</style></head><body>
  <div class="copy">
    <div class="brand"><img src="data:image/png;base64,${crest}" alt=""><div class="word"><b>${site.brand.wordmarkMain}</b><small>${site.brand.wordmarkSub}</small></div></div>
    <h1>${site.hero.headline}<em>${site.hero.headlineAccent}</em></h1>
    <p class="sub">Admissions · CSC &amp; university scholarships · X1 visa</p>
    <div class="pills"><span>${c.programmes} programmes</span><span>${c.provinces} provinces</span><span>${c.cities} cities</span></div>
  </div>
  <p class="foot">${domain} &nbsp;·&nbsp; WhatsApp ${site.contact.phoneDisplay}</p>
  <svg class="map" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${shapes}${dots}</svg>
</body></html>`;

const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_PATH || 'puppeteer-core');
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'networkidle0' });
await page.evaluate(() => document.fonts.ready);
const out = path.join(root, 'public/og-image.png');
await page.screenshot({ path: out, type: 'png' });
await browser.close();
console.log('wrote', path.relative(root, out), fs.statSync(out).size, 'bytes');
