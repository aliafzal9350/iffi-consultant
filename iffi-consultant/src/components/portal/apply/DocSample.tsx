/**
 * "What it should look like": a drawn sample of each document with numbered gold pins. The numbers match the
 * numbered points in lib/portal/documents.ts, which are listed beside the drawing. Schematic on purpose (grey bars
 * for text, made-up codes) and marked SAMPLE, so nobody mistakes it for a real document.
 */
import type { ReactNode } from 'react';
import type { SampleKind } from '@/lib/portal/documents';

const C = {
  paper: '#ffffff',
  edge: '#d9dfea',
  bar: '#e3e8f0',
  ink: '#aab5c8',
  navy: '#0d1f3f',
  gold: '#c8a24c',
  goldSoft: '#f7efdd',
  tint: '#f2f5fa',
  mist: '#cdd6e6',
  red: '#c0392b',
};
const SANS = 'Poppins, system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

type Pt = [number, number];

function Bar({ x, y, w, h = 5, dark, fill }: { x: number; y: number; w: number; h?: number; dark?: boolean; fill?: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={fill ?? (dark ? C.ink : C.bar)} />;
}

function Lines({ x, y, widths, gap = 10, h = 4.5, dark }: { x: number; y: number; widths: number[]; gap?: number; h?: number; dark?: boolean }) {
  return (
    <>
      {widths.map((w, i) => (
        <Bar key={i} x={x} y={y + i * gap} w={w} h={h} dark={dark} />
      ))}
    </>
  );
}

function Page({ x, y, w, h, stack = 0 }: { x: number; y: number; w: number; h: number; stack?: number }) {
  return (
    <>
      {Array.from({ length: stack }, (_, i) => stack - i).map((k) => (
        <rect key={k} x={x + k * 5} y={y + k * 5} width={w} height={h} rx={6} fill={C.paper} stroke={C.edge} />
      ))}
      <rect x={x} y={y} width={w} height={h} rx={6} fill={C.paper} stroke={C.edge} />
    </>
  );
}

function Face({ x, y, w, h, bg = C.tint }: { x: number; y: number; w: number; h: number; bg?: string }) {
  const cx = x + w / 2;
  const r = w * 0.22;
  const cy = y + h * 0.4;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={bg} stroke={C.edge} />
      <path d={`M${x + w * 0.1} ${y + h} C ${x + w * 0.12} ${cy + r * 1.5}, ${x + w * 0.88} ${cy + r * 1.5}, ${x + w * 0.9} ${y + h} Z`} fill={C.mist} />
      <circle cx={cx} cy={cy} r={r} fill={C.mist} />
    </g>
  );
}

function Stamp({ cx, cy, r, color = C.red, label = 'OFFICIAL' }: { cx: number; cy: number; r: number; color?: string; label?: string }) {
  return (
    <g opacity={0.75} transform={`rotate(-14 ${cx} ${cy})`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.6} />
      <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke={color} strokeWidth={0.9} />
      <text x={cx} y={cy + r * 0.13} textAnchor="middle" fontSize={r * 0.36} fontFamily={SANS} fontWeight={700} fill={color}>
        {label}
      </text>
    </g>
  );
}

function Signature({ x, y, w = 60 }: { x: number; y: number; w?: number }) {
  const s = w / 60;
  return (
    <path
      d={`M${x} ${y} c ${6 * s} -${10 * s}, ${10 * s} -${12 * s}, ${12 * s} -${4 * s} s -${8 * s} ${12 * s}, ${2 * s} ${6 * s} s ${10 * s} -${14 * s}, ${14 * s} -${6 * s} s ${4 * s} ${8 * s}, ${12 * s} ${1 * s} s ${12 * s} -${4 * s}, ${20 * s} -${2 * s}`}
      fill="none"
      stroke={C.navy}
      strokeWidth={1.4}
      strokeLinecap="round"
    />
  );
}

function Mark({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return <rect x={x} y={y} width={w} height={h} rx={4} fill="none" stroke={C.gold} strokeWidth={1.5} strokeDasharray="4 3" />;
}

function Pins({ at, count }: { at: Pt[]; count: number }) {
  return (
    <>
      {at.slice(0, count).map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={9} fill={C.gold} stroke="#fff" strokeWidth={2} />
          <text x={x} y={y + 3.6} textAnchor="middle" fontSize={10} fontWeight={700} fontFamily={SANS} fill={C.navy}>
            {i + 1}
          </text>
        </g>
      ))}
    </>
  );
}

function Watermark({ x, y, size = 30 }: { x: number; y: number; size?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={700} fontFamily={SANS} letterSpacing={size / 6} fill={C.gold} opacity={0.17} transform={`rotate(-18 ${x} ${y})`}>
      SAMPLE
    </text>
  );
}

const T = ({ x, y, size = 7, children, anchor = 'start', weight = 600, fill = C.navy, font = SANS, spacing }: { x: number; y: number; size?: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; weight?: number; fill?: string; font?: string; spacing?: number }) => (
  <text x={x} y={y} fontSize={size} fontFamily={font} fontWeight={weight} fill={fill} textAnchor={anchor} letterSpacing={spacing}>
    {children}
  </text>
);

// ------------------------------------------------------------------------------------------------- the samples

const SAMPLES: Record<SampleKind, { box: [number, number]; pins: Pt[]; draw: () => ReactNode }> = {
  passport: {
    box: [340, 232],
    pins: [[318, 24], [262, 146], [324, 190], [20, 214]],
    draw: () => (
      <>
        <rect x={10} y={10} width={320} height={212} rx={10} fill={C.paper} stroke={C.edge} />
        <path d="M10 20 a10 10 0 0 1 10 -10 h300 a10 10 0 0 1 10 10 v18 h-320 Z" fill={C.tint} />
        <T x={22} y={28} size={9} spacing={1.5}>
          PASSPORT
        </T>
        <T x={300} y={28} size={7} anchor="end" weight={500} fill={C.ink}>
          Type P · Code XXX
        </T>
        <Face x={22} y={48} w={76} h={98} />
        {[50, 72, 94, 116].map((y, i) => (
          <g key={y}>
            <Bar x={112} y={y} w={38} h={3.5} />
            <Bar x={112} y={y + 7} w={[120, 150, 90, 104][i]} h={6} dark />
          </g>
        ))}
        <Bar x={112} y={138} w={44} h={3.5} />
        <T x={112} y={152} size={9} weight={700}>
          01 JAN 2032
        </T>
        <Mark x={106} y={133} w={110} h={25} />
        <Bar x={236} y={50} w={44} h={3.5} />
        <T x={236} y={64} size={9} weight={700} font={MONO}>
          AB1234567
        </T>
        <rect x={20} y={166} width={300} height={46} rx={5} fill={C.tint} />
        <T x={28} y={184} size={10} weight={500} font={MONO} spacing={0.6}>
          P&lt;XXXSAMPLE&lt;&lt;STUDENT&lt;NAME&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
        </T>
        <T x={28} y={202} size={10} weight={500} font={MONO} spacing={0.6}>
          AB12345670XXX0001012M3201012&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;04
        </T>
        {[
          [10, 10, 1, 1],
          [330, 10, -1, 1],
          [10, 222, 1, -1],
          [330, 222, -1, -1],
        ].map(([x, y, dx, dy]) => (
          <path key={`${x}${y}`} d={`M${x} ${y + dy * 16} V${y} H${x + dx * 16}`} fill="none" stroke={C.gold} strokeWidth={2.5} />
        ))}
        <Watermark x={220} y={120} size={34} />
      </>
    ),
  },

  photo: {
    box: [240, 250],
    pins: [[170, 38], [150, 84], [160, 178], [210, 112]],
    draw: () => (
      <>
        <rect x={60} y={24} width={120} height={174} fill="#fff" stroke={C.ink} strokeWidth={1.2} />
        <path d="M68 198 C 72 150, 168 150, 172 198 Z" fill={C.mist} />
        <ellipse cx={120} cy={92} rx={29} ry={35} fill={C.mist} />
        <ellipse cx={90} cy={94} rx={4} ry={8} fill={C.mist} />
        <ellipse cx={150} cy={94} rx={4} ry={8} fill={C.mist} />
        <circle cx={109} cy={88} r={2.4} fill={C.ink} />
        <circle cx={131} cy={88} r={2.4} fill={C.ink} />
        <path d="M111 109 q9 6 18 0" fill="none" stroke={C.ink} strokeWidth={1.6} strokeLinecap="round" />
        <line x1={64} x2={176} y1={57} y2={57} stroke={C.gold} strokeDasharray="3 3" />
        <line x1={64} x2={176} y1={127} y2={127} stroke={C.gold} strokeDasharray="3 3" />
        <line x1={60} x2={180} y1={212} y2={212} stroke={C.navy} />
        <path d="M60 208 v8 M180 208 v8" stroke={C.navy} />
        <T x={120} y={228} size={9} anchor="middle">
          33 mm
        </T>
        <line x1={194} x2={194} y1={24} y2={198} stroke={C.navy} />
        <path d="M190 24 h8 M190 198 h8" stroke={C.navy} />
        <T x={200} y={140} size={9}>
          48 mm
        </T>
        <Watermark x={120} y={150} size={22} />
      </>
    ),
  },

  application_form: {
    box: [240, 320],
    pins: [[214, 74], [214, 280], [26, 308]],
    draw: () => (
      <>
        <Page x={20} y={10} w={196} h={296} stack={2} />
        <T x={118} y={30} size={10} anchor="middle" font="'Noto Serif SC', serif">
          外国留学生入学申请表
        </T>
        <T x={118} y={40} size={5.5} anchor="middle" weight={500} fill={C.ink}>
          APPLICATION FORM FOR FOREIGN STUDENTS
        </T>
        {[48, 116, 176].map((y, s) => (
          <g key={y}>
            <rect x={30} y={y} width={176} height={9} rx={2} fill={C.tint} />
            <Bar x={34} y={y + 2.5} w={60} h={4} dark />
            {Array.from({ length: s === 2 ? 3 : 4 }, (_, r) => (
              <g key={r}>
                {[30, 88, 146].map((x) => (
                  <rect key={x} x={x} y={y + 12 + r * 13} width={58} height={13} fill="none" stroke={C.edge} />
                ))}
                {[34, 92, 150].map((x, c) => (
                  <Bar key={x} x={x} y={y + 16.5 + r * 13} w={[30, 44, 36][(r + c) % 3]} h={4} dark={c > 0} />
                ))}
              </g>
            ))}
          </g>
        ))}
        <Lines x={30} y={228} widths={[170, 160, 172, 120]} gap={8} h={3.5} />
        <Bar x={30} y={272} w={36} h={3.5} />
        <Signature x={70} y={279} w={50} />
        <Bar x={130} y={272} w={16} h={3.5} />
        <T x={150} y={278} size={6.5} weight={500}>
          2026-10-13
        </T>
        <Mark x={26} y={262} w={182} h={24} />
        <Watermark x={118} y={170} size={28} />
      </>
    ),
  },

  health_form: {
    box: [240, 320],
    pins: [[160, 44], [214, 140], [214, 210], [30, 286]],
    draw: () => (
      <>
        <Page x={20} y={10} w={196} h={296} />
        <T x={118} y={28} size={10} anchor="middle" font="'Noto Serif SC', serif">
          外国人体格检查表
        </T>
        <T x={118} y={37} size={5} anchor="middle" weight={500} fill={C.ink}>
          FOREIGNER PHYSICAL EXAMINATION FORM
        </T>
        {[44, 60, 76, 92].map((y, i) => (
          <g key={y}>
            <rect x={30} y={y} width={132} height={16} fill="none" stroke={C.edge} />
            <Bar x={34} y={y + 6} w={22} h={3.5} />
            <Bar x={62} y={y + 5.5} w={[60, 80, 44, 70][i]} h={4.5} dark />
          </g>
        ))}
        <Face x={168} y={44} w={40} h={64} bg="#fff" />
        <Stamp cx={204} cy={104} r={13} label="HOSPITAL" />
        {[118, 128, 138, 148, 158, 168].map((y, i) => (
          <g key={y}>
            <Bar x={30} y={y} w={[64, 50, 72, 58, 66, 48][i]} h={3.5} />
            <rect x={160} y={y - 2} width={7} height={7} fill="#fff" stroke={C.ink} />
            <path d={`M161 ${y + 1.5} l2 2 l3.5 -4`} fill="none" stroke={C.navy} strokeWidth={1.3} />
            <T x={169} y={y + 4} size={5}>
              No
            </T>
            <rect x={184} y={y - 2} width={7} height={7} fill="#fff" stroke={C.ink} />
            <T x={193} y={y + 4} size={5}>
              Yes
            </T>
          </g>
        ))}
        {[180, 200, 220, 240].map((y, r) =>
          [30, 92, 154].map((x, c) => (
            <g key={`${x}${y}`}>
              <rect x={x} y={y} width={62} height={20} fill="none" stroke={C.edge} />
              <Bar x={x + 4} y={y + 4} w={24} h={3} />
              {r === 0 ? (
                <T x={x + 4} y={y + 16} size={7}>
                  {['170 cm', '65 kg', '120/80'][c]}
                </T>
              ) : (
                <Bar x={x + 4} y={y + 11} w={[30, 22, 36][(r + c) % 3]} h={4} dark />
              )}
            </g>
          ))
        )}
        <Bar x={30} y={272} w={44} h={3.5} />
        <Signature x={34} y={294} w={48} />
        <Stamp cx={170} cy={284} r={17} label="HOSPITAL" />
        <Watermark x={118} y={200} size={28} />
      </>
    ),
  },

  education: {
    box: [250, 210],
    pins: [[18, 70], [232, 30], [150, 176], [238, 168]],
    draw: () => (
      <>
        <Page x={118} y={14} w={112} h={150} stack={1} />
        <Bar x={128} y={24} w={70} h={5} dark />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <line x1={126} x2={222} y1={38 + i * 12} y2={38 + i * 12} stroke={C.edge} />
            <Bar x={128} y={41 + i * 12} w={[50, 40, 56, 44, 52, 38, 48, 42, 54][i]} h={4} />
            <Bar x={200} y={41 + i * 12} w={16} h={4} dark />
          </g>
        ))}
        <rect x={10} y={62} width={176} height={124} rx={4} fill={C.paper} stroke={C.edge} />
        <rect x={16} y={68} width={164} height={112} rx={2} fill="none" stroke={C.gold} strokeWidth={1.2} />
        <rect x={20} y={72} width={156} height={104} rx={2} fill="none" stroke={C.gold} strokeWidth={0.5} />
        <T x={98} y={92} size={9} anchor="middle" font="Georgia, serif">
          Certificate
        </T>
        <Bar x={58} y={100} w={80} h={4} />
        <Bar x={48} y={112} w={100} h={6} dark />
        <Lines x={40} y={126} widths={[116, 104, 90]} gap={9} h={3.5} />
        <circle cx={52} cy={164} r={10} fill={C.goldSoft} stroke={C.gold} />
        <Signature x={112} y={166} w={44} />
        <Watermark x={110} y={130} size={26} />
      </>
    ),
  },

  police: {
    box: [240, 300],
    pins: [[30, 120], [212, 252], [212, 66]],
    draw: () => (
      <>
        <Page x={22} y={10} w={196} h={280} />
        <circle cx={120} cy={36} r={13} fill={C.tint} stroke={C.ink} />
        <Bar x={80} y={54} w={80} h={4} dark />
        <Bar x={150} y={64} w={56} h={4} />
        <rect x={40} y={78} width={160} height={14} rx={2} fill={C.tint} />
        <T x={120} y={88} size={7} anchor="middle" spacing={0.5}>
          POLICE CHARACTER CERTIFICATE
        </T>
        <Lines x={40} y={104} widths={[150, 120]} gap={10} h={4} />
        <Bar x={40} y={114} w={110} h={6} dark />
        <Mark x={36} y={110} w={122} h={13} />
        <Lines x={40} y={134} widths={[156, 150, 160, 140, 152, 100]} gap={10} h={4} />
        <Signature x={48} y={250} w={50} />
        <Bar x={44} y={258} w={60} h={3.5} />
        <Stamp cx={176} cy={238} r={20} label="POLICE" />
        <Watermark x={120} y={170} size={28} />
      </>
    ),
  },

  bank: {
    box: [240, 300],
    pins: [[30, 76], [52, 22], [214, 98], [214, 254]],
    draw: () => (
      <>
        <Page x={18} y={10} w={204} h={280} />
        <rect x={30} y={22} width={18} height={18} rx={4} fill={C.navy} />
        <Bar x={54} y={25} w={60} h={5} dark />
        <Bar x={54} y={34} w={40} h={3.5} />
        <T x={208} y={32} size={7} anchor="end">
          STATEMENT
        </T>
        <Bar x={30} y={56} w={50} h={3.5} />
        <Bar x={30} y={66} w={96} h={6} dark />
        <Mark x={26} y={62} w={106} h={14} />
        <Lines x={30} y={82} widths={[120, 80]} gap={8} h={3.5} />
        <T x={208} y={96} size={6.5} anchor="end" weight={500}>
          01 Jul – 30 Sep 2026
        </T>
        <rect x={30} y={110} width={178} height={11} fill={C.tint} />
        {Array.from({ length: 9 }, (_, i) => (
          <g key={i}>
            <line x1={30} x2={208} y1={133 + i * 12} y2={133 + i * 12} stroke={C.edge} />
            <Bar x={32} y={125 + i * 12} w={22} h={3.5} />
            <Bar x={60} y={125 + i * 12} w={[60, 44, 70, 52, 48, 66, 40, 58, 50][i]} h={3.5} />
            <Bar x={180} y={125 + i * 12} w={24} h={3.5} dark />
          </g>
        ))}
        <rect x={30} y={244} width={178} height={18} rx={3} fill={C.goldSoft} />
        <Bar x={36} y={251} w={56} h={4} dark />
        <T x={202} y={256.5} size={8} anchor="end" weight={700}>
          5,240.00
        </T>
        <Watermark x={120} y={180} size={28} />
      </>
    ),
  },

  english: {
    box: [300, 210],
    pins: [[150, 66], [282, 140], [30, 186]],
    draw: () => (
      <>
        <rect x={10} y={10} width={280} height={190} rx={8} fill={C.paper} stroke={C.edge} />
        <path d="M10 18 a8 8 0 0 1 8 -8 h264 a8 8 0 0 1 8 8 v14 h-280 Z" fill={C.tint} />
        <T x={22} y={26} size={8} spacing={1}>
          TEST REPORT
        </T>
        <Face x={22} y={44} w={46} h={58} />
        <Bar x={80} y={48} w={36} h={3.5} />
        <Bar x={80} y={56} w={110} h={6} dark />
        <Mark x={76} y={52} w={118} h={14} />
        <Lines x={80} y={74} widths={[90, 70, 100]} gap={10} h={4} />
        {['6.5', '6.0', '7.0', '6.5'].map((s, i) => (
          <g key={i}>
            <rect x={22 + i * 50} y={122} width={42} height={34} rx={4} fill="#fff" stroke={C.edge} />
            <Bar x={28 + i * 50} y={128} w={24} h={3} />
            <T x={43 + i * 50} y={150} size={11} anchor="middle" weight={700}>
              {s}
            </T>
          </g>
        ))}
        <rect x={222} y={116} width={56} height={46} rx={6} fill={C.goldSoft} stroke={C.gold} />
        <Bar x={230} y={123} w={30} h={3} dark />
        <T x={250} y={153} size={16} anchor="middle" weight={700}>
          6.5
        </T>
        <Bar x={22} y={176} w={30} h={3.5} />
        <T x={56} y={180} size={7} weight={500}>
          12 MAR 2026
        </T>
        <Watermark x={160} y={110} size={30} />
      </>
    ),
  },

  letter: {
    box: [240, 300],
    pins: [[214, 34], [214, 120], [214, 232], [30, 270]],
    draw: () => (
      <>
        <Page x={22} y={10} w={196} h={280} />
        <Bar x={70} y={28} w={100} h={7} dark />
        <Bar x={90} y={42} w={60} h={4} />
        <Bar x={36} y={62} w={50} h={5} dark />
        <Lines x={36} y={74} widths={[166, 160, 168, 120]} gap={9} h={3.5} />
        <Bar x={36} y={118} w={60} h={5} dark />
        <Lines x={36} y={130} widths={[160, 166, 150, 164, 140]} gap={9} h={3.5} />
        <Bar x={36} y={186} w={44} h={5} dark />
        <Lines x={36} y={198} widths={[166, 158, 162, 168, 110]} gap={9} h={3.5} />
        <Bar x={36} y={252} w={70} h={4} dark />
        <Watermark x={120} y={160} size={28} />
      </>
    ),
  },

  recommendation: {
    box: [240, 300],
    pins: [[214, 32], [214, 130], [140, 256]],
    draw: () => (
      <>
        <Page x={22} y={10} w={196} h={280} />
        <circle cx={46} cy={34} r={11} fill={C.goldSoft} stroke={C.gold} />
        <Bar x={64} y={27} w={86} h={5} dark />
        <Bar x={64} y={37} w={60} h={3.5} />
        <line x1={34} x2={206} y1={52} y2={52} stroke={C.gold} />
        <Bar x={156} y={62} w={46} h={3.5} />
        <Bar x={36} y={78} w={80} h={4} dark />
        <Lines x={36} y={94} widths={[166, 160, 168, 150, 162, 120]} gap={9} h={3.5} />
        <Lines x={36} y={156} widths={[160, 166, 152, 100]} gap={9} h={3.5} />
        <Signature x={40} y={234} w={56} />
        <Bar x={36} y={242} w={70} h={4.5} dark />
        <Lines x={36} y={252} widths={[90, 76, 84]} gap={8} h={3} />
        <Stamp cx={178} cy={240} r={18} color={C.navy} label="DEPT." />
        <Watermark x={120} y={150} size={28} />
      </>
    ),
  },

  cv: {
    box: [240, 300],
    pins: [[214, 34], [214, 108], [214, 222]],
    draw: () => (
      <>
        <Page x={22} y={10} w={196} h={280} />
        <Bar x={36} y={26} w={96} h={9} dark />
        <Lines x={36} y={42} widths={[120, 100]} gap={8} h={3.5} />
        <line x1={36} x2={204} y1={64} y2={64} stroke={C.edge} />
        {[74, 136, 198].map((y, s) => (
          <g key={y}>
            <Bar x={36} y={y} w={[54, 44, 70][s]} h={5} fill={C.gold} />
            {Array.from({ length: 3 }, (_, r) => (
              <g key={r}>
                <Bar x={36} y={y + 13 + r * 16} w={28} h={3.5} />
                <Bar x={72} y={y + 12 + r * 16} w={[100, 90, 120][r]} h={4.5} dark />
                <Bar x={72} y={y + 20 + r * 16} w={[80, 110, 70][r]} h={3} />
              </g>
            ))}
          </g>
        ))}
        <Watermark x={120} y={160} size={28} />
      </>
    ),
  },

  video: {
    box: [300, 200],
    pins: [[190, 54], [68, 36], [262, 182]],
    draw: () => (
      <>
        <rect x={10} y={10} width={280} height={160} rx={12} fill={C.navy} />
        <path d="M110 170 C 112 128, 188 128, 190 170 Z" fill="#33507f" />
        <ellipse cx={150} cy={92} rx={24} ry={28} fill="#33507f" />
        <rect x={26} y={26} width={98} height={26} rx={10} fill="#fff" />
        <path d="M56 52 l6 9 l4 -9 Z" fill="#fff" />
        <T x={75} y={43} size={8} anchor="middle" weight={500}>
          Hello, my name is…
        </T>
        <circle cx={150} cy={92} r={14} fill="rgba(255,255,255,0.85)" />
        <path d="M145 84 L158 92 L145 100 Z" fill={C.navy} />
        <rect x={20} y={178} width={210} height={5} rx={2.5} fill={C.bar} />
        <rect x={20} y={178} width={130} height={5} rx={2.5} fill={C.gold} />
        <T x={240} y={185} size={8} weight={600}>
          3:30
        </T>
        <Watermark x={150} y={150} size={24} />
      </>
    ),
  },

  generic: {
    box: [240, 300],
    pins: [[214, 74], [212, 250], [214, 36], [30, 200]],
    draw: () => (
      <>
        <Page x={22} y={10} w={196} h={280} />
        <circle cx={120} cy={34} r={12} fill={C.tint} stroke={C.ink} />
        <Bar x={150} y={34} w={50} h={3.5} />
        <Bar x={70} y={66} w={100} h={7} dark />
        <Lines x={40} y={90} widths={[156, 150, 160, 140]} gap={10} h={4} />
        <Bar x={40} y={134} w={110} h={6} dark />
        <Lines x={40} y={150} widths={[156, 160, 130, 150, 90]} gap={10} h={4} />
        <Signature x={48} y={252} w={50} />
        <Stamp cx={176} cy={240} r={20} />
        <Watermark x={120} y={180} size={28} />
      </>
    ),
  },
};

/** The sample drawing for one document, with `count` numbered pins (one per point in the list beside it). */
export function DocSample({ kind, count, title, className }: { kind: SampleKind; count: number; title: string; className?: string }) {
  const s = SAMPLES[kind];
  const [w, h] = s.box;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Sample of ${title}, with ${count} numbered points`} className={className}>
      {s.draw()}
      <Pins at={s.pins} count={count} />
    </svg>
  );
}

export const samplePinCount = (kind: SampleKind) => SAMPLES[kind].pins.length;
