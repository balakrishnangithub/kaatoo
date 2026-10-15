import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { GameId } from '../data/content';
import { setMuted } from './speech';
import { birthDateFor, formatAge, stageFromAge } from './age';
import { priorSkill, type Skill } from './skill';

// ---------------- types ----------------
export interface Settings {
  name: string;
  birth: string; // ISO date
  sessionMin: number; // session length chosen by parent
  sound: boolean;
  english: boolean; // echo English after Tamil
  guide: boolean; // adaptive guiding hand (fades as she succeeds)
  /** where a game she has never played starts: 0..3, null = from her age */
  stageOverride: number | null;
  onboarded: boolean; // first-run parent setup completed
}

export interface ActProg {
  plays: number;
  wins: number;
  /** recent round outcomes, newest last: 1 = clean round (no wrong taps), 0 = needed
   *  tries — what the parents' corner shows as dots */
  outcomes?: number[];
  /** her estimated ability in this game — what picks the next round's level */
  skill?: Skill;
}

interface Persisted {
  settings: Settings;
  progress: Record<string, ActProg>;
  milestones: Record<string, boolean>;
}

export type Phase = 'play' | 'rest';

interface Store extends Persisted {
  /** where new games start: 0=2-3y, 1=3-4y, 2=4-5y, 3=5-6y */
  stage: number;
  ageText: string;
  /** the session's time is up — games finish their round, then offer only rest */
  expired: boolean;
  phase: Phase;
  /** her ability estimate for a game — from her own rounds, or her starting point */
  skillOf: (gameId: GameId) => Skill;
  recordWin: (gameId: GameId) => void;
  /** call once per finished round: clean = no wrong tries; skill = the updated estimate */
  recordRound: (gameId: GameId, clean: boolean, skill: Skill) => void;
  updateSettings: (s: Partial<Settings>) => void;
  toggleMilestone: (id: string) => void;
  resetAll: () => void;
  goRest: () => void;
  wake: () => void; // parent ends rest / starts fresh session
}

/** what the app calls her until a parent types her name */
export const DEFAULT_NAME = 'செல்லம்';
/** session lengths a parent can choose from, in minutes */
export const SESSION_MINUTES = [5, 10, 15, 20] as const;

/** A fresh profile. The birth date is relative to today — a fixed date would
 *  quietly age the "new child" (and her starting level) a little more every month. */
function defaults(): Persisted {
  return {
    settings: {
      name: DEFAULT_NAME,
      birth: birthDateFor(2),
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
}

const KEY = 'kaatoo-v1';
const LEGACY_KEYS = ['ambuli-v1', 'mazhalai-v1']; // pre-rename keys — kept only to migrate existing progress

function load(): Persisted {
  const fresh = defaults();
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
    if (!raw) return fresh;
    const p = JSON.parse(raw) as Partial<Persisted>;
    const settings = { ...fresh.settings, ...(p.settings ?? {}) };
    // a session of zero minutes would rest forever, with the settings out of reach
    if (!(settings.sessionMin > 0)) settings.sessionMin = fresh.settings.sessionMin;
    return { settings, progress: p.progress ?? {}, milestones: p.milestones ?? {} };
  } catch {
    return fresh;
  }
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * The estimate for a game that has none yet. A game she has played under the
 * old rules (age level, nudged ±1 by the last few rounds) starts exactly where
 * those rules had her — so an update never moves a child's level by itself —
 * and half-settled, so her next rounds quickly take over.
 */
function startingSkill(stage: number, outcomes: number[] = []): Skill {
  if (!outcomes.length) return priorSkill(stage);
  const recent5 = outcomes.slice(-5);
  const recent3 = outcomes.slice(-3);
  let level = Math.min(stage, 3);
  if (recent5.length >= 4 && sum(recent5) / recent5.length >= 0.8) level += 1;
  if (recent3.length >= 3 && sum(recent3) <= 1) level -= 1;
  level = Math.max(0, Math.min(level, 3, stage + 1));
  return { ...priorSkill(level), u: 0.5, n: outcomes.length };
}

const Ctx = createContext<Store | null>(null);
/* The countdown lives in its own context: it changes every second, and keeping
   it out of the store means a tick re-renders only what draws the clock (the
   home screen's meter) — not every game on screen. */
const ClockCtx = createContext(0);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [persisted, setPersisted] = useState<Persisted>(load);
  const [phase, setPhase] = useState<Phase>('play');
  const [timeLeft, setTimeLeft] = useState(() => persisted.settings.sessionMin * 60);
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
  }, [persisted]);

  // the sound setting is the one switch for the voice and the chimes. A layout
  // effect, so it is in force before any screen's first line is spoken.
  const { sound } = persisted.settings;
  useLayoutEffect(() => setMuted(!sound), [sound]);

  // session timer — ticks only while the page is visible and phase is play
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden || phaseRef.current !== 'play') return;
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const stage = persisted.settings.stageOverride ?? stageFromAge(persisted.settings.birth);
  const expired = timeLeft <= 0;

  /**
   * Difficulty follows her, not the calendar: each game's level comes from its
   * own skill estimate (lib/skill.ts), updated after every round. Age (or the
   * parent's choice of stage) only says where a game she has never played
   * begins — there is no age ceiling.
   */
  const skillOf = useCallback(
    (gameId: GameId) => {
      const p = persisted.progress[gameId];
      return p?.skill ?? startingSkill(stage, p?.outcomes);
    },
    [persisted.progress, stage],
  );

  const recordWin = useCallback((gameId: GameId) => {
    setPersisted((p) => {
      const cur = p.progress[gameId] ?? { plays: 0, wins: 0 };
      return {
        ...p,
        progress: { ...p.progress, [gameId]: { ...cur, plays: cur.plays + 1, wins: cur.wins + 1 } },
      };
    });
  }, []);

  const recordRound = useCallback((gameId: GameId, clean: boolean, skill: Skill) => {
    setPersisted((p) => {
      const cur = p.progress[gameId] ?? { plays: 0, wins: 0 };
      const outcomes = [...(cur.outcomes ?? []), clean ? 1 : 0].slice(-8);
      return { ...p, progress: { ...p.progress, [gameId]: { ...cur, outcomes, skill } } };
    });
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setPersisted((p) => ({ ...p, settings: { ...p.settings, ...s } }));
    if (s.sessionMin !== undefined) setTimeLeft(s.sessionMin * 60);
  }, []);

  const toggleMilestone = useCallback((id: string) => {
    setPersisted((p) => ({ ...p, milestones: { ...p.milestones, [id]: !p.milestones[id] } }));
  }, []);

  const resetAll = useCallback(() => {
    const fresh = defaults();
    setPersisted(fresh);
    setTimeLeft(fresh.settings.sessionMin * 60);
    setPhase('play');
  }, []);

  const goRest = useCallback(() => setPhase('rest'), []);
  const wake = useCallback(() => {
    setTimeLeft(persisted.settings.sessionMin * 60);
    setPhase('play');
  }, [persisted.settings.sessionMin]);

  const ageText = formatAge(persisted.settings.birth);
  const value = useMemo<Store>(
    () => ({
      ...persisted,
      stage,
      ageText,
      expired,
      phase,
      skillOf,
      recordWin,
      recordRound,
      updateSettings,
      toggleMilestone,
      resetAll,
      goRest,
      wake,
    }),
    [
      persisted,
      stage,
      ageText,
      expired,
      phase,
      skillOf,
      recordWin,
      recordRound,
      updateSettings,
      toggleMilestone,
      resetAll,
      goRest,
      wake,
    ],
  );

  return (
    <Ctx.Provider value={value}>
      <ClockCtx.Provider value={timeLeft}>{children}</ClockCtx.Provider>
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('store missing');
  return s;
}

/** seconds left in this session — re-renders its caller every second, so use it sparingly */
export function useTimeLeft(): number {
  return useContext(ClockCtx);
}
