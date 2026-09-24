import { StoryLibraryService } from './StoryLibraryService';
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
  private root: HTMLDivElement | null = null;
  private manifest: StoryLibraryManifest | null = null;
  private chapterIndex = 0;
  private requestVersion = 0;
  private fontSize = DEFAULT_FONT_SIZE;
  private lineHeight = DEFAULT_LINE_HEIGHT;
  private closed = false;

  public constructor(private readonly options: StoryReaderOverlayOptions) {}

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
      intro.textContent = 'Choose a book from Quill’s shelves and settle in for as long as you like.';
      headingWrap.append(eyebrow, heading, intro);
      const close = button('Close ✕', 'story-reader-close', () => this.destroy());
      close.setAttribute('aria-label', 'Close Story House Library');
      header.append(headingWrap, close);

      const shelf = document.createElement('main');
      shelf.className = 'story-library-shelf';
      shelf.setAttribute('aria-label', 'Story collection');

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
        meta.textContent = `${story.chapterCount} chapter${story.chapterCount === 1 ? '' : 's'} · Read`;
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
      footer.textContent = 'More shelves can fill up over time without making the Valley slower to open.';

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
      this.chapterIndex = 0;
      await this.showChapter(0);
    } catch {
      if (!this.root || request !== this.requestVersion) return;
      this.root.replaceChildren(
        this.createError('Quill could not open that book just now.', () => void this.showCatalogue()),
      );
    }
  }

  private async showChapter(index: number): Promise<void> {
    const root = this.root;
    const manifest = this.manifest;
    const chapter = manifest?.chapters[index];
    if (!root || !manifest || !chapter) return;

    const request = ++this.requestVersion;
    root.replaceChildren(this.createLoading(`Opening “${chapter.title}”…`));

    try {
      const content = await this.library.loadChapter(manifest.id, chapter.id);
      if (!this.root || request !== this.requestVersion) return;
      this.chapterIndex = index;
      this.renderReader(manifest, content, index);
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
  ): void {
    const root = this.root;
    if (!root) return;

    const shell = document.createElement('div');
    shell.className = 'story-reader-shell';
    this.applyReadingPreferences(shell);

    const topbar = document.createElement('header');
    topbar.className = 'story-reader-topbar';
    const back = button('← Library', 'story-reader-back', () => void this.showCatalogue());
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
      void this.showChapter(index - 1);
    });
    previous.disabled = index === 0;
    const chapterPosition = document.createElement('span');
    chapterPosition.textContent = chapterLabel(index, manifest.chapters.length);
    const next = button('Next chapter →', 'story-reader-chapter-button', () => {
      void this.showChapter(index + 1);
    });
    next.disabled = index >= manifest.chapters.length - 1;
    navigation.append(previous, chapterPosition, next);
    paper.append(navigation);

    scroller.append(paper);
    shell.append(topbar, toolbar, scroller);
    root.replaceChildren(shell);
    scroller.scrollTop = 0;
  }

  private changeFontSize(delta: number): void {
    this.fontSize = Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, this.fontSize + delta));
    const shell = this.root?.querySelector<HTMLElement>('.story-reader-shell');
    if (shell) this.applyReadingPreferences(shell);
  }

  private changeLineHeight(delta: number): void {
    this.lineHeight = Math.max(
      MIN_LINE_HEIGHT,
      Math.min(MAX_LINE_HEIGHT, Math.round((this.lineHeight + delta) * 10) / 10),
    );
    const shell = this.root?.querySelector<HTMLElement>('.story-reader-shell');
    if (shell) this.applyReadingPreferences(shell);
  }

  private applyReadingPreferences(shell: HTMLElement): void {
    shell.style.setProperty('--story-reader-font-size', `${this.fontSize}px`);
    shell.style.setProperty('--story-reader-line-height', String(this.lineHeight));
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
