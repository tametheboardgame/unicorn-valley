import type { MiniGameLaunchSource } from '../MiniGameSession';
import { canOfferPattern, type CrystalariumFullState } from './CrystalariumFullRules';
import {
  feasibleFirstLesson,
  firstLessonAllows,
  firstLessonPair,
  type FirstLessonCommand,
  type FirstLessonStep,
  type TutorialPair,
} from './CrystalariumTutorialPolicy';

export type CrystalariumGuideStage =
  | 'grow'
  | 'merge'
  | 'offer'
  | 'explore'
  | 'shelf'
  | 'wash'
  | 'families'
  | 'harmony'
  | 'refined'
  | 'polish';

export interface CrystalariumGuidePrompt {
  readonly stage: CrystalariumGuideStage;
  readonly lessonStep?: FirstLessonStep;
  readonly sourceIndex?: number;
  readonly targetIndex?: number;
  readonly title: string;
  readonly instruction: string;
  readonly target:
    | 'grow'
    | 'cell'
    | 'offer'
    | 'goal'
    | 'none'
    | 'shelve'
    | 'wash'
    | 'source-low'
    | 'harmony'
    | 'grow-refined'
    | 'polish';
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
        instruction: 'Tap the Low crystal generator to grow a new shard.',
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
    case 'shelf':
      return {
        stage,
        title: 'Keep crystals in Storage',
        instruction:
          'Drag a crystal onto Storage to keep it safe. Open Storage and tap a stored crystal to return it to the board.',
        target: 'shelve',
      };
    case 'wash':
      return {
        stage,
        title: 'Brook Wash is free',
        instruction:
          'Too many crystals? Select one and recycle it in Brook Wash. There is no penalty.',
        target: 'wash',
      };
    case 'families':
      return {
        stage,
        title: 'A new crystal voice!',
        instruction: 'Try the new crystal vein. Different colours and shapes make different songs.',
        target: 'none',
      };
    case 'harmony':
      return {
        stage,
        title: 'Three voices sing together',
        instruction:
          'Make one polished shard of each colour. The Harmony button turns them into a musical token.',
        target: 'harmony',
      };
    case 'refined':
      return {
        stage,
        title: 'New crystal growing power',
        instruction:
          'You can now grow a polished crystal directly, or keep growing basic shards whenever you like.',
        target: 'grow-refined',
      };
    case 'polish':
      return {
        stage,
        title: 'Polishing basin unlocked',
        instruction: 'Select a crystal, then use one Harmony token to polish it to the next shape.',
        target: 'polish',
      };
    case 'explore':
      return {
        stage,
        title: 'Your crystal songbook',
        instruction:
          'Grow shards, drag matching twins together, then match the pictured recipe. Storage keeps crystals safely; Brook Wash recycles them.',
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
  private lesson: { step: FirstLessonStep; pair: TutorialPair | null } | null = null;
  private static readonly MILESTONES = new Map<number, CrystalariumGuideStage>([
    [2, 'shelf'],
    [3, 'wash'],
    [4, 'families'],
    [7, 'harmony'],
    [20, 'refined'],
    [30, 'polish'],
  ]);

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
    if (this.active) this.lesson = feasibleFirstLesson(state);
    if (this.active && !this.lesson) this.active = false;
    const milestone = CrystalariumGuide.MILESTONES.get(state.completed);
    if (!this.active && milestone && !this.wasSeen(milestone)) {
      this.stage = milestone;
      this.active = true;
    }
  }

  public getPrompt(): CrystalariumGuidePrompt | null {
    if (!this.active) return null;
    if (!this.lesson) return promptFor(this.stage);
    const { step, pair } = this.lesson;
    switch (step) {
      case 'grow':
        return {
          stage: 'grow',
          lessonStep: step,
          title: '1 of 4 • Grow',
          instruction: 'Only Grow Shard works. Tap the glowing Grow button.',
          target: 'grow',
        };
      case 'pick-up':
        return {
          stage: 'merge',
          lessonStep: step,
          title: '2 of 4 • Pick up',
          instruction: 'Pick up the outlined new crystal, not the other one.',
          target: 'cell',
          sourceIndex: pair?.source,
        };
      case 'merge':
        return {
          stage: 'merge',
          lessonStep: step,
          title: '3 of 4 • Merge',
          instruction: 'Drop it onto the outlined matching twin.',
          target: 'cell',
          sourceIndex: pair?.source,
          targetIndex: pair?.target,
        };
      case 'offer':
        return {
          stage: 'offer',
          lessonStep: step,
          title: '4 of 4 • Offer',
          instruction: 'The crystal matches! Tap the glowing order card once to offer it.',
          target: 'offer',
        };
    }
  }

  /** Called before any rule or save; Skip, Help, Exit and sound live outside this policy. */
  public allows(command: FirstLessonCommand): boolean {
    return (
      !this.active || !this.lesson || firstLessonAllows(this.lesson.step, this.lesson.pair, command)
    );
  }

  public picked(index: number): void {
    if (!this.lesson || this.lesson.step !== 'pick-up') return;
    if (firstLessonAllows(this.lesson.step, this.lesson.pair, { kind: 'pick', index })) {
      this.lesson.step = 'merge';
    }
  }

  public replay(state: CrystalariumFullState): void {
    this.lesson = feasibleFirstLesson(state);
    this.active = true;
    this.stage = guideStage(state);
  }

  public skip(): void {
    this.finish();
  }

  public observe(before: CrystalariumFullState, after: CrystalariumFullState): void {
    if (this.lesson) {
      if (after.completed > before.completed) {
        this.finish();
      } else if (
        this.lesson.step === 'grow' &&
        after.cells.filter(Boolean).length > before.cells.filter(Boolean).length
      ) {
        const pair = firstLessonPair(after);
        if (pair) this.lesson = { step: 'pick-up', pair };
        else this.finish(); // An unusual saved board may not support this choreography.
      } else if (this.lesson.step === 'merge' && after.merges > before.merges) {
        this.lesson = { step: 'offer', pair: null };
      }
      return;
    }
    if (after.completed > before.completed && this.active) this.finish();
    const milestone = CrystalariumGuide.MILESTONES.get(after.completed);
    if (after.completed > before.completed && milestone && !this.wasSeen(milestone)) {
      this.stage = milestone;
      this.active = true;
      return;
    }
    if (!this.active) return;
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

  private wasSeen(stage: CrystalariumGuideStage): boolean {
    try {
      return this.storage?.getItem(this.key + ':' + stage) === 'seen';
    } catch {
      return false;
    }
  }

  private finish(): void {
    if (this.lesson) this.stage = 'explore';
    this.lesson = null;
    this.active = false;
    try {
      this.storage?.setItem(
        this.stage === 'grow' ||
          this.stage === 'merge' ||
          this.stage === 'offer' ||
          this.stage === 'explore'
          ? this.key
          : this.key + ':' + this.stage,
        'seen',
      );
    } catch {
      // Never block gameplay or persistence because tutorial UI storage failed.
    }
  }
}
