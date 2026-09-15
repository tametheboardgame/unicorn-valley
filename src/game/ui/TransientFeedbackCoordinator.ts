import type Phaser from 'phaser';

export type TransientFeedbackKind = 'reaction' | 'reward' | 'guidance' | 'quest-complete';

const PRIORITY: Record<TransientFeedbackKind, number> = {
  reaction: 10,
  reward: 20,
  guidance: 30,
  'quest-complete': 40,
};

interface ActiveTransientFeedback {
  token: symbol;
  kind: TransientFeedbackKind;
  priority: number;
  onPreempt: () => void;
}

const activeByScene = new WeakMap<Phaser.Scene, ActiveTransientFeedback>();

/**
 * Claims the single non-dialogue transient feedback slot for a scene.
 *
 * Higher-priority feedback pre-empts lower-priority feedback at its canonical presenter. Equal
 * priority replaces the previous surface, which keeps repeated guidance/reward events from stacking.
 * Lower-priority callers receive null and can choose to queue or suppress their message.
 */
export function claimTransientFeedback(
  scene: Phaser.Scene,
  kind: TransientFeedbackKind,
  onPreempt: () => void,
): (() => void) | null {
  const priority = PRIORITY[kind];
  const current = activeByScene.get(scene);
  if (current && current.priority > priority) {
    return null;
  }

  const token = Symbol(kind);
  const next: ActiveTransientFeedback = { token, kind, priority, onPreempt };
  activeByScene.set(scene, next);

  if (current) {
    current.onPreempt();
  }

  return () => {
    const active = activeByScene.get(scene);
    if (active?.token === token) {
      activeByScene.delete(scene);
    }
  };
}

export function getTransientFeedbackKind(scene: Phaser.Scene): TransientFeedbackKind | null {
  return activeByScene.get(scene)?.kind ?? null;
}

/** Dialogue owns the screen above every transient notification, so starting dialogue clears it. */
export function preemptTransientFeedbackForDialogue(scene: Phaser.Scene): void {
  const active = activeByScene.get(scene);
  if (!active) {
    return;
  }
  activeByScene.delete(scene);
  active.onPreempt();
}
