import type { CSSProperties } from 'react';
import { Art } from '../art';
import { ACTIVITIES, type GameId } from '../data/content';
import { useStore, useTimeLeft } from '../lib/store';
import { HoldButton } from '../components/chrome';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'காலை வணக்கம்';
  if (h < 16) return 'மதிய வணக்கம்';
  return 'மாலை வணக்கம்';
}

/** gentle session meter — a quiet line, not a countdown. Its own component:
 *  it is the one thing on screen that needs the ticking clock. */
function SessionMeter() {
  const { settings } = useStore();
  const pct = Math.max(0, Math.min(1, useTimeLeft() / (settings.sessionMin * 60)));
  return (
    <div className="mt-3 h-2 rounded-full bg-plum/10 overflow-hidden" aria-hidden>
      <div
        className="h-full rounded-full bg-sage transition-all duration-1000"
        style={{ width: `${pct * 100}%` }}
      />
    </div>
  );
}

export default function Home({
  onOpen,
  onParent,
}: {
  onOpen: (id: GameId) => void;
  onParent: () => void;
}) {
  const { settings, updateSettings } = useStore();

  return (
    <div className="h-full flex flex-col px-4 sm:px-6 safe-top safe-bottom">
      {/* header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-plum/60 font-semibold text-sm">{greeting()} · hello</div>
          <h1 className="font-display font-bold text-4xl text-plum leading-tight">
            {settings.name} <span className="inline-block anim-float">🌱</span>
          </h1>
        </div>
        {/* the same switch as the parents' corner — one setting, so it stays put */}
        <button
          aria-label="sound"
          className="btn-chunky !min-h-11 !px-3 text-lg"
          onClick={() => updateSettings({ sound: !settings.sound })}
        >
          {settings.sound ? '🔊' : '🔇'}
        </button>
      </div>

      <SessionMeter />

      {/* activity garden. A scroll box clips at its edges, and a tilted card's
          corners poke a few pixels past its own box — so the scroller reaches
          6px into the page gutter on each side (and up into the gap above):
          the cards stay exactly where they were, with room to be crooked. */}
      <div className="grow overflow-y-auto no-scrollbar -mx-1.5 px-1.5 mt-2.5 pt-1.5 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {ACTIVITIES.map((a, i) => (
            <button
              key={a.id}
              onClick={() => onOpen(a.id)}
              // each sticker sits a little crooked. The tilt is a variable the
              // pop-in keyframes and the resting transform both read, so it is
              // there from the first frame and survives the press-down scale.
              className="sticker anim-pop p-4 flex flex-col items-center gap-1 rotate-[var(--tilt)] active:scale-95 transition-transform min-h-[148px] justify-center"
              style={
                {
                  background: a.bg,
                  '--tilt': `${i % 2 === 0 ? -1.6 : 1.4}deg`,
                  animationDelay: `${i * 60}ms`,
                } as CSSProperties
              }
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
