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
import { activeResonanceQueue, canOfferQueuedPattern } from './CrystalariumMultiOrderRules';
import { CrystalariumPointerDrag } from './CrystalariumPointerDrag';
import { readCrystalariumChamber } from './CrystalariumChamberRules';
import type { CrystalariumGuidePrompt } from './CrystalariumGuide';
import './CrystalariumPortraitView.css';

export interface CrystalariumPortraitActions {
  cell(index: number): void;
  dragMove(source: number, target: number): void;
  dragShelve(source: number, targetSlot?: number): void;
  dragWash(source: number): void;
  dragRestore(shelfIndex: number, target: number): void;
  moveStored(source: number, target: number): void;
  dragInvalid(): void;
  source(family: CrystalFamily): void;
  growFromWell(family: CrystalFamily): void;
  grow(): void;
  growRefined(): void;
  offer(): void;
  offerPattern(patternId: string): void;
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

/** Transient visual-only event emitted after a successful, persisted well growth. */
export interface CrystalariumGrowthCue {
  readonly id: number;
  readonly family: CrystalFamily;
  readonly cellIndex: number;
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
  growthCue?: CrystalariumGrowthCue | null;
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
  private previousLessonFocus: string | null = null;
  private activeMenu: 'pattern' | 'growing' | 'tools' | null = null;
  private lastLessonStep: string | undefined;
  private storageOpen = false;
  private arrangingStorage = false;
  private storageMoveSource: number | null = null;
  private pendingBoardSlot: number | null = null;

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
        if (this.storageOpen) {
          this.storageOpen = false;
          this.arrangingStorage = false;
          this.storageMoveSource = null;
          if (this.currentView) this.render(this.currentView);
        } else if (this.pendingBoardSlot !== null) {
          this.pendingBoardSlot = null;
          if (this.currentView) this.render(this.currentView);
        } else if (this.activeMenu !== null) {
          const menu = this.activeMenu;
          this.toggleMenu(menu);
        } else {
          this.actions.exit();
        }
      }
    });
    (document.querySelector('#game-shell') ?? document.body).append(this.root);
    this.dragging = new CrystalariumPointerDrag(
      this.root,
      {
        move: actions.dragMove,
        shelve: (index, slot) => {
          this.storageOpen = true;
          actions.dragShelve(index, slot);
        },
        wash: actions.dragWash,
        restore: actions.dragRestore,
        tapShelf: (index) => this.activateStoredSlot(index),
        rearrange: (source, target) => {
          this.storageMoveSource = null;
          actions.moveStored(source, target);
        },
        invalid: actions.dragInvalid,
      },
      ({ kind, index }) => {
        const view = this.currentView;
        return (kind === 'cell' ? view?.state.cells[index] : view?.state.shelf[index]) ?? null;
      },
    );
  }

  private activateStoredSlot(index: number): void {
    const piece = this.currentView?.state.shelf[index];
    if (!this.arrangingStorage) {
      if (piece) this.actions.restore(index);
      return;
    }
    if (this.storageMoveSource === null) {
      if (piece) {
        this.storageMoveSource = index;
        if (this.currentView) this.render(this.currentView);
      }
      return;
    }
    const source = this.storageMoveSource;
    this.storageMoveSource = null;
    if (source === index) {
      if (this.currentView) this.render(this.currentView);
    } else this.actions.moveStored(source, index);
  }

  private button(
    label: string,
    action: () => void,
    kind = 'standard',
    disabled = false,
    name?: string,
    pointerActivate = false,
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
    // A portrait menu must react before a touch click can be retargeted
    // onto its newly revealed backdrop. Consume the matching synthetic click,
    // while retaining keyboard and assistive-technology activation.
    let menuPointerHandled = false;
    let slotPointerHandled = false;
    if (pointerActivate) {
      let down: { id: number; x: number; y: number } | null = null;
      button.addEventListener('pointerdown', (event) => {
        if (!button.disabled && event.isPrimary && event.button === 0) {
          down = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }
      });
      button.addEventListener('pointercancel', () => {
        down = null;
      });
      button.addEventListener('pointerup', (event) => {
        const start = down;
        down = null;
        if (!start || button.disabled || event.pointerId !== start.id) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
        const bounds = button.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          return;
        slotPointerHandled = true;
        action();
      });
    }
    if (name?.startsWith('menu-')) {
      button.addEventListener('pointerdown', () => {
        menuPointerHandled = false;
      });
      button.addEventListener('pointerup', (event) => {
        event.preventDefault();
        event.stopPropagation();
        menuPointerHandled = true;
        if (!button.disabled) action();
      });
    }
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      if ((menuPointerHandled || slotPointerHandled) && event.detail > 0) {
        menuPointerHandled = false;
        slotPointerHandled = false;
        return;
      }
      menuPointerHandled = false;
      slotPointerHandled = false;
      if (!button.disabled) action();
    });
    return button;
  }

  /**
   * Menus only alter their existing DOM visibility: rebuilding the complete
   * 42-cell board during a native click can replace the target mid-event and
   * inadvertently close a freshly opened panel on mobile.
   */
  private syncMenuVisibility(): void {
    const backdrop = this.root.querySelector<HTMLElement>('.crystalarium-portrait-menu-backdrop');
    const panel = this.root.querySelector<HTMLElement>('.crystalarium-portrait-menu-panel');
    if (!backdrop || !panel) return;
    backdrop.hidden = this.activeMenu === null;
    panel.hidden = this.activeMenu === null;
    panel.setAttribute('aria-label', 'Crystalarium ' + (this.activeMenu ?? 'options') + ' panel');
    const title = panel.querySelector<HTMLElement>('.crystalarium-portrait-menu-title');
    if (title) title.textContent = '✦ ' + (this.activeMenu ?? 'Options');
    for (const menu of ['pattern', 'growing', 'tools'] as const) {
      const trigger = this.root.querySelector<HTMLButtonElement>(
        `[data-crystalarium-menu="${menu}"]`,
      );
      trigger?.setAttribute('aria-expanded', String(this.activeMenu === menu));
      trigger?.classList.toggle('is-active', this.activeMenu === menu);
    }
    const pattern = panel.querySelector<HTMLElement>('.crystalarium-portrait-pattern');
    const growing = panel.querySelector<HTMLElement>('.crystalarium-portrait-controls');
    const tools = panel.querySelector<HTMLElement>('.crystalarium-portrait-tools');
    if (pattern) pattern.hidden = this.activeMenu !== 'pattern';
    if (growing) growing.hidden = this.activeMenu !== 'growing';
    if (tools) tools.hidden = this.activeMenu !== 'tools';
  }

  private toggleMenu(menu: 'pattern' | 'growing' | 'tools'): void {
    this.activeMenu = this.activeMenu === menu ? null : menu;
    this.syncMenuVisibility();
    const focusTarget = this.activeMenu
      ? this.root.querySelector<HTMLButtonElement>('[data-crystalarium-action="close-menu"]')
      : this.root.querySelector<HTMLButtonElement>(`[data-crystalarium-menu="${menu}"]`);
    focusTarget?.focus({ preventScroll: true });
  }

  public render(view: CrystalariumPortraitPresentation): void {
    this.dragging.cancelActiveGesture();
    this.currentView = view;
    this.root.dataset.crystalariumCelebration = view.celebration ?? 'none';
    // Replacing view nodes is safe because the game mode owns all persistent state.
    // Restore keyboard focus to the same semantic control after a change.
    const boardScrollLeft =
      this.root.querySelector<HTMLElement>('.crystalarium-portrait-board-scroll')?.scrollLeft ?? 0;
    const active = document.activeElement;
    const focusKey =
      active instanceof HTMLElement
        ? (active.dataset.crystalariumAction ?? active.dataset.crystalariumCell)
        : undefined;
    const focusIsCell =
      active instanceof HTMLElement && active.dataset.crystalariumCell !== undefined;
    const { state } = view;
    this.root.dataset.crystalariumShelfCapacity = String(state.shelf.length);
    const lesson = view.guide?.lessonStep;
    const locked = lesson !== undefined;
    // The first-play spotlight opens only the panel needed for that action.
    // Normal play starts board-first, with secondary surfaces closed.
    if (lesson !== this.lastLessonStep) {
      this.activeMenu = lesson === 'grow' ? 'growing' : lesson === 'offer' ? 'pattern' : null;
      this.lastLessonStep = lesson;
    }
    // Do not scroll on initial render: the compact first board row must remain visible.
    // After an accepted step, move focus to its next literal action, not an old button.
    const nextLessonFocus =
      lesson === 'grow'
        ? 'grow'
        : lesson === 'pick-up'
          ? 'cell-' + view.guide?.sourceIndex
          : lesson === 'merge'
            ? 'cell-' + view.guide?.targetIndex
            : lesson === 'offer'
              ? 'offer'
              : null;
    const advanceFocus =
      this.previousLessonFocus !== null &&
      nextLessonFocus !== null &&
      this.previousLessonFocus !== nextLessonFocus;
    this.previousLessonFocus = nextLessonFocus;
    const queue = readCrystalariumChamber(state);
    const activeOrders = queue ? activeResonanceQueue(queue) : [];
    const pattern = activeOrders[0] ?? activeResonancePattern(state);
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
    const menuStrip = makeElement('nav', 'crystalarium-portrait-menu-strip');
    menuStrip.setAttribute('aria-label', 'Crystalarium panels');
    const patternName = activeResonancePattern(state)?.title ?? 'Free play';
    const readyLabel = canOfferPattern(state) ? '✦ Ready!' : '♫ Pattern';
    for (const [menu, title] of [
      ['pattern', readyLabel],
      ['growing', 'Grow'],
      ['tools', 'Tools'],
    ] as const) {
      const trigger = this.button(
        title,
        () => this.toggleMenu(menu),
        'quiet',
        false,
        'menu-' + menu,
      );
      trigger.dataset.crystalariumMenu = menu;
      trigger.setAttribute('aria-expanded', String(this.activeMenu === menu));
      trigger.setAttribute('aria-controls', 'crystalarium-mobile-menu');
      trigger.setAttribute('aria-label', 'Open ' + menu + ' panel');
      trigger.classList.toggle('is-active', this.activeMenu === menu);
      if (menu === 'pattern') {
        trigger.classList.toggle('is-ready', canOfferPattern(state));
        trigger.setAttribute(
          'aria-label',
          'Pattern ' + patternName + (canOfferPattern(state) ? ', ready to offer' : ''),
        );
        trigger.replaceChildren(
          makeElement('span', 'crystalarium-portrait-menu-label', '♫ Pattern'),
          makeElement(
            'span',
            'crystalarium-portrait-menu-detail',
            canOfferPattern(state) ? '✦ Ready to offer' : patternName,
          ),
        );
      }
      menuStrip.append(trigger);
    }

    const task = makeElement('section', 'crystalarium-portrait-pattern');
    task.setAttribute('aria-label', 'Current Resonance Pattern');
    task.dataset.crystalariumGoalCount = String(pattern?.goals.length ?? 0);
    const readyToOffer = canOfferPattern(state);
    task.dataset.crystalariumReady = readyToOffer ? 'true' : 'false';
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
      for (const [goalIndex, goal] of pattern.goals.entries()) {
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
    const offer = this.button(
      readyToOffer ? '✦ Ready — Offer Pattern' : 'Offer Pattern',
      this.actions.offer,
      'offer',
      !readyToOffer || (locked && lesson !== 'offer'),
      'offer',
    );
    if (readyToOffer) {
      offer.classList.add('is-ready');
      offer.setAttribute('aria-label', 'Pattern complete. Ready to offer.');
    }
    task.append(label, title, goals, offer);
    if (activeOrders.length > 1) {
      const overflow = makeElement('div', 'crystalarium-portrait-order-rail');
      overflow.setAttribute('aria-label', 'Other active Resonance Orders, swipe sideways');
      for (const candidate of activeOrders.slice(1)) {
        const ready = queue ? canOfferQueuedPattern(queue, candidate.id) : false;
        const tile = this.button(
          candidate.title + (ready ? ' · Ready to offer' : ' · In progress'),
          () => this.actions.offerPattern(candidate.id),
          'quiet',
          !ready || locked,
          'offer-' + candidate.id,
        );
        tile.classList.add('crystalarium-portrait-extra-order');
        tile.dataset.crystalariumPatternId = candidate.id;
        tile.classList.toggle('is-ready', ready);
        tile.setAttribute('aria-label', 'Resonance Order: ' + candidate.title);
        overflow.append(tile);
      }
      task.append(overflow);
    }

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
      makeElement('span', 'crystalarium-portrait-board-count', '42 sockets · 7 × 6'),
    );
    const scrollCue = makeElement(
      'p',
      'crystalarium-portrait-scroll-cue',
      '↔ Swipe sideways to see the whole board',
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
      const allowedCell =
        !locked ||
        (lesson === 'pick-up' && index === view.guide?.sourceIndex) ||
        (lesson === 'merge' &&
          (index === view.guide?.sourceIndex || index === view.guide?.targetIndex));
      button.disabled = !allowedCell || (this.pendingBoardSlot !== null && piece !== null);
      button.classList.toggle(
        'is-storage-target',
        this.pendingBoardSlot !== null && piece === null,
      );
      button.classList.toggle('is-guide-focus', locked && allowedCell);
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
        if (this.pendingBoardSlot !== null) {
          if (piece === null) {
            const slot = this.pendingBoardSlot;
            this.pendingBoardSlot = null;
            this.actions.dragRestore(slot, index);
          }
        } else this.actions.cell(index);
      });
      grid.append(button);
    }
    scroller.append(grid);
    // These physical wells belong to the merge board's frame, not to the
    // generator controls. They never occupy or replace one of the 42 cells.
    const nursery = makeElement('fieldset', 'crystalarium-portrait-rooted-wells');
    nursery.setAttribute('aria-label', 'Crystal wells rooted in the board frame');
    const legend = makeElement('legend', 'crystalarium-portrait-wells-title', '✦ Growing wells');
    nursery.append(legend);
    for (const family of CRYSTAL_FAMILIES) {
      const unlocked = unlockedCrystalFamilies(state).includes(family);
      const well = this.button(
        unlocked ? `${CRYSTAL_NOTE_PRESENTATION[family].symbol} ${family} · Grow` : `🔒 ${family}`,
        () => this.actions.growFromWell(family),
        'rooted-well',
        locked,
        'well-' + family,
      );
      well.dataset.crystalariumWell = family;
      well.dataset.crystalariumUnlocked = unlocked ? 'true' : 'false';
      well.setAttribute(
        'aria-label',
        unlocked
          ? `Grow one free ${family} crystal from the board well`
          : `${family} well locked until ${family === 'bright' ? 4 : 7} patterns`,
      );
      well.classList.toggle('is-selected', state.selectedFamily === family);
      well.classList.toggle('is-locked', !unlocked);
      nursery.append(well);
    }
    boardSection.append(boardHeading, nursery, scrollCue, scroller);
    const helper = makeElement(
      'p',
      'crystalarium-portrait-hint',
      'Drag matching crystals together. The floating shelf below stores crystals safely.',
    );
    boardSection.append(helper);
    if (view.guide?.target === 'cell') grid.classList.add('is-guide-focus');

    const controls = makeElement('section', 'crystalarium-portrait-controls');
    controls.setAttribute('aria-label', 'Crystal Growing');
    controls.append(makeElement('h2', 'crystalarium-portrait-section-title', '✦ Crystal Growing'));
    controls.append(
      makeElement(
        'p',
        'crystalarium-portrait-growing-hint',
        'Tap a well attached to the board for a free shard. The Grow button below uses your selected family.',
      ),
    );
    const primary = makeElement('div', 'crystalarium-portrait-primary-actions');
    primary.append(
      this.button('Grow shard', this.actions.grow, 'primary', locked && lesson !== 'grow', 'grow'),
    );
    const refined = refinedSourceTier(state);
    if (refined !== null) {
      primary.append(
        this.button(
          refined === 2 ? 'Grow crystal' : 'Grow polished',
          this.actions.growRefined,
          'primary',
          locked,
          'grow-refined',
        ),
      );
    }
    controls.append(primary);
    if (view.guide?.target === 'grow' || view.guide?.target === 'grow-refined') {
      primary
        .querySelector('[data-crystalarium-action="' + view.guide.target + '"]')
        ?.classList.add('is-guide-focus');
    }
    if (view.guide?.target === 'offer') offer.classList.add('is-guide-focus');
    if (refined !== null) primary.classList.add('is-refined');

    const tools = makeElement('section', 'crystalarium-portrait-tools');
    tools.setAttribute('aria-label', 'Crystal Tools');
    tools.append(makeElement('h2', 'crystalarium-portrait-section-title', '✧ Crystal Tools'));
    tools.append(
      this.button(
        view.quiet ? 'Sound off' : view.globallyMuted ? 'Muted globally' : 'Sound on',
        this.actions.sound,
        'quiet',
        false,
        'sound',
      ),
    );
    const utility = makeElement('div', 'crystalarium-portrait-secondary-actions');
    utility.append(
      this.button('Harmony ♫', this.actions.harmony, 'standard', locked, 'harmony'),
      this.button(
        'Polish ✧',
        this.actions.polish,
        'standard',
        locked || state.completed < 30,
        'polish',
      ),
      this.button(
        'Shelf selected',
        this.actions.shelve,
        'standard',
        locked || view.selected === null,
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
    tools.append(utility);
    const shelf = makeElement('div', 'crystalarium-portrait-shelf');
    shelf.classList.toggle('is-open', this.storageOpen);
    const storedCount = state.shelf.filter(Boolean).length;
    const storageToggle = this.button(
      this.storageOpen ? '× Close Storage' : `Storage Chest ${storedCount}/${state.shelf.length}`,
      () => {
        this.storageOpen = !this.storageOpen;
        this.storageMoveSource = null;
        if (this.currentView) this.render(this.currentView);
      },
      'quiet',
      locked,
      'storage-toggle',
    );
    storageToggle.dataset.crystalariumStorageDrop = 'true';
    storageToggle.setAttribute('aria-expanded', String(this.storageOpen));
    shelf.append(storageToggle);
    if (this.pendingBoardSlot !== null) {
      shelf.append(
        this.button(
          'Cancel placement',
          () => {
            this.pendingBoardSlot = null;
            if (this.currentView) this.render(this.currentView);
          },
          'quiet',
          false,
          'storage-cancel',
        ),
      );
    }
    if (this.storageOpen) {
      shelf.append(
        makeElement(
          'p',
          'crystalarium-portrait-shelf-heading',
          `Storage Chamber • ${storedCount} of ${state.shelf.length} slots used`,
        ),
      );
      const shelfSlots = makeElement('div', 'crystalarium-portrait-shelf-slots');
      shelfSlots.setAttribute('role', 'group');
      shelfSlots.setAttribute('aria-label', 'Four by three Storage Chamber');
      for (let index = 0; index < state.shelf.length; index += 1) {
        const piece = state.shelf[index];
        const slot = this.button(
          piece ? CRYSTAL_TIER_NAMES[piece.tier] : 'Empty',
          () => this.activateStoredSlot(index),
          'shelf',
          locked || (piece === null && (!this.arrangingStorage || this.storageMoveSource === null)),
          'shelf-' + index,
          true,
        );
        slot.classList.toggle(
          'is-selected',
          this.arrangingStorage && this.storageMoveSource === index,
        );
        slot.setAttribute(
          'aria-label',
          piece
            ? `Stored crystal ${index + 1}: ${piece.family} ${CRYSTAL_TIER_NAMES[piece.tier]}`
            : `Empty Storage slot ${index + 1}`,
        );
        if (piece) slot.replaceChildren(createCrystalArtElement(piece));
        shelfSlots.append(slot);
      }
      shelf.append(shelfSlots);
      const storageActions = makeElement('div', 'crystalarium-portrait-storage-actions');
      storageActions.append(
        this.button(
          this.arrangingStorage ? 'Finish arranging' : 'Rearrange',
          () => {
            this.arrangingStorage = !this.arrangingStorage;
            this.storageMoveSource = null;
            if (this.currentView) this.render(this.currentView);
          },
          'quiet',
          locked,
          'storage-arrange',
        ),
      );
      const boardReturn = this.button(
        '↩ Board',
        () => {
          if (this.storageMoveSource !== null) {
            const slot = this.storageMoveSource;
            this.storageMoveSource = null;
            this.actions.restore(slot);
          }
        },
        'quiet',
        false,
        'storage-return',
      );
      boardReturn.dataset.crystalariumBoardReturn = 'true';
      boardReturn.setAttribute(
        'aria-label',
        'Drop a stored crystal to return to the first empty board socket',
      );
      storageActions.append(boardReturn);
      storageActions.append(
        this.button(
          'Choose board socket',
          () => {
            if (this.storageMoveSource !== null) {
              this.pendingBoardSlot = this.storageMoveSource;
              this.storageMoveSource = null;
              this.storageOpen = false;
              if (this.currentView) this.render(this.currentView);
            }
          },
          'quiet',
          this.storageMoveSource === null,
          'storage-choose-socket',
        ),
      );
      shelf.append(storageActions);
    }
    tools.append(
      this.button(
        view.resetArmed ? 'Confirm fresh board' : 'Fresh board',
        this.actions.fresh,
        view.resetArmed ? 'warning' : 'quiet',
        locked,
        'fresh',
      ),
    );
    if (locked) {
      for (const control of utility.querySelectorAll<HTMLButtonElement>('button')) {
        control.disabled = true;
      }
    }
    const status = makeElement('p', 'crystalarium-portrait-status', view.message);
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    // The three existing gameplay surfaces stay mounted, but only one is
    // exposed in the non-modal drawer. Saves and controller actions are shared.
    const backdrop = makeElement('div', 'crystalarium-portrait-menu-backdrop');
    backdrop.hidden = this.activeMenu === null;
    // Dismiss on a new pointer gesture, not a retargeted click originating
    // from the button that has just opened the panel.
    backdrop.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (this.activeMenu !== null) this.toggleMenu(this.activeMenu);
    });
    const menuPanel = makeElement('div', 'crystalarium-portrait-menu-panel');
    menuPanel.id = 'crystalarium-mobile-menu';
    menuPanel.hidden = this.activeMenu === null;
    menuPanel.setAttribute('role', 'region');
    menuPanel.setAttribute(
      'aria-label',
      'Crystalarium ' + (this.activeMenu ?? 'options') + ' panel',
    );
    const closeMenu = this.button(
      'Close ✕',
      () => {
        if (this.activeMenu !== null) this.toggleMenu(this.activeMenu);
      },
      'quiet',
      false,
      'close-menu',
    );
    const menuHead = makeElement('div', 'crystalarium-portrait-menu-heading');
    menuHead.append(
      makeElement(
        'strong',
        'crystalarium-portrait-menu-title',
        '✦ ' + (this.activeMenu ?? 'Options'),
      ),
      closeMenu,
    );
    task.hidden = this.activeMenu !== 'pattern';
    controls.hidden = this.activeMenu !== 'growing';
    tools.hidden = this.activeMenu !== 'tools';
    menuPanel.append(menuHead, task, controls, tools);
    this.root.replaceChildren(
      header,
      menuStrip,
      backdrop,
      menuPanel,
      guidePanel,
      boardSection,
      shelf,
      status,
    );
    this.syncMenuVisibility();
    // Recreating the 42-cell board must not snap a narrow phone back to column one.
    // Players need to keep later columns in view after selection, Grow and Offer.
    scroller.scrollLeft = boardScrollLeft;

    if (advanceFocus && nextLessonFocus !== null) {
      const selector = nextLessonFocus.startsWith('cell-')
        ? `[data-crystalarium-cell="${nextLessonFocus.slice(5)}"]`
        : `[data-crystalarium-action="${nextLessonFocus}"]`;
      const target = this.root.querySelector<HTMLButtonElement>(selector);
      if (target && !target.disabled) {
        target.focus({ preventScroll: true });
        target.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
    } else if (focusKey !== undefined) {
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
