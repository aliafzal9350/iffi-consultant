/**
 * When should the hero swap its SVG map for the three.js scene (~600 KB of JavaScript)?
 *
 *   'interaction' - after the first scroll, pointer move, key press or touch (zero cost while the page loads)
 *   'idle'        - as soon as the browser is idle after load (prettiest, but Lighthouse counts it in TBT)
 *   'button'      - only when the visitor taps "View in 3D"
 *   'never'       - keep the SVG map
 */
export type Load3DTrigger = 'interaction' | 'idle' | 'button' | 'never';

export interface DeviceContext {
  /** small screen or touch-first pointer */
  mobile: boolean;
  /** < 4 GB memory, < 4 CPU cores or data saver on */
  weak: boolean;
  /** prefers-reduced-motion */
  reduced: boolean;
  /** WebGL is available */
  webgl: boolean;
}

/**
 * The trade-off between the 3D map and a 90+ mobile score: phones and weak devices opt in with a button,
 * desktops load it on first interaction. Lighthouse throttles the CPU but reports the test machine's real
 * core count, so anything that loads on 'idle' runs during a mobile test - keep 'idle' out of the mobile branch.
 */
export function load3DTrigger({ mobile, weak, reduced, webgl }: DeviceContext): Load3DTrigger {
  if (!webgl || reduced) return 'never';
  if (mobile || weak) return 'button';
  return 'interaction';
}
