import type {
  StoryCatalogue,
  StoryCatalogueEntry,
  StoryChapterContent,
  StoryChapterManifest,
  StoryContentBlock,
  StoryLibraryManifest,
} from './StoryLibraryTypes';

const STORY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BLOCK_MARKER = /<!--\s*block:([a-z0-9]+(?:-[a-z0-9]+)*)\s*-->/g;

interface StoryLibraryResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type StoryLibraryFetch = (path: string) => Promise<StoryLibraryResponse>;

function defaultFetch(path: string): Promise<StoryLibraryResponse> {
  return fetch(path);
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Story Library expected ${label} to be a non-empty string.`);
  }
  return value;
}

function requireStringArray(value: unknown, label: string): readonly string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Story Library expected ${label} to be an array of strings.`);
  }
  return value;
}

function requireSafeId(value: unknown, label: string): string {
  const id = requireString(value, label);
  if (!STORY_ID.test(id)) {
    throw new Error(`Story Library rejected invalid ${label} "${id}".`);
  }
  return id;
}

function requireRelativePath(value: unknown, label: string, extension: string): string {
  const path = requireString(value, label);
  if (
    path.startsWith('/') ||
    path.includes('..') ||
    path.includes('\\') ||
    !path.endsWith(extension)
  ) {
    throw new Error(`Story Library rejected unsafe ${label} "${path}".`);
  }
  return path;
}

function requireImagePath(value: unknown, label: string): string {
  const path = requireString(value, label);
  const lowerPath = path.toLowerCase();
  if (
    path.startsWith('/') ||
    path.includes('..') ||
    path.includes('\\') ||
    (!lowerPath.endsWith('.webp') && !lowerPath.endsWith('.avif'))
  ) {
    throw new Error(`Story Library rejected unsafe ${label} "${path}".`);
  }
  return path;
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Story Library expected ${label} to be a positive integer.`);
  }
  return value;
}

function parseSeries(value: unknown): StoryCatalogueEntry['series'] {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'object') throw new Error('Story Library expected series metadata.');
  const series = value as Record<string, unknown>;
  const order = series.order;
  if (typeof order !== 'number' || !Number.isFinite(order)) {
    throw new Error('Story Library expected series.order to be numeric.');
  }
  return {
    id: requireSafeId(series.id, 'series id'),
    title: requireString(series.title, 'series title'),
    order,
  };
}

function parseCatalogue(value: unknown): StoryCatalogue {
  if (!value || typeof value !== 'object') throw new Error('Story Library catalogue is invalid.');
  const source = value as Record<string, unknown>;
  if (source.schemaVersion !== 1 || !Array.isArray(source.stories)) {
    throw new Error('Story Library catalogue has an unsupported schema.');
  }

  const stories = source.stories.map((item): StoryCatalogueEntry => {
    if (!item || typeof item !== 'object')
      throw new Error('Story Library catalogue entry is invalid.');
    const entry = item as Record<string, unknown>;
    const chapterCount = entry.chapterCount;
    if (typeof chapterCount !== 'number' || chapterCount < 1) {
      throw new Error('Story Library expected a positive chapter count.');
    }
    return {
      id: requireSafeId(entry.id, 'story id'),
      title: requireString(entry.title, 'story title'),
      description: requireString(entry.description, 'story description'),
      author: requireString(entry.author, 'story author'),
      coverPath: entry.coverPath === null ? null : requireString(entry.coverPath, 'cover path'),
      coverAlt: entry.coverAlt === null ? null : requireString(entry.coverAlt, 'cover alt text'),
      series: parseSeries(entry.series),
      tags: requireStringArray(entry.tags, 'story tags'),
      chapterCount,
      manifestPath: requireString(entry.manifestPath, 'manifest path'),
    };
  });

  return { schemaVersion: 1, stories };
}

function parseChapter(value: unknown, storyId: string): StoryChapterManifest {
  if (!value || typeof value !== 'object') throw new Error('Story Library chapter is invalid.');
  const chapter = value as Record<string, unknown>;
  return {
    id: requireSafeId(chapter.id, 'chapter id'),
    title: requireString(chapter.title, 'chapter title'),
    path: requireRelativePath(chapter.path, 'chapter path', '.md'),
    illustrations: Array.isArray(chapter.illustrations)
      ? chapter.illustrations.map((item) => {
          if (!item || typeof item !== 'object') {
            throw new Error(`Story Library illustration metadata is invalid for ${storyId}.`);
          }
          const illustration = item as Record<string, unknown>;
          const placement = illustration.placement;
          if (placement !== 'inline' && placement !== 'full-width') {
            throw new Error('Story Library illustration placement is invalid.');
          }
          return {
            id: requireSafeId(illustration.id, 'illustration id'),
            blockId: requireSafeId(illustration.blockId, 'illustration block id'),
            path: requireImagePath(illustration.path, 'illustration path'),
            alt: requireString(illustration.alt, 'illustration alt text'),
            placement,
            width: requirePositiveInteger(illustration.width, 'illustration width'),
            height: requirePositiveInteger(illustration.height, 'illustration height'),
            ...(typeof illustration.caption === 'string' ? { caption: illustration.caption } : {}),
          };
        })
      : undefined,
  };
}

function parseManifest(value: unknown): StoryLibraryManifest {
  if (!value || typeof value !== 'object') throw new Error('Story Library manifest is invalid.');
  const source = value as Record<string, unknown>;
  if (source.schemaVersion !== 1 || !source.publication || typeof source.publication !== 'object') {
    throw new Error('Story Library manifest has an unsupported schema.');
  }
  const publication = source.publication as Record<string, unknown>;
  if (!['draft', 'published', 'hidden'].includes(String(publication.status))) {
    throw new Error('Story Library manifest has an invalid publication status.');
  }
  if (!Array.isArray(source.chapters) || source.chapters.length === 0) {
    throw new Error('Story Library manifest needs at least one chapter.');
  }

  const id = requireSafeId(source.id, 'story id');
  const cover =
    source.cover === null || source.cover === undefined
      ? null
      : (() => {
          if (typeof source.cover !== 'object') {
            throw new Error('Story Library cover metadata is invalid.');
          }
          const value = source.cover as Record<string, unknown>;
          return {
            path: requireImagePath(value.path, 'cover path'),
            alt: requireString(value.alt, 'cover alt text'),
          };
        })();

  return {
    schemaVersion: 1,
    id,
    title: requireString(source.title, 'story title'),
    description: requireString(source.description, 'story description'),
    author: requireString(source.author, 'story author'),
    cover,
    series: parseSeries(source.series),
    tags: requireStringArray(source.tags, 'story tags'),
    publication: {
      status: String(publication.status) as StoryLibraryManifest['publication']['status'],
    },
    chapters: source.chapters.map((chapter) => parseChapter(chapter, id)),
  };
}

export function parseStoryChapterBlocks(markdown: string): readonly StoryContentBlock[] {
  const markers = [...markdown.matchAll(BLOCK_MARKER)];
  if (markers.length === 0) {
    throw new Error('Story Library chapter has no stable block markers.');
  }

  return markers.map((marker, index) => {
    const id = marker[1];
    const start = (marker.index ?? 0) + marker[0].length;
    const end = markers[index + 1]?.index ?? markdown.length;
    const content = markdown.slice(start, end).trim();
    if (!content) throw new Error(`Story Library block "${id}" is empty.`);
    return { id, markdown: content };
  });
}

export class StoryLibraryService {
  private catalogue: StoryCatalogue | null = null;
  private readonly manifests = new Map<string, StoryLibraryManifest>();

  public constructor(private readonly fetcher: StoryLibraryFetch = defaultFetch) {}

  public async listStories(): Promise<readonly StoryCatalogueEntry[]> {
    if (!this.catalogue) {
      const response = await this.fetcher('/stories/catalogue.json');
      if (!response.ok) {
        throw new Error(`Story Library catalogue request failed with HTTP ${response.status}.`);
      }
      this.catalogue = parseCatalogue(await response.json());
    }
    return this.catalogue.stories;
  }

  public async loadManifest(storyId: string): Promise<StoryLibraryManifest> {
    requireSafeId(storyId, 'story id');
    const cached = this.manifests.get(storyId);
    if (cached) return cached;

    const entry = (await this.listStories()).find((candidate) => candidate.id === storyId);
    if (!entry) throw new Error(`Story Library could not find published story "${storyId}".`);

    const response = await this.fetcher(entry.manifestPath);
    if (!response.ok) {
      throw new Error(`Story Library manifest request failed with HTTP ${response.status}.`);
    }
    const manifest = parseManifest(await response.json());
    if (manifest.id !== storyId) {
      throw new Error(`Story Library manifest id mismatch for "${storyId}".`);
    }
    this.manifests.set(storyId, manifest);
    return manifest;
  }

  public async loadChapter(storyId: string, chapterId: string): Promise<StoryChapterContent> {
    requireSafeId(chapterId, 'chapter id');
    const manifest = await this.loadManifest(storyId);
    const chapter = manifest.chapters.find((candidate) => candidate.id === chapterId);
    if (!chapter) {
      throw new Error(`Story Library could not find chapter "${chapterId}" in "${storyId}".`);
    }

    const response = await this.fetcher(`/stories/${manifest.id}/${chapter.path}`);
    if (!response.ok) {
      throw new Error(`Story Library chapter request failed with HTTP ${response.status}.`);
    }

    return {
      storyId: manifest.id,
      chapterId: chapter.id,
      title: chapter.title,
      blocks: parseStoryChapterBlocks(await response.text()),
    };
  }
}
