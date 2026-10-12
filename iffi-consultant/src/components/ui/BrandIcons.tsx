/** Brand marks that Lucide does not ship. Simple single-colour paths, sized like Lucide icons. */
interface Props {
  size?: number;
  className?: string;
}

export function WhatsAppIcon({ size = 20, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 0 1-1.44-5.02c0-5.2 4.24-9.44 9.45-9.44 2.52 0 4.9.99 6.68 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.46 9.44m8.05-17.5A11.3 11.3 0 0 0 12.05.67C5.78.67.67 5.78.67 12.06c0 2 .53 3.96 1.52 5.69L.58 23.33l5.7-1.5a11.36 11.36 0 0 0 5.77 1.48c6.27 0 11.38-5.11 11.38-11.39 0-3.04-1.18-5.9-3.33-8.04" />
    </svg>
  );
}

export function FacebookIcon({ size = 20, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13.5 21.9v-7.3h2.46l.37-2.86H13.5V9.92c0-.83.23-1.39 1.42-1.39h1.51V5.97a20.3 20.3 0 0 0-2.2-.11c-2.18 0-3.67 1.33-3.67 3.77v2.1H8.1v2.86h2.46v7.3A10 10 0 1 1 13.5 21.9" />
    </svg>
  );
}

export function InstagramIcon({ size = 20, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
