import { Art } from '../art';
import { EMOTIONS, type EmotionDef } from '../data/content';
import { GameShell } from '../components/chrome';
import { LookFind } from '../components/lookfind';
import { FEELING_FIND } from '../data/levels';
import { HAND_FONT } from '../lib/util';

/** feelings whose faces look alike — happy and surprised, sad and angry, sleepy and calm */
const family = (art: string) => EMOTIONS.find((e) => e.art === art)?.family;

export default function Emotions({ onHome }: { onHome: () => void }) {
  return (
    <div className="relative h-full">
      <GameShell ta="உணர்வுகள்" en="feelings" art="face_happy" onHome={onHome} tint="#CDB4DB">
        <LookFind
          gameId="emotions"
          cards={EMOTIONS}
          levels={FEELING_FIND}
          kin={(a, b) => family(a.art) === family(b.art)}
          Face={EmoFace}
          // each feeling comes with a little sentence about when we feel it
          lookLine={(emo) => ({ ta: `${emo.ta}. ${emo.line}`, en: emo.en })}
          findInstruction={{ ta: 'உணர்வைக் கண்டுபிடி', en: 'find the feeling' }}
          onHome={onHome}
        />
      </GameShell>
    </div>
  );
}

function EmoFace({ card }: { card: EmotionDef }) {
  return (
    <>
      <Art id={card.art} size={Math.min(180, window.innerWidth * 0.4)} />
      <div className="text-4xl text-plum leading-none" style={{ fontFamily: HAND_FONT }}>
        {card.ta}
      </div>
      <div className="font-semibold text-xl text-plum/55">{card.en}</div>
      <div className="text-plum/70 font-medium mt-1 text-center max-w-xs">{card.line}</div>
      <div className="text-plum/45 font-bold text-xs mt-1">◂ slide · நழுவு ▸</div>
    </>
  );
}
