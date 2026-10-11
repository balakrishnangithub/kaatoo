import { Art } from '../art';
import { ACTIVITIES } from '../data/content';
import { isMuted, setMuted } from '../lib/speech';
import { useStore } from '../lib/store';
import { HoldButton } from '../components/chrome';
import { useState } from 'react';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'காலை வணக்கம்';
  if (h < 16) return 'மதிய வணக்கம்';
  return 'மாலை வணக்கம்';
}

export default function Home({
  onOpen,
  onParent,
}: {
  onOpen: (id: string) => void;
  onParent: () => void;
}) {
  const { settings, timeLeft } = useStore();
  const [soundOff, setSoundOff] = useState(isMuted());
  const pct = Math.max(0, Math.min(1, timeLeft / (settings.sessionMin * 60)));

  return (
    <div
      className="h-full flex flex-col px-4 sm:px-6 safe-bottom"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-plum/60 font-semibold text-sm">{greeting()} · hello</div>
          <h1 className="font-display font-bold text-4xl text-plum leading-tight">
            {settings.name} <span className="inline-block anim-float">🌱</span>
          </h1>
        </div>
        <button
          aria-label="sound"
          className="btn-chunky !min-h-11 !px-3 text-lg"
          onClick={() => {
            const m = !soundOff;
            setSoundOff(m);
            setMuted(m);
          }}
        >
          {soundOff ? '🔇' : '🔊'}
        </button>
      </div>

      {/* gentle session meter — a quiet line, not a countdown */}
      <div className="mt-3 h-2 rounded-full bg-plum/10 overflow-hidden" aria-hidden>
        <div
          className="h-full rounded-full bg-sage transition-all duration-1000"
          style={{ width: `${pct * 100}%` }}
        />
      </div>

      {/* activity garden */}
      <div className="grow overflow-y-auto no-scrollbar mt-4 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {ACTIVITIES.map((a, i) => (
            <button
              key={a.id}
              onClick={() => onOpen(a.id)}
              className="sticker anim-pop p-4 flex flex-col items-center gap-1 active:scale-95 transition-transform min-h-[148px] justify-center"
              style={{
                background: a.bg,
                ['--rot' as string]: `${i % 2 === 0 ? -1.6 : 1.4}deg`,
                transform: `rotate(${i % 2 === 0 ? -1.6 : 1.4}deg)`,
                animationDelay: `${i * 60}ms`,
              }}
            >
              <Art id={a.art} size={76} />
              <div className="font-display font-bold text-xl text-plum leading-tight text-center">
                {a.ta}
              </div>
              <div className="text-[11px] font-semibold text-plum/55 tracking-wide">{a.en}</div>
            </button>
          ))}
        </div>
      </div>

      {/* footer: calm promise + parent gate */}
      <div className="flex items-center justify-between mt-2">
        <div className="text-[11px] text-plum/50 font-semibold">
          விளம்பரம் இல்லை · autoplay இல்லை · no tricks · v{__APP_BUILD__}
        </div>
        <HoldButton onDone={onParent} className="btn-chunky !min-h-10 !px-4 text-sm bg-lav/40">
          பெற்றோர் · hold
        </HoldButton>
      </div>
    </div>
  );
}
