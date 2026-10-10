// Things & nature — same sticker language.
import { Blush, ClosedEyes, Eyes, O, P, Smile, Svg, type ArtProps } from './shared';

/* ------------------------------ things ------------------------------ */

export function Ball(p: ArtProps) {
  return (
    <Svg {...p}>
      <circle cx="120" cy="124" r="66" fill="#FFFDF8" {...P} />
      <path
        d="M120 58 C92 92 92 156 120 190 C148 156 148 92 120 58 Z"
        fill="#F28482"
        {...P}
        strokeWidth={5}
      />
      <path
        d="M58 100 C80 116 160 116 182 100 M58 148 C80 132 160 132 182 148"
        fill="none"
        {...P}
        strokeWidth={5}
      />
      <Eyes cy={112} dx={18} r={6} />
      <Smile cy={134} w={24} />
    </Svg>
  );
}

export function Car(p: ArtProps) {
  return (
    <Svg {...p}>
      <rect x="86" y="58" width="80" height="48" rx="16" fill="#A9D6E5" {...P} />
      <rect x="36" y="98" width="168" height="56" rx="20" fill="#F28482" {...P} />
      <circle cx="80" cy="158" r="19" fill={O} stroke="none" />
      <circle cx="160" cy="158" r="19" fill={O} stroke="none" />
      <circle cx="80" cy="158" r="8" fill="#F7EDE2" stroke="none" />
      <circle cx="160" cy="158" r="8" fill="#F7EDE2" stroke="none" />
      <circle cx="196" cy="118" r="6" fill="#FFCE80" stroke="none" />
      <Eyes cy={122} dx={26} r={6} />
      <Smile cy={138} w={26} />
    </Svg>
  );
}

export function Bus(p: ArtProps) {
  return (
    <Svg {...p}>
      <rect x="32" y="62" width="176" height="98" rx="22" fill="#FFCE80" {...P} />
      <rect x="48" y="80" width="36" height="30" rx="8" fill="#FFFDF8" {...P} strokeWidth={5} />
      <rect x="102" y="80" width="36" height="30" rx="8" fill="#FFFDF8" {...P} strokeWidth={5} />
      <rect x="156" y="80" width="36" height="30" rx="8" fill="#FFFDF8" {...P} strokeWidth={5} />
      <path d="M36 128 L204 128" {...P} strokeWidth={5} opacity={0.35} />
      <circle cx="76" cy="164" r="19" fill={O} stroke="none" />
      <circle cx="164" cy="164" r="19" fill={O} stroke="none" />
      <circle cx="76" cy="164" r="8" fill="#F7EDE2" stroke="none" />
      <circle cx="164" cy="164" r="8" fill="#F7EDE2" stroke="none" />
      <circle cx="114" cy="142" r="5" fill={O} stroke="none" />
      <circle cx="130" cy="142" r="5" fill={O} stroke="none" />
      <path d="M114 151 Q122 156 130 151" fill="none" {...P} strokeWidth={4.5} />
    </Svg>
  );
}

export function Book(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M42 78 Q80 62 120 78 L120 190 Q80 174 42 190 Z" fill="#FFFDF8" {...P} />
      <path d="M198 78 Q160 62 120 78 L120 190 Q160 174 198 190 Z" fill="#F7EDE2" {...P} />
      <g {...P} strokeWidth={5} opacity={0.55}>
        <path d="M58 102 Q86 92 106 100" fill="none" />
        <path d="M58 124 Q86 114 106 122" fill="none" />
        <path d="M58 146 Q86 136 106 144" fill="none" />
        <path d="M134 100 Q154 92 182 102" fill="none" />
        <path d="M134 122 Q154 114 182 124" fill="none" />
        <path d="M134 144 Q154 136 182 146" fill="none" />
      </g>
    </Svg>
  );
}

export function Cup(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M96 62 C90 50 102 44 96 32" fill="none" {...P} strokeWidth={6} opacity={0.4} />
      <path d="M128 66 C122 54 134 48 128 36" fill="none" {...P} strokeWidth={6} opacity={0.4} />
      <rect x="66" y="86" width="96" height="88" rx="18" fill="#B7E4C7" {...P} />
      <path d="M162 102 C198 102 198 148 162 148" fill="none" {...P} strokeWidth={11} />
      <Eyes cy={122} dx={20} r={6} />
      <Smile cy={142} w={24} />
      <Blush cy={140} dx={40} />
    </Svg>
  );
}

export function Shoe(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M50 158 L50 112 Q50 100 62 100 L94 100 L136 124 L186 134 Q202 138 202 154 L202 160 L50 160 Z"
        fill="#CDB4DB"
        {...P}
      />
      <rect x="42" y="156" width="168" height="22" rx="11" fill="#FFFDF8" {...P} strokeWidth={5} />
      <g {...P} strokeWidth={5}>
        <path d="M96 112 L112 106" />
        <path d="M108 124 L124 118" />
        <path d="M120 134 L136 128" />
      </g>
      <circle cx="158" cy="146" r="5" fill={O} stroke="none" />
      <circle cx="176" cy="149" r="5" fill={O} stroke="none" />
      <path d="M160 156 Q168 160 176 157" fill="none" {...P} strokeWidth={4} />
    </Svg>
  );
}

export function Balloon(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M120 162 C110 186 130 196 120 224" fill="none" {...P} strokeWidth={5} />
      <path d="M112 158 L128 158 L120 172 Z" fill="#F28482" {...P} strokeWidth={5} />
      <ellipse cx="120" cy="96" rx="54" ry="64" fill="#F28482" {...P} />
      <ellipse
        cx="98"
        cy="70"
        rx="12"
        ry="18"
        fill="#fff"
        stroke="none"
        opacity={0.5}
        transform="rotate(-20 98 70)"
      />
      <Eyes cy={92} dx={20} r={6} />
      <Smile cy={112} w={24} />
      <Blush cy={112} dx={40} />
    </Svg>
  );
}

export function Drum(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M82 36 L104 84 M158 36 L136 84"
        fill="none"
        stroke="#8D6E63"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <circle cx="80" cy="32" r="9" fill="#FFCE80" {...P} strokeWidth={5} />
      <circle cx="160" cy="32" r="9" fill="#FFCE80" {...P} strokeWidth={5} />
      <rect x="52" y="88" width="136" height="84" rx="16" fill="#F28482" {...P} />
      <ellipse cx="120" cy="88" rx="68" ry="20" fill="#FFFDF8" {...P} />
      <path
        d="M64 112 L84 132 L104 112 L124 132 L144 112 L164 132 L184 112"
        fill="none"
        stroke="#B7E4C7"
        strokeWidth={8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="106" cy="152" r="5" fill={O} stroke="none" />
      <circle cx="134" cy="152" r="5" fill={O} stroke="none" />
      <path d="M108 161 Q120 167 132 161" fill="none" {...P} strokeWidth={4.5} />
    </Svg>
  );
}

/* ------------------------------ nature ------------------------------ */

export function Sun(p: ArtProps) {
  const rays = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <Svg {...p}>
      {rays.map((a) => (
        <line
          key={a}
          x1={120 + 58 * Math.cos((a * Math.PI) / 180)}
          y1={124 + 58 * Math.sin((a * Math.PI) / 180)}
          x2={120 + 82 * Math.cos((a * Math.PI) / 180)}
          y2={124 + 82 * Math.sin((a * Math.PI) / 180)}
          {...P}
          strokeWidth={8}
        />
      ))}
      <circle cx="120" cy="124" r="44" fill="#FFCE80" {...P} />
      <ClosedEyes cy={118} dx={16} />
      <Smile cy={136} w={22} />
      <Blush cy={136} dx={32} />
    </Svg>
  );
}

export function Moon(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M168 34 A94 94 0 1 0 168 206 A78 78 0 1 1 168 34 Z"
        fill="#F7DFA0"
        {...P}
        strokeLinejoin="round"
      />
      <path
        d="M186 66 L190 76 L200 80 L190 84 L186 94 L182 84 L172 80 L182 76 Z"
        fill="#FFCE80"
        {...P}
        strokeWidth={4}
      />
      <path d="M92 108 Q100 116 108 108" fill="none" {...P} strokeWidth={6} />
      <path d="M96 138 Q106 144 116 138" fill="none" {...P} strokeWidth={6} />
    </Svg>
  );
}

export function StarShape(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M120 44 L145 96 L202 100 L158 138 L172 194 L120 162 L68 194 L82 138 L38 100 L95 96 Z"
        fill="#FFCE80"
        {...P}
        strokeLinejoin="round"
      />
      <Eyes cy={118} dx={18} r={6} />
      <Smile cy={136} w={22} />
      <Blush cy={134} dx={38} />
    </Svg>
  );
}

export function Flower(p: ArtProps) {
  const petals = [-90, -18, 54, 126, 198].map((a) => ({
    x: 120 + 44 * Math.cos((a * Math.PI) / 180),
    y: 104 + 44 * Math.sin((a * Math.PI) / 180),
  }));
  return (
    <Svg {...p}>
      <path
        d="M120 148 L120 210"
        fill="none"
        stroke="#84A59D"
        strokeWidth={10}
        strokeLinecap="round"
      />
      <path
        d="M120 190 C104 186 94 176 92 162 C108 166 118 176 120 190 Z"
        fill="#84A59D"
        {...P}
        strokeWidth={5}
      />
      {petals.map((pt, i) => (
        <circle key={i} cx={pt.x} cy={pt.y} r="27" fill="#F28482" {...P} strokeWidth={5} />
      ))}
      <circle cx="120" cy="104" r="24" fill="#FFCE80" {...P} strokeWidth={5} />
      <circle cx="113" cy="100" r="3.6" fill={O} stroke="none" />
      <circle cx="127" cy="100" r="3.6" fill={O} stroke="none" />
      <path d="M114 110 Q120 115 126 110" fill="none" {...P} strokeWidth={4} />
    </Svg>
  );
}

export function Tree(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M106 142 L134 142 L131 210 L109 210 Z" fill="#8D6E63" {...P} />
      <circle cx="76" cy="108" r="32" fill="#84A59D" {...P} />
      <circle cx="164" cy="108" r="32" fill="#84A59D" {...P} />
      <circle cx="120" cy="72" r="36" fill="#84A59D" {...P} />
      <circle cx="120" cy="114" r="38" fill="#84A59D" {...P} />
      <circle cx="92" cy="98" r="4" fill="#F28482" stroke="none" />
      <circle cx="150" cy="86" r="4" fill="#F28482" stroke="none" />
      <circle cx="136" cy="126" r="4" fill="#F28482" stroke="none" />
      <Eyes cy={100} dx={16} r={5.5} />
      <Smile cy={116} w={20} />
    </Svg>
  );
}

export function Cloud(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M64 168 C42 168 32 150 40 133 C47 117 64 111 78 118 C83 96 100 82 122 82 C144 82 161 96 165 116 C182 110 199 121 202 139 C205 155 192 168 176 168 Z"
        fill="#FFFDF8"
        {...P}
      />
      <ClosedEyes cy={128} dx={20} />
      <Smile cy={146} w={24} />
      <Blush cy={146} dx={42} />
    </Svg>
  );
}

export function House(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M42 122 L120 50 L198 122 Z" fill="#F28482" {...P} strokeLinejoin="round" />
      <rect x="58" y="118" width="124" height="88" rx="10" fill="#FFFDF8" {...P} />
      <rect x="104" y="148" width="34" height="58" rx="8" fill="#8D6E63" {...P} strokeWidth={5} />
      <circle cx="130" cy="178" r="3.5" fill="#FFCE80" stroke="none" />
      <rect x="72" y="134" width="28" height="28" rx="7" fill="#A9D6E5" {...P} strokeWidth={5} />
      <rect x="142" y="134" width="28" height="28" rx="7" fill="#A9D6E5" {...P} strokeWidth={5} />
    </Svg>
  );
}

export { O };
