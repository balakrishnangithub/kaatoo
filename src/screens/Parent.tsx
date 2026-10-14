import { useState } from 'react';
import { ACTIVITIES, MILESTONES } from '../data/content';
import { SESSION_MINUTES, useStore } from '../lib/store';
import { isoDate, stageFromAge } from '../lib/age';
import { HoldButton } from '../components/chrome';
import { Art } from '../art';

const STAGE_LABELS = ['2–3 வயது', '3–4 வயது', '4–5 வயது', '5–6 வயது'];

export default function Parent({ onBack }: { onBack: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<'settings' | 'progress' | 'milestones' | 'why'>('settings');

  if (!unlocked) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 text-center gap-5">
        <Art id="house" size={90} />
        <h1 className="font-display font-bold text-3xl text-plum">பெற்றோர் மூலை</h1>
        <p className="text-plum/60 font-semibold max-w-xs">
          parents&apos; corner — hold the button for a moment so little fingers don&apos;t wander in
        </p>
        <HoldButton
          onDone={() => setUnlocked(true)}
          className="btn-chunky bg-sun w-64"
          holdMs={1600}
        >
          அழுத்திப் பிடி · press &amp; hold
        </HoldButton>
        <button className="btn-chunky" onClick={onBack}>
          ← திரும்ப · back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col safe-top">
      <div className="flex items-center gap-3 px-4 sm:px-6 shrink-0">
        <button className="btn-chunky !min-h-11 !px-4" onClick={onBack}>
          ←
        </button>
        <h1 className="font-display font-bold text-2xl text-plum">பெற்றோர் மூலை · Parents</h1>
      </div>

      <div className="flex gap-2 px-4 sm:px-6 mt-2 py-1 overflow-x-auto overflow-y-hidden no-scrollbar shrink-0">
        {(
          [
            ['settings', 'அமைப்பு · settings'],
            ['progress', 'முன்னேற்றம் · progress'],
            ['milestones', 'மைல்கற்கள் · milestones'],
            ['why', 'ஏன் இப்படி? · why'],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`btn-chunky !min-h-10 !px-4 text-sm whitespace-nowrap ${tab === t ? 'bg-sun' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grow overflow-y-auto no-scrollbar px-4 sm:px-6 py-4 max-w-2xl mx-auto w-full">
        {tab === 'settings' && <Settings />}
        {tab === 'progress' && <Progress />}
        {tab === 'milestones' && <Milestones />}
        {tab === 'why' && <Why />}
      </div>
      <div className="h-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="sticker p-4 mb-3">
      <div className="font-display font-bold text-plum mb-2">{label}</div>
      {children}
    </div>
  );
}

function Settings() {
  const s = useStore();
  const auto = s.settings.stageOverride === null;
  return (
    <div className="anim-fade-up">
      <Row label={`குழந்தை பெயர் · child's name`}>
        <input
          value={s.settings.name}
          onChange={(e) => s.updateSettings({ name: e.target.value })}
          className="w-full rounded-2xl border-3 border-plum/20 bg-white px-4 py-3 font-display font-bold text-xl text-plum outline-none focus:border-sage"
          maxLength={20}
        />
      </Row>
      <Row label={`பிறந்த தேதி · birthdate`}>
        <input
          type="date"
          value={s.settings.birth}
          max={isoDate(new Date())}
          onChange={(e) => s.updateSettings({ birth: e.target.value })}
          className="w-full rounded-2xl border-3 border-plum/20 bg-white px-4 py-3 font-semibold text-lg text-plum outline-none focus:border-sage"
        />
        <div className="text-sm text-plum/60 font-semibold mt-1">
          {s.ageText} — activities auto-adjust as she grows
        </div>
      </Row>
      <Row label="நிலை · stage">
        <div className="flex flex-wrap gap-2">
          <button
            className={`btn-chunky !min-h-10 !px-3 text-sm ${auto ? 'bg-sage text-white' : ''}`}
            onClick={() => s.updateSettings({ stageOverride: null })}
          >
            auto ({STAGE_LABELS[stageFromAge(s.settings.birth)]})
          </button>
          {STAGE_LABELS.map((l, i) => (
            <button
              key={l}
              className={`btn-chunky !min-h-10 !px-3 text-sm ${s.settings.stageOverride === i ? 'bg-sage text-white' : ''}`}
              onClick={() => s.updateSettings({ stageOverride: i })}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="text-sm text-plum/60 font-semibold mt-2">
          Override only if she&apos;s ahead/behind — auto follows her age.
        </div>
      </Row>
      <Row label="அமர்வு நேரம் · session length">
        <div className="flex gap-2">
          {SESSION_MINUTES.map((m) => (
            <button
              key={m}
              className={`btn-chunky flex-1 !min-h-11 !px-0 ${s.settings.sessionMin === m ? 'bg-sun' : ''}`}
              onClick={() => s.updateSettings({ sessionMin: m })}
            >
              {m}m
            </button>
          ))}
        </div>
        <div className="text-sm text-plum/60 font-semibold mt-2">
          When time is up she finishes her round, then the app breathes and rests. AAP suggests ≤ 1
          hr/day of co-viewed quality content — short sessions win.
        </div>
      </Row>
      <Row label="ஒலி · sound">
        <button
          className={`btn-chunky ${s.settings.sound ? 'bg-mint' : ''}`}
          onClick={() => s.updateSettings({ sound: !s.settings.sound })}
        >
          {s.settings.sound ? 'ஒலி உண்டு · on' : 'அமைதி · off'}
        </button>
      </Row>
      <Row label="English echo">
        <button
          className={`btn-chunky ${s.settings.english ? 'bg-mint' : ''}`}
          onClick={() => s.updateSettings({ english: !s.settings.english })}
        >
          {s.settings.english ? 'Tamil → English ✓' : 'Tamil only'}
        </button>
        <div className="text-sm text-plum/60 font-semibold mt-2">
          When on, each Tamil word is followed once by its English — gentle bilingual exposure.
        </div>
      </Row>
      <Row label="வழிகாட்டும் கை · guiding hand">
        <button
          className={`btn-chunky ${s.settings.guide ? 'bg-mint' : ''}`}
          onClick={() => s.updateSettings({ guide: !s.settings.guide })}
        >
          {s.settings.guide ? 'வழிகாட்டி உண்டு · on (adaptive)' : 'வழிகாட்டி இல்லை · off'}
        </button>
        <div className="text-sm text-plum/60 font-semibold mt-2 space-y-1.5">
          <p>
            A little hand points at the <b>centre of the exact thing to tap</b> — but only when she
            needs it: right after a wrong try, or in free play when she pauses. It is adaptive, so
            she won&apos;t grow dependent on it:
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li>
              In free play, the more she has played a game, the <b>longer it waits</b> before
              appearing.
            </li>
            <li>
              After ~4 plays of a game it <b>stops appearing at all</b> there.
            </li>
            <li>The moment she taps anything, it vanishes instantly.</li>
          </ul>
          <p>
            At age 2, research shows in-app prompts work best{' '}
            <b>after a parent models the action once</b> — show her how the first round goes, then
            let her try.
          </p>
        </div>
      </Row>
      <Row label="மீட்டமை · reset">
        <HoldButton onDone={s.resetAll} className="btn-chunky bg-coral" holdMs={2500}>
          அனைத்தையும் அழி · hold to erase all progress
        </HoldButton>
      </Row>
      <Row label="முழுத்திரை + குழந்தை பாதுகாப்பு · fullscreen & child-safe">
        <ol className="list-decimal ml-5 text-sm font-semibold text-plum/75 space-y-1.5 leading-relaxed">
          <li>
            On your Android phone or tablet, open this site in Chrome →{' '}
            <b>⋮ → Add to Home screen</b>. It launches as a true fullscreen app (no address bar, no
            pull-to-refresh, no pinch-zoom).
          </li>
          <li>
            For real toddler-proofing use Android <b>Screen Pinning</b> (Settings → Security → App
            pinning): pin the app and she cannot leave it, pull down notifications, or reload the
            page at all.
          </li>
          <li>
            Optional, on Samsung devices: enable <b>Edge touch / grip suppression</b> so her palm
            doesn&apos;t trigger touches while she holds the phone.
          </li>
        </ol>
      </Row>
    </div>
  );
}

function Progress() {
  const s = useStore();
  return (
    <div className="anim-fade-up">
      <p className="text-sm text-plum/60 font-semibold mb-3">
        Stored only in this browser — nothing leaves the device. Each game&apos;s level is set by
        her <b>age stage</b>, then nudged up or down by her <b>recent first-try accuracy</b> (the
        dots): mostly clean rounds → step up, mostly struggled → step down. Age also caps how far
        content can go.
      </p>
      {ACTIVITIES.map((a) => {
        const p = s.progress[a.id];
        const lv = s.levelFor(a.id, 3);
        const skill = s.skillFor(a.id);
        const outcomes = (p?.outcomes ?? []).slice(-5);
        return (
          <div key={a.id} className="sticker p-3 mb-3 flex items-center gap-3">
            <div
              className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center"
              style={{ background: a.bg }}
            >
              <Art id={a.art} size={40} />
            </div>
            <div className="grow">
              <div className="font-display font-bold text-plum leading-tight">
                {a.ta} <span className="text-sm font-semibold text-plum/50">{a.en}</span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-2.5 w-8 rounded-full ${i <= lv ? 'bg-sage' : 'bg-plum/10'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                {outcomes.length > 0 ? (
                  outcomes.map((o, i) => (
                    <div
                      key={i}
                      title={o ? 'clean round' : 'needed tries'}
                      className={`h-2 w-2 rounded-full ${o ? 'bg-mint' : 'bg-coral/70'}`}
                    />
                  ))
                ) : (
                  <span className="text-[10px] font-semibold text-plum/40">not played yet</span>
                )}
                {skill.acc !== null && (
                  <span className="text-[10px] font-bold text-plum/50 ml-1">
                    first-try {Math.round(skill.acc * 100)}%
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-sm font-bold text-plum/70">
              {p?.plays ?? 0}×<div className="text-[10px] font-semibold text-plum/45">plays</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Milestones() {
  const s = useStore();
  const [band, setBand] = useState(0);
  const b = MILESTONES[band];
  const done = b.groups.flatMap((g) => g.items).filter((i) => s.milestones[i.id]).length;
  const total = b.groups.flatMap((g) => g.items).length;
  return (
    <div className="anim-fade-up">
      <p className="text-sm text-plum/60 font-semibold mb-3">
        Based on the CDC developmental milestone checklists — tick what you notice in everyday life
        (not just in the app).
      </p>
      <div className="flex gap-2 mb-3 flex-wrap">
        {MILESTONES.map((m, i) => (
          <button
            key={m.id}
            className={`btn-chunky !min-h-10 !px-3 text-sm ${band === i ? 'bg-sun' : ''}`}
            onClick={() => setBand(i)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="text-sm font-bold text-plum/60 mb-2">
        {b.labelTa} — {done}/{total} noticed
      </div>
      {b.groups.map((g) => (
        <div key={g.domain} className="sticker p-4 mb-3">
          <div className="font-display font-bold text-plum">
            {g.domainTa} · <span className="text-plum/60 text-sm font-semibold">{g.domain}</span>
          </div>
          {g.items.map((it) => (
            <label key={it.id} className="flex items-start gap-3 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!s.milestones[it.id]}
                onChange={() => s.toggleMilestone(it.id)}
                className="mt-1 w-6 h-6 accent-[#84A59D] shrink-0"
              />
              <span>
                <span className="block font-semibold text-plum leading-snug">{it.ta}</span>
                <span className="block text-sm text-plum/55 leading-snug">{it.en}</span>
              </span>
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

function Why() {
  return (
    <div className="anim-fade-up text-plum/80 font-medium leading-relaxed space-y-3">
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">Calm by design</div>
        <p>
          No autoplay, no endless feeds, no streaks, coins, or exploding rewards. Every activity is
          finite and ends at a natural stopping point — the patterns that make videos addictive are
          simply not built in.
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">Thinking before facts</div>
        <p>
          Sorting, matching shadows, finding the odd one out, completing patterns, ordering by size
          — these build categorization, abstraction, and working memory: the cognitive roots that
          letters and numbers later grow from.
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">
          Tamil first, English alongside
        </div>
        <p>
          Strong first-language foundations make second languages easier. Every concept speaks Tamil
          first, with English echoed gently — code-mixing is normal and healthy for bilingual
          toddlers.
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">
          Levels follow her, not the calendar alone
        </div>
        <p>
          Each game starts at her age stage, then adapts to live skill estimates: ~4 of the last 5
          rounds solved on the first try → the challenge steps up; mostly struggled rounds → it
          steps back down. Age still caps the ceiling, so a 2-year-old never sees content designed
          for 5-year-olds (the zone of proximal development — challenge just ahead of skill, never
          beyond reach).
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">
          Same before different, copy before continue
        </div>
        <p>
          &quot;Find the same&quot; is developmentally earlier than &quot;find the different&quot;
          (~24–28 months), so Odd One Out begins as matching and only later asks for the different
          one — first with two identical pictures against a wildly different one, then by color,
          then by category. Patterns follow the research learning trajectory (Clements &amp; Sarama;
          Rittle-Johnson): <b>copy</b> a pattern first, then <b>extend</b> it — with the repeating
          unit named aloud in rhythm, which measurably helps preschoolers see the structure (Fyfe et
          al., <i>Child Development</i> 2015).
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">Finish what you start</div>
        <p>
          In drawing, the picture blooms only when she has traced ~85% of the outline — mastery
          learning: partial effort earns warm encouragement, never an early reward, so completing
          things becomes the habit. Process praise (effort, not accuracy) is used throughout
          (Gunderson et al. 2013).
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">
          Gestures matched to small hands
        </div>
        <p>
          Studies of 2–8 year olds (Yadav et al. 2020) show toddlers tap and slide long before they
          can drag-and-drop — so every game works fully by tapping, while swiping (word cards) and
          dragging (sorting) are available as richer alternatives. Deliberate dragging can deepen
          word learning in over-2s (Russo-Johnson et al. 2017), but nothing ever <i>requires</i> it.
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">Help that fades on purpose</div>
        <p>
          The guiding hand is <i>scaffolding</i> (Vygotsky): it shows <b>what</b> to tap, waits
          longer each time she plays, and retires completely once she&apos;s competent — because
          help that never fades teaches dependence, not skill. Studies of touchscreen prompts
          (Hiniker et al.) found under-3s follow them best after a parent demonstrates first, so the
          first round of each game is best played together.
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">Effort is the reward</div>
        <p>
          In drawing she is praised for <b>trying and finishing</b>, never for accuracy — process
          praise (Gunderson et al., 2013) given to 1–3 year-olds predicts motivation and resilience
          years later. A wobbly traced circle counts as a win, because it is one.
        </p>
      </div>
      <div className="sticker p-4">
        <div className="font-display font-bold text-plum text-lg">Best together</div>
        <p>
          Research (AAP, Harvard &quot;serve-and-return&quot;) says toddlers learn most when a
          parent joins in: name what she taps, celebrate, and — most importantly — try the
          off-screen idea when the app rests.
        </p>
      </div>
      <p className="text-xs text-plum/45 font-semibold">
        Milestone lists adapted from CDC &quot;Learn the Signs. Act Early.&quot;; screen-time
        guidance from the American Academy of Pediatrics.
      </p>
    </div>
  );
}
