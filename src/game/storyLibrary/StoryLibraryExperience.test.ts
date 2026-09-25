import { describe, expect, it } from 'vitest';
import {
  buildStoryLibraryShelves,
  calculateStoryLibraryStats,
  storiesForLibraryShelf,
  type StoryLibraryProgressSummary,
} from './StoryLibraryExperience';
import type { StoryCatalogueEntry } from './StoryLibraryTypes';

function story(
  id: string,
  overrides: Partial<StoryCatalogueEntry['discovery']> & {
    tags?: readonly string[];
  } = {},
): StoryCatalogueEntry {
  return {
    id,
    title: id,
    description: `${id} description`,
    author: 'Quill',
    readingMode: 'flowing',
    coverPath: null,
    coverAlt: null,
    series: null,
    tags: overrides.tags ?? [],
    discovery: {
      format: overrides.format ?? 'Short Story',
      genres: overrides.genres ?? ['Fantasy'],
      audiences: overrides.audiences ?? ['Read Together'],
      length: overrides.length ?? 'Quick Read',
    },
    rightsSummary: {
      text: 'original',
      illustrations: null,
      edition: 'original',
      originalPublicationYear: null,
    },
    chapterCount: 1,
    manifestPath: `/stories/${id}/book.json`,
  };
}

const stories = [
  story('duck', { format: 'Picture Book', genres: ['Animals'] }),
  story('lion', { genres: ['Animals', 'Classics'], tags: ['classic-retelling'] }),
  story('lantern', { format: 'Chapter Book', length: 'Longer Read' }),
];

describe('Story Library experience', () => {
  it('derives shelves from metadata and reading state', () => {
    const progress = new Map<string, StoryLibraryProgressSummary>([
      ['duck', { percentComplete: 35, completed: false, lastReadAt: '2026-09-25T09:00:00Z' }],
      ['lion', { percentComplete: 100, completed: true, lastReadAt: '2026-09-24T09:00:00Z' }],
    ]);

    expect(buildStoryLibraryShelves(stories, progress).map(({ id }) => id)).toEqual([
      'all',
      'unread',
      'in-progress',
      'recently-read',
      'picture-books',
      'classics',
      'longer-stories',
      'completed',
    ]);
    expect(storiesForLibraryShelf(stories, 'unread', progress).map(({ id }) => id)).toEqual([
      'lantern',
    ]);
    expect(storiesForLibraryShelf(stories, 'recently-read', progress).map(({ id }) => id)).toEqual([
      'duck',
      'lion',
    ]);
  });

  it('summarises library progress independently of quests', () => {
    const progress = new Map<string, StoryLibraryProgressSummary>([
      ['duck', { percentComplete: 35, completed: false, lastReadAt: '2026-09-25T09:00:00Z' }],
      ['lion', { percentComplete: 100, completed: true, lastReadAt: '2026-09-24T09:00:00Z' }],
    ]);

    expect(calculateStoryLibraryStats(stories, progress)).toEqual({
      started: 2,
      completed: 1,
      catalogueCompletionPercent: 33,
    });
  });
});
