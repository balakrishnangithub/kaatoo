import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { EMOTIONS } from '../data/content';
import { chimeGood, chimeSoft, chimeTap, speak, speakPair } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { HAND_FONT, sample, shuffle } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand, SwipeableCard } from '../components/hint';

type Mode = 'look' | 'find';
const FIND_ROUNDS = 5;

export default function Emotions({ onHome }: { onHome: () => void }) {
  const { recordWin, recordOutcome, timeLeft } = useStore();
  const [mode, setMode] = useState<Mode>('look');

  return (
    <div className="relative h-full">
      <GameShell ta="உணர்வுகள்" en="feelings" art="face_happy" onHome={onHome} tint="#CDB4DB">
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
          <Look
            expired={timeLeft <= 0}
            onExitHome={onHome}
            onDeckDone={() => {
              // the deck is finished — the natural next step is finding, not ending
              setMode('find');
              speak('இப்போ கண்டுபிடி!', 'ta');
            }}
          />
        ) : (
          <Find
            onHome={onHome}
            recordWin={() => recordWin('emotions')}
            recordOutcome={(c) => recordOutcome('emotions', c)}
          />
        )}
      </GameShell>
    </div>
  );
}

function EmoFace({ emo }: { emo: (typeof EMOTIONS)[number] }) {
  return (
    <>
      <Art id={emo.art} size={Math.min(180, window.innerWidth * 0.4)} />
      <div className="text-4xl text-plum leading-none" style={{ fontFamily: HAND_FONT }}>
        {emo.ta}
      </div>
      <div className="font-semibold text-xl text-plum/55">{emo.en}</div>
      <div className="text-plum/70 font-medium mt-1 text-center max-w-xs">{emo.line}</div>
      <div className="text-plum/45 font-bold text-xs mt-1">◂ slide · நழுவு ▸</div>
    </>
  );
}

function Look({
  expired,
  onExitHome,
  onDeckDone,
}: {
  expired: boolean;
  onExitHome: () => void;
  onDeckDone: () => void;
}) {
  const { settings } = useStore();
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);
  const emo = EMOTIONS[i];
  const isLast = i === EMOTIONS.length - 1;

  useEffect(() => {
    speakPair(emo.ta + '. ' + emo.line, emo.en, settings.english);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  useEffect(() => {
    if (expired) setDone(true);
  }, [expired]);

  return (
    <div className="grow flex flex-col min-h-0">
      <SwipeableCard
        className="grow min-h-0 w-full"
        faceClassName="sticker flex flex-col items-center justify-center gap-2 p-4 bg-cream"
        ariaLabel={`${emo.ta} ${emo.en}`}
        onTap={() => speakPair(emo.ta + '. ' + emo.line, emo.en, settings.english)}
        onSwipe={(dir) =>
          dir === 1
            ? isLast
              ? onDeckDone()
              : (chimeTap(), setI(i + 1))
            : i > 0 && (chimeTap(), setI(i - 1))
        }
        behindNext={!isLast ? <EmoFace emo={EMOTIONS[i + 1]} /> : undefined}
        behindPrev={i > 0 ? <EmoFace emo={EMOTIONS[i - 1]} /> : undefined}
      >
        <EmoFace emo={emo} />
      </SwipeableCard>
      <div className="flex items-center justify-between gap-3 mt-3">
        <button className="btn-chunky !px-5" disabled={i === 0} onClick={() => setI(i - 1)}>
          ←
        </button>
        <div className="flex gap-1.5">
          {EMOTIONS.map((_, d) => (
            <div
              key={d}
              className={`h-2 w-2 rounded-full ${d === i ? 'bg-salmon' : 'bg-plum/15'}`}
            />
          ))}
        </div>
        <button
          className="btn-chunky !px-5 bg-mint"
          onClick={() => (isLast ? onDeckDone() : (chimeTap(), setI(i + 1)))}
        >
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

function Find({
  onHome,
  recordWin,
  recordOutcome,
}: {
  onHome: () => void;
  recordWin: () => void;
  recordOutcome: (clean: boolean) => void;
}) {
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState(EMOTIONS[0]);
  const [options, setOptions] = useState(EMOTIONS.slice(0, 3));
  const [wrong, setWrong] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [ended, setEnded] = useState(false);
  const missesRef = useRef(0);
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const done = ended || round >= FIND_ROUNDS;

  useInstruction('உணர்வைக் கண்டுபிடி', 'find the feeling', []);

  useEffect(() => {
    if (round >= FIND_ROUNDS) return; // game over — no phantom question speech
    const t = sample(EMOTIONS, 1)[0];
    setTarget(t);
    setOptions(
      shuffle([
        t,
        ...sample(
          EMOTIONS.filter((e) => e.art !== t.art),
          2,
        ),
      ]),
    );
    setMisses(0);
    missesRef.current = 0;
    const id = window.setTimeout(() => speak(`${t.ta} எங்கே?`, 'ta'), 300);
    return () => window.clearTimeout(id);
  }, [round]);

  const choose = (art: string) => {
    if (art === target.art) {
      chimeGood();
      speak('சரி! ' + target.ta, 'ta');
      recordOutcome(missesRef.current === 0);
      window.setTimeout(() => {
        // last round: end here — no phantom question behind the end card
        if (round + 1 >= FIND_ROUNDS) {
          recordWin();
          setEnded(true);
        } else {
          setRound((r) => r + 1);
        }
      }, 700);
    } else {
      chimeSoft();
      setWrong(art);
      missesRef.current += 1;
      setMisses((m) => m + 1);
      window.setTimeout(() => setWrong(null), 450);
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
        guideKey="emotions"
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
        {options.map((e) => (
          <button
            key={e.art}
            ref={(el) => {
              optRefs.current[e.art] = el;
            }}
            onClick={() => choose(e.art)}
            className={`sticker p-3 aspect-square flex items-center justify-center transition-transform active:scale-95 ${wrong === e.art ? 'anim-wiggle' : ''} ${
              misses >= 2 && e.art === target.art ? 'anim-hint' : ''
            }`}
          >
            <Art id={e.art} size={92} />
          </button>
        ))}
      </div>
    </div>
  );
}
