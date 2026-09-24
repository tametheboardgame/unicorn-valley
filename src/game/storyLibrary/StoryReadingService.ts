import type { SaveService } from '../save/SaveService';
import type {
  ReaderPreferencesState,
  StoryReadingProgress,
} from '../save/saveSchema';

export type StoryReadingStatus = 'not-started' | 'in-progress' | 'completed';

export interface StoryReadingPosition {
  storyId: string;
  chapterId: string;
  blockId: string;
  blockProgress: number;
  chapterPercentComplete: number;
  percentComplete: number;
}

const DEFAULT_PREFERENCES: ReaderPreferencesState = {
  fontSize: 20,
  lineHeight: 1.7,
};

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export class StoryReadingService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  public getPreferences(): ReaderPreferencesState {
    const save = this.saveService.load();
    return save
      ? { ...save.storyReading.preferences }
      : { ...DEFAULT_PREFERENCES };
  }

  public getProgress(storyId: string): StoryReadingProgress | null {
    const save = this.saveService.load();
    const progress = save?.storyReading.byStoryId[storyId];
    return progress ? { ...progress } : null;
  }

  public getStatus(storyId: string): StoryReadingStatus {
    const progress = this.getProgress(storyId);
    if (!progress) return 'not-started';
    return progress.completed ? 'completed' : 'in-progress';
  }

  public updatePreferences(preferences: Partial<ReaderPreferencesState>): boolean {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const nextPreferences: ReaderPreferencesState = {
      fontSize: clamp(
        Math.round(preferences.fontSize ?? save.storyReading.preferences.fontSize),
        16,
        28,
      ),
      lineHeight: clamp(
        Math.round((preferences.lineHeight ?? save.storyReading.preferences.lineHeight) * 10) / 10,
        1.4,
        2,
      ),
    };

    const result = this.saveService.saveWithResult({
      ...save,
      storyReading: {
        ...save.storyReading,
        preferences: nextPreferences,
      },
    });
    return result.status === 'saved';
  }

  public savePosition(position: StoryReadingPosition): boolean {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const previous = save.storyReading.byStoryId[position.storyId];
    const completed = previous?.completed ?? false;
    const progress: StoryReadingProgress = {
      chapterId: position.chapterId,
      blockId: position.blockId,
      blockProgress: clamp(position.blockProgress, 0, 1),
      chapterPercentComplete: clamp(position.chapterPercentComplete, 0, 100),
      percentComplete: completed ? 100 : clamp(position.percentComplete, 0, 99.9),
      completed,
      lastReadAt: this.now(),
    };

    const result = this.saveService.saveWithResult({
      ...save,
      storyReading: {
        ...save.storyReading,
        byStoryId: {
          ...save.storyReading.byStoryId,
          [position.storyId]: progress,
        },
      },
    });
    return result.status === 'saved';
  }

  public markCompleted(position: StoryReadingPosition): boolean {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const progress: StoryReadingProgress = {
      chapterId: position.chapterId,
      blockId: position.blockId,
      blockProgress: 1,
      chapterPercentComplete: 100,
      percentComplete: 100,
      completed: true,
      lastReadAt: this.now(),
    };

    const result = this.saveService.saveWithResult({
      ...save,
      storyReading: {
        ...save.storyReading,
        byStoryId: {
          ...save.storyReading.byStoryId,
          [position.storyId]: progress,
        },
      },
    });
    return result.status === 'saved';
  }
}
