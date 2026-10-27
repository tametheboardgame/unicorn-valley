import type { MiniGameLaunchSource } from '../MiniGameSession';
import { canOfferPattern, type CrystalariumFullState } from './CrystalariumFullRules';

export type CrystalariumGuideStage = 'grow' | 'merge' | 'offer' | 'explore';

export interface CrystalariumGuidePrompt {
  readonly stage: CrystalariumGuideStage;
  readonly title: string;
  readonly instruction: string;
  readonly target: 'grow' | 'cell' | 'offer' | 'none';
}

interface GuideStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const CRYSTALARIUM_GUIDE_VERSION = 1;
export function crystalariumGuideKey(source: MiniGameLaunchSource): string {
  return 'unicorn-valley:crystalarium:guide:' + source + ':v' + CRYSTALARIUM_GUIDE_VERSION;
}
function browserStorage(): GuideStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
export function guideStage(state: CrystalariumFullState): CrystalariumGuideStage {
  if (state.completed > 0) return 'explore';
  if (canOfferPattern(state) || state.merges > 0) return 'offer';
  if (state.cells.filter(Boolean).length >= 3) return 'merge';
  return 'grow';
}
function promptFor(stage: CrystalariumGuideStage): CrystalariumGuidePrompt {
  switch (stage) {
    case 'grow':
      return {
        stage,
        title: '1. Make a crystal',
        instruction: 'Tap Grow shard. A new little crystal appears on the board!',
        target: 'grow',
      };
    case 'merge':
      return {
        stage,
        title: '2. Make it sparkle',
        instruction: 'Pick up one crystal and drop it on its matching twin.',
        target: 'cell',
      };
    case 'offer':
      return {
        stage,
        title: '3. Match the picture',
        instruction: 'Look at the crystal picture above. When it matches, tap Offer pattern!',
        target: 'offer',
      };
    case 'explore':
      return {
        stage,
        title: 'Your crystal songbook',
        instruction: 'Grow shards, drag matching twins together, then match the pictured recipe. The shelf stores crystals; Brook Wash recycles them.',
        target: 'none',
      };
  }
}

/**
 * UI-only guidance. Its scoped keys are independent from adventure progress,
 * Just Games songbook, Grotto flags and quest state. Gameplay is never blocked.
 */
export class CrystalariumGuide {
  private readonly key: string;
  private readonly storage: GuideStorage | null;
  private active: boolean;
  private stage: CrystalariumGuideStage;

  public constructor(
    source: MiniGameLaunchSource,
    state: CrystalariumFullState,
    storage: GuideStorage | null = browserStorage(),
  ) {
    this.key = crystalariumGuideKey(source);
    this.storage = storage;
    this.stage = guideStage(state);
    let seen = false;
    try {
      seen = this.storage?.getItem(this.key) === 'seen';
    } catch {
      // Storage may be disabled; the guide remains optional and in-memory.
    }
    this.active = !seen && state.completed === 0;
  }

  public getPrompt(): CrystalariumGuidePrompt | null {
    return this.active ? promptFor(this.stage) : null;
  }

  public replay(state: CrystalariumFullState): void {
    this.active = true;
    this.stage = guideStage(state);
  }

  public skip(): void {
    this.finish();
  }

  public observe(before: CrystalariumFullState, after: CrystalariumFullState): void {
    if (!this.active) return;
    if (after.completed > before.completed) {
      this.finish();
      return;
    }
    // Advance only after real accepted moves, not rejected actions or mere taps.
    if (after.merges > before.merges) {
      this.stage = 'offer';
    } else if (
      this.stage === 'grow' &&
      after.cells.filter(Boolean).length > before.cells.filter(Boolean).length
    ) {
      this.stage = 'merge';
    }
  }

  private finish(): void {
    this.active = false;
    try {
      this.storage?.setItem(this.key, 'seen');
    } catch {
      // Never block gameplay or persistence because tutorial UI storage failed.
    }
  }
}
