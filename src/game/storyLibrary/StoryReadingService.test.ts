import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { StoryReadingService } from './StoryReadingService';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

describe('StoryReadingService', () => {
  it('persists independent positions for multiple stories and reader preferences', () => {
    const repository = new MemorySaveRepository();
    const saves = new SaveService(repository);
    let now = '2026-09-24T08:30:00.000Z';
    const reading = new StoryReadingService(saves, () => now);

    expect(reading.updatePreferences({ fontSize: 24, lineHeight: 1.8 })).toBe(true);
    expect(
      reading.savePosition({
        storyId: 'first-book',
        chapterId: 'chapter-02',
        blockId: 'hidden-door',
        blockProgress: 0.42,
        chapterPercentComplete: 56,
        percentComplete: 31,
      }),
    ).toBe(true);

    now = '2026-09-24T08:35:00.000Z';
    expect(
      reading.savePosition({
        storyId: 'second-book',
        chapterId: 'chapter-01',
        blockId: 'opening',
        blockProgress: 0.2,
        chapterPercentComplete: 20,
        percentComplete: 10,
      }),
    ).toBe(true);

    const restored = new StoryReadingService(new SaveService(repository));
    expect(restored.getPreferences()).toEqual({ fontSize: 24, lineHeight: 1.8 });
    expect(restored.getProgress('first-book')).toMatchObject({
      chapterId: 'chapter-02',
      blockId: 'hidden-door',
      blockProgress: 0.42,
      chapterPercentComplete: 56,
      percentComplete: 31,
      completed: false,
      lastReadAt: '2026-09-24T08:30:00.000Z',
    });
    expect(restored.getProgress('second-book')).toMatchObject({
      chapterId: 'chapter-01',
      blockId: 'opening',
      percentComplete: 10,
    });
  });

  it('records completion without losing the stable semantic locator', () => {
    const repository = new MemorySaveRepository();
    const reading = new StoryReadingService(
      new SaveService(repository),
      () => '2026-09-24T09:00:00.000Z',
    );

    expect(
      reading.markCompleted({
        storyId: 'finished-book',
        chapterId: 'chapter-04',
        blockId: 'last-page',
        blockProgress: 0.6,
        chapterPercentComplete: 83,
        percentComplete: 96,
      }),
    ).toBe(true);

    expect(reading.getStatus('finished-book')).toBe('completed');
    expect(reading.getProgress('finished-book')).toEqual({
      chapterId: 'chapter-04',
      blockId: 'last-page',
      blockProgress: 1,
      chapterPercentComplete: 100,
      percentComplete: 100,
      completed: true,
      lastReadAt: '2026-09-24T09:00:00.000Z',
    });
  });
});
