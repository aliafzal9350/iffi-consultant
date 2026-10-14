import { site, whatsappLink } from '@/data/core';

export type WhatsAppKey = keyof typeof site.whatsapp.messages;

/** Fill a site.whatsapp.messages template: "I am interested in: {service}" */
export function waMessage(key: WhatsAppKey, vars: Record<string, string | number> = {}): string {
  const template = site.whatsapp.messages[key];
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : ''));
}

export function waHref(key: WhatsAppKey, vars?: Record<string, string | number>): string {
  return whatsappLink(waMessage(key, vars));
}
