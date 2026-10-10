import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { CATEGORIES, WORDS, type WordCard } from '../data/content';
import { chimeGood, chimeSoft, chimeTap, speak, speakPair } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { HAND_FONT, sample, shuffle } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand, SwipeableCard } from '../components/hint';

type Mode = 'look' | 'find';
const FIND_ROUNDS = 5;

export default function Words({ onHome }: { onHome: () => void }) {
  const { recordWin, recordOutcome, timeLeft } = useStore();
  const [cat, setCat] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('look');

  if (!cat) return <CategoryPick onPick={setCat} onHome={onHome} />;

  const cards = WORDS.filter((w) => w.cat === cat);
  const catDef = CATEGORIES.find((c) => c.id === cat)!;

  return (
    <div className="relative h-full">
      <GameShell ta={catDef.ta} en={catDef.en} art={catDef.art} onHome={onHome} tint={catDef.bg}>
        <div className="flex gap-2 mb-3">
          {(
            [
              ['look', 'பார்', 'look', '👁'],
              ['find', 'கண்டுபிடி', 'find it', '🔍'],
            ] as [Mode, string, string, string][]
          ).map(([m, ta, en, glyph]) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                chimeTap();
              }}
              className={`btn-chunky flex-1 !min-h-12 text-base ${mode === m ? 'bg-sun' : ''}`}
            >
              <span className="text-xl leading-none" aria-hidden>
                {glyph}
              </span>
              <span className="leading-tight">
                <span className="block">{ta}</span>
                <span className="block text-[10px] font-semibold opacity-60">{en}</span>
              </span>
            </button>
          ))}
        </div>
        {mode === 'look' ? (
          <LookMode
            cards={cards}
            expired={timeLeft <= 0}
            onExitHome={onHome}
            onDeckDone={() => {
              // the deck is finished — the natural next step is finding, not ending
              setMode('find');
              speak('இப்போ கண்டுபிடி!', 'ta');
            }}
          />
        ) : (
          <FindMode
            cards={cards}
            onHome={onHome}
            recordWin={() => recordWin('words')}
            recordOutcome={(c) => recordOutcome('words', c)}
          />
        )}
      </GameShell>
    </div>
  );
}

/* ---------- category picker ---------- */
function CategoryPick({ onPick, onHome }: { onPick: (c: string) => void; onHome: () => void }) {
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
                speak(c.ta, 'ta');
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

/* ---------- look: calm flashcards ---------- */
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

function LookMode({
  cards,
  expired,
  onExitHome,
  onDeckDone,
}: {
  cards: WordCard[];
  expired: boolean;
  onExitHome: () => void;
  onDeckDone: () => void;
}) {
  const { settings } = useStore();
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const card = cards[i];
  const isLast = i === cards.length - 1;

  useEffect(() => {
    speakPair(card.ta, card.en, settings.english);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  useEffect(() => {
    if (expired) setDone(true);
  }, [expired]);

  // past the last card: flow into the find game — the session ends only there
  const next = () => (isLast ? onDeckDone() : (chimeTap(), setI(i + 1)));
  const prev = () => i > 0 && (chimeTap(), setI(i - 1));

  return (
    <div className="grow flex flex-col min-h-0">
      <SwipeableCard
        className="grow min-h-0 w-full"
        faceClassName="sticker flex flex-col items-center justify-center gap-2 p-4 bg-cream"
        ariaLabel={`${card.ta} ${card.en}`}
        onTap={() => speakPair(card.ta, card.en, settings.english)}
        onSwipe={(dir) => (dir === 1 ? next() : prev())}
        behindNext={!isLast ? <WordFace card={cards[i + 1]} /> : undefined}
        behindPrev={i > 0 ? <WordFace card={cards[i - 1]} /> : undefined}
      >
        <WordFace card={card} />
      </SwipeableCard>
      <div className="flex items-center justify-between gap-3 mt-3">
        <button className="btn-chunky !px-5" disabled={i === 0} onClick={prev}>
          ←
        </button>
        <div className="flex gap-1.5 flex-wrap justify-center">
          {cards.map((_, d) => (
            <div
              key={d}
              className={`h-2 w-2 rounded-full ${d === i ? 'bg-salmon' : 'bg-plum/15'}`}
            />
          ))}
        </div>
        <button className="btn-chunky !px-5 bg-mint" onClick={next}>
          {isLast ? '✓' : '→'}
        </button>
      </div>
      {done && (
        <EndCard
          onAgain={() => {
            setI(0);
            setDone(false);
          }}
          onHome={onExitHome}
        />
      )}
    </div>
  );
}

/* ---------- find it: listen & tap ---------- */
function FindMode({
  cards,
  onHome,
  recordWin,
  recordOutcome,
}: {
  cards: WordCard[];
  onHome: () => void;
  recordWin: () => void;
  recordOutcome: (clean: boolean) => void;
}) {
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<WordCard>(() => cards[0]);
  const [options, setOptions] = useState<WordCard[]>([]);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [hint, setHint] = useState(false);
  const [misses, setMisses] = useState(0);
  const [ended, setEnded] = useState(false);
  const missesRef = useRef(0);
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const done = ended || round >= FIND_ROUNDS;

  useEffect(() => {
    const t = cards[Math.floor(Math.random() * cards.length)];
    setTarget(t);
    const others = WORDS.filter((w) => w.art !== t.art);
    setOptions(shuffle([t, ...sample(others, 2)]));
    setHint(false);
    setWrongId(null);
    setMisses(0);
    missesRef.current = 0;
    if (round >= FIND_ROUNDS) return; // game over — no phantom question speech
    const id = window.setTimeout(() => speak(`${t.ta} எங்கே?`, 'ta'), 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const choose = (w: WordCard) => {
    if (w.art === target.art) {
      chimeGood();
      speak('சரி! ' + w.ta, 'ta');
      recordOutcome(missesRef.current === 0);
      window.setTimeout(() => {
        // last round: end here — no phantom question behind the end card
        if (round + 1 >= FIND_ROUNDS) {
          recordWin();
          setEnded(true);
        } else {
          setRound(round + 1);
        }
      }, 700);
    } else {
      chimeSoft();
      missesRef.current += 1;
      setMisses((m) => m + 1);
      setWrongId(w.art);
      if (wrongId) setHint(true);
      window.setTimeout(() => setWrongId(null), 500);
    }
  };

  if (done)
    return (
      <EndCard
        onAgain={() => {
          setEnded(false);
          setRound(0);
        }}
        onHome={onHome}
      />
    );

  return (
    <div ref={layerRef} className="relative grow flex flex-col min-h-0">
      <GuideHand
        target={() => optRefs.current[target.art] ?? null}
        layerRef={layerRef}
        guideKey="words"
        active={!done && options.length > 0}
        fireSignal={misses}
      />
      <button
        className="sticker mx-auto px-6 py-3 mb-3 font-display font-bold text-2xl text-plum"
        onClick={() => speak(`${target.ta} எங்கே?`, 'ta')}
      >
        {target.ta} எங்கே? 🔊
      </button>
      <div className="relative grid grid-cols-3 gap-3 grow content-center max-w-md mx-auto w-full">
        {options.map((w) => (
          <button
            key={w.art}
            ref={(el) => {
              optRefs.current[w.art] = el;
            }}
            onClick={() => choose(w)}
            className={`sticker p-3 aspect-square flex items-center justify-center transition-transform active:scale-95 ${wrongId === w.art ? 'anim-wiggle' : ''} ${hint && w.art === target.art ? 'anim-hint' : ''}`}
          >
            <Art id={w.art} size={92} />
          </button>
        ))}
      </div>
    </div>
  );
}
