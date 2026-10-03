import { StoryHouseService } from '../discovery/StoryHouseService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  collectStoryDiscoveryOptions,
  filterStoryCatalogue,
  storyDiscoveryBadges,
  type StoryLibraryDiscoveryFilters,
} from './StoryLibraryDiscovery';
import {
  buildStoryLibraryShelves,
  calculateStoryLibraryStats,
  storiesForLibraryShelf,
  type StoryLibraryShelfId,
} from './StoryLibraryExperience';
import { StoryLibraryService } from './StoryLibraryService';
import { StoryReadingService } from './StoryReadingService';
import type {
  StoryChapterContent,
  StoryContentBlock,
  StoryEditionManifest,
  StoryIllustrationReference,
  StoryIllustrationSetManifest,
  StoryLibraryManifest,
} from './StoryLibraryTypes';

export interface StoryReaderOverlayOptions {
  onClose: () => void;
  initialFilters?: Partial<
    Pick<StoryLibraryDiscoveryFilters, 'format' | 'genre' | 'audience' | 'length'>
  >;
  initialShelf?: StoryLibraryShelfId;
}

const MIN_FONT_SIZE = 16;
const MAX_FONT_SIZE = 28;
const DEFAULT_FONT_SIZE = 20;
const MIN_LINE_HEIGHT = 1.4;
const MAX_LINE_HEIGHT = 2;
const DEFAULT_LINE_HEIGHT = 1.7;

function button(label: string, className: string, onPress: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = className;
  element.textContent = label;
  element.addEventListener('click', onPress);
  return element;
}

function appendInlineMarkdown(parent: HTMLElement, source: string): void {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let cursor = 0;

  for (const match of source.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) {
      parent.append(document.createTextNode(source.slice(cursor, index)));
    }

    const token = match[0];
    if (token.startsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = token.slice(2, -2);
      parent.append(strong);
    } else {
      const emphasis = document.createElement('em');
      emphasis.textContent = token.slice(1, -1);
      parent.append(emphasis);
    }
    cursor = index + token.length;
  }

  if (cursor < source.length) {
    parent.append(document.createTextNode(source.slice(cursor)));
  }
}

function appendParagraph(parent: HTMLElement, lines: readonly string[]): void {
  if (lines.length === 0) {
    return;
  }
  const paragraph = document.createElement('p');
  appendInlineMarkdown(paragraph, lines.join(' '));
  parent.append(paragraph);
}

function renderMarkdownBlock(block: StoryContentBlock): HTMLElement {
  const section = document.createElement('section');
  section.className = 'story-reader-block';
  section.dataset.storyBlockId = block.id;

  const lines = block.markdown.replace(/\r/g, '').split('\n');
  let paragraphLines: string[] = [];
  const flushParagraph = () => {
    appendParagraph(section, paragraphLines);
    paragraphLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      const level = Math.min(4, heading[1].length + 1);
      const headingElement = document.createElement(`h${level}`);
      appendInlineMarkdown(headingElement, heading[2]);
      section.append(headingElement);
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph();
      section.append(document.createElement('hr'));
      continue;
    }

    if (line.startsWith('> ')) {
      flushParagraph();
      const quote = document.createElement('blockquote');
      appendInlineMarkdown(quote, line.slice(2));
      section.append(quote);
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return section;
}

function renderStoryIllustration(
  storyId: string,
  illustration: StoryIllustrationReference,
): HTMLElement {
  const figure = document.createElement('figure');
  figure.className = `story-reader-illustration is-${illustration.placement}`;
  figure.dataset.storyIllustrationId = illustration.id;

  const image = document.createElement('img');
  image.src = `/stories/${storyId}/${illustration.path}`;
  image.alt = illustration.alt;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.draggable = false;
  image.width = illustration.width;
  image.height = illustration.height;
  figure.append(image);

  if (illustration.caption) {
    const caption = document.createElement('figcaption');
    caption.textContent = illustration.caption;
    figure.append(caption);
  }

  return figure;
}

function chapterLabel(edition: StoryEditionManifest, index: number): string {
  const noun = edition.readingMode === 'flowing' ? 'Chapter' : 'Page';
  return `${noun} ${index + 1} of ${edition.chapters.length}`;
}

export class StoryReaderOverlay {
  private readonly library = new StoryLibraryService();
  private readonly reading = new StoryReadingService(getBrowserSaveService());
  private readonly storyHouse = new StoryHouseService(getBrowserSaveService());
  private root: HTMLDivElement | null = null;
  private manifest: StoryLibraryManifest | null = null;
  private activeEditionId: string | null = null;
  private activeIllustrationSetId: string | null = null;
  private requestVersion = 0;
  private fontSize = DEFAULT_FONT_SIZE;
  private lineHeight = DEFAULT_LINE_HEIGHT;
  private closed = false;
  private progressTimer: number | null = null;
  private currentChapter: {
    manifest: StoryLibraryManifest;
    edition: StoryEditionManifest;
    chapter: StoryChapterContent;
    index: number;
    scroller: HTMLElement;
  } | null = null;

  public constructor(private readonly options: StoryReaderOverlayOptions) {
    const preferences = this.reading.getPreferences();
    this.fontSize = preferences.fontSize;
    this.lineHeight = preferences.lineHeight;
  }

  public mount(): void {
    if (this.root || this.closed) {
      return;
    }

    const root = document.createElement('div');
    root.className = 'story-reader-overlay';
    root.dataset.storyReaderOverlay = 'true';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Story House Library');
    this.root = root;
    document.body.append(root);
    globalThis.addEventListener('keydown', this.onKeyDown, true);
    void this.showCatalogue();
  }

  public destroy(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    this.persistCurrentPosition();
    this.clearProgressTimer();
    this.requestVersion += 1;
    globalThis.removeEventListener('keydown', this.onKeyDown, true);
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement && this.root?.contains(activeElement)) {
      activeElement.blur();
    }
    this.root?.remove();
    this.root = null;
    this.options.onClose();
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.destroy();
  };

  private async showCatalogue(): Promise<void> {
    const root = this.root;
    if (!root) return;

    this.persistCurrentPosition();
    this.clearProgressTimer();
    this.currentChapter = null;
    const request = ++this.requestVersion;
    this.manifest = null;
    this.activeEditionId = null;
    this.activeIllustrationSetId = null;
    root.replaceChildren(this.createLoading('Opening the Story House shelves…'));

    try {
      const stories = await this.library.listStories();
      if (!this.root || request !== this.requestVersion) return;

      const shell = document.createElement('div');
      shell.className = 'story-library-shell';

      const header = document.createElement('header');
      header.className = 'story-library-header';
      const headingWrap = document.createElement('div');
      const eyebrow = document.createElement('p');
      eyebrow.className = 'story-reader-eyebrow';
      eyebrow.textContent = 'SUNBEAM VILLAGE';
      const heading = document.createElement('h1');
      heading.textContent = 'Story House Library';
      const intro = document.createElement('p');
      intro.className = 'story-library-intro';
      intro.textContent =
        'Choose a book from Quill’s shelves and settle in for as long as you like.';
      headingWrap.append(eyebrow, heading, intro);
      const close = button('Close ✕', 'story-reader-close', () => this.destroy());
      close.setAttribute('aria-label', 'Close Story House Library');
      header.append(headingWrap, close);

      const controls = document.createElement('section');
      controls.className = 'story-library-controls';
      controls.setAttribute('aria-label', 'Find a book');

      const options = collectStoryDiscoveryOptions(stories);
      const initialFilters = this.options.initialFilters ?? {};
      const filters: StoryLibraryDiscoveryFilters = {
        query: '',
        format:
          initialFilters.format && options.formats.includes(initialFilters.format)
            ? initialFilters.format
            : null,
        genre:
          initialFilters.genre && options.genres.includes(initialFilters.genre)
            ? initialFilters.genre
            : null,
        audience:
          initialFilters.audience && options.audiences.includes(initialFilters.audience)
            ? initialFilters.audience
            : null,
        length:
          initialFilters.length && options.lengths.includes(initialFilters.length)
            ? initialFilters.length
            : null,
      };
      let activeShelf: StoryLibraryShelfId = this.options.initialShelf ?? 'all';
      let coverStyle = this.reading.getPreferences().coverStyle ?? 'modern';

      const searchWrap = document.createElement('label');
      searchWrap.className = 'story-library-search';
      searchWrap.id = 'story-library-search-panel';
      searchWrap.hidden = true;
      const searchLabel = document.createElement('span');
      searchLabel.textContent = 'Search';
      const searchInput = document.createElement('input');
      searchInput.type = 'search';
      searchInput.placeholder = 'Title, author, series or category…';
      searchInput.autocomplete = 'off';
      searchInput.setAttribute('aria-label', 'Search Story House books');
      searchWrap.append(searchLabel, searchInput);

      const filterWrap = document.createElement('div');
      filterWrap.className = 'story-library-filters';
      filterWrap.id = 'story-library-filter-panel';
      filterWrap.hidden =
        filters.format === null &&
        filters.genre === null &&
        filters.audience === null &&
        filters.length === null;

      const controlToggles = document.createElement('div');
      controlToggles.className = 'story-library-control-toggles';
      const searchToggle = button('🔎 Search', 'story-library-control-toggle', () => {
        const expanded = searchWrap.hidden !== false;
        searchWrap.hidden = !expanded;
        searchToggle.setAttribute('aria-expanded', String(expanded));
        searchToggle.classList.toggle('is-active', expanded);
        if (expanded) {
          searchInput.focus();
        }
      });
      searchToggle.setAttribute('aria-controls', searchWrap.id);
      searchToggle.setAttribute('aria-expanded', 'false');

      const filterToggle = button('☷ Filters', 'story-library-control-toggle', () => {
        const expanded = filterWrap.hidden !== false;
        filterWrap.hidden = !expanded;
        filterToggle.setAttribute('aria-expanded', String(expanded));
        filterToggle.classList.toggle('is-active', expanded);
      });
      filterToggle.setAttribute('aria-controls', filterWrap.id);
      filterToggle.setAttribute('aria-expanded', String(!filterWrap.hidden));
      filterToggle.classList.toggle('is-active', !filterWrap.hidden);
      controlToggles.append(searchToggle, filterToggle);

      const selects: HTMLSelectElement[] = [];
      const addFilter = (
        label: string,
        key: 'format' | 'genre' | 'audience' | 'length',
        values: readonly string[],
      ): void => {
        if (values.length === 0) return;
        const control = document.createElement('label');
        control.className = 'story-library-filter';
        const caption = document.createElement('span');
        caption.textContent = label;
        const select = document.createElement('select');
        select.setAttribute('aria-label', `Filter books by ${label.toLowerCase()}`);
        const all = document.createElement('option');
        all.value = '';
        all.textContent = `All ${label.toLowerCase()}`;
        select.append(all);
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          select.append(option);
        }
        select.value = filters[key] ?? '';
        select.addEventListener('change', () => {
          filters[key] = select.value || null;
          renderShelf();
        });
        control.append(caption, select);
        selects.push(select);
        filterWrap.append(control);
      };

      addFilter('Formats', 'format', options.formats);
      addFilter('Genres', 'genre', options.genres);
      addFilter('Reading', 'audience', options.audiences);
      addFilter('Lengths', 'length', options.lengths);

      const clearFilters = button('Clear', 'story-library-clear', () => {
        filters.query = '';
        filters.format = null;
        filters.genre = null;
        filters.audience = null;
        filters.length = null;
        activeShelf = 'all';
        searchInput.value = '';
        for (const select of selects) select.value = '';
        renderShelf();
        if (!searchWrap.hidden) {
          searchInput.focus();
        }
      });
      filterWrap.append(clearFilters);
      controls.append(controlToggles, searchWrap, filterWrap);

      const shelf = document.createElement('main');
      shelf.className = 'story-library-shelf';
      shelf.setAttribute('aria-label', 'Story collection');

      const progressByStoryId = new Map(
        stories.flatMap((story) => {
          const editionIds = story.editions?.map(({ id }) => id) ?? ['default'];
          const defaultEditionId = story.defaultEditionId ?? editionIds[0] ?? 'default';
          const latest = this.reading.getLatestProgressForStory(
            story.id,
            editionIds,
            defaultEditionId,
          );
          return latest ? [[story.id, latest.progress] as const] : [];
        }),
      );
      const shelfDefinitions = buildStoryLibraryShelves(stories, progressByStoryId);
      if (!shelfDefinitions.some(({ id }) => id === activeShelf)) {
        activeShelf = 'all';
      }
      const stats = calculateStoryLibraryStats(stories, progressByStoryId);

      const shelfTabs = document.createElement('nav');
      shelfTabs.className = 'story-library-shelf-tabs';
      shelfTabs.id = 'story-library-category-panel';
      shelfTabs.hidden = true;
      shelfTabs.setAttribute('aria-label', 'Story House categories');

      let categoryToggle: HTMLButtonElement | null = null;
      const setCategoriesExpanded = (expanded: boolean): void => {
        shelfTabs.hidden = !expanded;
        categoryToggle?.setAttribute('aria-expanded', String(expanded));
        categoryToggle?.classList.toggle('is-active', expanded);
      };

      const shelfButtons = new Map<StoryLibraryShelfId, HTMLButtonElement>();
      for (const shelfDefinition of shelfDefinitions) {
        const shelfButton = document.createElement('button');
        shelfButton.type = 'button';
        shelfButton.className = 'story-library-shelf-tab';
        shelfButton.textContent = `${shelfDefinition.label} (${shelfDefinition.count})`;
        shelfButton.addEventListener('click', () => {
          activeShelf = shelfDefinition.id;
          setCategoriesExpanded(false);
          renderShelf();
        });
        shelfButtons.set(shelfDefinition.id, shelfButton);
        shelfTabs.append(shelfButton);
      }

      categoryToggle = button('▦ Categories', 'story-library-control-toggle', () => {
        setCategoriesExpanded(shelfTabs.hidden !== false);
      });
      categoryToggle.setAttribute('aria-controls', shelfTabs.id);
      categoryToggle.setAttribute('aria-expanded', 'false');

      const coverToggle = button('', 'story-library-control-toggle story-library-cover-toggle', () => {
        coverStyle = coverStyle === 'modern' ? 'classic' : 'modern';
        this.reading.updatePreferences({ coverStyle });
        updateCoverToggle();
        renderShelf();
      });
      coverToggle.setAttribute('aria-label', 'Switch between classic and modern book covers');
      const updateCoverToggle = (): void => {
        const modern = coverStyle === 'modern';
        coverToggle.textContent = modern ? '▣ Covers: Modern' : '▣ Covers: Classic';
        coverToggle.classList.toggle('is-active', modern);
        coverToggle.setAttribute('aria-pressed', String(modern));
      };
      updateCoverToggle();
      controlToggles.append(categoryToggle, coverToggle);
      controls.append(shelfTabs);

      const statsPanel = document.createElement('section');
      statsPanel.className = 'story-library-stats';
      statsPanel.setAttribute('aria-label', 'Library reading progress');
      for (const [label, value] of [
        ['Started', `${stats.started} / ${stories.length}`],
        ['Completed', String(stats.completed)],
        ['Collection', `${stats.catalogueCompletionPercent}%`],
      ] as const) {
        const stat = document.createElement('span');
        const statValue = document.createElement('strong');
        statValue.textContent = value;
        const statLabel = document.createElement('small');
        statLabel.textContent = label;
        stat.append(statValue, statLabel);
        statsPanel.append(stat);
      }

      const footer = document.createElement('footer');
      footer.className = 'story-library-footer';

      const progressEntries = stories
        .map((story) => ({ story, progress: progressByStoryId.get(story.id) ?? null }))
        .filter(({ progress }) => progress !== null);
      const mostRecent = [...progressEntries]
        .filter(({ progress }) => !progress?.completed)
        .sort((left, right) =>
          String(right.progress?.lastReadAt).localeCompare(String(left.progress?.lastReadAt)),
        )[0];

      if (mostRecent?.progress) {
        const continueButton = button(
          `▶ Continue · ${mostRecent.story.title} · ${Math.round(mostRecent.progress.percentComplete)}%`,
          'story-library-control-toggle story-library-continue-toggle',
          () => {
            void this.openStory(mostRecent.story.id);
          },
        );
        controlToggles.append(continueButton);
      }

      const valleyCards = this.storyHouse.listCards().filter(({ unlocked }) => unlocked);
      if (valleyCards.length > 0) {
        const storyCardsPanel = document.createElement('section');
        storyCardsPanel.className = 'story-library-valley-cards';
        storyCardsPanel.id = 'story-library-story-cards-panel';
        storyCardsPanel.hidden = true;

        const storyCardsToggle = button(
          `✦ Story Cards (${valleyCards.length})`,
          'story-library-control-toggle',
          () => {
            const expanded = storyCardsPanel.hidden !== false;
            storyCardsPanel.hidden = !expanded;
            storyCardsToggle.setAttribute('aria-expanded', String(expanded));
            storyCardsToggle.classList.toggle('is-active', expanded);
          },
        );
        storyCardsToggle.setAttribute('aria-controls', storyCardsPanel.id);
        storyCardsToggle.setAttribute('aria-expanded', 'false');
        controlToggles.append(storyCardsToggle);

        const collectionHeading = document.createElement('div');
        collectionHeading.className = 'story-library-valley-heading';
        const collectionTitle = document.createElement('h2');
        collectionTitle.textContent = 'Valley Story Cards';
        const collectionCopy = document.createElement('p');
        collectionCopy.textContent =
          'Small memories gathered from adventures you have already had around the valley.';
        collectionHeading.append(collectionTitle, collectionCopy);

        const cardList = document.createElement('div');
        cardList.className = 'story-library-valley-card-list';
        const cardDetail = document.createElement('div');
        cardDetail.className = 'story-library-valley-detail';
        cardDetail.textContent = 'Choose a card to read it here on Quill’s table.';

        for (const storyCard of valleyCards) {
          const cardButton = document.createElement('button');
          cardButton.type = 'button';
          cardButton.className = 'story-library-valley-card';
          cardButton.classList.toggle('is-read', storyCard.read);
          const icon = document.createElement('span');
          icon.textContent = storyCard.icon;
          const cardCopy = document.createElement('span');
          const cardTitle = document.createElement('strong');
          cardTitle.textContent = storyCard.title;
          const cardState = document.createElement('small');
          cardState.textContent = storyCard.read ? 'Read again' : 'New story';
          cardCopy.append(cardTitle, cardState);
          cardButton.append(icon, cardCopy);
          cardButton.addEventListener('click', () => {
            const readCard = this.storyHouse.readCard(storyCard.id);
            if (!readCard) return;
            cardButton.classList.add('is-read');
            cardState.textContent = 'Read again';
            cardDetail.replaceChildren();
            const detailTitle = document.createElement('strong');
            detailTitle.textContent = `${readCard.icon} ${readCard.title}`;
            const detailCopy = document.createElement('p');
            detailCopy.textContent = readCard.text;
            cardDetail.append(detailTitle, detailCopy);
          });
          cardList.append(cardButton);
        }

        storyCardsPanel.append(collectionHeading, cardList, cardDetail);
        controls.append(storyCardsPanel);
      }

      const renderShelf = (): void => {
        const shelfStories = storiesForLibraryShelf(stories, activeShelf, progressByStoryId);
        const visibleStories = filterStoryCatalogue(shelfStories, filters);
        shelf.replaceChildren();

        const hasFacetFilters =
          filters.query.trim().length > 0 ||
          filters.format !== null ||
          filters.genre !== null ||
          filters.audience !== null ||
          filters.length !== null;
        const hasActiveFilters = hasFacetFilters || activeShelf !== 'all';
        clearFilters.disabled = !hasActiveFilters;
        const activeFilterCount = [
          filters.format,
          filters.genre,
          filters.audience,
          filters.length,
        ].filter((value) => value !== null).length;
        searchToggle.textContent = filters.query.trim().length > 0 ? '🔎 Search •' : '🔎 Search';
        filterToggle.textContent =
          activeFilterCount > 0 ? `☷ Filters (${activeFilterCount})` : '☷ Filters';

        for (const [shelfId, shelfButton] of shelfButtons) {
          const selected = shelfId === activeShelf;
          shelfButton.classList.toggle('is-active', selected);
          shelfButton.setAttribute('aria-current', selected ? 'page' : 'false');
        }
        const activeShelfLabel =
          shelfDefinitions.find(({ id }) => id === activeShelf)?.label ?? 'Categories';
        if (categoryToggle) {
          categoryToggle.textContent =
            activeShelf === 'all' ? '▦ Categories' : `▦ ${activeShelfLabel}`;
        }

        for (const story of visibleStories) {
          const card = document.createElement('button');
          card.type = 'button';
          card.className = 'story-library-book';
          card.dataset.storyId = story.id;
          card.addEventListener('click', () => {
            void this.openStory(story.id);
          });

          const cover = document.createElement('span');
          cover.className = 'story-library-cover';
          const preferredCover =
            story.coverSets.find(({ id }) => id === coverStyle) ??
            story.coverSets.find(({ id }) => id === 'classic') ??
            story.coverSets[0] ??
            null;
          const selectedCoverPath = preferredCover?.coverPath ?? story.coverPath;
          const selectedCoverAlt = preferredCover?.coverAlt ?? story.coverAlt ?? '';
          const selectedCoverStyle = preferredCover?.id ?? 'classic';
          cover.dataset.coverStyle = selectedCoverStyle;
          if (selectedCoverPath) {
            const image = document.createElement('img');
            image.src = selectedCoverPath;
            image.alt = selectedCoverAlt;
            image.loading = 'lazy';
            cover.append(image);
            if (selectedCoverStyle === 'modern') {
              const coverTitle = document.createElement('span');
              coverTitle.className = 'story-library-cover-title';
              coverTitle.textContent = story.title;
              cover.append(coverTitle);
            }
          } else {
            const sparkle = document.createElement('span');
            sparkle.className = 'story-library-cover-sparkle';
            sparkle.textContent = '✦';
            const bookIcon = document.createElement('span');
            bookIcon.className = 'story-library-cover-icon';
            bookIcon.textContent = '📖';
            cover.append(sparkle, bookIcon);
          }

          const copy = document.createElement('span');
          copy.className = 'story-library-book-copy';
          const title = document.createElement('strong');
          title.textContent = story.title;
          const author = document.createElement('span');
          author.className = 'story-library-author';
          author.textContent = `by ${story.author}`;

          const badges = document.createElement('span');
          badges.className = 'story-library-badges';
          for (const label of storyDiscoveryBadges(story)) {
            const badge = document.createElement('span');
            badge.textContent = label;
            badges.append(badge);
          }

          const description = document.createElement('span');
          description.className = 'story-library-description';
          description.textContent = story.catalogueBlurb;
          const meta = document.createElement('span');
          meta.className = 'story-library-meta';
          const progress = progressByStoryId.get(story.id) ?? null;
          if (progress?.completed) {
            card.classList.add('is-completed');
            meta.textContent = 'Completed ✓ · Read again';
          } else if (progress) {
            card.classList.add('is-in-progress');
            meta.textContent = `${Math.round(progress.percentComplete)}% · Continue reading`;
          } else {
            meta.textContent =
              story.readingMode === 'paged-picture-book'
                ? `${story.chapterCount} pages · Read`
                : `${story.chapterCount} chapter${story.chapterCount === 1 ? '' : 's'} · Read`;
          }
          copy.append(title, author, badges, description);

          card.append(cover, copy, meta);
          shelf.append(card);
        }

        if (visibleStories.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'story-library-empty';
          const emptyTitle = document.createElement('strong');
          emptyTitle.textContent = 'No books on that shelf yet';
          const emptyCopy = document.createElement('span');
          emptyCopy.textContent = 'Try another search or clear a filter.';
          empty.append(emptyTitle, emptyCopy);
          shelf.append(empty);
        }

        footer.textContent = `${visibleStories.length} shown · ${stats.started} started · ${stats.completed} completed · ${stories.length} in the library`;
      };

      searchInput.addEventListener('input', () => {
        filters.query = searchInput.value;
        renderShelf();
      });

      shell.append(header, controls, statsPanel, shelf, footer);
      renderShelf();
      this.root.replaceChildren(shell);
      close.focus({ preventScroll: true });
    } catch {
      if (!this.root || request !== this.requestVersion) return;
      this.root.replaceChildren(
        this.createError('The shelves would not open just now.', () => void this.showCatalogue()),
      );
    }
  }

  private editionFor(
    manifest: StoryLibraryManifest,
    editionId: string | null = this.activeEditionId,
  ): StoryEditionManifest {
    const edition =
      manifest.editions.find((candidate) => candidate.id === editionId) ??
      manifest.editions.find((candidate) => candidate.id === manifest.defaultEditionId) ??
      manifest.editions[0];
    if (!edition) {
      throw new Error(`Story Library manifest "${manifest.id}" has no readable editions.`);
    }
    return edition;
  }

  private illustrationSetFor(
    edition: StoryEditionManifest,
    illustrationSetId: string | null = this.activeIllustrationSetId,
  ): StoryIllustrationSetManifest | null {
    return (
      edition.illustrationSets.find((candidate) => candidate.id === illustrationSetId) ??
      edition.illustrationSets.find(
        (candidate) => candidate.id === edition.defaultIllustrationSetId,
      ) ??
      edition.illustrationSets[0] ??
      null
    );
  }

  private selectIllustrationSetFor(
    manifest: StoryLibraryManifest,
    edition: StoryEditionManifest,
  ): void {
    const preferredId = this.reading.getIllustrationSetPreference(
      manifest.id,
      edition.id,
      manifest.defaultEditionId,
    );
    const preferred = preferredId
      ? edition.illustrationSets.find((candidate) => candidate.id === preferredId)
      : undefined;
    this.activeIllustrationSetId =
      preferred?.id ??
      this.illustrationSetFor(edition, edition.defaultIllustrationSetId)?.id ??
      null;
  }

  private illustrationsForChapter(
    edition: StoryEditionManifest,
    chapterId: string,
  ): readonly StoryIllustrationReference[] {
    const illustrationSet = this.illustrationSetFor(edition);
    return (
      illustrationSet?.chapters.find((chapter) => chapter.chapterId === chapterId)?.illustrations ??
      []
    );
  }

  private async openStory(storyId: string): Promise<void> {
    const root = this.root;
    if (!root) return;
    const request = ++this.requestVersion;
    root.replaceChildren(this.createLoading('Taking the book down from the shelf…'));

    try {
      const manifest = await this.library.loadManifest(storyId);
      if (!this.root || request !== this.requestVersion) return;
      this.manifest = manifest;

      const latest = this.reading.getLatestProgressForStory(
        storyId,
        manifest.editions.map(({ id }) => id),
        manifest.defaultEditionId,
      );
      const edition = this.editionFor(manifest, latest?.editionId ?? manifest.defaultEditionId);
      this.activeEditionId = edition.id;
      this.selectIllustrationSetFor(manifest, edition);
      const progress =
        latest?.editionId === edition.id
          ? latest.progress
          : this.reading.getProgress(storyId, edition.id, manifest.defaultEditionId);

      const savedChapterIndex =
        progress && !progress.completed
          ? edition.chapters.findIndex((chapter) => chapter.id === progress.chapterId)
          : -1;
      const chapterIndex =
        savedChapterIndex >= 0
          ? savedChapterIndex
          : progress && !progress.completed
            ? Math.min(
                edition.chapters.length - 1,
                Math.floor((progress.percentComplete / 100) * edition.chapters.length),
              )
            : 0;
      await this.showChapter(chapterIndex, progress && !progress.completed ? progress : null);
    } catch {
      if (!this.root || request !== this.requestVersion) return;
      this.root.replaceChildren(
        this.createError(
          'Quill could not open that book just now.',
          () => void this.showCatalogue(),
        ),
      );
    }
  }

  private async switchEdition(editionId: string): Promise<void> {
    const manifest = this.manifest;
    if (!manifest || editionId === this.activeEditionId) return;

    const edition = this.editionFor(manifest, editionId);
    this.persistCurrentPosition();
    this.activeEditionId = edition.id;
    this.selectIllustrationSetFor(manifest, edition);

    const progress = this.reading.getProgress(manifest.id, edition.id, manifest.defaultEditionId);
    const savedChapterIndex =
      progress && !progress.completed
        ? edition.chapters.findIndex((chapter) => chapter.id === progress.chapterId)
        : -1;
    const chapterIndex =
      savedChapterIndex >= 0
        ? savedChapterIndex
        : progress && !progress.completed
          ? Math.min(
              edition.chapters.length - 1,
              Math.floor((progress.percentComplete / 100) * edition.chapters.length),
            )
          : 0;

    await this.showChapter(chapterIndex, progress && !progress.completed ? progress : null);
  }

  private async switchIllustrationSet(illustrationSetId: string): Promise<void> {
    const manifest = this.manifest;
    if (!manifest || illustrationSetId === this.activeIllustrationSetId) return;

    const edition = this.editionFor(manifest);
    if (!edition.illustrationSets.some((candidate) => candidate.id === illustrationSetId)) {
      return;
    }

    const chapterIndex = this.currentChapter?.index ?? 0;
    this.persistCurrentPosition();
    this.activeIllustrationSetId = illustrationSetId;
    this.reading.updateIllustrationSetPreference(
      manifest.id,
      edition.id,
      manifest.defaultEditionId,
      illustrationSetId,
    );

    const progress = this.reading.getProgress(manifest.id, edition.id, manifest.defaultEditionId);
    await this.showChapter(chapterIndex, progress && !progress.completed ? progress : null);
  }

  private async showChapter(
    index: number,
    resume: ReturnType<StoryReadingService['getProgress']> = null,
  ): Promise<void> {
    const root = this.root;
    const manifest = this.manifest;
    if (!root || !manifest) return;

    const edition = this.editionFor(manifest);
    const chapter = edition.chapters[index];
    if (!chapter) return;

    const request = ++this.requestVersion;
    root.replaceChildren(this.createLoading(`Opening “${chapter.title}”…`));

    try {
      const content = await this.library.loadChapter(manifest.id, chapter.id, edition.id);
      if (!this.root || request !== this.requestVersion) return;
      this.renderReader(manifest, edition, content, index, resume);
    } catch {
      if (!this.root || request !== this.requestVersion) return;
      this.root.replaceChildren(
        this.createError('That chapter would not open just now.', () => void this.showCatalogue()),
      );
    }
  }

  private renderReader(
    manifest: StoryLibraryManifest,
    edition: StoryEditionManifest,
    chapter: StoryChapterContent,
    index: number,
    resume: ReturnType<StoryReadingService['getProgress']>,
  ): void {
    const root = this.root;
    if (!root) return;

    const shell = document.createElement('div');
    shell.className = 'story-reader-shell';
    if (manifest.editions.length > 1) {
      shell.classList.add('has-multiple-editions');
    }
    if (edition.illustrationSets.length > 1) {
      shell.classList.add('has-multiple-illustration-sets');
    }
    const isPictureBook = edition.readingMode === 'paged-picture-book';
    const isPagedEdition = edition.readingMode !== 'flowing';
    if (isPictureBook) {
      shell.classList.add('is-picture-book');
    }
    this.applyReadingPreferences(shell);

    const topbar = document.createElement('header');
    topbar.className = 'story-reader-topbar';
    const back = button('← Library', 'story-reader-back', () => {
      this.persistCurrentPosition();
      void this.showCatalogue();
    });
    const titleWrap = document.createElement('div');
    titleWrap.className = 'story-reader-title-wrap';
    const bookTitle = document.createElement('strong');
    bookTitle.textContent = manifest.title;
    const chapterProgress = document.createElement('span');
    chapterProgress.textContent =
      manifest.editions.length > 1
        ? `${edition.label} · ${chapterLabel(edition, index)}`
        : chapterLabel(edition, index);
    titleWrap.append(bookTitle, chapterProgress);
    const close = button('Close ✕', 'story-reader-close', () => this.destroy());
    topbar.append(back, titleWrap, close);

    const toolbar = document.createElement('div');
    toolbar.className = 'story-reader-toolbar';
    toolbar.setAttribute('role', 'toolbar');
    toolbar.setAttribute('aria-label', 'Reading controls');

    if (manifest.editions.length > 1) {
      const textSwitch = document.createElement('span');
      textSwitch.className = 'story-reader-control-group story-reader-text-switch';
      const editionLabel = document.createElement('span');
      editionLabel.className = 'story-reader-edition-label';
      editionLabel.textContent = 'Text';
      textSwitch.append(editionLabel);

      for (const candidate of manifest.editions) {
        const displayLabel =
          candidate.id === 'story-house'
            ? 'Modern'
            : candidate.id === 'full-classic'
              ? 'Classic'
              : candidate.label;
        const editionButton = button(displayLabel, 'story-reader-edition-button', () => {
          void this.switchEdition(candidate.id);
        });
        const active = candidate.id === edition.id;
        editionButton.classList.toggle('is-active', active);
        editionButton.setAttribute('aria-pressed', String(active));
        textSwitch.append(editionButton);
      }
      toolbar.append(textSwitch);
    }

    if (edition.illustrationSets.length > 1) {
      const illustrationSwitch = document.createElement('span');
      illustrationSwitch.className =
        'story-reader-control-group story-reader-illustration-switch';
      const illustrationLabel = document.createElement('span');
      illustrationLabel.className = 'story-reader-edition-label';
      illustrationLabel.textContent = 'Illustrations';
      illustrationSwitch.append(illustrationLabel);

      for (const candidate of edition.illustrationSets) {
        const displayLabel =
          candidate.id === 'modern'
            ? 'Modern'
            : candidate.id === 'classic'
              ? 'Classic'
              : candidate.label;
        const illustrationButton = button(
          displayLabel,
          'story-reader-edition-button story-reader-illustration-button',
          () => {
            void this.switchIllustrationSet(candidate.id);
          },
        );
        const active = candidate.id === this.activeIllustrationSetId;
        illustrationButton.classList.toggle('is-active', active);
        illustrationButton.setAttribute('aria-pressed', String(active));
        illustrationSwitch.append(illustrationButton);
      }
      toolbar.append(illustrationSwitch);
    }

    const sizeGroup = document.createElement('span');
    sizeGroup.className = 'story-reader-control-group';
    const sizeLabel = document.createElement('span');
    sizeLabel.className = 'story-reader-edition-label';
    sizeLabel.textContent = 'Size';
    const smaller = button('A−', 'story-reader-tool', () => this.changeFontSize(-2));
    smaller.setAttribute('aria-label', 'Make text smaller');
    const larger = button('A+', 'story-reader-tool', () => this.changeFontSize(2));
    larger.setAttribute('aria-label', 'Make text larger');
    sizeGroup.append(sizeLabel, smaller, larger);

    const spacingGroup = document.createElement('span');
    spacingGroup.className = 'story-reader-control-group';
    const spacingLabel = document.createElement('span');
    spacingLabel.className = 'story-reader-edition-label';
    spacingLabel.textContent = 'Spacing';
    const tighter = button('−', 'story-reader-tool', () => this.changeLineHeight(-0.1));
    tighter.setAttribute('aria-label', 'Reduce line spacing');
    const looser = button('+', 'story-reader-tool', () => this.changeLineHeight(0.1));
    looser.setAttribute('aria-label', 'Increase line spacing');
    spacingGroup.append(spacingLabel, tighter, looser);

    toolbar.append(sizeGroup, spacingGroup);

    const scroller = document.createElement('main');
    scroller.className = 'story-reader-scroller';
    scroller.dataset.storyReaderScroller = 'true';
    const paper = document.createElement('article');
    paper.className = isPictureBook
      ? 'story-reader-paper story-reader-picture-page'
      : 'story-reader-paper';
    paper.dataset.storyId = manifest.id;
    paper.dataset.storyEditionId = edition.id;
    if (this.activeIllustrationSetId) {
      paper.dataset.storyIllustrationSetId = this.activeIllustrationSetId;
    }
    paper.dataset.chapterId = chapter.chapterId;
    paper.addEventListener('dragstart', (event) => event.preventDefault());

    const chapterIllustrations = this.illustrationsForChapter(edition, chapter.chapterId);

    if (isPictureBook) {
      for (const illustration of chapterIllustrations) {
        paper.append(renderStoryIllustration(manifest.id, illustration));
      }
      const pageCopy = document.createElement('div');
      pageCopy.className = 'story-reader-picture-copy';
      for (const block of chapter.blocks) {
        pageCopy.append(renderMarkdownBlock(block));
      }
      paper.append(pageCopy);
    } else {
      const chapterHeading = document.createElement('header');
      chapterHeading.className = 'story-reader-chapter-heading';
      const eyebrow = document.createElement('p');
      eyebrow.textContent =
        manifest.editions.length > 1
          ? `${edition.label} · ${edition.author}`
          : manifest.series
            ? `${manifest.series.title} · Book ${manifest.series.order}`
            : `A Story House book · ${edition.author}`;
      const heading = document.createElement('h1');
      heading.textContent = chapter.title;
      chapterHeading.append(eyebrow, heading);
      paper.append(chapterHeading);

      for (const block of chapter.blocks) {
        paper.append(renderMarkdownBlock(block));
        for (const illustration of chapterIllustrations) {
          if (illustration.blockId === block.id) {
            paper.append(renderStoryIllustration(manifest.id, illustration));
          }
        }
      }
    }

    const navigation = document.createElement('nav');
    navigation.className = 'story-reader-chapter-nav';
    navigation.setAttribute(
      'aria-label',
      isPagedEdition ? 'Page navigation' : 'Chapter navigation',
    );
    const previous = button(
      isPagedEdition ? '← Previous page' : '← Previous chapter',
      'story-reader-chapter-button',
      () => {
        this.persistCurrentPosition();
        void this.showChapter(index - 1);
      },
    );
    previous.disabled = index === 0;
    const chapterPosition = document.createElement('span');
    chapterPosition.textContent = chapterLabel(edition, index);
    const isLastChapter = index >= edition.chapters.length - 1;
    const next = button(
      isLastChapter ? 'Finish book ✓' : isPagedEdition ? 'Next page →' : 'Next chapter →',
      'story-reader-chapter-button',
      () => {
        if (isLastChapter) {
          this.finishBook();
          return;
        }
        this.persistCurrentPosition();
        void this.showChapter(index + 1);
      },
    );
    navigation.append(previous, chapterPosition, next);
    paper.append(navigation);

    const turnFeedback = document.createElement('span');
    turnFeedback.className = 'story-reader-turn-feedback';
    turnFeedback.setAttribute('aria-hidden', 'true');

    let turnPending = false;
    const requestPageTurn = (direction: 'previous' | 'next'): void => {
      if (turnPending || (direction === 'previous' && index === 0)) return;

      turnPending = true;
      const feedbackClass =
        direction === 'previous'
          ? 'story-reader-turn-feedback is-previous'
          : 'story-reader-turn-feedback is-next';
      turnFeedback.className = feedbackClass;
      turnFeedback.textContent = direction === 'previous' ? '‹' : '›';
      scroller.classList.add(direction === 'previous' ? 'is-turning-previous' : 'is-turning-next');

      window.requestAnimationFrame(() => {
        turnFeedback.classList.add('is-visible');
      });

      window.setTimeout(() => {
        if (direction === 'previous') {
          this.persistCurrentPosition();
          void this.showChapter(index - 1);
          return;
        }
        if (isLastChapter) {
          this.finishBook();
          return;
        }
        this.persistCurrentPosition();
        void this.showChapter(index + 1);
      }, 110);
    };

    type ReaderPointerStart = {
      pointerId: number;
      x: number;
      y: number;
      lastX: number;
      lastY: number;
      startedAt: number;
    };

    let stopActiveGesture: (() => void) | null = null;
    const isInteractiveTarget = (target: EventTarget | null): boolean =>
      target instanceof Element &&
      target.closest('button, a, input, select, textarea, label') !== null;

    scroller.addEventListener('pointerdown', (event) => {
      if (
        (event.pointerType === 'mouse' && event.button !== 0) ||
        isInteractiveTarget(event.target)
      ) {
        return;
      }

      stopActiveGesture?.();

      const start: ReaderPointerStart = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        lastX: event.clientX,
        lastY: event.clientY,
        startedAt: performance.now(),
      };

      const cleanup = (): void => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        if (stopActiveGesture === cleanup) stopActiveGesture = null;
      };

      const finishGesture = (endX: number, endY: number): void => {
        const deltaX = endX - start.x;
        const deltaY = endY - start.y;
        const horizontalDistance = Math.abs(deltaX);
        const verticalDistance = Math.abs(deltaY);

        if (horizontalDistance >= 56 && horizontalDistance > verticalDistance * 1.25) {
          requestPageTurn(deltaX < 0 ? 'next' : 'previous');
          return;
        }

        const elapsed = performance.now() - start.startedAt;
        if (horizontalDistance > 10 || verticalDistance > 10 || elapsed > 500) return;

        const paperRect = paper.getBoundingClientRect();
        if (endX < paperRect.left) {
          requestPageTurn('previous');
        } else if (endX > paperRect.right) {
          requestPageTurn('next');
        }
      };

      const onPointerMove = (moveEvent: PointerEvent): void => {
        if (moveEvent.pointerId !== start.pointerId) return;
        start.lastX = moveEvent.clientX;
        start.lastY = moveEvent.clientY;
      };

      const onPointerUp = (upEvent: PointerEvent): void => {
        if (upEvent.pointerId !== start.pointerId) return;
        const endX = start.lastX === start.x ? upEvent.clientX : start.lastX;
        const endY = start.lastY === start.y ? upEvent.clientY : start.lastY;
        cleanup();
        finishGesture(endX, endY);
      };

      const onPointerCancel = (cancelEvent: PointerEvent): void => {
        if (cancelEvent.pointerId !== start.pointerId) return;
        cleanup();
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
      stopActiveGesture = cleanup;
    });

    scroller.append(paper);
    shell.append(topbar, toolbar, scroller, turnFeedback);
    root.replaceChildren(shell);
    this.currentChapter = { manifest, edition, chapter, index, scroller };
    scroller.addEventListener('scroll', this.scheduleProgressSave, { passive: true });
    this.restoreReadingPosition(resume);
  }

  private changeFontSize(delta: number): void {
    this.fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, this.fontSize + delta));
    const shell = this.root?.querySelector<HTMLElement>('.story-reader-shell');
    if (shell) this.applyReadingPreferences(shell);
    this.reading.updatePreferences({ fontSize: this.fontSize });
  }

  private changeLineHeight(delta: number): void {
    this.lineHeight = Math.max(
      MIN_LINE_HEIGHT,
      Math.min(MAX_LINE_HEIGHT, Math.round((this.lineHeight + delta) * 10) / 10),
    );
    const shell = this.root?.querySelector<HTMLElement>('.story-reader-shell');
    if (shell) this.applyReadingPreferences(shell);
    this.reading.updatePreferences({ lineHeight: this.lineHeight });
  }

  private applyReadingPreferences(shell: HTMLElement): void {
    shell.style.setProperty('--story-reader-font-size', `${this.fontSize}px`);
    shell.style.setProperty('--story-reader-line-height', String(this.lineHeight));
  }

  private readonly scheduleProgressSave = (): void => {
    this.clearProgressTimer();
    this.progressTimer = globalThis.setTimeout(() => {
      this.progressTimer = null;
      this.persistCurrentPosition();
    }, 300);
  };

  private clearProgressTimer(): void {
    if (this.progressTimer === null) {
      return;
    }
    globalThis.clearTimeout(this.progressTimer);
    this.progressTimer = null;
  }

  private persistCurrentPosition(): void {
    const current = this.currentChapter;
    if (!current) {
      return;
    }

    if (current.edition.readingMode === 'paged-picture-book') {
      const pageBlock = current.chapter.blocks[0];
      if (!pageBlock) {
        return;
      }
      this.reading.savePosition({
        storyId: current.manifest.id,
        editionId: current.edition.id,
        defaultEditionId: current.manifest.defaultEditionId,
        chapterId: current.chapter.chapterId,
        blockId: pageBlock.id,
        blockProgress: 0,
        chapterPercentComplete: 100,
        percentComplete: ((current.index + 1) / current.edition.chapters.length) * 100,
      });
      return;
    }

    const blocks = Array.from(
      current.scroller.querySelectorAll<HTMLElement>('.story-reader-block'),
    );
    if (blocks.length === 0) {
      return;
    }

    const scrollerRect = current.scroller.getBoundingClientRect();
    const readingLine = scrollerRect.top + Math.min(current.scroller.clientHeight * 0.36, 240);
    let selectedIndex = 0;
    for (let index = 0; index < blocks.length; index += 1) {
      if (blocks[index].getBoundingClientRect().top <= readingLine) {
        selectedIndex = index;
      } else {
        break;
      }
    }

    const selected = blocks[selectedIndex];
    const blockRect = selected.getBoundingClientRect();
    const blockProgress =
      blockRect.height > 0
        ? Math.max(0, Math.min(1, (readingLine - blockRect.top) / blockRect.height))
        : 0;
    const chapterFraction = Math.max(
      0,
      Math.min(1, (selectedIndex + blockProgress) / blocks.length),
    );
    const chapterPercentComplete = chapterFraction * 100;
    const percentComplete =
      ((current.index + chapterFraction) / current.edition.chapters.length) * 100;

    this.reading.savePosition({
      storyId: current.manifest.id,
      editionId: current.edition.id,
      defaultEditionId: current.manifest.defaultEditionId,
      chapterId: current.chapter.chapterId,
      blockId: selected.dataset.storyBlockId ?? current.chapter.blocks[0]?.id ?? 'start',
      blockProgress,
      chapterPercentComplete,
      percentComplete,
    });
  }

  private restoreReadingPosition(progress: ReturnType<StoryReadingService['getProgress']>): void {
    const current = this.currentChapter;
    if (
      !current ||
      !progress ||
      progress.completed ||
      current.edition.readingMode === 'paged-picture-book'
    ) {
      current?.scroller.scrollTo({ top: 0 });
      return;
    }

    globalThis.requestAnimationFrame(() => {
      if (this.currentChapter !== current) {
        return;
      }
      const blocks = Array.from(
        current.scroller.querySelectorAll<HTMLElement>('.story-reader-block'),
      );
      if (blocks.length === 0) {
        return;
      }

      let targetIndex = blocks.findIndex(
        (block) => block.dataset.storyBlockId === progress.blockId,
      );
      let localProgress = progress.blockProgress;
      if (targetIndex < 0) {
        const chapterFraction = Math.max(
          0,
          Math.min(
            0.999,
            (progress.percentComplete / 100) * current.edition.chapters.length - current.index,
          ),
        );
        const rawIndex = chapterFraction * blocks.length;
        targetIndex = Math.min(blocks.length - 1, Math.max(0, Math.floor(rawIndex)));
        localProgress = rawIndex - Math.floor(rawIndex);
      }

      const target = blocks[targetIndex];
      const scrollerRect = current.scroller.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const readingOffset = Math.min(current.scroller.clientHeight * 0.36, 240);
      const targetTop =
        current.scroller.scrollTop +
        (targetRect.top - scrollerRect.top) +
        targetRect.height * Math.max(0, Math.min(1, localProgress)) -
        readingOffset;
      current.scroller.scrollTo({ top: Math.max(0, targetTop) });
    });
  }

  private finishBook(): void {
    const current = this.currentChapter;
    if (!current) {
      return;
    }
    const lastBlock = current.chapter.blocks.at(-1);
    if (!lastBlock) {
      return;
    }

    this.reading.markCompleted({
      storyId: current.manifest.id,
      editionId: current.edition.id,
      defaultEditionId: current.manifest.defaultEditionId,
      chapterId: current.chapter.chapterId,
      blockId: lastBlock.id,
      blockProgress: 1,
      chapterPercentComplete: 100,
      percentComplete: 100,
    });
    this.currentChapter = null;
    void this.showCatalogue();
  }

  private createLoading(message: string): HTMLElement {
    const loading = document.createElement('div');
    loading.className = 'story-reader-status-card';
    loading.setAttribute('role', 'status');
    const mark = document.createElement('span');
    mark.className = 'story-reader-status-mark';
    mark.textContent = '📖';
    const text = document.createElement('p');
    text.textContent = message;
    loading.append(mark, text);
    return loading;
  }

  private createError(message: string, retry: () => void): HTMLElement {
    const error = document.createElement('div');
    error.className = 'story-reader-status-card';
    error.setAttribute('role', 'alert');
    const mark = document.createElement('span');
    mark.className = 'story-reader-status-mark';
    mark.textContent = '✨';
    const text = document.createElement('p');
    text.textContent = message;
    const retryButton = button('Back to the shelves', 'story-reader-back', retry);
    error.append(mark, text, retryButton);
    return error;
  }
}
