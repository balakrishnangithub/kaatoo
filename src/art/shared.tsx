import type { CSSProperties, ReactNode } from 'react';

export const O = '#563E79'; // plum outline — one voice across all art
export const P = {
  stroke: O,
  strokeWidth: 7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export interface ArtProps {
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Svg({
  size = 120,
  className,
  style,
  children,
}: ArtProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      className={className}
      style={style}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* classic friendly face: dot eyes + smile + blush, centered on a head at (120,130) */
export function Eyes({ cy = 124, dx = 24, r = 7 }: { cy?: number; dx?: number; r?: number }) {
  return (
    <g stroke="none" fill={O}>
      <circle cx={120 - dx} cy={cy} r={r} />
      <circle cx={120 + dx} cy={cy} r={r} />
      <circle cx={120 - dx + r * 0.35} cy={cy - r * 0.35} r={r * 0.34} fill="#fff" />
      <circle cx={120 + dx + r * 0.35} cy={cy - r * 0.35} r={r * 0.34} fill="#fff" />
    </g>
  );
}

export function Smile({ cy = 150, w = 32 }: { cy?: number; w?: number }) {
  return (
    <path
      d={`M${120 - w} ${cy} Q120 ${cy + 13} ${120 + w} ${cy}`}
      fill="none"
      {...P}
      strokeWidth={6}
    />
  );
}

export function Blush({ cy = 146, dx = 46 }: { cy?: number; dx?: number }) {
  return (
    <g stroke="none" fill="#F28482" opacity={0.4}>
      <ellipse cx={120 - dx} cy={cy} rx={11} ry={7} />
      <ellipse cx={120 + dx} cy={cy} rx={11} ry={7} />
    </g>
  );
}

/** closed happy eyes ^ ^ */
export function ClosedEyes({ cy = 124, dx = 24 }: { cy?: number; dx?: number }) {
  return (
    <g fill="none" {...P} strokeWidth={6}>
      <path d={`M${120 - dx - 9} ${cy} Q${120 - dx} ${cy - 9} ${120 - dx + 9} ${cy}`} />
      <path d={`M${120 + dx - 9} ${cy} Q${120 + dx} ${cy - 9} ${120 + dx + 9} ${cy}`} />
    </g>
  );
}
