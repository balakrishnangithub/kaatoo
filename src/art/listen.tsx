// Words that sound almost alike (பல் / பால், கல் / கால், மலை / மாலை) and the ear
// for the listening game — same sticker language as the rest of the art.
import { Blush, Eyes, O, P, Smile, Svg, type ArtProps } from './shared';

/** பல் — a tooth */
export function Tooth(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M66 78 Q64 46 96 46 Q110 46 120 56 Q130 46 144 46 Q176 46 174 78 Q174 116 162 140 Q154 178 142 198 Q132 210 126 192 L120 164 L114 192 Q108 210 98 198 Q86 178 78 140 Q66 116 66 78 Z"
        fill="#FFFDF8"
        {...P}
      />
      <path d="M86 66 Q92 58 102 58" fill="none" {...P} strokeWidth={5} opacity={0.3} />
      <Eyes cy={98} dx={20} r={6} />
      <Smile cy={118} w={20} />
      <Blush cy={116} dx={36} />
    </Svg>
  );
}

/** பால் — a glass of milk */
export function Milk(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M68 52 L172 52 L160 196 Q158 206 148 206 L92 206 Q82 206 80 196 Z"
        fill="#DCEFF5"
        stroke="none"
      />
      <path
        d="M74 96 Q97 86 120 96 Q143 106 166 96 L160 196 Q158 202 150 202 L90 202 Q82 202 80 196 Z"
        fill="#FFFDF8"
        stroke="none"
      />
      <path d="M74 96 Q97 86 120 96 Q143 106 166 96" fill="none" {...P} strokeWidth={5} />
      <path
        d="M68 52 L172 52 L160 196 Q158 206 148 206 L92 206 Q82 206 80 196 Z"
        fill="none"
        {...P}
      />
      <Eyes cy={136} dx={20} r={6} />
      <Smile cy={156} w={20} />
      <Blush cy={152} dx={36} />
    </Svg>
  );
}

/** கல் — a stone */
export function Stone(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M48 154 Q42 108 84 90 Q122 72 164 86 Q202 100 196 144 Q192 182 146 186 L94 186 Q54 184 48 154 Z"
        fill="#CFC8D6"
        {...P}
      />
      <path
        d="M84 104 Q100 96 116 98"
        fill="none"
        stroke="#fff"
        strokeWidth={8}
        strokeLinecap="round"
        opacity={0.6}
      />
      <circle cx="160" cy="160" r="5" fill={O} stroke="none" opacity={0.25} />
      <circle cx="72" cy="150" r="4" fill={O} stroke="none" opacity={0.25} />
      <Eyes cy={134} dx={22} r={6} />
      <Smile cy={154} w={22} />
    </Svg>
  );
}

/** கால் — a leg and its foot */
export function Leg(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M92 30 L140 30 L142 142 Q142 154 154 158 L186 168 Q206 176 202 194 Q198 208 178 208 L98 208 Q84 208 84 194 L92 142 Z"
        fill="#F3C6A5"
        {...P}
      />
      <g fill="#F3C6A5" {...P} strokeWidth={5}>
        <circle cx="196" cy="182" r="8" />
        <circle cx="184" cy="172" r="7" />
        <circle cx="172" cy="166" r="6" />
      </g>
      <path d="M92 70 L140 70" fill="none" {...P} strokeWidth={5} opacity={0.25} />
      <path d="M100 196 Q130 200 160 196" fill="none" {...P} strokeWidth={5} opacity={0.3} />
    </Svg>
  );
}

/** மலை — a hill */
export function Hill(p: ArtProps) {
  return (
    <Svg {...p}>
      <path
        d="M20 196 L94 70 Q102 58 110 70 L146 128 L162 104 Q170 94 178 104 L220 196 Z"
        fill="#B7E4C7"
        {...P}
      />
      <path
        d="M80 94 L94 70 Q102 58 110 70 L124 94 Q112 104 102 96 Q92 104 80 94 Z"
        fill="#FFFDF8"
        {...P}
        strokeWidth={5}
      />
      <Eyes cy={150} dx={20} r={6} />
      <Smile cy={170} w={20} />
      <Blush cy={166} dx={36} />
    </Svg>
  );
}

/** மாலை — a garland of marigolds and jasmine */
export function Garland(p: ArtProps) {
  const flowers = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    return { x: 46 + 148 * t, y: 52 + 140 * Math.sin(Math.PI * t), marigold: i % 2 === 0 };
  });
  return (
    <Svg {...p}>
      <path d="M46 52 Q120 330 194 52" fill="none" {...P} strokeWidth={5} opacity={0.5} />
      {flowers.map((f, i) => (
        <g key={i}>
          <circle
            cx={f.x}
            cy={f.y}
            r={f.marigold ? 15 : 11}
            fill={f.marigold ? '#F4A259' : '#FFFDF8'}
            {...P}
            strokeWidth={5}
          />
          <circle
            cx={f.x}
            cy={f.y}
            r={f.marigold ? 5 : 3.5}
            fill={f.marigold ? '#F28482' : '#FFCE80'}
            stroke="none"
          />
        </g>
      ))}
      <path d="M114 196 L120 222 L126 196" fill="#F28482" {...P} strokeWidth={5} />
    </Svg>
  );
}

/** காது — an ear, listening */
export function Ear(p: ArtProps) {
  return (
    <Svg {...p}>
      <g fill="none" {...P} strokeWidth={6} opacity={0.45}>
        <path d="M58 92 Q44 120 58 148" />
        <path d="M36 76 Q14 120 36 164" />
      </g>
      <path
        d="M150 44 Q86 34 84 100 Q82 140 112 152 Q126 158 124 182 Q122 208 148 208 Q180 206 188 158 Q200 92 150 44 Z"
        fill="#F3C6A5"
        {...P}
      />
      <path
        d="M118 104 Q120 74 148 76 Q172 80 168 116 Q164 140 146 136"
        fill="none"
        {...P}
        strokeWidth={6}
      />
      <path d="M140 108 Q148 112 146 124" fill="none" {...P} strokeWidth={5} />
    </Svg>
  );
}
