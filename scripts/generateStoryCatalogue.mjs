import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const STORIES_ROOT = path.join(ROOT, 'public', 'stories');
const OUTPUT = path.join(STORIES_ROOT, 'catalogue.json');
const CHECK_ONLY = process.argv.includes('--check');
const STORY_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BLOCK_MARKER = /<!--\s*block:([a-z0-9]+(?:-[a-z0-9]+)*)\s*-->/g;
const RIGHTS_STATUSES = new Set(['original', 'public-domain', 'licensed', 'unknown']);

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function assertString(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Story catalogue rejected ${label}: expected a non-empty string.`);
  }
}

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`Story catalogue rejected ${label}: expected an array of strings.`);
  }
}

function assertOptionalString(value, label) {
  if (value !== undefined && value !== null) {
    assertString(value, label);
  }
}

function assertDiscovery(value, label) {
  if (!value || typeof value !== 'object') {
    throw new Error(`Story catalogue rejected ${label}: expected discovery metadata.`);
  }
  assertString(value.format, `${label} format`);
  assertStringArray(value.genres, `${label} genres`);
  assertStringArray(value.audiences, `${label} audiences`);
  assertString(value.length, `${label} length`);
}

function assertRightsReference(value, label) {
  if (!value || typeof value !== 'object') {
    throw new Error(`Story catalogue rejected ${label}: expected rights metadata.`);
  }
  if (!RIGHTS_STATUSES.has(value.status)) {
    throw new Error(
      `Story catalogue rejected ${label}: status must be original, public-domain, licensed or unknown.`,
    );
  }
  assertString(value.source, `${label} source`);
  assertOptionalString(value.sourceUrl, `${label} source URL`);
  assertOptionalString(value.rightsHolder, `${label} rights holder`);
  assertOptionalString(value.notes, `${label} notes`);
}

function assertRights(value, label) {
  if (!value || typeof value !== 'object') {
    throw new Error(`Story catalogue rejected ${label}: expected rights/provenance metadata.`);
  }
  assertRightsReference(value.text, `${label} text rights`);
  if (value.illustrations !== undefined && value.illustrations !== null) {
    assertRightsReference(value.illustrations, `${label} illustration rights`);
  }
  if (value.edition !== undefined && value.edition !== null) {
    assertRightsReference(value.edition, `${label} edition rights`);
  }
  if (
    value.originalPublicationYear !== undefined &&
    value.originalPublicationYear !== null &&
    (!Number.isInteger(value.originalPublicationYear) ||
      value.originalPublicationYear < 0 ||
      value.originalPublicationYear > 9999)
  ) {
    throw new Error(
      `Story catalogue rejected ${label}: originalPublicationYear must be a four-digit-compatible year.`,
    );
  }
  assertOptionalString(value.curatorNotes, `${label} curator notes`);
}

function assertSafeRelativePath(value, label, extension) {
  assertString(value, label);
  if (
    path.isAbsolute(value) ||
    value.includes('..') ||
    value.includes('\\') ||
    !value.toLowerCase().endsWith(extension)
  ) {
    throw new Error(`Story catalogue rejected ${label}: unsafe or unexpected path "${value}".`);
  }
}

function assertSafeImagePath(value, label) {
  assertString(value, label);
  const lowerPath = value.toLowerCase();
  if (
    path.isAbsolute(value) ||
    value.includes('..') ||
    value.includes('\\') ||
    (!lowerPath.endsWith('.webp') && !lowerPath.endsWith('.avif'))
  ) {
    throw new Error(
      `Story catalogue rejected ${label}: image path must be a safe WebP or AVIF asset.`,
    );
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Story catalogue could not parse ${toPosix(path.relative(ROOT, filePath))}: ${error}`,
    );
  }
}

async function validateChapter(storyDirectory, storyId, chapter, chapterIds, readingMode) {
  if (!chapter || typeof chapter !== 'object') {
    throw new Error(`Story catalogue rejected ${storyId}: chapter must be an object.`);
  }

  assertString(chapter.id, `${storyId} chapter id`);
  if (!STORY_ID.test(chapter.id)) {
    throw new Error(`Story catalogue rejected ${storyId}: invalid chapter id "${chapter.id}".`);
  }
  if (chapterIds.has(chapter.id)) {
    throw new Error(`Story catalogue rejected ${storyId}: duplicate chapter id "${chapter.id}".`);
  }
  chapterIds.add(chapter.id);

  assertString(chapter.title, `${storyId}/${chapter.id} title`);
  assertSafeRelativePath(chapter.path, `${storyId}/${chapter.id} path`, '.md');

  const chapterPath = path.join(storyDirectory, chapter.path);
  const markdown = await fs.readFile(chapterPath, 'utf8');
  const blockIds = new Set();
  const markers = [...markdown.matchAll(BLOCK_MARKER)];
  if (markers.length === 0) {
    throw new Error(
      `Story catalogue rejected ${storyId}/${chapter.id}: chapter needs at least one stable <!-- block:id --> marker.`,
    );
  }
  for (const marker of markers) {
    const blockId = marker[1];
    if (blockIds.has(blockId)) {
      throw new Error(
        `Story catalogue rejected ${storyId}/${chapter.id}: duplicate block id "${blockId}".`,
      );
    }
    blockIds.add(blockId);
  }

  if (readingMode === 'paged-picture-book' && markers.length !== 1) {
    throw new Error(
      `Story catalogue rejected ${storyId}/${chapter.id}: paged picture-book pages need exactly one stable content block.`,
    );
  }

  if (
    readingMode === 'paged-picture-book' &&
    (!Array.isArray(chapter.illustrations) || chapter.illustrations.length !== 1)
  ) {
    throw new Error(
      `Story catalogue rejected ${storyId}/${chapter.id}: paged picture-book pages need exactly one illustration.`,
    );
  }

  if (chapter.illustrations !== undefined) {
    if (!Array.isArray(chapter.illustrations)) {
      throw new Error(
        `Story catalogue rejected ${storyId}/${chapter.id}: illustrations must be an array.`,
      );
    }
    const illustrationIds = new Set();
    for (const illustration of chapter.illustrations) {
      assertString(illustration?.id, `${storyId}/${chapter.id} illustration id`);
      if (illustrationIds.has(illustration.id)) {
        throw new Error(
          `Story catalogue rejected ${storyId}/${chapter.id}: duplicate illustration id "${illustration.id}".`,
        );
      }
      illustrationIds.add(illustration.id);
      if (!STORY_ID.test(illustration.id)) {
        throw new Error(
          `Story catalogue rejected ${storyId}/${chapter.id}: invalid illustration id "${illustration.id}".`,
        );
      }
      assertString(illustration.blockId, `${storyId}/${chapter.id}/${illustration.id} block id`);
      if (!blockIds.has(illustration.blockId)) {
        throw new Error(
          `Story catalogue rejected ${storyId}/${chapter.id}/${illustration.id}: unknown block id "${illustration.blockId}".`,
        );
      }
      assertSafeImagePath(
        illustration.path,
        `${storyId}/${chapter.id}/${illustration.id} illustration path`,
      );
      assertString(illustration.alt, `${storyId}/${chapter.id}/${illustration.id} alt text`);
      if (!['inline', 'full-width'].includes(illustration.placement)) {
        throw new Error(
          `Story catalogue rejected ${storyId}/${chapter.id}/${illustration.id}: placement must be inline or full-width.`,
        );
      }
      if (
        !Number.isInteger(illustration.width) ||
        illustration.width <= 0 ||
        !Number.isInteger(illustration.height) ||
        illustration.height <= 0
      ) {
        throw new Error(
          `Story catalogue rejected ${storyId}/${chapter.id}/${illustration.id}: width and height must be positive integers.`,
        );
      }
      if (illustration.caption !== undefined) {
        assertString(illustration.caption, `${storyId}/${chapter.id}/${illustration.id} caption`);
      }
      await fs.access(path.join(storyDirectory, illustration.path));
    }
  }
}

async function discoverStoryDirectories() {
  let entries = [];
  try {
    entries = await fs.readdir(STORIES_ROOT, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function loadStory(directoryEntry) {
  const directoryName = directoryEntry.name;
  const storyDirectory = path.join(STORIES_ROOT, directoryName);
  const manifestPath = path.join(storyDirectory, 'book.json');
  const manifest = await readJson(manifestPath);

  if (manifest.schemaVersion !== 1) {
    throw new Error(
      `Story catalogue rejected ${directoryName}: unsupported schemaVersion ${String(manifest.schemaVersion)}.`,
    );
  }
  assertString(manifest.id, `${directoryName} id`);
  if (!STORY_ID.test(manifest.id) || manifest.id !== directoryName) {
    throw new Error(
      `Story catalogue rejected ${directoryName}: id must match the folder and use lower-kebab-case.`,
    );
  }
  assertString(manifest.title, `${manifest.id} title`);
  assertString(manifest.description, `${manifest.id} description`);
  assertString(manifest.author, `${manifest.id} author`);
  assertStringArray(manifest.tags, `${manifest.id} tags`);
  assertDiscovery(manifest.discovery, `${manifest.id} discovery`);
  assertRights(manifest.rights, `${manifest.id} rights`);

  const readingMode = manifest.readingMode ?? 'flowing';
  if (!['flowing', 'paged-picture-book'].includes(readingMode)) {
    throw new Error(
      `Story catalogue rejected ${manifest.id}: readingMode must be flowing or paged-picture-book.`,
    );
  }

  if (
    !manifest.publication ||
    !['draft', 'published', 'hidden'].includes(manifest.publication.status)
  ) {
    throw new Error(
      `Story catalogue rejected ${manifest.id}: publication.status must be draft, published or hidden.`,
    );
  }

  if (manifest.cover !== undefined && manifest.cover !== null) {
    assertSafeImagePath(manifest.cover.path, `${manifest.id} cover path`);
    assertString(manifest.cover.alt, `${manifest.id} cover alt text`);
    await fs.access(path.join(storyDirectory, manifest.cover.path));
  }

  if (manifest.series !== undefined && manifest.series !== null) {
    assertString(manifest.series.id, `${manifest.id} series id`);
    assertString(manifest.series.title, `${manifest.id} series title`);
    if (!Number.isFinite(manifest.series.order)) {
      throw new Error(`Story catalogue rejected ${manifest.id}: series.order must be numeric.`);
    }
  }

  if (!Array.isArray(manifest.chapters) || manifest.chapters.length === 0) {
    throw new Error(`Story catalogue rejected ${manifest.id}: at least one chapter is required.`);
  }

  const chapterIds = new Set();
  for (const chapter of manifest.chapters) {
    await validateChapter(storyDirectory, manifest.id, chapter, chapterIds, readingMode);
  }

  return manifest;
}

function catalogueEntry(manifest) {
  return {
    id: manifest.id,
    title: manifest.title,
    description: manifest.description,
    author: manifest.author,
    readingMode: manifest.readingMode ?? 'flowing',
    coverPath: manifest.cover ? `/stories/${manifest.id}/${manifest.cover.path}` : null,
    coverAlt: manifest.cover?.alt ?? null,
    series: manifest.series ?? null,
    tags: manifest.tags,
    discovery: manifest.discovery,
    rightsSummary: {
      text: manifest.rights.text.status,
      illustrations: manifest.rights.illustrations?.status ?? null,
      edition: manifest.rights.edition?.status ?? null,
      originalPublicationYear: manifest.rights.originalPublicationYear ?? null,
    },
    chapterCount: manifest.chapters.length,
    manifestPath: `/stories/${manifest.id}/book.json`,
  };
}

const directories = await discoverStoryDirectories();
const manifests = [];
const storyIds = new Set();
for (const directory of directories) {
  const manifest = await loadStory(directory);
  if (storyIds.has(manifest.id)) {
    throw new Error(`Duplicate story id: ${manifest.id}`);
  }
  storyIds.add(manifest.id);
  manifests.push(manifest);
}

const stories = manifests
  .filter((manifest) => manifest.publication.status === 'published')
  .map(catalogueEntry)
  .sort((left, right) => left.title.localeCompare(right.title));

const expected = `${JSON.stringify({ schemaVersion: 1, stories }, null, 2)}\n`;
if (CHECK_ONLY) {
  let current = '';
  try {
    current = await fs.readFile(OUTPUT, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  if (current !== expected) {
    console.error('Story catalogue is stale. Run npm run story:catalogue and commit the result.');
    process.exitCode = 1;
  }
} else {
  await fs.mkdir(STORIES_ROOT, { recursive: true });
  await fs.writeFile(OUTPUT, expected, 'utf8');
  console.log(
    `Story catalogue generated: ${stories.length} published stor${stories.length === 1 ? 'y' : 'ies'}.`,
  );
}
