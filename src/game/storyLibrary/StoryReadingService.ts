import type { SaveService } from '../save/SaveService';
import type { ReaderPreferencesState, StoryReadingProgress } from '../save/saveSchema';

export type StoryReadingStatus = 'not-started' | 'in-progress' | 'completed';

export interface StoryReadingPosition {
  storyId: string;
  editionId?: string;
  defaultEditionId?: string;
  chapterId: string;
  blockId: string;
  blockProgress: number;
  chapterPercentComplete: number;
  percentComplete: number;
}

export interface StoryEditionProgress {
  editionId: string;
  progress: StoryReadingProgress;
}

const DEFAULT_PREFERENCES: ReaderPreferencesState = {
  fontSize: 20,
  lineHeight: 1.7,
  illustrationSetByStoryEditionKey: {},
};

const EDITION_KEY_SEPARATOR = '::edition::';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function progressKey(storyId: string, editionId?: string, defaultEditionId?: string): string {
  if (!editionId || !defaultEditionId || editionId === defaultEditionId) {
    return storyId;
  }
  return `${storyId}${EDITION_KEY_SEPARATOR}${editionId}`;
}

export class StoryReadingService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  public getPreferences(): ReaderPreferencesState {
    const save = this.saveService.load();
    const preferences = save?.storyReading.preferences ?? DEFAULT_PREFERENCES;
    return {
      ...preferences,
      illustrationSetByStoryEditionKey: { ...(preferences.illustrationSetByStoryEditionKey ?? {}) },
    };
  }

  public getIllustrationSetPreference(
    storyId: string,
    editionId?: string,
    defaultEditionId?: string,
  ): string | null {
    const save = this.saveService.load();
    return (
      save?.storyReading.preferences.illustrationSetByStoryEditionKey?.[
        progressKey(storyId, editionId, defaultEditionId)
      ] ?? null
    );
  }

  public getProgress(
    storyId: string,
    editionId?: string,
    defaultEditionId?: string,
  ): StoryReadingProgress | null {
    const save = this.saveService.load();
    const progress =
      save?.storyReading.byStoryId[progressKey(storyId, editionId, defaultEditionId)];
    return progress ? { ...progress } : null;
  }

  public getLatestProgressForStory(
    storyId: string,
    editionIds: readonly string[],
    defaultEditionId: string,
  ): StoryEditionProgress | null {
    let latest: StoryEditionProgress | null = null;

    for (const editionId of editionIds) {
      const progress = this.getProgress(storyId, editionId, defaultEditionId);
      if (!progress) continue;
      if (!latest || progress.lastReadAt > latest.progress.lastReadAt) {
        latest = { editionId, progress };
      }
    }

    return latest;
  }

  public getStatus(
    storyId: string,
    editionId?: string,
    defaultEditionId?: string,
  ): StoryReadingStatus {
    const progress = this.getProgress(storyId, editionId, defaultEditionId);
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
      illustrationSetByStoryEditionKey: {
        ...(save.storyReading.preferences.illustrationSetByStoryEditionKey ?? {}),
      },
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

  public updateIllustrationSetPreference(
    storyId: string,
    editionId: string,
    defaultEditionId: string,
    illustrationSetId: string,
  ): boolean {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const key = progressKey(storyId, editionId, defaultEditionId);
    const result = this.saveService.saveWithResult({
      ...save,
      storyReading: {
        ...save.storyReading,
        preferences: {
          ...save.storyReading.preferences,
          illustrationSetByStoryEditionKey: {
            ...(save.storyReading.preferences.illustrationSetByStoryEditionKey ?? {}),
            [key]: illustrationSetId,
          },
        },
      },
    });
    return result.status === 'saved';
  }

  public savePosition(position: StoryReadingPosition): boolean {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const key = progressKey(position.storyId, position.editionId, position.defaultEditionId);
    const previous = save.storyReading.byStoryId[key];
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
          [key]: progress,
        },
      },
    });
    return result.status === 'saved';
  }

  public markCompleted(position: StoryReadingPosition): boolean {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const key = progressKey(position.storyId, position.editionId, position.defaultEditionId);
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
          [key]: progress,
        },
      },
    });
    return result.status === 'saved';
  }
}
