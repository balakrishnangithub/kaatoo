// Geometric shapes (color-prop) and emotion faces.
import { O, P, Svg, type ArtProps } from './shared';

export interface ShapeProps extends ArtProps {
  fill?: string;
}

const STAR = 'M120 44 L145 96 L202 100 L158 138 L172 194 L120 162 L68 194 L82 138 L38 100 L95 96 Z';

export function ShapeCircle({ fill = '#F28482', ...p }: ShapeProps) {
  return (
    <Svg {...p}>
      <circle cx="120" cy="120" r="64" fill={fill} {...P} />
    </Svg>
  );
}

export function ShapeSquare({ fill = '#84A59D', ...p }: ShapeProps) {
  return (
    <Svg {...p}>
      <rect x="56" y="56" width="128" height="128" rx="16" fill={fill} {...P} />
    </Svg>
  );
}

export function ShapeTriangle({ fill = '#FFCE80', ...p }: ShapeProps) {
  return (
    <Svg {...p}>
      <path d="M120 50 L200 188 L40 188 Z" fill={fill} {...P} strokeLinejoin="round" />
    </Svg>
  );
}

export function ShapeRect({ fill = '#A9D6E5', ...p }: ShapeProps) {
  return (
    <Svg {...p}>
      <rect x="44" y="76" width="152" height="88" rx="16" fill={fill} {...P} />
    </Svg>
  );
}

export function ShapeStar({ fill = '#CDB4DB', ...p }: ShapeProps) {
  return (
    <Svg {...p}>
      <path d={STAR} fill={fill} {...P} strokeLinejoin="round" />
    </Svg>
  );
}

export function ShapeHeart({ fill = '#F28482', ...p }: ShapeProps) {
  return (
    <Svg {...p}>
      <path
        d="M120 200 C58 152 42 112 62 84 C78 62 108 64 120 90 C132 64 162 62 178 84 C198 112 182 152 120 200 Z"
        fill={fill}
        {...P}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ShapeOval({ fill = '#B7E4C7', ...p }: ShapeProps) {
  return (
    <Svg {...p}>
      <ellipse cx="120" cy="120" rx="50" ry="68" fill={fill} {...P} />
    </Svg>
  );
}

/* ------------------------------ emotion faces ------------------------------ */

function FaceBase({ children, ...p }: ArtProps & { children: React.ReactNode }) {
  return (
    <Svg {...p}>
      <circle cx="120" cy="120" r="66" fill="#FFCE80" {...P} />
      {children}
    </Svg>
  );
}

export function FaceHappy(p: ArtProps) {
  return (
    <FaceBase {...p}>
      <g fill={O} stroke="none">
        <circle cx="96" cy="108" r="8" />
        <circle cx="144" cy="108" r="8" />
      </g>
      <path d="M92 130 Q120 162 148 130" fill="none" {...P} strokeWidth={8} />
      <g fill="#F28482" opacity={0.45} stroke="none">
        <ellipse cx="80" cy="132" rx="11" ry="7" />
        <ellipse cx="160" cy="132" rx="11" ry="7" />
      </g>
    </FaceBase>
  );
}

export function FaceSad(p: ArtProps) {
  return (
    <FaceBase {...p}>
      <path d="M86 96 L106 104 M154 96 L134 104" fill="none" {...P} strokeWidth={6} />
      <g fill={O} stroke="none">
        <circle cx="96" cy="116" r="7" />
        <circle cx="144" cy="116" r="7" />
      </g>
      <path d="M94 156 Q120 136 146 156" fill="none" {...P} strokeWidth={7} />
      <path
        d="M84 124 C78 136 80 144 86 148 C92 144 92 134 84 124 Z"
        fill="#A9D6E5"
        {...P}
        strokeWidth={4}
      />
    </FaceBase>
  );
}

export function FaceAngry(p: ArtProps) {
  return (
    <FaceBase {...p}>
      <path d="M84 96 L110 108 M156 96 L130 108" fill="none" {...P} strokeWidth={8} />
      <g fill={O} stroke="none">
        <circle cx="98" cy="120" r="7" />
        <circle cx="142" cy="120" r="7" />
      </g>
      <path d="M96 156 Q120 142 144 156" fill="none" {...P} strokeWidth={7} />
    </FaceBase>
  );
}

export function FaceSurprised(p: ArtProps) {
  return (
    <FaceBase {...p}>
      <path d="M84 92 Q96 82 108 90 M132 90 Q144 82 156 92" fill="none" {...P} strokeWidth={6} />
      <g fill={O} stroke="none">
        <circle cx="96" cy="112" r="10" />
        <circle cx="144" cy="112" r="10" />
        <circle cx="99" cy="108" r="3.4" fill="#fff" />
        <circle cx="147" cy="108" r="3.4" fill="#fff" />
      </g>
      <circle cx="120" cy="148" r="12" fill={O} stroke="none" />
    </FaceBase>
  );
}

export function FaceSleepy(p: ArtProps) {
  return (
    <FaceBase {...p}>
      <path
        d="M84 112 Q96 120 108 112 M132 112 Q144 120 156 112"
        fill="none"
        {...P}
        strokeWidth={6}
      />
      <ellipse cx="120" cy="146" rx="9" ry="11" fill={O} stroke="none" />
      <g fill={O} stroke="none" opacity={0.55}>
        <circle cx="168" cy="70" r="5" />
        <circle cx="182" cy="54" r="7" />
        <circle cx="198" cy="34" r="9" />
      </g>
    </FaceBase>
  );
}

export function FaceCalm(p: ArtProps) {
  return (
    <FaceBase {...p}>
      <path
        d="M84 110 Q96 118 108 110 M132 110 Q144 118 156 110"
        fill="none"
        {...P}
        strokeWidth={6}
      />
      <path d="M100 138 Q120 154 140 138" fill="none" {...P} strokeWidth={7} />
      <g fill="#F28482" opacity={0.4} stroke="none">
        <ellipse cx="82" cy="128" rx="10" ry="6" />
        <ellipse cx="158" cy="128" rx="10" ry="6" />
      </g>
    </FaceBase>
  );
}
