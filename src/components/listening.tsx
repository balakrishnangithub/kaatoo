import type { ReactNode } from 'react';
import { useStore } from '../lib/store';

/**
 * listening.tsx — what the ear-training games share.
 *
 *   SoundGate   a listening game with the sound off is a game of guessing.
 *               Instead of playing silently, it says so and offers the switch;
 *               the game itself starts fresh only once there is sound.
 *   ListenButton the "hear it again" bubble every listening game has.
 */
export function SoundGate({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useStore();
  if (settings.sound) return <>{children}</>;
  return (
    <div className="grow flex items-center justify-center">
      <div className="sticker anim-pop p-6 text-center max-w-xs w-full">
        <div className="text-5xl" aria-hidden>
          🔇
        </div>
        <div className="font-display font-bold text-xl text-plum mt-2">இதற்கு ஒலி வேண்டும்</div>
        <div className="text-sm font-semibold text-plum/60">this game is all about listening</div>
        <button
          className="btn-chunky bg-mint mt-4 w-full"
          onClick={() => updateSettings({ sound: true })}
          aria-label="sound on"
        >
          🔊 ஒலி · sound on
        </button>
      </div>
    </div>
  );
}

/** the round's sound, in a bubble: it pulses while it plays, and a tap plays it again */
export function ListenButton({
  playing,
  ready,
  onReplay,
  children,
  label = 'hear it again',
}: {
  /** the sound is playing right now */
  playing: boolean;
  /** she may answer (and so ask to hear it again) */
  ready: boolean;
  onReplay: () => void;
  children?: ReactNode;
  label?: string;
}) {
  return (
    <button
      className={`sticker shrink-0 w-28 h-28 sm:w-32 sm:h-32 !rounded-full flex items-center justify-center transition-transform ${
        playing ? 'anim-sing' : ''
      } ${ready ? 'active:scale-95' : ''}`}
      onClick={() => ready && onReplay()}
      aria-label={label}
    >
      {children ?? (
        <span className="text-5xl" aria-hidden>
          🔊
        </span>
      )}
    </button>
  );
}
