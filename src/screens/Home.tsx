import { ACTIVITIES } from '../data/content';
import { Art } from '../art';
import { HoldButton } from '../components/chrome';
import { useStore } from '../lib/store';

/** home: a calm garden of activities — no spinning, no badges, no noise */
export default function Home({
  onPlay,
  onParent,
}: {
  onPlay: (id: string) => void;
  onParent: () => void;
}) {
  const { rec } = useStore();
  const played = rec.playCount;
  return (
    <div className="h-full flex flex-col px-5 pt-6 pb-4 overflow-y-auto">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-plum/60 tracking-widest">
            காலை வணக்கம் · hello
          </div>
          <h1 className="font-display font-black text-4xl text-ink leading-none mt-1">
            செல்லம்
          </h1>
        </div>
        <div className="w-16 h-16 rounded-3xl bg-leaf/25 flex items-center justify-center">
          <Art id="sprout" size={52} />
        </div>
      </header>

      <div className="mt-4 mb-2 h-1.5 rounded-full bg-sand overflow-hidden">
        <div
          className="h-full bg-leaf rounded-full transition-all duration-700"
          style={{ width: `${Math.min(100, (Object.keys(played).length / ACTIVITIES.length) * 100)}%` }}
        />
      </div>

      <div className="grow flex items-center">
        <div className="grid grid-cols-2 gap-4 w-full">
          {ACTIVITIES.map((a) => (
            <button
              key={a.id}
              onClick={() => onPlay(a.id)}
              className={`${a.tint} rounded-4xl p-4 flex flex-col items-center gap-1.5 shadow-soft active:scale-95 transition-transform`}
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
