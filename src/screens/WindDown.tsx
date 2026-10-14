import { useEffect, useState } from 'react';
import { Art } from '../art';
import { OFFLINE_IDEAS } from '../data/content';
import { speak } from '../lib/speech';
import { useStore } from '../lib/store';
import { pick } from '../lib/util';
import { HoldButton } from '../components/chrome';

const BREATH_SECONDS = 4;
const CYCLES = 3;

export default function WindDown() {
  const { wake, settings } = useStore();
  // one counter of half-breaths: in, out, in, out… Phase and cycle are both
  // read off it, so they can never disagree about where the breathing is.
  const [beat, setBeat] = useState(0);
  const phase = beat % 2 === 0 ? 'in' : 'out';
  const cycle = Math.floor(beat / 2);
  // chosen once per visit to the rest screen
  const [idea] = useState(() => pick(OFFLINE_IDEAS));
  const finished = cycle >= CYCLES;

  useEffect(() => {
    speak('ஓய்வு நேரம். மெதுவாக மூச்சு விடுவோம்.', 'ta');
  }, []);

  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => setBeat((b) => b + 1), BREATH_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [finished]);

  return (
    <div
      className="fixed inset-0 z-50 bg-cream flex flex-col items-center justify-center px-6 text-center"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {!finished ? (
        <>
          <div className="text-plum/60 font-semibold">ஓய்வு நேரம் · rest time</div>
          <div className="font-display font-bold text-3xl text-plum mt-1 mb-6">
            {phase === 'in' ? 'உள்ளே இழு…' : 'வெளியே விடு…'}
          </div>
          <div
            className="transition-transform ease-in-out"
            style={{
              transform: phase === 'in' ? 'scale(1.18)' : 'scale(0.8)',
              transitionDuration: `${BREATH_SECONDS * 1000}ms`,
            }}
          >
            <Art id="flower" size={170} />
          </div>
          <div className="flex gap-2 mt-8">
            {Array.from({ length: CYCLES }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 w-2.5 rounded-full ${i < cycle ? 'bg-sage' : 'bg-plum/15'}`}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="anim-fade-up w-full max-w-sm">
          <div className="anim-float inline-block">
            <Art id="moon" size={110} />
          </div>
          <h2 className="font-display font-bold text-3xl text-plum mt-2">
            இன்றைய விளையாட்டு முடிந்தது
          </h2>
          <p className="text-plum/60 font-semibold mt-1">
            well played, {settings.name} — now let&apos;s play outside the screen
          </p>
          <div className="sticker mt-5 p-5">
            <div className="text-xs font-bold tracking-wide text-plum/50 mb-1">
              இப்போது செய்யலாம் · TRY THIS
            </div>
            <div className="font-display font-bold text-2xl text-plum">{idea.ta}</div>
            <div className="text-plum/60 font-semibold">{idea.en}</div>
          </div>
          <HoldButton onDone={wake} className="btn-chunky mt-6 bg-lav/40 w-full">
            பெற்றோர் — அழுத்திப் பிடி · hold to play again
          </HoldButton>
        </div>
      )}
    </div>
  );
}
