import type { StoryCatalogueEntry } from './StoryLibraryTypes';

export type StoryLibraryShelfId =
  | 'all'
  | 'unread'
  | 'in-progress'
  | 'recently-read'
  | 'picture-books'
  | 'classics'
  | 'longer-stories'
  | 'completed';

export interface StoryLibraryProgressSummary {
  percentComplete: number;
  completed: boolean;
  lastReadAt: string;
}

export interface StoryLibraryShelf {
  id: StoryLibraryShelfId;
  label: string;
  count: number;
}

export interface StoryLibraryStats {
  started: number;
  completed: number;
  catalogueCompletionPercent: number;
}

function isPictureBook(story: StoryCatalogueEntry): boolean {
  return story.discovery.format.toLocaleLowerCase().includes('picture');
}

function isClassic(story: StoryCatalogueEntry): boolean {
  return (
    story.discovery.genres.some((genre) => genre.toLocaleLowerCase() === 'classics') ||
    story.tags.some((tag) => ['classic', 'classic-retelling'].includes(tag.toLocaleLowerCase()))
  );
}

function isLongerStory(story: StoryCatalogueEntry): boolean {
  return story.discovery.length.toLocaleLowerCase().includes('long');
}

function sortByLastRead(
  stories: readonly StoryCatalogueEntry[],
  progressByStoryId: ReadonlyMap<string, StoryLibraryProgressSummary>,
): readonly StoryCatalogueEntry[] {
  return [...stories].sort((left, right) =>
    (progressByStoryId.get(right.id)?.lastReadAt ?? '').localeCompare(
      progressByStoryId.get(left.id)?.lastReadAt ?? '',
    ),
  );
}

export function storiesForLibraryShelf(
  stories: readonly StoryCatalogueEntry[],
  shelfId: StoryLibraryShelfId,
  progressByStoryId: ReadonlyMap<string, StoryLibraryProgressSummary>,
): readonly StoryCatalogueEntry[] {
  switch (shelfId) {
    case 'unread':
      return stories.filter(({ id }) => !progressByStoryId.has(id));
    case 'in-progress':
      return sortByLastRead(
        stories.filter(({ id }) => {
          const progress = progressByStoryId.get(id);
          return Boolean(progress && !progress.completed);
        }),
        progressByStoryId,
      );
    case 'recently-read':
      return sortByLastRead(
        stories.filter(({ id }) => progressByStoryId.has(id)),
        progressByStoryId,
      );
    case 'picture-books':
      return stories.filter(isPictureBook);
    case 'classics':
      return stories.filter(isClassic);
    case 'longer-stories':
      return stories.filter(isLongerStory);
    case 'completed':
      return sortByLastRead(
        stories.filter(({ id }) => progressByStoryId.get(id)?.completed === true),
        progressByStoryId,
      );
    default:
      return stories;
  }
}

export function buildStoryLibraryShelves(
  stories: readonly StoryCatalogueEntry[],
  progressByStoryId: ReadonlyMap<string, StoryLibraryProgressSummary>,
): readonly StoryLibraryShelf[] {
  const shelves: StoryLibraryShelf[] = [{ id: 'all', label: 'All Books', count: stories.length }];
  const candidates: readonly [StoryLibraryShelfId, string][] = [
    ['unread', 'Unread'],
    ['in-progress', 'Continue Reading'],
    ['recently-read', 'Recently Read'],
    ['picture-books', 'Picture Books'],
    ['classics', 'Classics'],
    ['longer-stories', 'Longer Stories'],
    ['completed', 'Completed'],
  ];

  for (const [id, label] of candidates) {
    const count = storiesForLibraryShelf(stories, id, progressByStoryId).length;
    if (count > 0) shelves.push({ id, label, count });
  }
  return shelves;
}

export function calculateStoryLibraryStats(
  stories: readonly StoryCatalogueEntry[],
  progressByStoryId: ReadonlyMap<string, StoryLibraryProgressSummary>,
): StoryLibraryStats {
  const started = stories.filter(({ id }) => progressByStoryId.has(id)).length;
  const completed = stories.filter(
    ({ id }) => progressByStoryId.get(id)?.completed === true,
  ).length;
  return {
    started,
    completed,
    catalogueCompletionPercent:
      stories.length === 0 ? 0 : Math.round((completed / stories.length) * 100),
  };
}
