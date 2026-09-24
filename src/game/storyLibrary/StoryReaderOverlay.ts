import { getBrowserSaveService } from '../save/browserSaveService';
import { StoryLibraryService } from './StoryLibraryService';
import { StoryReadingService } from './StoryReadingService';
import type {
  StoryChapterContent,
  StoryContentBlock,
  StoryLibraryManifest,
} from './StoryLibraryTypes';

export interface StoryReaderOverlayOptions {
  onClose: () => void;
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

function chapterLabel(index: number, total: number): string {
  return `Chapter ${index + 1} of ${total}`;
}

export class StoryReaderOverlay {
  private readonly library = new StoryLibraryService();
  private readonly reading = new StoryReadingService(getBrowserSaveService());
  private root: HTMLDivElement | null = null;
  private manifest: StoryLibraryManifest | null = null;
  private requestVersion = 0;
  private fontSize = DEFAULT_FONT_SIZE;
  private lineHeight = DEFAULT_LINE_HEIGHT;
  private closed = false;
  private progressTimer: number | null = null;
  private currentChapter: {
    manifest: StoryLibraryManifest;
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

      const shelf = document.createElement('main');
      shelf.className = 'story-library-shelf';
      shelf.setAttribute('aria-label', 'Story collection');

      const progressEntries = stories
        .map((story) => ({ story, progress: this.reading.getProgress(story.id) }))
        .filter(({ progress }) => progress !== null);
      const mostRecent = [...progressEntries]
        .filter(({ progress }) => !progress?.completed)
        .sort((left, right) =>
          String(right.progress?.lastReadAt).localeCompare(String(left.progress?.lastReadAt)),
        )[0];
      if (mostRecent?.progress) {
        const continueButton = document.createElement('button');
        continueButton.type = 'button';
        continueButton.className = 'story-library-continue';
        continueButton.addEventListener('click', () => {
          void this.openStory(mostRecent.story.id);
        });
        const continueLabel = document.createElement('strong');
        continueLabel.textContent = 'Continue Reading';
        const continueBook = document.createElement('span');
        continueBook.textContent = `${mostRecent.story.title} · ${Math.round(mostRecent.progress.percentComplete)}%`;
        continueButton.append(continueLabel, continueBook);
        shelf.append(continueButton);
      }

      for (const story of stories) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'story-library-book';
        card.dataset.storyId = story.id;
        card.addEventListener('click', () => {
          void this.openStory(story.id);
        });

        const cover = document.createElement('span');
        cover.className = 'story-library-cover';
        if (story.coverPath) {
          const image = document.createElement('img');
          image.src = story.coverPath;
          image.alt = story.coverAlt ?? '';
          image.loading = 'lazy';
          cover.append(image);
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
        const description = document.createElement('span');
        description.className = 'story-library-description';
        description.textContent = story.description;
        const meta = document.createElement('span');
        meta.className = 'story-library-meta';
        const progress = this.reading.getProgress(story.id);
        if (progress?.completed) {
          card.classList.add('is-completed');
          meta.textContent = 'Completed ✓ · Read again';
        } else if (progress) {
          card.classList.add('is-in-progress');
          meta.textContent = `${Math.round(progress.percentComplete)}% · Continue reading`;
        } else {
          meta.textContent = `${story.chapterCount} chapter${story.chapterCount === 1 ? '' : 's'} · Read`;
        }
        copy.append(title, author, description, meta);

        card.append(cover, copy);
        shelf.append(card);
      }

      if (stories.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'story-library-empty';
        empty.textContent = 'Quill has cleared a shelf for the first book.';
        shelf.append(empty);
      }

      const footer = document.createElement('footer');
      footer.className = 'story-library-footer';
      const startedCount = progressEntries.length;
      const completedCount = progressEntries.filter(({ progress }) => progress?.completed).length;
      footer.textContent =
        startedCount === 0
          ? 'No books started yet · choose one from the shelf'
          : `${startedCount} started · ${completedCount} completed · ${stories.length} in the library`;

      shell.append(header, shelf, footer);
      this.root.replaceChildren(shell);
      close.focus({ preventScroll: true });
    } catch {
      if (!this.root || request !== this.requestVersion) return;
      this.root.replaceChildren(
        this.createError('The shelves would not open just now.', () => void this.showCatalogue()),
      );
    }
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
      const progress = this.reading.getProgress(storyId);
      const savedChapterIndex =
        progress && !progress.completed
          ? manifest.chapters.findIndex((chapter) => chapter.id === progress.chapterId)
          : -1;
      const chapterIndex =
        savedChapterIndex >= 0
          ? savedChapterIndex
          : progress && !progress.completed
            ? Math.min(
                manifest.chapters.length - 1,
                Math.floor((progress.percentComplete / 100) * manifest.chapters.length),
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

  private async showChapter(
    index: number,
    resume: ReturnType<StoryReadingService['getProgress']> = null,
  ): Promise<void> {
    const root = this.root;
    const manifest = this.manifest;
    const chapter = manifest?.chapters[index];
    if (!root || !manifest || !chapter) return;

    const request = ++this.requestVersion;
    root.replaceChildren(this.createLoading(`Opening “${chapter.title}”…`));

    try {
      const content = await this.library.loadChapter(manifest.id, chapter.id);
      if (!this.root || request !== this.requestVersion) return;
      this.renderReader(manifest, content, index, resume);
    } catch {
      if (!this.root || request !== this.requestVersion) return;
      this.root.replaceChildren(
        this.createError('That chapter would not open just now.', () => void this.showCatalogue()),
      );
    }
  }

  private renderReader(
    manifest: StoryLibraryManifest,
    chapter: StoryChapterContent,
    index: number,
    resume: ReturnType<StoryReadingService['getProgress']>,
  ): void {
    const root = this.root;
    if (!root) return;

    const shell = document.createElement('div');
    shell.className = 'story-reader-shell';
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
    chapterProgress.textContent = chapterLabel(index, manifest.chapters.length);
    titleWrap.append(bookTitle, chapterProgress);
    const close = button('Close ✕', 'story-reader-close', () => this.destroy());
    topbar.append(back, titleWrap, close);

    const toolbar = document.createElement('nav');
    toolbar.className = 'story-reader-toolbar';
    toolbar.setAttribute('aria-label', 'Reading controls');
    const textLabel = document.createElement('span');
    textLabel.textContent = 'Text';
    const smaller = button('A−', 'story-reader-tool', () => this.changeFontSize(-2));
    smaller.setAttribute('aria-label', 'Make text smaller');
    const larger = button('A+', 'story-reader-tool', () => this.changeFontSize(2));
    larger.setAttribute('aria-label', 'Make text larger');
    const spacingLabel = document.createElement('span');
    spacingLabel.textContent = 'Spacing';
    const tighter = button('−', 'story-reader-tool', () => this.changeLineHeight(-0.1));
    tighter.setAttribute('aria-label', 'Reduce line spacing');
    const looser = button('+', 'story-reader-tool', () => this.changeLineHeight(0.1));
    looser.setAttribute('aria-label', 'Increase line spacing');
    toolbar.append(textLabel, smaller, larger, spacingLabel, tighter, looser);

    const scroller = document.createElement('main');
    scroller.className = 'story-reader-scroller';
    scroller.dataset.storyReaderScroller = 'true';
    const paper = document.createElement('article');
    paper.className = 'story-reader-paper';
    paper.dataset.storyId = manifest.id;
    paper.dataset.chapterId = chapter.chapterId;

    const chapterHeading = document.createElement('header');
    chapterHeading.className = 'story-reader-chapter-heading';
    const eyebrow = document.createElement('p');
    eyebrow.textContent = manifest.series
      ? `${manifest.series.title} · Book ${manifest.series.order}`
      : `A Story House book · ${manifest.author}`;
    const heading = document.createElement('h1');
    heading.textContent = chapter.title;
    chapterHeading.append(eyebrow, heading);
    paper.append(chapterHeading);

    for (const block of chapter.blocks) {
      paper.append(renderMarkdownBlock(block));
    }

    const navigation = document.createElement('nav');
    navigation.className = 'story-reader-chapter-nav';
    navigation.setAttribute('aria-label', 'Chapter navigation');
    const previous = button('← Previous chapter', 'story-reader-chapter-button', () => {
      this.persistCurrentPosition();
      void this.showChapter(index - 1);
    });
    previous.disabled = index === 0;
    const chapterPosition = document.createElement('span');
    chapterPosition.textContent = chapterLabel(index, manifest.chapters.length);
    const isLastChapter = index >= manifest.chapters.length - 1;
    const next = button(
      isLastChapter ? 'Finish book ✓' : 'Next chapter →',
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

    scroller.append(paper);
    shell.append(topbar, toolbar, scroller);
    root.replaceChildren(shell);
    this.currentChapter = { manifest, chapter, index, scroller };
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
      ((current.index + chapterFraction) / current.manifest.chapters.length) * 100;

    this.reading.savePosition({
      storyId: current.manifest.id,
      chapterId: current.chapter.chapterId,
      blockId: selected.dataset.storyBlockId ?? current.chapter.blocks[0]?.id ?? 'start',
      blockProgress,
      chapterPercentComplete,
      percentComplete,
    });
  }

  private restoreReadingPosition(progress: ReturnType<StoryReadingService['getProgress']>): void {
    const current = this.currentChapter;
    if (!current || !progress || progress.completed) {
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
            (progress.percentComplete / 100) * current.manifest.chapters.length - current.index,
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
