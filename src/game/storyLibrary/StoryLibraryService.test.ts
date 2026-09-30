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
            catalogueBlurb: 'A small sampler from Quill’s shelves.',
            author: 'Unicorn Valley',
            readingMode: 'flowing',
            coverPath: null,
            coverAlt: null,
            series: null,
            tags: ['story-house', 'sample'],
            discovery: {
              format: 'Short Story',
              genres: ['Fantasy'],
              audiences: ['Read Together'],
              length: 'Quick Read',
            },
            rightsSummary: {
              text: 'original',
              illustrations: 'original',
              edition: 'original',
              originalPublicationYear: null,
            },
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
        readingMode: 'flowing',
        cover: null,
        series: null,
        tags: ['story-house', 'sample'],
        discovery: {
          format: 'Short Story',
          genres: ['Fantasy'],
          audiences: ['Read Together'],
          length: 'Quick Read',
        },
        rights: {
          text: {
            status: 'original',
            source: 'Unicorn Valley development content',
          },
          illustrations: {
            status: 'original',
            source: 'Unicorn Valley development content',
          },
          edition: {
            status: 'original',
            source: 'Unicorn Valley development content',
          },
          originalPublicationYear: null,
        },
        publication: { status: 'published' },
        chapters: [
          {
            id: 'chapter-01',
            title: 'The First Shelf',
            path: 'chapters/01.md',
            illustrations: [
              {
                id: 'shelf-picture',
                blockId: 'first-shelf',
                path: 'illustrations/shelf.webp',
                alt: 'A painted shelf full of books.',
                placement: 'full-width',
                width: 480,
                height: 480,
              },
            ],
          },
        ],
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
    expect(stories[0]?.readingMode).toBe('flowing');
    expect(stories[0]?.catalogueBlurb).toBe('A small sampler from Quill’s shelves.');
    expect(stories[0]?.discovery).toEqual({
      format: 'Short Story',
      genres: ['Fantasy'],
      audiences: ['Read Together'],
      length: 'Quick Read',
    });
    expect(stories[0]?.rightsSummary.text).toBe('original');
    expect(requested).toEqual(['/stories/catalogue.json']);

    const manifest = await service.loadManifest('story-house-sampler');
    expect(manifest.readingMode).toBe('flowing');
    expect(manifest.discovery.format).toBe('Short Story');
    expect(manifest.rights.text.status).toBe('original');
    expect(manifest.chapters[0]?.id).toBe('chapter-01');
    expect(manifest.chapters[0]?.illustrations?.[0]).toMatchObject({
      id: 'shelf-picture',
      blockId: 'first-shelf',
      path: 'illustrations/shelf.webp',
      placement: 'full-width',
      width: 480,
      height: 480,
    });
    expect(manifest.defaultIllustrationSetId).toBe('default');
    expect(manifest.editions[0]?.illustrationSets).toHaveLength(1);
    expect(manifest.editions[0]?.illustrationSets[0]).toMatchObject({
      id: 'default',
      label: 'Illustrations',
      rights: {
        status: 'original',
        source: 'Unicorn Valley development content',
      },
      chapters: [
        {
          chapterId: 'chapter-01',
          illustrations: [
            {
              id: 'shelf-picture',
              path: 'illustrations/shelf.webp',
            },
          ],
        },
      ],
    });
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
    expect(requested).not.toContain('/stories/story-house-sampler/illustrations/shelf.webp');
  });

  it('rejects chapters without stable block markers', () => {
    expect(() => parseStoryChapterBlocks('# Unstable chapter')).toThrow(
      'Story Library chapter has no stable block markers.',
    );
  });
  it('normalises a multi-edition manifest and loads chapters from the selected edition', async () => {
    const bodies = new Map<string, ReturnType<typeof response>>([
      [
        '/stories/catalogue.json',
        response({
          schemaVersion: 1,
          stories: [
            {
              id: 'alice',
              title: "Alice's Adventures in Wonderland",
              description: 'Two editions of a classic.',
              catalogueBlurb: 'Choose the Story House or full classic text.',
              author: 'Lewis Carroll, retold by Quill',
              readingMode: 'flowing',
              coverPath: null,
              coverAlt: null,
              series: null,
              tags: ['classic-retelling'],
              discovery: {
                format: 'Chapter Book',
                genres: ['Classics'],
                audiences: ['Read Together'],
                length: 'Longer Read',
              },
              rightsSummary: {
                text: 'original',
                illustrations: 'public-domain',
                edition: 'original',
                originalPublicationYear: 1865,
              },
              chapterCount: 1,
              manifestPath: '/stories/alice/book.json',
              defaultEditionId: 'story-house',
              editions: [
                { id: 'story-house', label: 'Story House Edition' },
                { id: 'full-classic', label: 'Full Classic Text' },
              ],
            },
          ],
        }),
      ],
      [
        '/stories/alice/book.json',
        response({
          schemaVersion: 2,
          id: 'alice',
          title: "Alice's Adventures in Wonderland",
          description: 'Two editions of a classic.',
          catalogueBlurb: 'Choose the Story House or full classic text.',
          cover: null,
          series: null,
          tags: ['classic-retelling'],
          discovery: {
            format: 'Chapter Book',
            genres: ['Classics'],
            audiences: ['Read Together'],
            length: 'Longer Read',
          },
          publication: { status: 'published' },
          defaultEditionId: 'story-house',
          editions: [
            {
              id: 'story-house',
              label: 'Story House Edition',
              author: 'Lewis Carroll, retold by Quill',
              readingMode: 'flowing',
              rights: {
                text: { status: 'original', source: 'Story House retelling' },
                illustrations: { status: 'public-domain', source: 'John Tenniel' },
                edition: { status: 'original', source: 'Story House edition' },
                originalPublicationYear: 1865,
              },
              chapters: [
                {
                  id: 'chapter-01',
                  title: 'Story House opening',
                  path: 'editions/story-house/chapters/01.md',
                },
              ],
            },
            {
              id: 'full-classic',
              label: 'Full Classic Text',
              author: 'Lewis Carroll',
              readingMode: 'paged-prose',
              rights: {
                text: { status: 'public-domain', source: '1865 text' },
                illustrations: { status: 'public-domain', source: 'John Tenniel' },
                edition: { status: 'public-domain', source: 'Historic edition' },
                originalPublicationYear: 1865,
              },
              chapters: [
                {
                  id: 'chapter-01',
                  title: 'Down the Rabbit-Hole',
                  path: 'editions/full-classic/chapters/01.md',
                },
              ],
              illustrationSets: [
                {
                  id: 'modern',
                  label: 'Modern Illustrations',
                  rights: { status: 'original', source: 'Modern Story House art' },
                  chapters: [
                    {
                      chapterId: 'chapter-01',
                      illustrations: [
                        {
                          id: 'modern-rabbit',
                          blockId: 'white-rabbit',
                          path: 'illustrations/generated/rabbit.webp',
                          alt: 'Modern White Rabbit illustration.',
                          placement: 'full-width',
                          width: 600,
                          height: 400,
                        },
                      ],
                    },
                  ],
                },
                {
                  id: 'classic',
                  label: 'Classic Illustrations',
                  rights: { status: 'public-domain', source: 'John Tenniel' },
                  chapters: [
                    {
                      chapterId: 'chapter-01',
                      illustrations: [
                        {
                          id: 'classic-rabbit',
                          blockId: 'white-rabbit',
                          path: 'illustrations/classic/rabbit.webp',
                          alt: 'Historic White Rabbit illustration.',
                          placement: 'full-width',
                          width: 600,
                          height: 400,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
      [
        '/stories/alice/editions/full-classic/chapters/01.md',
        response(
          '<!-- block:white-rabbit -->\\n# Down the Rabbit-Hole\\n\\nA White Rabbit ran close by her.',
        ),
      ],
    ]);

    const service = new StoryLibraryService(async (path) => bodies.get(path) ?? response('', 404));
    const manifest = await service.loadManifest('alice');

    expect(manifest.defaultEditionId).toBe('story-house');
    expect(manifest.editions.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'story-house', label: 'Story House Edition' },
      { id: 'full-classic', label: 'Full Classic Text' },
    ]);
    expect(manifest.author).toBe('Lewis Carroll, retold by Quill');
    expect(manifest.chapters[0]?.title).toBe('Story House opening');

    const chapter = await service.loadChapter('alice', 'chapter-01', 'full-classic');
    expect(manifest.editions[1]?.readingMode).toBe('paged-prose');
    expect(manifest.editions[1]?.defaultIllustrationSetId).toBe('classic');
    expect(chapter.editionId).toBe('full-classic');
    expect(chapter.title).toBe('Down the Rabbit-Hole');
    expect(chapter.blocks[0]?.id).toBe('white-rabbit');
  });
  it('normalises independent classic and modern illustration sets without duplicating chapter prose', async () => {
    const bodies = new Map<string, ReturnType<typeof response>>([
      [
        '/stories/catalogue.json',
        response({
          schemaVersion: 1,
          stories: [
            {
              id: 'fable',
              title: 'A Fable',
              description: 'One text with two art choices.',
              catalogueBlurb: 'Choose classic or modern pictures.',
              author: 'Aesop, retold by Quill',
              readingMode: 'flowing',
              coverPath: null,
              coverAlt: null,
              series: null,
              tags: ['classic-retelling'],
              discovery: {
                format: 'Short Story',
                genres: ['Classics'],
                audiences: ['Read Together'],
                length: 'Quick Read',
              },
              rightsSummary: {
                text: 'original',
                illustrations: 'original',
                edition: 'original',
                originalPublicationYear: null,
              },
              chapterCount: 1,
              manifestPath: '/stories/fable/book.json',
            },
          ],
        }),
      ],
      [
        '/stories/fable/book.json',
        response({
          schemaVersion: 1,
          id: 'fable',
          title: 'A Fable',
          description: 'One text with two art choices.',
          author: 'Aesop, retold by Quill',
          readingMode: 'flowing',
          cover: null,
          series: null,
          tags: ['classic-retelling'],
          discovery: {
            format: 'Short Story',
            genres: ['Classics'],
            audiences: ['Read Together'],
            length: 'Quick Read',
          },
          rights: {
            text: { status: 'original', source: 'Story House retelling' },
            illustrations: { status: 'original', source: 'Default Story House art' },
            edition: { status: 'original', source: 'Story House edition' },
            originalPublicationYear: null,
          },
          publication: { status: 'published' },
          chapters: [
            {
              id: 'the-story',
              title: 'The Story',
              path: 'chapters/01.md',
            },
          ],
          illustrationSets: [
            {
              id: 'classic',
              label: 'Classic Illustrations',
              rights: { status: 'public-domain', source: 'Historic source edition' },
              chapters: [
                {
                  chapterId: 'the-story',
                  illustrations: [
                    {
                      id: 'classic-opening',
                      blockId: 'opening',
                      path: 'illustrations/classic/opening.webp',
                      alt: 'Historic illustration.',
                      placement: 'full-width',
                      width: 600,
                      height: 400,
                    },
                  ],
                },
              ],
            },
            {
              id: 'modern',
              label: 'Modern Illustrations',
              rights: { status: 'original', source: 'Unicorn Valley generated art' },
              chapters: [
                {
                  chapterId: 'the-story',
                  illustrations: [
                    {
                      id: 'modern-opening',
                      blockId: 'opening',
                      path: 'illustrations/generated/opening.webp',
                      alt: 'Modern Story House illustration.',
                      placement: 'full-width',
                      width: 600,
                      height: 400,
                    },
                  ],
                },
              ],
            },
          ],
        }),
      ],
    ]);

    const service = new StoryLibraryService(async (path) => bodies.get(path) ?? response('', 404));
    const manifest = await service.loadManifest('fable');
    const edition = manifest.editions[0];

    expect(edition?.chapters).toHaveLength(1);
    expect(edition?.chapters[0]?.illustrations).toBeUndefined();
    expect(edition?.defaultIllustrationSetId).toBe('modern');
    expect(edition?.illustrationSets.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'classic', label: 'Classic Illustrations' },
      { id: 'modern', label: 'Modern Illustrations' },
    ]);
    expect(edition?.illustrationSets[0]?.rights).toEqual({
      status: 'public-domain',
      source: 'Historic source edition',
    });
    expect(edition?.illustrationSets[1]?.chapters[0]?.illustrations[0]?.path).toBe(
      'illustrations/generated/opening.webp',
    );
  });
});
