import type { StoryCatalogueEntry } from './StoryLibraryTypes';

export interface StoryLibraryDiscoveryFilters {
  query: string;
  format: string | null;
  genre: string | null;
  audience: string | null;
  length: string | null;
}

export interface StoryLibraryDiscoveryOptions {
  formats: readonly string[];
  genres: readonly string[];
  audiences: readonly string[];
  lengths: readonly string[];
}

function sortUnique(values: readonly string[]): readonly string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

export function collectStoryDiscoveryOptions(
  stories: readonly StoryCatalogueEntry[],
): StoryLibraryDiscoveryOptions {
  return {
    formats: sortUnique(stories.map(({ discovery }) => discovery.format)),
    genres: sortUnique(stories.flatMap(({ discovery }) => discovery.genres)),
    audiences: sortUnique(stories.flatMap(({ discovery }) => discovery.audiences)),
    lengths: sortUnique(stories.map(({ discovery }) => discovery.length)),
  };
}

export function filterStoryCatalogue(
  stories: readonly StoryCatalogueEntry[],
  filters: StoryLibraryDiscoveryFilters,
): readonly StoryCatalogueEntry[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return stories.filter((story) => {
    if (filters.format && story.discovery.format !== filters.format) return false;
    if (filters.genre && !story.discovery.genres.includes(filters.genre)) return false;
    if (filters.audience && !story.discovery.audiences.includes(filters.audience)) return false;
    if (filters.length && story.discovery.length !== filters.length) return false;

    if (!query) return true;

    const searchable = [
      story.title,
      story.author,
      story.description,
      story.series?.title ?? '',
      story.discovery.format,
      story.discovery.length,
      ...story.discovery.genres,
      ...story.discovery.audiences,
      ...story.tags,
    ]
      .join(' ')
      .toLocaleLowerCase();

    return searchable.includes(query);
  });
}

export function storyDiscoveryBadges(story: StoryCatalogueEntry): readonly string[] {
  return [story.discovery.format, story.discovery.genres[0], story.discovery.length].filter(
    (value, index, values): value is string => Boolean(value) && values.indexOf(value) === index,
  );
}
