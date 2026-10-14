import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Art, type ArtId } from '../art';
import type { GameId, Phrase } from '../data/content';
import { useFlash } from '../hooks/useFlash';
import { useRounds } from '../hooks/useRounds';
import { chimeGood, chimeTap, hush, speak, speakPair } from '../lib/speech';
import { useStore } from '../lib/store';
import { pick, sample, shuffle } from '../lib/util';
import { EndCard } from './chrome';
import { GuideHand, SwipeableCard } from './hint';

/**
 * lookfind.tsx — the "look, then find" activity both vocabulary games are:
 *   look  a calm deck of cards — see the picture, hear its name, swipe on
 *   find  listen & tap — "X எங்கே?" with three pictures to choose from
 * Words and Emotions differ only in their cards and how a card looks; the
 * deck, the tabs and the find rounds are the same thing, so they live here.
 */

/** the least a card needs: a picture and its name in both languages */
export interface Card {
  art: ArtId;
  ta: string;
  en: string;
}

type Mode = 'look' | 'find';
const FIND_ROUNDS = 5;

const MODES: { id: Mode; ta: string; en: string; glyph: string }[] = [
  { id: 'look', ta: 'பார்', en: 'look', glyph: '👁' },
  { id: 'find', ta: 'கண்டுபிடி', en: 'find it', glyph: '🔍' },
];

interface LookFindProps<C extends Card> {
  /** whose progress this is — `words` or `emotions` */
  gameId: GameId;
  /** the deck to look through, and the things she is asked to find */
  cards: C[];
  /** where the two wrong pictures of a find round come from (default: the deck) */
  decoys?: Card[];
  /** how a card looks */
  Face: ComponentType<{ card: C }>;
  /** what the voice says for a card in the deck (default: just its name) */
  lookLine?: (card: C) => Phrase;
  /** spoken once when the find game opens, before its first question */
  findInstruction?: Phrase;
  onHome: () => void;
}

export function LookFind<C extends Card>({
  gameId,
  cards,
  decoys = cards,
  Face,
  lookLine,
  findInstruction,
  onHome,
}: LookFindProps<C>) {
  const [mode, setMode] = useState<Mode>('look');

  return (
    <>
      <div className="flex gap-2 mb-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              if (m.id !== mode) hush(); // switching modes — the old one stops talking
              setMode(m.id);
              chimeTap();
            }}
            className={`btn-chunky flex-1 !min-h-12 text-base ${mode === m.id ? 'bg-sun' : ''}`}
          >
            <span className="text-xl leading-none" aria-hidden>
              {m.glyph}
            </span>
            <span className="leading-tight">
              <span className="block">{m.ta}</span>
              <span className="block text-[10px] font-semibold opacity-60">{m.en}</span>
            </span>
          </button>
        ))}
      </div>
      {mode === 'look' ? (
        <LookDeck
          cards={cards}
          Face={Face}
          lookLine={lookLine}
          onHome={onHome}
          onDeckDone={() => {
            // the deck is finished — the natural next step is finding, not ending
            setMode('find');
            speak('இப்போ கண்டுபிடி!', 'ta');
          }}
        />
      ) : (
        <FindGame
          gameId={gameId}
          cards={cards}
          decoys={decoys}
          instruction={findInstruction}
          onHome={onHome}
        />
      )}
    </>
  );
}

/* ---------- look: calm flashcards ---------- */
function LookDeck<C extends Card>({
  cards,
  Face,
  lookLine = (card) => card,
  onHome,
  onDeckDone,
}: {
  cards: C[];
  Face: ComponentType<{ card: C }>;
  lookLine?: (card: C) => Phrase;
  onHome: () => void;
  onDeckDone: () => void;
}) {
  const { settings, expired } = useStore();
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const card = cards[i];
  const isLast = i === cards.length - 1;

  const say = (opts?: { queue: boolean }) => {
    const line = lookLine(card);
    speakPair(line.ta, line.en, settings.english, opts);
  };

  // Name each card as it comes up. The first card after the deck opens waits
  // its turn (a category name may still be in the air); a swipe interrupts.
  // Spoken from a timer so a re-run of this effect can never say it twice.
  const opened = useRef(false);
  useEffect(() => {
    const id = window.setTimeout(() => {
      say({ queue: !opened.current });
      opened.current = true;
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  // when the session's time is up, the deck closes with the end card
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
        faceClassName="sticker flex flex-col items-center justify-center gap-2 p-4"
        ariaLabel={`${card.ta} ${card.en}`}
        onTap={() => say()}
        onSwipe={(dir) => (dir === 1 ? next() : prev())}
        behindNext={!isLast ? <Face card={cards[i + 1]} /> : undefined}
        behindPrev={i > 0 ? <Face card={cards[i - 1]} /> : undefined}
      >
        <Face card={card} />
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
          onHome={onHome}
        />
      )}
    </div>
  );
}

/* ---------- find it: listen & tap ---------- */
function FindGame({
  gameId,
  cards,
  decoys,
  instruction,
  onHome,
}: {
  gameId: GameId;
  cards: Card[];
  decoys: Card[];
  instruction?: Phrase;
  onHome: () => void;
}) {
  const { settings } = useStore();
  const deal = () => {
    const target = pick(cards);
    const others = decoys.filter((c) => c.art !== target.art);
    return { target, options: shuffle([target, ...sample(others, 2)]) };
  };
  const [board, setBoard] = useState(deal);
  const { round, done, solved, misses, miss, solve, restart } = useRounds(gameId, FIND_ROUNDS, () =>
    setBoard(deal()),
  );
  const [wrong, flashWrong] = useFlash<string>();
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const { target, options } = board;
  const question = `${target.ta} எங்கே?`;

  // Ask each round's question. The opening round follows what is already
  // being said ("இப்போ கண்டுபிடி!", then the instruction) instead of cutting
  // it off; later rounds interrupt — by then only old praise is in the air.
  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => {
      const opening = round === 0;
      if (opening && instruction)
        speakPair(instruction.ta, instruction.en, settings.english, { queue: true });
      speak(question, 'ta', { queue: opening });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, done]);

  const choose = (c: Card) => {
    if (solved) return;
    if (c.art === target.art) {
      chimeGood();
      speak('சரி! ' + c.ta, 'ta');
      solve(700);
    } else {
      miss();
      flashWrong(c.art);
    }
  };

  if (done) return <EndCard onAgain={restart} onHome={onHome} />;

  return (
    <div ref={layerRef} className="relative grow flex flex-col min-h-0">
      <GuideHand
        target={() => optRefs.current[target.art] ?? null}
        layerRef={layerRef}
        guideKey={gameId}
        active={!solved}
        fireSignal={misses}
      />
      <button
        className="sticker mx-auto px-6 py-3 mb-3 font-display font-bold text-2xl text-plum"
        onClick={() => speak(question, 'ta')}
      >
        {question} 🔊
      </button>
      <div className="relative grid grid-cols-3 gap-3 grow content-center max-w-md mx-auto w-full">
        {options.map((c) => (
          <button
            key={c.art}
            ref={(el) => {
              optRefs.current[c.art] = el;
            }}
            onClick={() => choose(c)}
            className={`sticker p-3 aspect-square flex items-center justify-center transition-transform active:scale-95 ${wrong === c.art ? 'anim-wiggle' : ''} ${misses >= 2 && c.art === target.art ? 'anim-hint' : ''}`}
          >
            <Art id={c.art} size={92} />
          </button>
        ))}
      </div>
    </div>
  );
}
