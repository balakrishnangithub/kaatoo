// Animals & food — round sticker portraits, one consistent face language.
import { Blush, Eyes, O, P, Smile, Svg, type ArtProps } from './shared';

/* ------------------------------ animals ------------------------------ */

export function Cat(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M66 92 L56 34 L112 66 Z" fill="#F4A259" {...P} />
      <path d="M174 92 L184 34 L128 66 Z" fill="#F4A259" {...P} />
      <path d="M70 76 L65 48 L92 63 Z" fill="#F5CAC3" stroke="none" />
      <path d="M170 76 L175 48 L148 63 Z" fill="#F5CAC3" stroke="none" />
      <circle cx="120" cy="132" r="64" fill="#F4A259" {...P} />
      <g {...P} strokeWidth={5}>
        <path d="M56 132 L26 124" fill="none" />
        <path d="M56 148 L28 152" fill="none" />
        <path d="M184 132 L214 124" fill="none" />
        <path d="M184 148 L212 152" fill="none" />
      </g>
      <Blush cy={150} dx={48} />
      <Eyes cy={126} />
      <path d="M114 146 L126 146 L120 154 Z" fill={O} stroke="none" />
      <Smile cy={158} w={26} />
    </Svg>
  );
}

export function Dog(p: ArtProps) {
  return (
    <Svg {...p}>
      <ellipse
        cx="56"
        cy="102"
        rx="24"
        ry="46"
        fill="#8D6E63"
        {...P}
        transform="rotate(16 56 102)"
      />
      <ellipse
        cx="184"
        cy="102"
        rx="24"
        ry="46"
        fill="#8D6E63"
        {...P}
        transform="rotate(-16 184 102)"
      />
      <circle cx="120" cy="130" r="62" fill="#D9A679" {...P} />
      <ellipse cx="120" cy="156" rx="30" ry="22" fill="#F7EDE2" {...P} strokeWidth={5} />
      <Blush cy={130} dx={46} />
      <Eyes cy={112} />
      <circle cx="120" cy="144" r="8" fill={O} stroke="none" />
      <path
        d="M120 152 Q120 162 110 164 M120 152 Q120 162 130 164"
        fill="none"
        {...P}
        strokeWidth={5}
      />
    </Svg>
  );
}

export function Cow(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M72 74 L56 42 L92 60 Z" fill="#FFCE80" {...P} />
      <path d="M168 74 L184 42 L148 60 Z" fill="#FFCE80" {...P} />
      <ellipse cx="52" cy="118" rx="20" ry="14" fill="#FFFDF8" {...P} />
      <ellipse cx="188" cy="118" rx="20" ry="14" fill="#FFFDF8" {...P} />
      <circle cx="120" cy="126" r="62" fill="#FFFDF8" {...P} />
      <path
        d="M82 84 C98 76 110 88 104 104 C98 118 80 118 74 106 C68 94 72 88 82 84 Z"
        fill={O}
        stroke="none"
        opacity={0.85}
      />
      <ellipse cx="120" cy="164" rx="34" ry="24" fill="#F5CAC3" {...P} strokeWidth={5} />
      <circle cx="109" cy="162" r="4.5" fill={O} stroke="none" />
      <circle cx="131" cy="162" r="4.5" fill={O} stroke="none" />
      <Eyes cy={118} />
    </Svg>
  );
}

export function Elephant(p: ArtProps) {
  return (
    <Svg {...p}>
      <circle cx="58" cy="116" r="36" fill="#A8BED4" {...P} />
      <circle cx="182" cy="116" r="36" fill="#A8BED4" {...P} />
      <circle cx="58" cy="116" r="20" fill="#F5CAC3" stroke="none" />
      <circle cx="182" cy="116" r="20" fill="#F5CAC3" stroke="none" />
      <circle cx="120" cy="118" r="58" fill="#A8BED4" {...P} />
      <path
        d="M120 128 C123 160 120 182 104 196"
        fill="none"
        stroke={O}
        strokeWidth={31}
        strokeLinecap="round"
      />
      <path
        d="M120 128 C123 160 120 182 104 196"
        fill="none"
        stroke="#A8BED4"
        strokeWidth={21}
        strokeLinecap="round"
      />
      <Blush cy={140} dx={44} />
      <Eyes cy={104} dx={22} />
    </Svg>
  );
}

export function Bird(p: ArtProps) {
  return (
    <Svg {...p}>
      <g {...P} strokeWidth={6}>
        <path d="M104 66 C100 52 108 44 102 34" fill="none" />
        <path d="M124 62 C124 48 134 42 130 30" fill="none" />
      </g>
      <ellipse
        cx="62"
        cy="140"
        rx="18"
        ry="30"
        fill="#7FB6CE"
        {...P}
        transform="rotate(18 62 140)"
      />
      <ellipse
        cx="178"
        cy="140"
        rx="18"
        ry="30"
        fill="#7FB6CE"
        {...P}
        transform="rotate(-18 178 140)"
      />
      <circle cx="120" cy="128" r="62" fill="#A9D6E5" {...P} />
      <ellipse cx="120" cy="164" rx="32" ry="22" fill="#FFFDF8" stroke="none" />
      <path d="M110 134 L130 134 L120 150 Z" fill="#F4A259" {...P} strokeWidth={5} />
      <Eyes cy={116} />
      <Blush cy={138} dx={48} />
      <g {...P} strokeWidth={5}>
        <path d="M104 204 L104 216 M104 216 L96 222 M104 216 L112 222" fill="none" />
        <path d="M136 204 L136 216 M136 216 L128 222 M136 216 L144 222" fill="none" />
      </g>
    </Svg>
  );
}

export function Fish(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M168 126 L216 88 L216 164 Z" fill="#F28482" {...P} />
      <ellipse cx="106" cy="126" rx="64" ry="46" fill="#F28482" {...P} />
      <path d="M96 82 C104 64 128 62 134 80" fill="#F28482" {...P} />
      <path d="M120 96 C132 112 132 140 120 156" fill="none" {...P} strokeWidth={5} />
      <g stroke="none" fill="#fff" {...{ opacity: 0.9 }}>
        <circle cx="42" cy="82" r="9" />
        <circle cx="28" cy="58" r="6" />
        <circle cx="48" cy="44" r="4" />
      </g>
      <circle cx="80" cy="116" r="8" fill={O} stroke="none" />
      <circle cx="83" cy="113" r="2.6" fill="#fff" stroke="none" />
      <path d="M58 138 Q66 144 74 138" fill="none" {...P} strokeWidth={5} />
    </Svg>
  );
}

export function Lion(p: ArtProps) {
  return (
    <Svg {...p}>
      <circle cx="120" cy="122" r="86" fill="#F28482" {...P} />
      <circle cx="72" cy="56" r="16" fill="#F4A259" {...P} strokeWidth={5} />
      <circle cx="168" cy="56" r="16" fill="#F4A259" {...P} strokeWidth={5} />
      <circle cx="120" cy="126" r="54" fill="#F4A259" {...P} />
      <Blush cy={146} dx={40} />
      <Eyes cy={114} />
      <path d="M112 136 L128 136 L120 146 Z" fill={O} stroke="none" />
      <path
        d="M120 146 Q120 154 112 156 M120 146 Q120 154 128 156"
        fill="none"
        {...P}
        strokeWidth={5}
      />
    </Svg>
  );
}

export function Rabbit(p: ArtProps) {
  return (
    <Svg {...p}>
      <rect
        x="84"
        y="16"
        width="30"
        height="86"
        rx="15"
        fill="#FFFDF8"
        {...P}
        transform="rotate(-8 99 59)"
      />
      <rect
        x="126"
        y="16"
        width="30"
        height="86"
        rx="15"
        fill="#FFFDF8"
        {...P}
        transform="rotate(8 141 59)"
      />
      <rect
        x="92"
        y="34"
        width="14"
        height="52"
        rx="7"
        fill="#F5CAC3"
        stroke="none"
        transform="rotate(-8 99 60)"
      />
      <rect
        x="134"
        y="34"
        width="14"
        height="52"
        rx="7"
        fill="#F5CAC3"
        stroke="none"
        transform="rotate(8 141 60)"
      />
      <circle cx="120" cy="146" r="58" fill="#FFFDF8" {...P} />
      <Blush cy={158} dx={44} />
      <Eyes cy={136} />
      <path d="M115 154 L125 154 L120 161 Z" fill="#F28482" stroke="none" />
      <rect x="112" y="164" width="16" height="13" rx="4" fill="#fff" {...P} strokeWidth={4} />
    </Svg>
  );
}

/* ------------------------------ food ------------------------------ */

export function Apple(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M120 78 C150 56 190 76 190 122 C190 168 158 202 120 202 C82 202 50 168 50 122 C50 76 90 56 120 78 Z"
        fill="#F28482"
        {...P}
      />
      <path d="M120 76 L128 44" fill="none" {...P} strokeWidth={8} />
      <ellipse
        cx="156"
        cy="52"
        rx="22"
        ry="12"
        fill="#84A59D"
        {...P}
        strokeWidth={5}
        transform="rotate(-28 156 52)"
      />
      <Blush cy={142} dx={50} />
      <Eyes cy={126} />
      <Smile cy={152} />
    </Svg>
  );
}

export function Banana(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M66 44 C74 118 128 178 198 168 C212 166 214 148 200 146 C142 152 98 106 90 42 C88 28 64 30 66 44 Z"
        fill="#FFCE80"
        {...P}
      />
      <path d="M74 42 L88 38 L92 52 L76 56 Z" fill="#8D6E63" {...P} strokeWidth={4} />
      <circle cx="118" cy="118" r="5.5" fill={O} stroke="none" />
      <circle cx="142" cy="128" r="5.5" fill={O} stroke="none" />
      <path d="M126 140 Q136 146 146 142" fill="none" {...P} strokeWidth={5} />
    </Svg>
  );
}

export function Mango(p: ArtProps) {
  return (
    <Svg {...p}>
      <ellipse
        cx="120"
        cy="132"
        rx="66"
        ry="54"
        fill="#F4A259"
        {...P}
        transform="rotate(-14 120 132)"
      />
      <path
        d="M148 66 C150 48 164 38 182 40 C180 58 166 68 148 66 Z"
        fill="#84A59D"
        {...P}
        strokeWidth={5}
      />
      <Blush cy={148} dx={44} />
      <Eyes cy={124} />
      <Smile cy={150} />
    </Svg>
  );
}

export function Grapes(p: ArtProps) {
  const g = { fill: '#CDB4DB', ...P, strokeWidth: 5 } as const;
  return (
    <Svg {...p}>
      <path d="M120 44 L124 70" fill="none" {...P} strokeWidth={6} />
      <ellipse
        cx="150"
        cy="48"
        rx="20"
        ry="11"
        fill="#84A59D"
        {...P}
        strokeWidth={5}
        transform="rotate(-24 150 48)"
      />
      <circle cx="94" cy="92" r="25" {...g} />
      <circle cx="146" cy="92" r="25" {...g} />
      <circle cx="68" cy="130" r="25" {...g} />
      <circle cx="120" cy="130" r="25" {...g} />
      <circle cx="172" cy="130" r="25" {...g} />
      <circle cx="94" cy="166" r="25" {...g} />
      <circle cx="146" cy="166" r="25" {...g} />
      <circle cx="120" cy="200" r="25" {...g} />
      <circle cx="112" cy="126" r="5" fill={O} stroke="none" />
      <circle cx="130" cy="126" r="5" fill={O} stroke="none" />
      <path d="M114 140 Q121 145 128 140" fill="none" {...P} strokeWidth={4.5} />
    </Svg>
  );
}

export function Orange(p: ArtProps) {
  return (
    <Svg {...p}>
      <path d="M120 64 L124 44" fill="none" {...P} strokeWidth={7} />
      <ellipse
        cx="150"
        cy="46"
        rx="20"
        ry="11"
        fill="#84A59D"
        {...P}
        strokeWidth={5}
        transform="rotate(-22 150 46)"
      />
      <circle cx="120" cy="136" r="64" fill="#F4A259" {...P} />
      <g fill="#E8893F" stroke="none" opacity={0.8}>
        <circle cx="168" cy="112" r="3.4" />
        <circle cx="178" cy="140" r="3.4" />
        <circle cx="160" cy="164" r="3.4" />
      </g>
      <Blush cy={152} dx={46} />
      <Eyes cy={128} />
      <Smile cy={152} />
    </Svg>
  );
}

export function Carrot(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M120 62 C106 40 108 24 100 14"
        fill="none"
        stroke="#84A59D"
        strokeWidth={11}
        strokeLinecap="round"
      />
      <path
        d="M122 60 C126 36 140 26 142 12"
        fill="none"
        stroke="#84A59D"
        strokeWidth={11}
        strokeLinecap="round"
      />
      <path
        d="M118 62 C112 38 122 28 118 10"
        fill="none"
        stroke="#6E948C"
        strokeWidth={11}
        strokeLinecap="round"
      />
      <path
        d="M120 58 C152 58 162 88 152 128 L130 206 C126 220 112 218 110 204 L90 128 C82 88 90 58 120 58 Z"
        fill="#F4A259"
        {...P}
      />
      <path
        d="M100 108 L118 106 M104 140 L124 138 M112 170 L128 168"
        fill="none"
        {...P}
        strokeWidth={4.5}
        opacity={0.5}
      />
      <circle cx="108" cy="86" r="5.5" fill={O} stroke="none" />
      <circle cx="132" cy="86" r="5.5" fill={O} stroke="none" />
      <path d="M110 98 Q120 105 130 98" fill="none" {...P} strokeWidth={5} />
    </Svg>
  );
}
