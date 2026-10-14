/** Deterministic navy and gold cover art per slug: no stock photos, no hot-linked images. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Topic shown on each cover, so the art says what the guide is about. */
const TOPIC: Record<string, string> = {
  'why-study-in-china-2026': 'Why China',
  'csc-scholarship-complete-guide': 'Scholarships',
  'top-scholarships-for-international-students-in-china': 'Scholarships',
  'cost-of-studying-in-china': 'Costs',
  'study-engineering-in-china-guide': 'Engineering',
  'top-10-chinese-universities-for-international-students-2026': 'Universities',
  'how-to-apply-for-chinese-student-visa-2026': 'Student visa',
  'china-student-visa-x1-x2': 'Student visa',
  'why-choose-iffi-consultant-for-study-in-china': 'About us',
};

export function BlogCover({ slug, className, label, topic = true }: { slug: string; className?: string; label?: string; topic?: boolean }) {
  const h = hash(slug);
  const rand = rng(h);
  const variant = h % 4;
  const W = 800;
  const H = 450;
  const shapes: React.ReactNode[] = [];

  if (variant === 0) {
    // concentric arcs rising from a corner, like a seal impression
    const cx = 120 + rand() * 560;
    for (let i = 1; i <= 14; i++) shapes.push(<circle key={i} cx={cx} cy={H + 40} r={i * 34} fill="none" stroke="#c8a24c" strokeOpacity={0.12 + (i % 4 === 0 ? 0.35 : 0)} strokeWidth={i % 4 === 0 ? 1.6 : 1} />);
  } else if (variant === 1) {
    // key-fret lattice
    const s = 40;
    for (let x = 0; x < W; x += s)
      for (let y = 0; y < H; y += s)
        if (rand() > 0.55)
          shapes.push(<path key={`${x}-${y}`} d={`M${x + 8} ${y + 32}V${y + 8}H${x + 32}V${y + 26}H${x + 16}V${y + 18}`} fill="none" stroke="#c8a24c" strokeOpacity={0.18 + rand() * 0.3} strokeWidth={1.2} />);
  } else if (variant === 2) {
    // diagonal hairlines with one bright band
    const bright = Math.floor(rand() * 18);
    for (let i = -10; i < 30; i++) shapes.push(<line key={i} x1={i * 40} y1={0} x2={i * 40 - 300} y2={H} stroke="#c8a24c" strokeOpacity={i === bright ? 0.75 : 0.1} strokeWidth={i === bright ? 2 : 1} />);
  } else {
    // dotted constellation, like the city beacons on the map
    for (let i = 0; i < 70; i++) {
      const r = rand();
      shapes.push(<circle key={i} cx={rand() * W} cy={rand() * H} r={r > 0.93 ? 4 : 1.6} fill={r > 0.93 ? '#e0bd6b' : '#cdd6e6'} fillOpacity={r > 0.93 ? 0.9 : 0.25} />);
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`g-${h}`} cx={`${20 + (h % 60)}%`} cy="10%" r="90%">
          <stop offset="0%" stopColor="#1c3a6b" />
          <stop offset="100%" stopColor="#0d1f3f" />
        </radialGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#g-${h})`} />
      {shapes}
      {topic && TOPIC[slug] && (
        <g transform="translate(48 64)" style={{ fontFamily: 'var(--font-sans)' }}>
          <rect x={0} y={-6} width={36} height={2} fill="#e0bd6b" />
          <text x={50} y={2} fill="#e0bd6b" fontSize={22} fontWeight={600} letterSpacing={4}>
            {TOPIC[slug].toUpperCase()}
          </text>
        </g>
      )}
    </svg>
  );
}
