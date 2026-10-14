import { useState } from 'react';
import { DEFAULT_NAME, SESSION_MINUTES, useStore } from '../lib/store';
import { isoDate } from '../lib/age';
import { Art } from '../art';

/* First-run setup: the app needs to know HER before it can meet her where she
   is — activities, tracing content, and challenge levels all key off age (and
   then adapt to her demonstrated skill). One minute, once. */
export default function Onboarding() {
  const s = useStore();
  const [name, setName] = useState(s.settings.name);
  const [birth, setBirth] = useState(s.settings.birth);
  const [mins, setMins] = useState(s.settings.sessionMin);

  const start = () => {
    s.updateSettings({
      name: name.trim() || DEFAULT_NAME,
      birth,
      sessionMin: mins,
      onboarded: true,
    });
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="min-h-full flex flex-col items-center justify-center px-5 py-5 max-w-md mx-auto w-full gap-3">
        <Art id="flower" size={56} />
        <div className="text-center">
          <h1 className="font-display font-bold text-2xl text-plum">வணக்கம்! · Welcome</h1>
          <p className="text-plum/60 font-semibold mt-1 text-xs leading-snug">
            A calm little garden of games for your child. Tell us about her once — activities match
            her age today, grow with her, and challenge adjusts itself to how she plays.
          </p>
        </div>

        <div className="sticker p-3 w-full">
          <div className="font-display font-bold text-plum mb-1.5">குழந்தை பெயர் · her name</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border-3 border-plum/20 bg-white px-4 py-2.5 font-display font-bold text-lg text-plum outline-none focus:border-sage"
            maxLength={20}
            placeholder={DEFAULT_NAME}
          />
        </div>

        <div className="sticker p-3 w-full">
          <div className="font-display font-bold text-plum mb-1.5">பிறந்த தேதி · birthdate</div>
          <input
            type="date"
            value={birth}
            max={isoDate(new Date())}
            onChange={(e) => setBirth(e.target.value)}
            className="w-full rounded-2xl border-3 border-plum/20 bg-white px-4 py-2.5 font-semibold text-plum outline-none focus:border-sage"
          />
          <div className="text-xs text-plum/60 font-semibold mt-1">
            Used only to pick age-right starting levels — everything stays on this device.
          </div>
        </div>

        <div className="sticker p-3 w-full">
          <div className="font-display font-bold text-plum mb-1.5">
            அமர்வு நேரம் · session length
          </div>
          <div className="flex gap-2">
            {SESSION_MINUTES.map((m) => (
              <button
                key={m}
                className={`btn-chunky flex-1 !min-h-10 !px-0 ${mins === m ? 'bg-sun' : ''}`}
                onClick={() => setMins(m)}
              >
                {m}m
              </button>
            ))}
          </div>
          <div className="text-xs text-plum/60 font-semibold mt-1">
            Short sessions, then the app rests. AAP suggests ≤ 1 hr/day of quality content,
            co-viewed.
          </div>
        </div>

        <button className="btn-chunky bg-mint w-full !min-h-14 text-lg" onClick={start}>
          தொடங்கு · let&apos;s begin 🌱
        </button>
        <p className="text-xs text-plum/45 font-semibold text-center">
          This screen is for grown-ups. Nothing is uploaded — all data lives in this browser only.
        </p>
      </div>
    </div>
  );
}
