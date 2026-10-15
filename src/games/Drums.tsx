import { useEffect, useRef, useState } from 'react';
import { Art } from '../art';
import { topLevel } from '../data/levels';
import { chimeGood, speak, speakSeq } from '../lib/speech';
import type { Ladder } from '../lib/skill';
import { drum } from '../lib/sounds';
import { EndCard, GameShell } from '../components/chrome';
import { SoundGate } from '../components/listening';
import { useRounds } from '../hooks/useRounds';
import { useTimers } from '../hooks/useTimers';
import { judgeEcho, judgeTogether, ownPace, PATTERNS, type Pattern } from '../lib/rhythm';

/*
 Drum with me — keeping a beat, then echoing one.
 Two-and-a-half-year-olds can drum in time with a partner, and they bend their
 own pace towards the partner's (Kirschner & Tomasello 2009); every child has
 a pace of her own (about 400–500 ms a beat) and speeds up more easily than
 she slows down (Provasi & Bobin-Bègue 2003). So:
   - each sitting starts with her drumming freely — that is her own pace;
   - the elephant first drums AT her pace, then a little faster, then slower;
   - then it plays a short pattern, and she plays it back — two beats, three,
     and a long-short rhythm.
 Judging uses only the gaps BETWEEN her taps, never when they land against
 the beat — phones differ in touch and sound delay, and the gaps don't.
 Finite on purpose: four patterns, then the end card. No score, no streak.
*/
const ROUNDS = 4;
const TRIES = 3; // after the third try the round moves on, gently
const LADDER: Ladder = {
  top: topLevel('drums'),
  chance: (level) => PATTERNS[level].chance,
};

/** what the round is doing */
type Phase = 'warmup' | 'intro' | 'partner' | 'yours' | 'judged';

export default function Drums({ onHome }: { onHome: () => void }) {
  return (
    <div className="relative h-full">
      <GameShell ta="தாளம் போடு" en="drum with me" art="drum" onHome={onHome} tint="#F5CAC3">
        <SoundGate>
          <Play onHome={onHome} />
        </SoundGate>
      </GameShell>
    </div>
  );
}

function Play({ onHome }: { onHome: () => void }) {
  const [phase, setPhase] = useState<Phase>('warmup');
  const [pace, setPace] = useState<number | null>(null); // her own ms per beat
  const [partnerHit, setPartnerHit] = useState(0); // bumps on each of the elephant's beats
  const [myHit, setMyHit] = useState(0); // bumps on each of her taps
  const [heard, setHeard] = useState(0); // her taps counted this turn (echo dots)
  const tries = useRef(0);
  const taps = useRef<number[]>([]);
  const turn = useRef({ from: 0, to: Infinity }); // when her taps count, ms (performance.now)
  const { later, clearAll } = useTimers();
  const stopVoice = useRef<() => void>(() => {});
  const { board, round, done, solved, miss, solve, restart } = useRounds('drums', {
    rounds: ROUNDS,
    ladder: LADDER,
    deal: (level) => PATTERNS[level],
    onDeal: () => {
      tries.current = 0;
      setHeard(0);
    },
  });

  const say = (line: string, then: () => void) => {
    stopVoice.current();
    stopVoice.current = speakSeq([line], 'ta', { onDone: then });
  };

  /* ---------- the warm-up: her own pace ---------- */
  useEffect(() => {
    say('மேளத்தை அடி! டம் டம் டம்!', () => {
      turn.current = { from: performance.now(), to: Infinity };
      taps.current = [];
      // enough taps, or a calm moment without many: either way, on we go
      later(() => setPace((p) => p ?? ownPace(taps.current)), 6000);
    });
    return () => stopVoice.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (phase === 'warmup' && heard >= 7) setPace((p) => p ?? ownPace(taps.current));
  }, [phase, heard]);

  /* ---------- a round ---------- */
  const perform = (p: Pattern, myPace: number) => {
    clearAll();
    setHeard(0);
    taps.current = [];
    turn.current = { from: 0, to: 0 }; // while the elephant talks, drumming is just for fun
    setPhase('intro');
    say(
      p.kind === 'together' ? 'என்னோடு சேர்ந்து அடி' : 'நான் அடிக்கிறேன், கேள். பிறகு நீ அடி',
      () => {
        const unit = p.kind === 'together' ? myPace * p.pace : 520;
        const beats = p.kind === 'together' ? Array.from({ length: 8 }, (_, i) => i) : p.beats;
        const start = performance.now() + 300;
        setPhase('partner');
        for (const b of beats) {
          later(
            () => {
              drum({ low: true });
              setPartnerHit((n) => n + 1);
            },
            300 + b * unit,
          );
        }
        const end = start + beats[beats.length - 1] * unit;
        if (p.kind === 'together') {
          // drumming along: her taps count from a little before the first beat
          turn.current = { from: start - unit / 2, to: end + unit };
          later(() => judge(p, unit), end - performance.now() + unit + 200);
        } else {
          // the echo: her turn starts once the elephant has finished
          later(
            () => {
              setPhase('yours');
              turn.current = {
                from: performance.now(),
                to: performance.now() + unit * (beats.length + 3),
              };
              later(() => judge(p, unit), unit * (beats.length + 3) + 100);
            },
            end - performance.now() + unit * 0.6,
          );
        }
      },
    );
  };

  const judge = (p: Pattern, unit: number) => {
    if (solved) return;
    const t = taps.current;
    const ok = p.kind === 'together' ? judgeTogether(t, unit, p.tolerance) : judgeEcho(t, p.beats);
    setPhase('judged');
    turn.current = { from: 0, to: 0 };
    if (ok) {
      chimeGood();
      speak('சூப்பர்!', 'ta');
      solve(1500);
      return;
    }
    tries.current += 1;
    miss();
    if (tries.current >= TRIES) {
      // three goes is plenty — the round ends kindly, and counts as not yet
      speak('பரவாயில்லை!', 'ta');
      solve(1500);
      return;
    }
    say('மீண்டும் அடிப்போம்', () => perform(p, pace ?? 500));
  };

  // each round begins as soon as it is dealt (and her pace is known)
  useEffect(() => {
    if (pace === null || done) return;
    perform(board, pace);
    return () => stopVoice.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pace, round, done]);

  // her drum always answers with a sound; only taps inside her turn are counted
  const tap = () => {
    const now = performance.now();
    const t = taps.current;
    if (t.length && now - t[t.length - 1] < 110) return; // two fingers at once are one tap
    drum();
    setMyHit((n) => n + 1);
    if (now < turn.current.from || now > turn.current.to) return; // not a turn: just drumming
    t.push(now);
    setHeard(t.length);
  };

  // the dots belong to an echo — not to the free drumming before the first round
  const echo = board.kind === 'echo' && phase !== 'warmup' ? board.beats.length : 0;

  return (
    <>
      <div className="relative grow flex flex-col items-center justify-around min-h-0 py-2">
        {/* the elephant and its drum */}
        <div className="flex items-end gap-1" aria-hidden>
          <Art id="elephant" size={96} />
          <span key={partnerHit} className={partnerHit ? 'block anim-beat' : 'block'}>
            <Art id="drum" size={78} />
          </span>
        </div>
        {/* echo: one dot per beat to play back, filling as she taps */}
        <div className="flex gap-3 min-h-6" aria-hidden>
          {Array.from({ length: echo }).map((_, i) => (
            <div
              key={i}
              className={`h-5 w-5 rounded-full border-3 border-plum/30 ${i < heard && phase !== 'partner' ? 'bg-sun border-plum/60' : ''}`}
            />
          ))}
        </div>
        <div className="text-sm font-bold text-plum/60 min-h-5">
          {phase === 'warmup' ? 'அடி! · drum!' : phase === 'yours' ? 'உன் முறை! · your turn' : ''}
        </div>
        {/* her drum: the biggest thing on screen */}
        <button
          onPointerDown={tap}
          aria-label="drum"
          className={`sticker !rounded-full flex items-center justify-center w-56 h-56 sm:w-64 sm:h-64 ${
            phase === 'yours' || phase === 'warmup' ? 'ring-4 ring-sun' : ''
          }`}
          style={{ touchAction: 'none' }}
        >
          <span key={myHit} className={myHit ? 'block anim-beat' : 'block'}>
            <Art id="drum" size={170} />
          </span>
        </button>
      </div>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </>
  );
}
