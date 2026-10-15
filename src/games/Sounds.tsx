import { useEffect, useRef, useState } from 'react';
import { Art, type ArtId } from '../art';
import { SOUND_FIND, topLevel } from '../data/levels';
import { chimeGood, speak, speakSeq } from '../lib/speech';
import type { Ladder } from '../lib/skill';
import { playSound, type SoundId } from '../lib/sounds';
import { pick, samplePreferring, shuffle } from '../lib/util';
import { EndCard, GameShell } from '../components/chrome';
import { GuideHand } from '../components/hint';
import { ListenButton, SoundGate } from '../components/listening';
import { useFlash } from '../hooks/useFlash';
import { useRounds } from '../hooks/useRounds';
import { useTimers } from '../hooks/useTimers';

/*
 What's that sound? — a sound plays; she taps what made it. Toddlers of 15–25
 months match everyday sounds to pictures about as well as they match spoken
 names (Cummings et al. 2009), so this is the gentlest listening game: first
 two very different pictures, later more of them, and then pictures of the
 same kind — an animal's call among animals' calls.
 The sounds are made on the device (lib/sounds.ts), not recorded.
*/
const ROUNDS = 5;

interface Thing {
  id: SoundId;
  art: ArtId;
  ta: string;
  en: string;
  /** animals' calls sound more alike to each other than to a drum */
  family: 'animal' | 'thing';
}
const THINGS: Thing[] = [
  { id: 'bird', art: 'bird', ta: 'பறவை', en: 'bird', family: 'animal' },
  { id: 'cow', art: 'cow', ta: 'மாடு', en: 'cow', family: 'animal' },
  { id: 'cat', art: 'cat', ta: 'பூனை', en: 'cat', family: 'animal' },
  { id: 'elephant', art: 'elephant', ta: 'யானை', en: 'elephant', family: 'animal' },
  { id: 'drum', art: 'drum', ta: 'மேளம்', en: 'drum', family: 'thing' },
  { id: 'car', art: 'car', ta: 'கார்', en: 'car', family: 'thing' },
  { id: 'balloon', art: 'balloon', ta: 'பலூன்', en: 'balloon', family: 'thing' },
  { id: 'ball', art: 'ball', ta: 'பந்து', en: 'ball', family: 'thing' },
  { id: 'cloud', art: 'cloud', ta: 'மழை', en: 'rain', family: 'thing' },
];

const LADDER: Ladder = {
  top: topLevel('sounds'),
  chance: (level) => 1 / SOUND_FIND[level].options,
};

interface Board {
  target: Thing;
  options: Thing[];
}
function deal(level: number): Board {
  const { options, alike } = SOUND_FIND[level];
  const target = pick(THINGS);
  const others = THINGS.filter((t) => t.id !== target.id);
  const same = others.filter((t) => t.family === target.family);
  const different = others.filter((t) => t.family !== target.family);
  const wrong = alike
    ? samplePreferring(same, different, options - 1)
    : samplePreferring(different, same, options - 1);
  return { target, options: shuffle([target, ...wrong]) };
}

export default function Sounds({ onHome }: { onHome: () => void }) {
  return (
    <div className="relative h-full">
      <GameShell ta="என்ன சத்தம்?" en="what's that sound?" art="cow" onHome={onHome} tint="#FFCE80">
        <SoundGate>
          <Play onHome={onHome} />
        </SoundGate>
      </GameShell>
    </div>
  );
}

function Play({ onHome }: { onHome: () => void }) {
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false); // the sound has been heard: she may answer
  const [started, setStarted] = useState(false);
  const { later, clearAll } = useTimers();
  const { board, round, done, solved, misses, miss, solve, restart } = useRounds('sounds', {
    rounds: ROUNDS,
    ladder: LADDER,
    deal,
    onDeal: () => setReady(false),
  });
  const [wrong, flashWrong] = useFlash<SoundId>();
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Partial<Record<SoundId, HTMLButtonElement | null>>>({});
  const { target, options } = board;

  /** play the round's sound; her turn comes once it has finished */
  const play = () => {
    clearAll();
    setPlaying(true);
    const length = playSound(target.id, 0.15);
    later(
      () => {
        setPlaying(false);
        setReady(true);
      },
      (length + 0.2) * 1000,
    );
  };

  useEffect(
    () =>
      speakSeq(['இது என்ன சத்தம்? கேட்டுவிட்டுத் தொடு'], 'ta', { onDone: () => setStarted(true) }),
    [],
  );
  useEffect(() => {
    if (!started || done) return;
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, round, done]);

  const choose = (t: Thing) => {
    if (solved || !ready) return; // taps while the sound plays are not answers
    if (t.id === target.id) {
      chimeGood();
      speak(`சரி! ${t.ta}!`, 'ta');
      solve(1400);
    } else {
      miss();
      flashWrong(t.id);
      later(play, 600); // listen again
    }
  };

  return (
    <>
      <div
        ref={layerRef}
        className="relative grow flex flex-col items-center justify-center gap-5 min-h-0"
      >
        <GuideHand
          target={() => optRefs.current[target.id] ?? null}
          layerRef={layerRef}
          guideKey="sounds"
          active={ready && !solved && !done}
          fireSignal={misses}
        />
        <ListenButton playing={playing} ready={ready && !solved} onReplay={play} />
        <div
          className={`grid ${options.length === 3 ? 'grid-cols-3 max-w-md' : 'grid-cols-2 max-w-sm'} gap-3 w-full`}
        >
          {options.map((t) => (
            <button
              key={t.id}
              ref={(el) => {
                optRefs.current[t.id] = el;
              }}
              onClick={() => choose(t)}
              aria-label={t.en}
              className={`sticker aspect-square p-3 flex items-center justify-center transition-all active:scale-95 ${
                wrong === t.id ? 'anim-wiggle' : ''
              } ${misses >= 2 && t.id === target.id && !solved ? 'anim-hint' : ''} ${
                solved && t.id !== target.id ? 'opacity-40' : ''
              }`}
            >
              <Art id={t.art} size={options.length === 3 ? 84 : 104} />
            </button>
          ))}
        </div>
      </div>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </>
  );
}
