import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { topLevel } from '../data/levels';
import { chimeGood, speak, speakSeq } from '../lib/speech';
import type { Ladder } from '../lib/skill';
import { GAPS, sing, voicePair } from '../lib/sounds';
import { EndCard, GameShell } from '../components/chrome';
import { GuideHand } from '../components/hint';
import { ListenButton, SoundGate } from '../components/listening';
import { useRounds } from '../hooks/useRounds';
import { useTimers } from '../hooks/useTimers';

/*
 Big voice, little voice — pitch, heard by comparing.
 The elephant sings low and the bird sings high; then one of them sings
 again, hidden, and she taps who it was. Nothing asks her to NAME a pitch
 "high" or "low": even 5–6-year-olds mix those words up (Costa-Giomi &
 Descombes 1996), while 2½-year-olds already hear a higher voice as a
 smaller creature (Mondloch & Maurer 2004). So the answer is a picture, and
 the picture's size carries the pitch.
 Difficulty is the gap between the two voices, from two octaves down to one
 semitone; her answers find where she is (5-year-olds tell up from down for
 steps of a third of a semitone; nobody has measured 2-year-olds).
*/
const ROUNDS = 5;
/** one of two pictures: a guess is right half the time */
const LADDER: Ladder = { top: topLevel('voices'), chance: () => 1 / 2 };

type Who = 'big' | 'little';
interface Board {
  /** Hz of the big (low) and little (high) voice this round */
  big: number;
  little: number;
  /** who sings the hidden note */
  answer: Who;
  /** loudness of each note in dB — roved, so a louder note never gives it away */
  gain: Record<Who | 'hidden', number>;
}

const rove = () => Math.random() * 6 - 3;
function deal(level: number): Board {
  return {
    ...voicePair(GAPS[level]),
    answer: Math.random() < 0.5 ? 'big' : 'little',
    gain: { big: rove(), little: rove(), hidden: rove() },
  };
}

const NOTE = 0.7; // seconds each voice sings
const PAUSE = 0.35; // seconds between voices

/** who is singing right now — or the hidden voice, or it is her turn */
type Phase = 'wait' | Who | 'hidden' | 'answer' | 'done';

const VOICES: Record<Who, { art: 'elephant' | 'bird'; ta: string; en: string }> = {
  big: { art: 'elephant', ta: 'யானை', en: 'elephant' },
  little: { art: 'bird', ta: 'பறவை', en: 'bird' },
};

export default function Voices({ onHome }: { onHome: () => void }) {
  return (
    <div className="relative h-full">
      <GameShell
        ta="யார் பாடுகிறார்?"
        en="big voice, little voice"
        art="bird"
        onHome={onHome}
        tint="#A9D6E5"
      >
        <SoundGate>
          <Play onHome={onHome} />
        </SoundGate>
      </GameShell>
    </div>
  );
}

function Play({ onHome }: { onHome: () => void }) {
  const [phase, setPhase] = useState<Phase>('wait');
  const [started, setStarted] = useState(false);
  const { later, clearAll } = useTimers();
  const { board, round, done, solved, misses, miss, solve, restart } = useRounds('voices', {
    rounds: ROUNDS,
    ladder: LADDER,
    deal,
    onDeal: () => setPhase('wait'),
  });
  const layerRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<Who, HTMLButtonElement | null>>({ big: null, little: null });

  /** both voices sing their notes, then the hidden one; then it is her turn */
  const perform = (b: Board, both = true) => {
    clearAll();
    let t = 0.2;
    const at = (s: number, fn: () => void) => later(fn, s * 1000);
    if (both) {
      for (const who of ['big', 'little'] as const) {
        at(t, () => {
          setPhase(who);
          sing(b[who], { gainDb: b.gain[who], dur: NOTE });
        });
        t += NOTE + PAUSE;
      }
      t += PAUSE;
    }
    at(t, () => {
      setPhase('hidden');
      sing(b[b.answer], { gainDb: b.gain.hidden, dur: NOTE });
    });
    at(t + NOTE, () => setPhase('answer'));
  };

  // the opening line is said in full first; then each round sings as it is dealt
  useEffect(
    () =>
      speakSeq(['யார் பாடுகிறார்கள்? கேட்டுவிட்டுத் தொடு'], 'ta', {
        onDone: () => setStarted(true),
      }),
    [],
  );
  useEffect(() => {
    if (!started || done) return;
    perform(board);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, round, done]);

  const choose = (who: Who) => {
    if (solved || phase !== 'answer') return; // only once she has heard it all
    if (who === board.answer) {
      chimeGood();
      speak(`சரி! ${VOICES[who].ta}!`, 'ta');
      setPhase('done');
      solve(1600);
    } else {
      miss();
      later(() => perform(board), 500); // hear them both again, then the hidden one
    }
  };

  const hint = misses >= 2 && phase === 'answer';

  return (
    <>
      <div
        ref={layerRef}
        className="relative grow flex flex-col items-center justify-center gap-6 min-h-0"
      >
        <GuideHand
          target={() => btnRefs.current[board.answer]}
          layerRef={layerRef}
          guideKey="voices"
          active={phase === 'answer' && !done}
          fireSignal={misses}
        />
        {/* the hidden singer — tap to hear it again */}
        <ListenButton
          playing={phase === 'hidden'}
          ready={phase === 'answer'}
          onReplay={() => perform(board, false)}
        >
          <span className="text-5xl" aria-hidden>
            {solved ? '🎵' : '❓'}
          </span>
        </ListenButton>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {(['big', 'little'] as const).map((who) => (
            <button
              key={who}
              ref={(el) => {
                btnRefs.current[who] = el;
              }}
              onClick={() => choose(who)}
              aria-label={VOICES[who].en}
              className={`sticker aspect-square flex items-end justify-center pb-4 transition-all active:scale-95 ${
                solved && who !== board.answer ? 'opacity-40' : ''
              } ${hint && who === board.answer ? 'anim-hint' : ''}`}
            >
              {/* the elephant is drawn big and the bird small: size carries the pitch */}
              <span className={`block ${phase === who ? 'anim-sing' : ''}`}>
                <Art id={VOICES[who].art} size={who === 'big' ? 124 : 68} />
              </span>
            </button>
          ))}
        </div>
      </div>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </>
  );
}
