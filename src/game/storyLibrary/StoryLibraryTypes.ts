export type StoryPublicationStatus = 'draft' | 'published' | 'hidden';
export type StoryIllustrationPlacement = 'inline' | 'full-width';

export interface StoryAssetReference {
  path: string;
  alt: string;
}

export interface StorySeriesReference {
  id: string;
  title: string;
  order: number;
}

export interface StoryIllustrationReference extends StoryAssetReference {
  id: string;
  blockId: string;
  placement: StoryIllustrationPlacement;
  width: number;
  height: number;
  caption?: string;
}

export interface StoryChapterManifest {
  id: string;
  title: string;
  path: string;
  illustrations?: readonly StoryIllustrationReference[];
}

export interface StoryLibraryManifest {
  schemaVersion: 1;
  id: string;
  title: string;
  description: string;
  author: string;
  cover?: StoryAssetReference | null;
  series?: StorySeriesReference | null;
  tags: readonly string[];
  publication: {
    status: StoryPublicationStatus;
  };
  chapters: readonly StoryChapterManifest[];
}

export interface StoryCatalogueEntry {
  id: string;
  title: string;
  description: string;
  author: string;
  coverPath: string | null;
  coverAlt: string | null;
  series: StorySeriesReference | null;
  tags: readonly string[];
  chapterCount: number;
  manifestPath: string;
}

export interface StoryCatalogue {
  schemaVersion: 1;
  stories: readonly StoryCatalogueEntry[];
}

export interface StoryContentBlock {
  id: string;
  markdown: string;
}

export interface StoryChapterContent {
  storyId: string;
  chapterId: string;
  title: string;
  blocks: readonly StoryContentBlock[];
}
