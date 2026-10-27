import {
  CRYSTAL_FAMILIES,
  FULL_CELL_COUNT,
  FULL_COLUMNS,
  RESONANCE_PATTERNS,
  activeResonancePattern,
  canOfferPattern,
  refinedSourceTier,
  unlockedCrystalFamilies,
  type CrystalariumFullState,
} from './CrystalariumFullRules';
import {
  CRYSTAL_NOTE_PRESENTATION,
  CRYSTAL_TIER_NAMES,
  type CrystalFamily,
} from './CrystalariumOpeningRules';
import { createCrystalArtElement } from './CrystalariumCrystalArt';
import { CrystalariumPointerDrag } from './CrystalariumPointerDrag';
import type { CrystalariumGuidePrompt } from './CrystalariumGuide';
import './CrystalariumPortraitView.css';

export interface CrystalariumPortraitActions {
  cell(index: number): void;
  dragMove(source: number, target: number): void;
  dragShelve(source: number): void;
  dragWash(source: number): void;
  dragRestore(shelfIndex: number, target: number): void;
  dragInvalid(): void;
  source(family: CrystalFamily): void;
  grow(): void;
  growRefined(): void;
  offer(): void;
  harmony(): void;
  polish(): void;
  shelve(): void;
  wash(): void;
  fresh(): void;
  restore(index: number): void;
  sound(): void;
  guide(): void;
  skipGuide(): void;
  exit(): void;
}

export interface CrystalariumPortraitPresentation {
  state: CrystalariumFullState;
  selected: number | null;
  message: string;
  quiet: boolean;
  globallyMuted: boolean;
  washArmed: boolean;
  resetArmed: boolean;
  source: 'world' | 'just-games';
  guide: CrystalariumGuidePrompt | null;
  celebration: 'merge' | 'offer' | 'harmony' | null;
}

function makeElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/**
 * Portrait-only native presentation of the *existing* Crystalarium controller.
 * The 1280×720 canvas stays authoritative for the world/desktop and browser
 * diagnostics; no rule, save or mini-game-session code is duplicated here.
 * This follows the existing title/portrait-native-controls presentation pattern
 * rather than attempting to enlarge a canvas-bound DOM overlay beyond its bounds.
 */
export class CrystalariumPortraitView {
  private readonly root: HTMLElement;
  private readonly actions: CrystalariumPortraitActions;
  private readonly dragging: CrystalariumPointerDrag;
  private currentView: CrystalariumPortraitPresentation | null = null;

  public constructor(actions: CrystalariumPortraitActions) {
    this.actions = actions;
    this.root = makeElement('section', 'crystalarium-portrait');
    this.root.dataset.crystalariumPortrait = 'true';
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-label', 'Crystalarium Resonance Garden');
    // Phaser listens for global pointer input; native portrait actions must
    // never leak touch-up/down into the canvas or a resumed Just Games scene.
    this.root.addEventListener('pointerdown', (event) => event.stopPropagation());
    this.root.addEventListener('pointerup', (event) => event.stopPropagation());
    this.root.addEventListener('pointercancel', (event) => event.stopPropagation());
    this.root.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        this.actions.exit();
      }
    });
    (document.querySelector('#game-shell') ?? document.body).append(this.root);
    this.dragging = new CrystalariumPointerDrag(
      this.root,
      {
        move: actions.dragMove,
        shelve: actions.dragShelve,
        wash: actions.dragWash,
        restore: actions.dragRestore,
        invalid: actions.dragInvalid,
      },
      ({ kind, index }) => {
        const view = this.currentView;
        return (kind === 'cell' ? view?.state.cells[index] : view?.state.shelf[index]) ?? null;
      },
    );
  }

  private button(
    label: string,
    action: () => void,
    kind = 'standard',
    disabled = false,
    name?: string,
  ): HTMLButtonElement {
    const button = makeElement('button', 'crystalarium-portrait-action is-' + kind, label);
    button.type = 'button';
    button.disabled = disabled;
    if (name) button.dataset.crystalariumAction = name;
    if (name === 'exit') {
      // Touch pointer-up must leave before a subsequent synthetic click can
      // fall through to a canvas action or act on a removed view.
      button.addEventListener('pointerup', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!button.disabled) action();
      });
    }
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!button.disabled) action();
    });
    return button;
  }

  public render(view: CrystalariumPortraitPresentation): void {
    this.currentView = view;
    this.root.dataset.crystalariumCelebration = view.celebration ?? 'none';
    // Replacing view nodes is safe because the game mode owns all persistent state.
    // Restore keyboard focus to the same semantic control after a change.
    const active = document.activeElement;
    const focusKey =
      active instanceof HTMLElement
        ? (active.dataset.crystalariumAction ?? active.dataset.crystalariumCell)
        : undefined;
    const focusIsCell =
      active instanceof HTMLElement && active.dataset.crystalariumCell !== undefined;
    const { state } = view;
    const pattern = activeResonancePattern(state);
    const header = makeElement('header', 'crystalarium-portrait-header');
    const heading = makeElement('h1', 'crystalarium-portrait-heading', '✦ Crystalarium');
    const subtitle = makeElement(
      'p',
      'crystalarium-portrait-subtitle',
      view.source === 'just-games' ? 'Your Just Games songbook' : 'Crystal Brook garden',
    );
    const intro = makeElement('div', 'crystalarium-portrait-brand');
    intro.append(heading, subtitle);
    header.append(
      intro,
      this.button(view.guide ? 'Skip guide' : 'Help', this.actions.guide, 'quiet', false, 'guide'),
      this.button('Leave', this.actions.exit, 'quiet', false, 'exit'),
    );

    const task = makeElement('section', 'crystalarium-portrait-pattern');
    task.setAttribute('aria-label', 'Current Resonance Pattern');
    const label = makeElement(
      'p',
      'crystalarium-portrait-eyebrow',
      pattern
        ? `${pattern.chapter} • ${state.completed + 1} of ${RESONANCE_PATTERNS.length}`
        : 'All five chapters restored',
    );
    const title = makeElement(
      'h2',
      'crystalarium-portrait-pattern-title',
      pattern?.title ?? 'Crystalarium Symphony complete',
    );
    const goals = makeElement('div', 'crystalarium-portrait-goals');
    if (pattern) {
      for (const goal of pattern.goals) {
        const tile = makeElement('div', 'crystalarium-portrait-goal');
        tile.append(createCrystalArtElement({ family: goal.family, tier: goal.tier }));
        const owned = [...state.cells, ...state.shelf].filter(
          (piece) => piece?.family === goal.family && piece.tier === goal.tier,
        ).length;
        tile.append(
          makeElement('span', 'crystalarium-portrait-goal-count', owned + ' / ' + goal.quantity),
        );
        tile.setAttribute(
          'aria-label',
          goal.family + ' ' + CRYSTAL_TIER_NAMES[goal.tier] + ': ' + owned + ' of ' + goal.quantity,
        );
        goals.append(tile);
      }
      if (pattern.harmonies) {
        goals.append(
          makeElement(
            'span',
            'crystalarium-portrait-harmony-goal',
            '♫ ' + state.harmonies + ' / ' + pattern.harmonies,
          ),
        );
      }
    } else {
      goals.append(makeElement('span', 'crystalarium-portrait-goal-count', 'Experiment freely!'));
    }
    task.append(label, title, goals);

    const guidePanel = makeElement('aside', 'crystalarium-portrait-guide');
    guidePanel.dataset.crystalariumGuide = view.guide?.stage ?? 'hidden';
    if (view.guide) {
      guidePanel.setAttribute('aria-live', 'polite');
      guidePanel.append(
        makeElement('strong', 'crystalarium-portrait-guide-title', '✦ ' + view.guide.title),
        makeElement('p', 'crystalarium-portrait-guide-copy', view.guide.instruction),
      );
    } else {
      guidePanel.hidden = true;
    }

    const boardSection = makeElement('section', 'crystalarium-portrait-board-section');
    boardSection.setAttribute('aria-label', 'Crystal merging board');
    const boardHeading = makeElement('div', 'crystalarium-portrait-board-heading');
    boardHeading.append(
      makeElement('h2', 'crystalarium-portrait-board-title', 'Crystal board'),
      this.button(
        view.quiet ? 'Sound off' : view.globallyMuted ? 'Muted globally' : 'Sound on',
        this.actions.sound,
        'quiet',
        false,
        'sound',
      ),
    );
    const scroller = makeElement('div', 'crystalarium-portrait-board-scroll');
    const grid = makeElement('div', 'crystalarium-portrait-grid');
    grid.setAttribute('role', 'group');
    grid.setAttribute(
      'aria-label',
      'Seven columns, six rows. Select two matching crystals to merge.',
    );
    for (let index = 0; index < FULL_CELL_COUNT; index += 1) {
      const piece = state.cells[index];
      const row = Math.floor(index / FULL_COLUMNS) + 1;
      const col = (index % FULL_COLUMNS) + 1;
      const button = makeElement('button', 'crystalarium-portrait-cell');
      button.type = 'button';
      button.dataset.crystalariumCell = String(index);
      button.dataset.family = piece?.family ?? 'empty';
      button.classList.toggle('is-selected', view.selected === index);
      button.classList.toggle('is-occupied', piece !== null);
      button.setAttribute('aria-pressed', view.selected === index ? 'true' : 'false');
      button.setAttribute(
        'aria-label',
        piece
          ? `${piece.family} ${CRYSTAL_TIER_NAMES[piece.tier]}, row ${row}, column ${col}`
          : `Empty socket, row ${row}, column ${col}`,
      );
      if (piece) button.append(createCrystalArtElement(piece));
      else button.textContent = '·';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        this.actions.cell(index);
      });
      grid.append(button);
    }
    scroller.append(grid);
    boardSection.append(boardHeading, scroller);
    const helper = makeElement(
      'p',
      'crystalarium-portrait-hint',
      'Drag matching crystals together. The floating shelf below stores crystals safely.',
    );
    boardSection.append(helper);
    if (view.guide?.target === 'cell') grid.classList.add('is-guide-focus');

    const controls = makeElement('section', 'crystalarium-portrait-controls');
    controls.setAttribute('aria-label', 'Crystalarium actions');
    controls.append(makeElement('h2', 'crystalarium-portrait-section-title', 'Crystal veins'));
    const sourceRow = makeElement('div', 'crystalarium-portrait-sources');
    for (const family of CRYSTAL_FAMILIES) {
      const unlocked = unlockedCrystalFamilies(state).includes(family);
      const text = unlocked
        ? `${CRYSTAL_NOTE_PRESENTATION[family].symbol} ${family}`
        : '🔒 ' + family;
      const button = this.button(
        text,
        () => this.actions.source(family),
        'source',
        !unlocked,
        'source-' + family,
      );
      button.setAttribute('aria-pressed', state.selectedFamily === family ? 'true' : 'false');
      button.classList.toggle('is-selected', state.selectedFamily === family);
      sourceRow.append(button);
    }
    controls.append(sourceRow);
    const primary = makeElement('div', 'crystalarium-portrait-primary-actions');
    primary.append(this.button('Grow shard', this.actions.grow, 'primary', false, 'grow'));
    const refined = refinedSourceTier(state);
    if (refined !== null) {
      primary.append(
        this.button(
          refined === 2 ? 'Grow crystal' : 'Grow polished',
          this.actions.growRefined,
          'primary',
          false,
          'grow-refined',
        ),
      );
    }
    primary.append(
      this.button('Offer pattern', this.actions.offer, 'offer', !canOfferPattern(state), 'offer'),
    );
    primary.classList.add('is-quickbar');
    if (view.guide && view.guide.target !== 'cell' && view.guide.target !== 'none') {
      primary
        .querySelector('[data-crystalarium-action="' + view.guide.target + '"]')
        ?.classList.add('is-guide-focus');
    }
    if (refined !== null) primary.classList.add('is-refined');

    const utility = makeElement('div', 'crystalarium-portrait-secondary-actions');
    utility.append(
      this.button('Harmony ♫', this.actions.harmony, 'standard', false, 'harmony'),
      this.button('Polish ✧', this.actions.polish, 'standard', state.completed < 30, 'polish'),
      this.button(
        'Shelf selected',
        this.actions.shelve,
        'standard',
        view.selected === null,
        'shelve',
      ),
      this.button(
        view.washArmed ? 'Confirm wash' : 'Brook Wash',
        this.actions.wash,
        view.washArmed ? 'warning' : 'standard',
        view.selected === null,
        'wash',
      ),
    );
    if (view.guide && ['harmony', 'polish', 'shelve', 'wash'].includes(view.guide.target)) {
      utility
        .querySelector('[data-crystalarium-action="' + view.guide.target + '"]')
        ?.classList.add('is-guide-focus');
    }
    controls.append(utility);
    const shelf = makeElement('div', 'crystalarium-portrait-shelf');
    shelf.append(
      makeElement(
        'p',
        'crystalarium-portrait-shelf-heading',
        `Safe shelf • ${state.harmonies} harmonies`,
      ),
    );
    const shelfSlots = makeElement('div', 'crystalarium-portrait-shelf-slots');
    for (let index = 0; index < state.shelf.length; index += 1) {
      const piece = state.shelf[index];
      const slot = this.button(
        piece ? CRYSTAL_TIER_NAMES[piece.tier] : 'Empty',
        () => this.actions.restore(index),
        'shelf',
        piece === null,
        'shelf-' + index,
      );
      if (piece) {
        slot.replaceChildren(createCrystalArtElement(piece));
        slot.setAttribute(
          'aria-label',
          'Return ' + piece.family + ' ' + CRYSTAL_TIER_NAMES[piece.tier] + ' to board',
        );
      }
      shelfSlots.append(slot);
    }
    shelfSlots.append(
      this.button(
        view.washArmed ? 'Confirm' : '♻ Wash',
        this.actions.wash,
        'warning',
        false,
        'wash-dock',
      ),
    );
    shelf.append(shelfSlots);
    controls.append(
      this.button(
        view.resetArmed ? 'Confirm fresh board' : 'Fresh board',
        this.actions.fresh,
        view.resetArmed ? 'warning' : 'quiet',
        false,
        'fresh',
      ),
    );
    const status = makeElement('p', 'crystalarium-portrait-status', view.message);
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    this.root.replaceChildren(
      header,
      task,
      guidePanel,
      primary,
      boardSection,
      shelf,
      status,
      controls,
    );

    if (focusKey !== undefined) {
      const selector = focusIsCell
        ? `[data-crystalarium-cell="${focusKey}"]`
        : `[data-crystalarium-action="${focusKey}"]`;
      const focusTarget = this.root.querySelector<HTMLButtonElement>(selector);
      if (focusTarget && !focusTarget.disabled) focusTarget.focus({ preventScroll: true });
    }
  }

  public destroy(): void {
    this.dragging.destroy();
    this.root.remove();
  }
}
