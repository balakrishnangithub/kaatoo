import { useEffect, useRef, useState } from 'react';
import { Art, type ArtId } from '../art';
import type { WordCard } from '../data/content';
import { LISTEN_FIND, topLevel } from '../data/levels';
import { dealListen } from '../lib/listen';
import { chimeGood, speak, speakSeq } from '../lib/speech';
import type { Ladder } from '../lib/skill';
import { EndCard, GameShell } from '../components/chrome';
import { GuideHand } from '../components/hint';
import { ListenButton, SoundGate } from '../components/listening';
import { useFlash } from '../hooks/useFlash';
import { useRounds } from '../hooks/useRounds';

/*
 Listen closely — a word is said; she taps its picture. The skill is hearing
 the sounds inside words: toddlers of 18–23 months already notice a single
 wrong sound in a word they know ("vaby" for "baby": Swingley & Aslin 2000),
 and how quickly they find a named picture goes with how fast their
 vocabulary grows (Fernald et al. 2006).
 Difficulty is how alike the pictures' names sound:
   words that start differently  →  words that start with the same sound
   →  Tamil pairs one sound apart: பல் / பால், கல் / கால், மலை / மாலை
 The word is spoken, never written — reading is not the skill.
*/
const ROUNDS = 5;

const LADDER: Ladder = {
  top: topLevel('listen'),
  chance: (level) => 1 / LISTEN_FIND[level].options,
};

export default function Listen({ onHome }: { onHome: () => void }) {
  return (
    <div className="relative h-full">
      <GameShell ta="கவனமாகக் கேள்" en="listen closely" art="ear" onHome={onHome} tint="#B7E4C7">
        <SoundGate>
          <Play onHome={onHome} />
        </SoundGate>
      </GameShell>
    </div>
  );
}

function Play({ onHome }: { onHome: () => void }) {
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const { board, round, done, solved, misses, miss, solve, restart } = useRounds('listen', {
    rounds: ROUNDS,
    ladder: LADDER,
    deal: dealListen,
    onDeal: () => setReady(false),
  });
  const [wrong, flashWrong] = useFlash<ArtId>();
  const layerRef = useRef<HTMLDivElement>(null);
  const optRefs = useRef<Partial<Record<ArtId, HTMLButtonElement | null>>>({});
  const stop = useRef<() => void>(() => {});
  const { target, options } = board;

  /** say the word; her turn comes once it has been said in full */
  const say = () => {
    stop.current();
    setSpeaking(true);
    stop.current = speakSeq([`${target.ta} எங்கே?`], 'ta', {
      onDone: () => {
        setSpeaking(false);
        setReady(true);
      },
    });
  };

  useEffect(
    () =>
      speakSeq(['கவனமாகக் கேள். சரியான படத்தைத் தொடு'], 'ta', { onDone: () => setStarted(true) }),
    [],
  );
  useEffect(() => {
    if (!started || done) return;
    say();
    return () => stop.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, round, done]);

  const choose = (w: WordCard) => {
    if (solved || !ready) return;
    if (w.art === target.art) {
      chimeGood();
      speak(`சரி! ${w.ta}!`, 'ta');
      solve(1400);
    } else {
      miss();
      flashWrong(w.art);
      say(); // hear it again
    }
  };

  return (
    <>
      <div
        ref={layerRef}
        className="relative grow flex flex-col items-center justify-center gap-5 min-h-0"
      >
        <GuideHand
          target={() => optRefs.current[target.art] ?? null}
          layerRef={layerRef}
          guideKey="listen"
          active={ready && !solved && !done}
          fireSignal={misses}
        />
        <ListenButton
          playing={speaking}
          ready={ready && !solved}
          onReplay={say}
          label="say it again"
        >
          <Art id="ear" size={76} />
        </ListenButton>
        <div
          className={`grid ${options.length === 3 ? 'grid-cols-3 max-w-md' : 'grid-cols-2 max-w-sm'} gap-3 w-full`}
        >
          {options.map((w) => (
            <button
              key={w.art}
              ref={(el) => {
                optRefs.current[w.art] = el;
              }}
              onClick={() => choose(w)}
              aria-label={w.en}
              className={`sticker aspect-square p-3 flex items-center justify-center transition-all active:scale-95 ${
                wrong === w.art ? 'anim-wiggle' : ''
              } ${misses >= 2 && w.art === target.art && !solved ? 'anim-hint' : ''} ${
                solved && w.art !== target.art ? 'opacity-40' : ''
              }`}
            >
              <Art id={w.art} size={options.length === 3 ? 84 : 104} />
            </button>
          ))}
        </div>
      </div>
      {done && <EndCard onAgain={restart} onHome={onHome} />}
    </>
  );
}
