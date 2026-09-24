import { describe, expect, it } from 'vitest';
import {
  collectStoryDiscoveryOptions,
  filterStoryCatalogue,
  storyDiscoveryBadges,
  type StoryLibraryDiscoveryFilters,
} from './StoryLibraryDiscovery';
import type { StoryCatalogueEntry } from './StoryLibraryTypes';

const stories: StoryCatalogueEntry[] = [
  {
    id: 'duck-book',
    title: 'The Duck Bread Baker',
    description: 'A duck learns about food.',
    author: 'David Fairbairn',
    readingMode: 'paged-picture-book',
    coverPath: null,
    coverAlt: null,
    series: null,
    tags: ['animals', 'food'],
    discovery: {
      format: 'Picture Book',
      genres: ['Animals', 'Food & Health'],
      audiences: ['Read Together', 'Early Reader'],
      length: 'Quick Read',
    },
    rightsSummary: {
      text: 'original',
      illustrations: 'unknown',
      edition: 'unknown',
      originalPublicationYear: null,
    },
    chapterCount: 41,
    manifestPath: '/stories/duck-book/book.json',
  },
  {
    id: 'moon-book',
    title: 'Moonlight Mystery',
    description: 'A longer mystery in the Valley.',
    author: 'Quill',
    readingMode: 'flowing',
    coverPath: null,
    coverAlt: null,
    series: { id: 'moon-series', title: 'Moon Tales', order: 1 },
    tags: ['mystery'],
    discovery: {
      format: 'Chapter Book',
      genres: ['Mystery'],
      audiences: ['Independent Reader'],
      length: 'Longer Read',
    },
    rightsSummary: {
      text: 'original',
      illustrations: null,
      edition: null,
      originalPublicationYear: null,
    },
    chapterCount: 8,
    manifestPath: '/stories/moon-book/book.json',
  },
];

const blankFilters: StoryLibraryDiscoveryFilters = {
  query: '',
  format: null,
  genre: null,
  audience: null,
  length: null,
};

describe('Story Library discovery', () => {
  it('derives filter choices entirely from catalogue metadata', () => {
    expect(collectStoryDiscoveryOptions(stories)).toEqual({
      formats: ['Chapter Book', 'Picture Book'],
      genres: ['Animals', 'Food & Health', 'Mystery'],
      audiences: ['Early Reader', 'Independent Reader', 'Read Together'],
      lengths: ['Longer Read', 'Quick Read'],
    });
  });

  it('searches title, author, series and discovery metadata', () => {
    expect(filterStoryCatalogue(stories, { ...blankFilters, query: 'David' })).toHaveLength(1);
    expect(filterStoryCatalogue(stories, { ...blankFilters, query: 'Moon Tales' })[0]?.id).toBe(
      'moon-book',
    );
    expect(filterStoryCatalogue(stories, { ...blankFilters, query: 'Food & Health' })[0]?.id).toBe(
      'duck-book',
    );
  });

  it('combines metadata facets without bespoke category code', () => {
    expect(
      filterStoryCatalogue(stories, {
        ...blankFilters,
        format: 'Picture Book',
        audience: 'Read Together',
      }).map(({ id }) => id),
    ).toEqual(['duck-book']);
    expect(
      filterStoryCatalogue(stories, {
        ...blankFilters,
        genre: 'Mystery',
        length: 'Quick Read',
      }),
    ).toEqual([]);
  });

  it('provides restrained metadata badges for book cards', () => {
    expect(storyDiscoveryBadges(stories[0])).toEqual(['Picture Book', 'Animals', 'Quick Read']);
  });
});
