export type StoryPublicationStatus = 'draft' | 'published' | 'hidden';
export type StoryReadingMode = 'flowing' | 'paged-picture-book';
export type StoryIllustrationPlacement = 'inline' | 'full-width';
export type StoryRightsStatus = 'original' | 'public-domain' | 'licensed' | 'unknown';

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

export interface StoryDiscoveryMetadata {
  format: string;
  genres: readonly string[];
  audiences: readonly string[];
  length: string;
}

export interface StoryRightsReference {
  status: StoryRightsStatus;
  source: string;
  sourceUrl?: string;
  rightsHolder?: string;
  notes?: string;
}

export interface StoryRightsMetadata {
  text: StoryRightsReference;
  illustrations?: StoryRightsReference | null;
  edition?: StoryRightsReference | null;
  originalPublicationYear?: number | null;
  curatorNotes?: string;
}

export interface StoryRightsSummary {
  text: StoryRightsStatus;
  illustrations: StoryRightsStatus | null;
  edition: StoryRightsStatus | null;
  originalPublicationYear: number | null;
}

export interface StoryLibraryManifest {
  schemaVersion: 1;
  id: string;
  title: string;
  description: string;
  catalogueBlurb?: string;
  author: string;
  readingMode: StoryReadingMode;
  cover?: StoryAssetReference | null;
  series?: StorySeriesReference | null;
  tags: readonly string[];
  discovery: StoryDiscoveryMetadata;
  rights: StoryRightsMetadata;
  publication: {
    status: StoryPublicationStatus;
  };
  chapters: readonly StoryChapterManifest[];
}

export interface StoryCatalogueEntry {
  id: string;
  title: string;
  description: string;
  catalogueBlurb: string;
  author: string;
  readingMode: StoryReadingMode;
  coverPath: string | null;
  coverAlt: string | null;
  series: StorySeriesReference | null;
  tags: readonly string[];
  discovery: StoryDiscoveryMetadata;
  rightsSummary: StoryRightsSummary;
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
