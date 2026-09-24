import { describe, expect, it } from 'vitest';
import { StoryLibraryService, parseStoryChapterBlocks } from './StoryLibraryService';
import type { StoryLibraryFetch } from './StoryLibraryService';

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      return String(body);
    },
  };
}

function libraryFetch(): StoryLibraryFetch {
  const bodies = new Map<string, ReturnType<typeof response>>([
    [
      '/stories/catalogue.json',
      response({
        schemaVersion: 1,
        stories: [
          {
            id: 'story-house-sampler',
            title: 'A Shelf Full of Stories',
            description: 'A small library-system sampler.',
            author: 'Unicorn Valley',
            coverPath: null,
            coverAlt: null,
            series: null,
            tags: ['story-house', 'sample'],
            chapterCount: 1,
            manifestPath: '/stories/story-house-sampler/book.json',
          },
        ],
      }),
    ],
    [
      '/stories/story-house-sampler/book.json',
      response({
        schemaVersion: 1,
        id: 'story-house-sampler',
        title: 'A Shelf Full of Stories',
        description: 'A small library-system sampler.',
        author: 'Unicorn Valley',
        cover: null,
        series: null,
        tags: ['story-house', 'sample'],
        publication: { status: 'published' },
        chapters: [{ id: 'chapter-01', title: 'The First Shelf', path: 'chapters/01.md' }],
      }),
    ],
    [
      '/stories/story-house-sampler/chapters/01.md',
      response(
        '<!-- block:first-shelf -->\n# The First Shelf\n\nQuill dusted one blue book.\n\n<!-- block:next-book -->\nAnother story waited beside it.',
      ),
    ],
  ]);
  return async (path) => bodies.get(path) ?? response('', 404);
}

describe('Story Library service', () => {
  it('loads the lightweight catalogue before fetching a selected manifest', async () => {
    const requested: string[] = [];
    const fetcher = libraryFetch();
    const service = new StoryLibraryService(async (path) => {
      requested.push(path);
      return fetcher(path);
    });

    const stories = await service.listStories();
    expect(stories.map(({ id }) => id)).toEqual(['story-house-sampler']);
    expect(requested).toEqual(['/stories/catalogue.json']);

    const manifest = await service.loadManifest('story-house-sampler');
    expect(manifest.chapters[0]?.id).toBe('chapter-01');
    expect(requested).toEqual([
      '/stories/catalogue.json',
      '/stories/story-house-sampler/book.json',
    ]);
  });

  it('loads only the requested chapter and exposes stable resume blocks', async () => {
    const requested: string[] = [];
    const fetcher = libraryFetch();
    const service = new StoryLibraryService(async (path) => {
      requested.push(path);
      return fetcher(path);
    });

    const chapter = await service.loadChapter('story-house-sampler', 'chapter-01');
    expect(chapter.blocks).toEqual([
      {
        id: 'first-shelf',
        markdown: '# The First Shelf\n\nQuill dusted one blue book.',
      },
      {
        id: 'next-book',
        markdown: 'Another story waited beside it.',
      },
    ]);
    expect(requested.at(-1)).toBe('/stories/story-house-sampler/chapters/01.md');
  });

  it('rejects chapters without stable block markers', () => {
    expect(() => parseStoryChapterBlocks('# Unstable chapter')).toThrow(
      'Story Library chapter has no stable block markers.',
    );
  });
});
