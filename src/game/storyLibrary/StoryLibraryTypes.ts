export type StoryPublicationStatus = 'draft' | 'published' | 'hidden';
export type StoryReadingMode = 'flowing' | 'paged-picture-book' | 'paged-prose';
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

export interface StoryEditionSummary {
  id: string;
  label: string;
}

export interface StoryEditionManifest extends StoryEditionSummary {
  author: string;
  readingMode: StoryReadingMode;
  rights: StoryRightsMetadata;
  chapters: readonly StoryChapterManifest[];
}

export interface StoryLibraryManifest {
  schemaVersion: 1 | 2;
  id: string;
  title: string;
  description: string;
  catalogueBlurb?: string;
  cover?: StoryAssetReference | null;
  series?: StorySeriesReference | null;
  tags: readonly string[];
  discovery: StoryDiscoveryMetadata;
  publication: {
    status: StoryPublicationStatus;
  };

  /**
   * Normalised aliases for the default edition. These preserve the original
   * single-edition reader contract while edition-aware code uses editions.
   */
  author: string;
  readingMode: StoryReadingMode;
  rights: StoryRightsMetadata;
  chapters: readonly StoryChapterManifest[];

  defaultEditionId: string;
  editions: readonly StoryEditionManifest[];
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
  defaultEditionId?: string;
  editions?: readonly StoryEditionSummary[];
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
  editionId: string;
  chapterId: string;
  title: string;
  blocks: readonly StoryContentBlock[];
}
