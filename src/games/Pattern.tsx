import { useEffect, useRef, useState } from 'react';
import { Art, type ArtId } from '../art';
import { COLORS, SHAPES } from '../data/content';
import { chimeGood, speak, speakSeq } from '../lib/speech';
import { EndCard, GameShell } from '../components/chrome';
import { pick, shuffle } from '../lib/util';
import { useFlash } from '../hooks/useFlash';
import { useFrozenLevel } from '../hooks/useFrozenLevel';
import { useInstruction } from '../hooks/useInstruction';
import { useRounds } from '../hooks/useRounds';
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
  const s = pick(SHAPES);
  const c = pick(COLORS);
  return { art: s.id, fill: c.hex, key: `${s.id}-${c.id}`, labelTa: `${c.ta} ${s.ta}` };
}

interface Data {
  mode: 'copy' | 'extend';
  seq: El[]; // model row
  answer?: El; // extend: the missing one
  options: El[];
}

function build(level: number): Data {
  // three elements that all look different: the pattern's units, and a spare decoy
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
  const seq = shown.slice(0, 4);

  if (level === 0) return { mode: 'copy', seq, options: shuffle([A, B]) };
  // the answer plus the two of A/B/C it is not
  return { mode: 'extend', seq, answer: shown[4], options: shuffle([A, B, C]) };
}

export default function Pattern({ onHome }: { onHome: () => void }) {
  const level = useFrozenLevel('pattern', 3);
  const [data, setData] = useState(() => build(level));
  const [filled, setFilled] = useState<El[]>([]); // copy mode: what she built
  const [spokenIdx, setSpokenIdx] = useState(-1); // which tile the voice is naming right now
  const { round, done, solved, misses, miss, solve, restart } = useRounds('pattern', ROUNDS, () => {
    setData(build(level));
    setFilled([]);
  });
  const [wrong, flashWrong] = useFlash<string>();
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
    return speakSeq(labels, 'ta', {
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
  }, [data, done, solved]);

  // which option is currently correct (extend: the answer; copy: matches next empty slot)
  const expectedKey = data.mode === 'extend' ? data.answer?.key : data.seq[filled.length]?.key;
  const answerIdx = data.options.findIndex((o) => o.key === expectedKey);

  const choose = (el: El, key: string) => {
    if (solved) return;
    if (el.key !== expectedKey) {
      miss();
      flashWrong(key);
      return;
    }
    chimeGood();
    if (data.mode === 'extend') {
      speak('சரி!', 'ta');
      solve(900);
      return;
    }
    const built = [...filled, el];
    setFilled(built);
    if (built.length >= data.seq.length) {
      speak('சரி! அதே முறை!', 'ta');
      solve(900);
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
            active={!solved && !done}
            fireSignal={misses}
          />
          {/* sequence strip — a tile lights exactly while the voice names it */}
          <div className="sticker py-3 px-3 flex items-center justify-center gap-2 w-full max-w-sm mx-auto">
            {data.seq.map((el, i) => (
              <div
                key={i}
                className={`shrink-0 rounded-2xl transition-all duration-150 ${spokenIdx === i ? 'scale-125 drop-shadow-[0_0_10px_rgba(255,183,77,0.9)]' : ''}`}
              >
                <Art id={el.art} fill={el.fill} size={52} />
              </div>
            ))}
            {data.mode === 'extend' && (
              <div
                className={`shrink-0 rounded-2xl border-4 border-dashed flex items-center justify-center font-display font-bold text-2xl transition-all duration-150 ${
                  solved ? 'border-sage bg-mint/40' : 'border-plum/30 text-plum/50'
                } ${spokenIdx === data.seq.length ? 'scale-125 border-salmon text-salmon' : ''}`}
                style={{ width: 66, height: 66 }}
              >
                {solved && data.answer ? (
                  <Art id={data.answer.art} fill={data.answer.fill} size={46} />
                ) : (
                  '?'
                )}
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
                  {filled[i] && <Art id={filled[i].art} fill={filled[i].fill} size={44} />}
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
                <Art id={el.art} fill={el.fill} size={84} />
              </button>
            ))}
          </div>
        </div>
      </GameShell>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </div>
  );
}
