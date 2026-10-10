import { useEffect, useRef, useState } from 'react';
import { ART, type ArtId } from '../art';
import { COLORS, SHAPES } from '../data/content';
import { chimeGood, chimeSoft, speak, speakSeq } from '../lib/speech';
import { useStore } from '../lib/store';
import { EndCard, GameShell } from '../components/chrome';
import { sample, shuffle } from '../lib/util';
import { useInstruction } from '../hooks/useInstruction';
import { GuideHand } from '../components/hint';

/*
 Learning trajectory for repeating patterns (Clements & Sarama; Rittle-Johnson
 et al. 2013): children first DUPLICATE a pattern, then EXTEND it, then abstract,
 then name the unit. So:
   level 0 · COPY: build the same pattern below the model (appearance matching —
             the entry level, reachable by 2–3 year olds)
   level 1 · EXTEND AB: what comes next (the classic task)
   level 2 · EXTEND AAB/ABB: longer unit
   level 3 · EXTEND ABC/AABB: hardest unit
 Teaching animation: each element is named aloud one by one, and the tile
 lights exactly while its name is spoken — the voice itself walks the rhythm
 ("red… blue… red… blue… — what next?"). Naming the unit aloud measurably
 improves preschoolers' patterning (Fyfe et al. 2015).
*/
const ROUNDS = 5;

interface El {
  art: ArtId;
  fill: string;
  key: string;
  labelTa: string; // e.g. "சிவப்பு வட்டம்"
}

function makeEl(): El {
  const s = sample(SHAPES, 1)[0];
  const c = sample(COLORS, 1)[0];
  return { art: s.id, fill: c.hex, key: `${s.id}-${c.id}`, labelTa: `${c.ta} ${s.ta}` };
}

interface Data {
  mode: 'copy' | 'extend';
  seq: El[]; // model row
  answer?: El; // extend: the missing one
  options: El[];
}

function build(level: number): Data {
  const A = makeEl();
  let B = makeEl();
  while (B.key === A.key) B = makeEl();
  let C = makeEl();
  while (C.key === A.key || C.key === B.key) C = makeEl();

  let unit: El[];
  if (level <= 1) unit = [A, B];
  else if (level === 2) unit = Math.random() < 0.5 ? [A, A, B] : [A, B, B];
  else unit = Math.random() < 0.5 ? [A, B, C] : [A, A, B, B];

  const shown: El[] = [];
  while (shown.length < 5) shown.push(...unit);

  if (level === 0) {
    const seq = shown.slice(0, 4);
    return { mode: 'copy', seq, options: shuffle([A, B]) };
  }
  const seq = shown.slice(0, 4);
  const answer = shown[4];
  const distract = new Set<El>([A, B, C].filter((e) => e.key !== answer.key));
  while (distract.size < 2) {
    const d = makeEl();
    if (d.key !== answer.key) distract.add(d);
  }
  return { mode: 'extend', seq, answer, options: shuffle([answer, ...distract]) };
}

export default function Pattern({ onHome }: { onHome: () => void }) {
  const { levelFor, recordWin, recordOutcome } = useStore();
  const level = levelFor('pattern', 3);
  const [round, setRound] = useState(0);
  const [ended, setEnded] = useState(false);
  const [data, setData] = useState(() => build(level));
  const [wrong, setWrong] = useState<string | null>(null);
  const [misses, setMisses] = useState(0);
  const [solved, setSolved] = useState(false);
  const [filled, setFilled] = useState<El[]>([]); // copy mode: what she built
  const [spokenIdx, setSpokenIdx] = useState(-1); // which tile the voice is naming right now
  const missesRef = useRef(0);
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const done = ended || round >= ROUNDS;

  useEffect(() => {
    setData(build(level));
    setSolved(false);
    setMisses(0);
    missesRef.current = 0;
    setFilled([]);
    optRefs.current = [];
  }, [round, level]);

  useInstruction(
    data.mode === 'copy' ? 'இதே மாதிரி கீழே போடு' : 'அடுத்தது என்ன?',
    data.mode === 'copy' ? 'copy the pattern' : 'what comes next?',
    [round],
    !done,
  );

  // name the elements aloud ONE BY ONE — the next word starts only after the
  // previous word has fully finished, and each tile lights exactly while its
  // name is being said (voice and highlight can never drift apart)
  useEffect(() => {
    if (done || solved) return;
    setSpokenIdx(-1);
    // full label — she hears the shape AND its colour, not just a colour word
    const labels = data.seq.map((e) => e.labelTa);
    const cancel = speakSeq(labels, 'ta', {
      onStep: (i) => setSpokenIdx(i),
      onDone: () => {
        if (data.mode === 'extend') {
          setSpokenIdx(data.seq.length); // light the "?" slot on its beat
          speak('அடுத்தது என்ன?', 'ta');
        } else {
          setSpokenIdx(-1);
        }
      },
    });
    return cancel;
  }, [round, data, done, solved]);

  // which option is currently correct (extend: the answer; copy: matches next empty slot)
  const expectedKey = data.mode === 'extend' ? data.answer?.key : data.seq[filled.length]?.key;
  const answerIdx = data.options.findIndex((o) => o.key === expectedKey);

  const finishRound = () => {
    recordOutcome('pattern', missesRef.current === 0);
    window.setTimeout(() => {
      // last round: end right here — don't advance into a phantom question
      // behind the end card (its instruction would talk over the praise)
      if (round + 1 >= ROUNDS) {
        recordWin('pattern');
        setEnded(true);
      } else {
        setRound((r) => r + 1);
      }
    }, 900);
  };

  const choose = (el: El, key: string) => {
    if (solved) return;
    if (el.key === expectedKey) {
      chimeGood();
      if (data.mode === 'copy') {
        const f = [...filled, el];
        setFilled(f);
        if (f.length >= data.seq.length) {
          setSolved(true);
          speak('சரி! அதே முறை!', 'ta');
          finishRound();
        }
      } else {
        setSolved(true);
        speak('சரி!', 'ta');
        finishRound();
      }
    } else {
      chimeSoft();
      setWrong(key);
      missesRef.current += 1;
      setMisses((m) => m + 1);
      window.setTimeout(() => setWrong(null), 450);
    }
  };

  return (
    <div className="relative h-full">
      <GameShell ta="முறைகள்" en="patterns" art="drum" onHome={onHome} tint="#FFCE80">
        <div ref={layerRef} className="relative grow flex flex-col justify-center gap-5 min-h-0">
          <GuideHand
            target={() => optRefs.current[answerIdx] ?? null}
            layerRef={layerRef}
            guideKey="pattern"
            active={!solved && !done && data.options.length > 0}
            fireSignal={misses}
          />
          {/* sequence strip — a tile lights exactly while the voice names it */}
          <div className="sticker py-3 px-3 flex items-center justify-center gap-2 w-full max-w-sm mx-auto">
            {data.seq.map((el, i) => (
              <div
                key={i}
                className={`shrink-0 rounded-2xl transition-all duration-150 ${spokenIdx === i ? 'scale-125 drop-shadow-[0_0_10px_rgba(255,183,77,0.9)]' : ''}`}
              >
                <TileIn el={el} size={52} />
              </div>
            ))}
            {data.mode === 'extend' && (
              <div
                className={`shrink-0 rounded-2xl border-4 border-dashed flex items-center justify-center font-display font-bold text-2xl transition-all duration-150 ${
                  solved ? 'border-sage bg-mint/40' : 'border-plum/30 text-plum/50'
                } ${spokenIdx === data.seq.length ? 'scale-125 border-salmon text-salmon' : ''}`}
                style={{ width: 66, height: 66 }}
              >
                {solved && data.answer ? <TileIn el={data.answer} size={46} /> : '?'}
              </div>
            )}
          </div>
          {/* copy mode: the row she is building */}
          {data.mode === 'copy' && (
            <div className="flex items-center justify-center gap-2 w-full max-w-sm mx-auto">
              {data.seq.map((_, i) => (
                <div
                  key={i}
                  className={`rounded-2xl border-4 border-dashed flex items-center justify-center ${
                    filled[i]
                      ? 'border-sage bg-mint/30'
                      : i === filled.length
                        ? 'border-salmon/60'
                        : 'border-plum/20'
                  }`}
                  style={{ width: 60, height: 60 }}
                >
                  {filled[i] && <TileIn el={filled[i]} size={44} />}
                </div>
              ))}
            </div>
          )}
          {/* options */}
          <div className="relative grid grid-cols-3 gap-3 max-w-md mx-auto w-full">
            {data.options.map((el, i) => (
              <button
                key={el.key + i}
                ref={(el2) => {
                  optRefs.current[i] = el2;
                }}
                onClick={() => choose(el, el.key + i)}
                className={`sticker aspect-square p-3 flex items-center justify-center transition-transform active:scale-95 ${
                  wrong === el.key + i ? 'anim-wiggle' : ''
                } ${misses >= 2 && el.key === expectedKey && !solved ? 'anim-hint' : ''}`}
              >
                <TileIn el={el} size={84} />
              </button>
            ))}
          </div>
        </div>
      </GameShell>
      {done && (
        <EndCard
          onAgain={() => {
            setEnded(false);
            setRound(0);
          }}
          onHome={onHome}
        />
      )}
    </div>
  );
}

function TileIn({ el, size }: { el: El; size: number }) {
  const C = ART[el.art] as React.ComponentType<{ size?: number; fill?: string }>;
  return <C size={size} fill={el.fill} />;
}
