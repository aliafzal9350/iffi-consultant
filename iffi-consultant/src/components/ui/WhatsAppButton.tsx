'use client';
import { WhatsAppIcon } from './BrandIcons';
import { buttonClass, type Common } from './buttonStyles';
import { track } from '@/lib/analytics';
import { waHref, type WhatsAppKey } from '@/lib/whatsapp';

export interface WhatsAppButtonProps extends Omit<Common, 'icon'> {
  messageKey: WhatsAppKey;
  vars?: Record<string, string | number>;
  label?: string;
}

/** Primary CTA: opens WhatsApp in a new tab with a pre-filled message from site.whatsapp.messages. */
export function WhatsAppButton({ messageKey, vars, label, children, variant = 'whatsapp', size = 'md', className }: WhatsAppButtonProps) {
  return (
    <a
      href={waHref(messageKey, vars)}
      target="_blank"
      rel="noopener"
      className={buttonClass(variant, size, className)}
      onClick={() => track('whatsapp_click', { context: messageKey })}
    >
      <WhatsAppIcon size={size === 'sm' ? 16 : 19} className="shrink-0" />
      {children ?? label ?? 'Chat on WhatsApp'}
    </a>
  );
}
