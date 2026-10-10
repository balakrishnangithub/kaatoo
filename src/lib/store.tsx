import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { setMuted } from './speech';
import { ageYears, stageFromAge } from './age';

// ---------------- types ----------------
export interface Settings {
  name: string;
  birth: string; // ISO date
  sessionMin: number; // session length chosen by parent
  sound: boolean;
  english: boolean; // echo English after Tamil
  guide: boolean; // adaptive guiding hand (fades as she succeeds)
  stageOverride: number | null; // 0..3, null = derive from age
  onboarded: boolean; // first-run parent setup completed
}

export interface ActProg {
  plays: number;
  wins: number;
  /** recent round outcomes, newest last: 1 = clean round (no wrong taps), 0 = struggled.
   *  This is the skill signal that drives dynamic difficulty — a lightweight,
   *  conservative mastery estimate (in the spirit of Bayesian knowledge tracing:
   *  level up only on sustained clean play, level down quickly on struggle). */
  outcomes?: number[];
}

interface Persisted {
  settings: Settings;
  progress: Record<string, ActProg>;
  milestones: Record<string, boolean>;
}

export type Phase = 'play' | 'rest';

interface Store extends Persisted {
  stage: number; // 0=2-3y, 1=3-4y, 2=4-5y, 3=5-6y
  ageText: string;
  timeLeft: number; // seconds remaining this session
  phase: Phase;
  levelFor: (gameId: string, maxLevel: number) => number;
  recordWin: (gameId: string) => void;
  /** call once per round: clean = completed without wrong taps (skill signal) */
  recordOutcome: (gameId: string, clean: boolean) => void;
  /** recent first-try accuracy 0..1 and how many rounds back it measures */
  skillFor: (gameId: string) => { acc: number | null; n: number };
  updateSettings: (s: Partial<Settings>) => void;
  toggleMilestone: (id: string) => void;
  resetAll: () => void;
  goRest: () => void;
  wake: () => void; // parent ends rest / starts fresh session
}

const DEFAULTS: Persisted = {
  settings: {
    name: 'செல்லம்',
    birth: '2024-09-13',
    sessionMin: 15,
    sound: true,
    english: true,
    guide: true,
    stageOverride: null,
    onboarded: false,
  },
  progress: {},
  milestones: {},
};

const KEY = 'kaatoo-v1';
const LEGACY_KEYS = ['ambuli-v1', 'mazhalai-v1']; // pre-rename keys — kept only to migrate existing progress

function load(): Persisted {
  try {
    let raw = localStorage.getItem(KEY);
    if (!raw) {
      // one-time migration from an older name: adopt the legacy blob, then clean up
      for (const legacy of LEGACY_KEYS) {
        raw = localStorage.getItem(legacy);
        if (raw) {
          try {
            localStorage.setItem(KEY, raw);
            localStorage.removeItem(legacy);
          } catch {
            /* private mode etc. — migration just runs again next launch */
          }
          break;
        }
      }
    }
    if (!raw) return DEFAULTS;
    const p = JSON.parse(raw) as Partial<Persisted>;
    return {
      settings: { ...DEFAULTS.settings, ...(p.settings ?? {}) },
      progress: p.progress ?? {},
      milestones: p.milestones ?? {},
    };
  } catch {
    return DEFAULTS;
  }
}

function fmtAge(birth: string): string {
  const a = ageYears(birth);
  const y = Math.floor(a);
  const m = Math.round((a - y) * 12);
  if (y <= 0) return `${m} மாதங்கள் · ${m} months`;
  if (m === 0) return `${y} வயது · ${y} yr`;
  return `${y} ஆண்டு ${m} மாதம் · ${y}y ${m}m`;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<Persisted>(load);
  const [phase, setPhase] = useState<Phase>('play');
  const [timeLeft, setTimeLeft] = useState(() => load().settings.sessionMin * 60);
  // mirror phase into a ref so the 1-second session timer reads it without
  // being torn down and restarted on every play↔rest transition
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(persisted));
    } catch {
      /* private mode etc. */
    }
    setMuted(!persisted.settings.sound);
  }, [persisted]);

  // session timer — ticks only while the page is visible and phase is play
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden || phaseRef.current !== 'play') return;
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const stage = persisted.settings.stageOverride ?? stageFromAge(persisted.settings.birth);

  /**
   * Dynamic difficulty: age sets the base AND a soft ceiling (a 2-year-old never
   * sees 5-year-old content no matter how skilled); demonstrated skill then nudges
   * the level ±1 within that band. Sustained clean rounds (≥4 of last 5) raise the
   * challenge; mostly-struggled rounds (≤1 of last 3) lower it fast — the zone of
   * proximal development, estimated live rather than by age alone.
   */
  const levelFor = useCallback(
    (gameId: string, maxLevel: number) => {
      const base = Math.min(stage, maxLevel);
      const cap = Math.min(maxLevel, stage + 1);
      const outcomes = persisted.progress[gameId]?.outcomes ?? [];
      let adj = 0;
      const recent5 = outcomes.slice(-5);
      if (recent5.length >= 4) {
        const acc = recent5.reduce((a, b) => a + b, 0) / recent5.length;
        if (acc >= 0.8) adj = 1; // sustained mastery → step up
      }
      const recent3 = outcomes.slice(-3);
      if (recent3.length >= 3 && recent3.reduce((a, b) => a + b, 0) <= 1) adj = -1; // struggling → step down
      return Math.max(0, Math.min(cap, base + adj));
    },
    [persisted.progress, stage],
  );

  const recordWin = useCallback((gameId: string) => {
    setPersisted((p) => {
      const cur = p.progress[gameId] ?? { plays: 0, wins: 0 };
      return {
        ...p,
        progress: { ...p.progress, [gameId]: { ...cur, plays: cur.plays + 1, wins: cur.wins + 1 } },
      };
    });
  }, []);

  const recordOutcome = useCallback((gameId: string, clean: boolean) => {
    setPersisted((p) => {
      const cur = p.progress[gameId] ?? { plays: 0, wins: 0 };
      const outcomes = [...(cur.outcomes ?? []), clean ? 1 : 0].slice(-8);
      return { ...p, progress: { ...p.progress, [gameId]: { ...cur, outcomes } } };
    });
  }, []);

  const skillFor = useCallback(
    (gameId: string) => {
      const outcomes = persisted.progress[gameId]?.outcomes ?? [];
      const recent = outcomes.slice(-5);
      if (recent.length < 3) return { acc: null, n: recent.length };
      return { acc: recent.reduce((a, b) => a + b, 0) / recent.length, n: recent.length };
    },
    [persisted.progress],
  );

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setPersisted((p) => ({ ...p, settings: { ...p.settings, ...s } }));
    if (s.sessionMin !== undefined) setTimeLeft(s.sessionMin * 60);
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    setPersisted((p) => ({ ...p, milestones: { ...p.milestones, [id]: !p.milestones[id] } }));
  }, []);

  const resetAll = useCallback(() => {
    setPersisted(DEFAULTS);
    setTimeLeft(DEFAULTS.settings.sessionMin * 60);
    setPhase('play');
  }, []);

  const goRest = useCallback(() => setPhase('rest'), []);
  const wake = useCallback(() => {
    setTimeLeft(persisted.settings.sessionMin * 60);
    setPhase('play');
  }, [persisted.settings.sessionMin]);

  const value = useMemo<Store>(
    () => ({
      ...persisted,
      stage,
      ageText: fmtAge(persisted.settings.birth),
      timeLeft,
      phase,
      levelFor,
      recordWin,
      recordOutcome,
      skillFor,
      updateSettings,
      toggleMilestone,
      resetAll,
      goRest,
      wake,
    }),
    [
      persisted,
      stage,
      timeLeft,
      phase,
      levelFor,
      recordWin,
      recordOutcome,
      skillFor,
      updateSettings,
      toggleMilestone,
      resetAll,
      goRest,
      wake,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('store missing');
  return s;
}
