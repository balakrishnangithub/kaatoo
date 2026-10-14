import { useState } from 'react';
import { Art } from '../art';
import { CATEGORIES, WORDS, type Category, type WordCard } from '../data/content';
import { chimeTap, speak } from '../lib/speech';
import { GameShell } from '../components/chrome';
import { LookFind } from '../components/lookfind';
import { HAND_FONT } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';

export default function Words({ onHome }: { onHome: () => void }) {
  const [cat, setCat] = useState<Category | null>(null);
  const catDef = CATEGORIES.find((c) => c.id === cat);

  if (!catDef) return <CategoryPick onPick={setCat} onHome={onHome} />;

  return (
    <div className="relative h-full">
      <GameShell ta={catDef.ta} en={catDef.en} art={catDef.art} onHome={onHome} tint={catDef.bg}>
        <LookFind
          gameId="words"
          cards={WORDS.filter((w) => w.cat === cat)}
          decoys={WORDS}
          Face={WordFace}
          onHome={onHome}
        />
      </GameShell>
    </div>
  );
}

/* ---------- category picker ---------- */
function CategoryPick({ onPick, onHome }: { onPick: (c: Category) => void; onHome: () => void }) {
  useInstruction('எதைப் பார்க்கலாம்?', 'what shall we look at?');
  return (
    <div className="relative h-full">
      <GameShell ta="சொற்கள்" en="first words" art="mango" onHome={onHome} tint="#FFCE80">
        <div className="grid grid-cols-2 gap-4 grow content-center max-w-md mx-auto w-full">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              onClick={() => {
                chimeTap();
                onPick(c.id);
                speak(c.ta, 'ta'); // the deck's first card waits for this to finish
              }}
              className="sticker anim-pop p-4 flex flex-col items-center gap-1 active:scale-95 transition-transform"
              style={{ background: c.bg, animationDelay: `${i * 70}ms` }}
            >
              <Art id={c.art} size={84} />
              <div className="font-display font-bold text-lg text-plum">{c.ta}</div>
              <div className="text-xs font-semibold text-plum/60">{c.en}</div>
            </button>
          ))}
        </div>
      </GameShell>
    </div>
  );
}

function WordFace({ card }: { card: WordCard }) {
  return (
    <>
      <Art id={card.art} size={Math.min(190, window.innerWidth * 0.42)} />
      <div className="text-4xl text-plum leading-none" style={{ fontFamily: HAND_FONT }}>
        {card.ta}
      </div>
      <div className="font-semibold text-xl text-plum/55">{card.en}</div>
      <div className="text-plum/45 font-bold text-xs mt-1">◂ slide · நழுவு ▸</div>
    </>
  );
}
