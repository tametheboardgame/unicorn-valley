import {
  CRYSTAL_FAMILIES,
  FULL_CELL_COUNT,
  FULL_COLUMNS,
  activeResonancePattern,
  canOfferPattern,
  refinedSourceTier,
  unlockedCrystalFamilies,
} from './CrystalariumFullRules';
import { CRYSTAL_TIER_NAMES, type CrystalPiece } from './CrystalariumOpeningRules';
import { CrystalariumPointerDrag } from './CrystalariumPointerDrag';
import { CrystalariumGrowthPotionFx } from './CrystalariumGrowthPotionFx';
import { activeResonanceQueue, canOfferQueuedPattern } from './CrystalariumMultiOrderRules';
import { POTION_CAPACITY, potionChamber } from './CrystalariumPotionRules';
import type {
  CrystalariumPortraitActions,
  CrystalariumPortraitPresentation,
} from './CrystalariumPortraitView';
import './CrystalariumIllustratedView.css';

const ASSETS = '/design-assets/crystalarium-c17/';
const sprite = (piece: CrystalPiece): string =>
  ASSETS + 'crystal-' + piece.family + '-tier-' + piece.tier + '.webp';

function node<K extends keyof HTMLElementTagNameMap>(
  name: K,
  className: string,
  content?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(name);
  element.className = className;
  if (content !== undefined) element.textContent = content;
  return element;
}

function image(url: string, alt = ''): HTMLImageElement {
  const element = document.createElement('img');
  element.src = url;
  element.alt = alt;
  element.decoding = 'async';
  return element;
}

/**
 * C17/C21 real-game visual integration candidate. It presents the EXISTING
 * CrystalariumFullMode state/actions and does not invent an economy, order
 * queue or save schema. Default on World draft builds; diagnostics retain
 * classic Phaser unless explicitly opting in with ?crystalariumLiveArt=1.
 */
export class CrystalariumIllustratedView {
  public static enabled(): boolean {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    // Diagnostics stay on the established Phaser presentation unless the
    // browser test explicitly opts into the live illustrated view.
    // The preview build presents approved artwork by default to real players.
    const mode = params.get('crystalariumLiveArt');
    if (mode === '0' || mode === 'classic') return false;
    return mode === '1' || !params.has('diagnostics');
  }

  private readonly root: HTMLElement;
  private readonly dragging: CrystalariumPointerDrag;
  private readonly actions: CrystalariumPortraitActions;
  private readonly growthFx = new CrystalariumGrowthPotionFx();
  private latest: CrystalariumPortraitPresentation | null = null;
  private storageOpen = false;
  // Shift+Enter is the accessible equivalent of dragging between Storage slots.
  private storageKeyboardSource: number | null = null;

  public constructor(actions: CrystalariumPortraitActions) {
    this.actions = actions;
    this.root = node('section', 'crystalarium-live');
    this.root.setAttribute('role', 'region');
    this.root.setAttribute('aria-label', 'Crystalarium illustrated live game');
    this.root.dataset.crystalariumLive = 'true';
    // Native buttons must not propagate presses to Phaser canvas controls.
    for (const name of ['pointerdown', 'pointerup', 'pointercancel', 'click']) {
      this.root.addEventListener(name, (event) => event.stopPropagation());
    }
    this.root.addEventListener('keydown', (event) => {
      event.stopPropagation();
      if (event.key === 'Escape') {
        event.preventDefault();
        if (this.storageOpen) {
          this.storageOpen = false;
          this.storageKeyboardSource = null;
          this.renderCurrent();
        } else if (this.latest?.guide) {
          this.actions.skipGuide();
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
        shelve: (index, targetSlot) => {
          this.storageOpen = true;
          actions.dragShelve(index, targetSlot);
        },
        wash: actions.dragWash,
        restore: actions.dragRestore,
        tapShelf: (index) => this.activateStoredSlot(index),
        rearrange: (source, target) => {
          this.storageKeyboardSource = null;
          actions.moveStored(source, target);
        },
        invalid: actions.dragInvalid,
      },
      ({ kind, index }) =>
        (kind === 'cell' ? this.latest?.state.cells[index] : this.latest?.state.shelf[index]) ??
        null,
    );
  }

  private activateStoredSlot(index: number): void {
    if (!this.latest?.state.shelf[index]) return;
    this.storageKeyboardSource = null;
    this.actions.restore(index);
  }

  /** A keyboard alternative to drag-and-drop, with no visible mode controls. */
  private rearrangeStorageByKeyboard(index: number): void {
    if (this.storageKeyboardSource === null) {
      if (!this.latest?.state.shelf[index]) return;
      this.storageKeyboardSource = index;
      this.renderCurrent();
      return;
    }
    const source = this.storageKeyboardSource;
    this.storageKeyboardSource = null;
    if (source === index) this.renderCurrent();
    else this.actions.moveStored(source, index);
  }

  private button(
    text: string,
    command: string,
    callback: () => void,
    disabled = false,
    pointerActivate = false,
  ): HTMLButtonElement {
    const element = node('button', 'crystalarium-live-button', text);
    element.type = 'button';
    element.disabled = disabled;
    element.dataset.crystalariumAction = command;
    if (pointerActivate) {
      let down: { id: number; x: number; y: number } | null = null;
      element.addEventListener('pointerdown', (event) => {
        if (!element.disabled && event.isPrimary && event.button === 0) {
          down = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }
      });
      element.addEventListener('pointercancel', () => {
        down = null;
      });
      element.addEventListener('pointerup', (event) => {
        const start = down;
        down = null;
        if (!start || event.pointerId !== start.id || element.disabled) return;
        if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 12) return;
        const bounds = element.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        ) {
          return;
        }
        // The controller may replace the button synchronously after growth.
        // Act on pointer-up rather than relying on a later synthetic click
        // against a button that is no longer in the document.
        callback();
      });
    }
    element.addEventListener('click', (event) => {
      // Native pointer clicks were already handled on pointer-up; detail=0
      // preserves Enter, Space and programmatic accessibility activation.
      if (!element.disabled && (!pointerActivate || event.detail === 0)) callback();
    });
    return element;
  }

  private iconButton(
    command: string,
    label: string,
    icon: string,
    callback: () => void,
  ): HTMLButtonElement {
    const button = this.button('', command, callback);
    button.classList.add('is-icon');
    button.setAttribute('aria-label', label);
    button.append(image(ASSETS + 'context-controls/' + icon + '.svg'));
    return button;
  }

  private renderCurrent(): void {
    if (this.latest) this.render(this.latest);
  }

  public render(view: CrystalariumPortraitPresentation): void {
    this.dragging.cancelActiveGesture();
    this.latest = view;
    const active = document.activeElement;
    const selectedKey =
      active instanceof HTMLElement
        ? (active.dataset.crystalariumCell ?? active.dataset.crystalariumAction ?? null)
        : null;
    const restoreCell =
      active instanceof HTMLElement && active.dataset.crystalariumCell !== undefined;
    const scrollLeft =
      this.root.querySelector<HTMLElement>('.crystalarium-live-orders-scroll')?.scrollLeft ?? 0;
    const { state } = view;
    this.root.dataset.crystalariumShelfCapacity = String(state.shelf.length);
    const prompt = view.guide;
    const activeLesson = prompt?.lessonStep;
    const firstLesson = activeLesson !== undefined;
    const queue = potionChamber(state);
    const patterns = queue ? activeResonanceQueue(queue) : [];
    const pattern = patterns[0] ?? activeResonancePattern(state);

    const unlocked = unlockedCrystalFamilies(state);
    const storedCount = state.shelf.filter(Boolean).length;

    const header = node('header', 'crystalarium-live-header');
    const heading = node('div', 'crystalarium-live-heading');
    heading.append(
      node('h1', '', 'Crystalarium'),
      node('small', '', view.source === 'world' ? 'Crystal Brook Garden' : 'Just Games Songbook'),
    );
    const headerButtons = node('nav', 'crystalarium-live-header-actions');
    headerButtons.setAttribute('aria-label', 'Crystalarium navigation');
    headerButtons.append(
      this.iconButton(
        'guide',
        prompt ? 'Skip guide' : 'Show guide',
        'help',
        prompt ? this.actions.skipGuide : this.actions.guide,
      ),
      this.iconButton(
        'sound',
        'Toggle sound',
        view.quiet || view.globallyMuted ? 'sound-off' : 'sound-on',
        this.actions.sound,
      ),
      this.iconButton('exit', 'Leave and save', 'leave', this.actions.exit),
    );
    header.append(heading, headerButtons);

    const scene = node('div', 'crystalarium-live-scene');
    const garden = node('section', 'crystalarium-live-garden');
    garden.setAttribute('aria-label', 'Seven by six crystal merge board');
    const gardenTitle = node('div', 'crystalarium-live-section-title');
    gardenTitle.append(node('h2', '', 'Crystal Garden'));
    const boardViewport = node('div', 'crystalarium-live-board-viewport');
    const frame = node('div', 'crystalarium-live-frame');
    const board = node('div', 'crystalarium-live-grid');
    board.setAttribute('role', 'group');
    board.setAttribute('aria-label', 'Crystal sockets');
    for (let index = 0; index < FULL_CELL_COUNT; index += 1) {
      const piece = state.cells[index];
      const lessonCell =
        (activeLesson === 'pick-up' && prompt?.sourceIndex === index) ||
        (activeLesson === 'merge' &&
          (prompt?.sourceIndex === index || prompt?.targetIndex === index));
      const cell = this.button(
        '',
        'cell-' + index,
        () => this.actions.cell(index),
        firstLesson && !lessonCell,
      );
      cell.classList.add('crystalarium-live-cell');
      cell.dataset.crystalariumCell = String(index);
      cell.classList.toggle('is-selected', view.selected === index);
      cell.classList.toggle(
        'is-guide-focus',
        Boolean(activeLesson === 'pick-up' && prompt?.sourceIndex === index) ||
          Boolean(activeLesson === 'merge' && prompt?.targetIndex === index),
      );
      cell.setAttribute(
        'aria-label',
        piece
          ? 'Socket ' + (index + 1) + ': ' + piece.family + ' ' + CRYSTAL_TIER_NAMES[piece.tier]
          : 'Socket ' + (index + 1) + ': empty',
      );
      if (piece) cell.append(image(sprite(piece)));
      board.append(cell);
    }
    // The approved portrait-proportioned grid is the entire board.
    // A plain CSS border follows the sockets; no decorative image overlays.
    frame.append(board);
    boardViewport.append(frame);
    const gardenFooter = node('div', 'crystalarium-live-board-footer');
    const storageButton = this.button(
      'Storage ' + storedCount + '/' + state.shelf.length,
      'storage',
      () => {
        this.storageOpen = true;
        this.renderCurrent();
      },
      firstLesson,
    );
    storageButton.classList.add('crystalarium-live-storage-entry');
    storageButton.classList.toggle('is-guide-focus', prompt?.stage === 'shelf');
    storageButton.dataset.crystalariumStorageDrop = 'true';
    storageButton.setAttribute(
      'aria-label',
      'Open Storage, ' + storedCount + ' of ' + state.shelf.length + ' slots occupied',
    );
    storageButton.prepend(image(ASSETS + 'storage-chamber/storage-chest-closed.svg'));
    gardenFooter.append(storageButton);
    garden.append(gardenTitle, boardViewport, gardenFooter);

    const producers = node('aside', 'crystalarium-live-producers');
    producers.setAttribute('aria-label', 'Growth Potion and crystal wells');
    const potion = node('section', 'crystalarium-live-potion');
    const fill = state.potion / POTION_CAPACITY;
    const bottle = fill === 0 ? 'empty' : fill < 0.26 ? 'low' : fill < 0.64 ? 'medium' : fill < 0.9 ? 'high' : 'full';
    const progress = node('progress', 'crystalarium-live-potion-meter');
    progress.max = POTION_CAPACITY;
    progress.value = state.potion;
    progress.setAttribute('aria-label', 'Growth Potion remaining');
    const spring = this.button(
      'Brook Spring +25',
      'potion-refill',
      this.actions.refillPotion,
      state.potion === POTION_CAPACITY,
    );
    spring.setAttribute('aria-label', 'Refill Growth Potion with 25 free drops from Brook Spring');
    potion.append(
      node('h2', '', 'Growth Potion'),
      image(
        ASSETS + 'growth-potion-assets/reservoir-' + bottle + '.webp',
        'Growth Potion reservoir, ' + state.potion + ' of ' + POTION_CAPACITY + ' drops',
      ),
      node('strong', 'crystalarium-live-potion-count', state.potion + ' / ' + POTION_CAPACITY),
      progress,
      spring,
    );
    producers.append(potion);
    CRYSTAL_FAMILIES.forEach((family) => {
      const available = unlocked.includes(family);
      const well = this.button(
        '',
        'well-' + family,
        () => this.actions.growFromWell(family),
        !available || (firstLesson && activeLesson !== 'grow'),
        true,
      );
      well.classList.add('crystalarium-live-well');
      const isGrowTarget = activeLesson === 'grow' && available && family === state.selectedFamily;
      well.classList.toggle('is-guide-focus', isGrowTarget);
      if (isGrowTarget) {
        well.dataset.crystalariumGuideTarget = 'true';
        well.setAttribute('aria-label', 'Tutorial: tap the glowing Low generator to grow a shard');
      }
      well.classList.toggle('is-locked', !available);
      if (family === state.selectedFamily && available) well.classList.add('is-active');
      const generator =
        family === 'low'
          ? 'generator-sky-blue.webp'
          : family === 'bright'
            ? 'generator-forest-green.webp'
            : 'generator-moon-purple.webp';
      well.append(
        image(ASSETS + generator),
        node('strong', '', family === 'low' ? 'Low' : family === 'bright' ? 'Bright' : 'Bell'),
        node('small', '', available ? 'Tap to grow' : 'Locked'),
      );
      producers.append(well);
    });
    // The upgrade is presented with the generators, not in the Garden Tools.
    if (refinedSourceTier(state) !== null) {
      const refined = this.button(
        'Grow refined',
        'grow-refined',
        this.actions.growRefined,
        firstLesson,
      );
      refined.classList.add('crystalarium-live-refined-control');
      producers.append(refined);
    }

    const orders = node('section', 'crystalarium-live-orders');
    const ordersTitle = node('div', 'crystalarium-live-section-title');
    ordersTitle.append(node('h2', '', 'Resonance Orders'), node('small', '', 'Scroll sideways'));
    const orderHelp = node(
      'p',
      'crystalarium-live-orders-caption',
      'Fulfil the illustrated crystal requirements',
    );
    const orderRow = node('div', 'crystalarium-live-orders-row');
    const rail = node('div', 'crystalarium-live-orders-scroll');
    rail.setAttribute('aria-label', 'Current Resonance Orders');
    const visible = patterns.length > 0 ? patterns : pattern ? [pattern] : [];
    for (const [index, activePattern] of visible.entries()) {
      const ready = queue ? canOfferQueuedPattern(queue, activePattern.id) : canOfferPattern(state);
      const offering = ready && (!firstLesson || (index === 0 && activeLesson === 'offer'));
      const card = this.button(
        '',
        index === 0 ? 'offer' : 'offer-' + activePattern.id,
        () => this.actions.offerPattern(activePattern.id),
        !offering,
      );
      card.classList.add('crystalarium-live-order-card');
      card.classList.toggle('has-two-goals', activePattern.goals.length === 2);
      card.classList.toggle('has-three-goals', activePattern.goals.length >= 3);
      card.classList.toggle('is-guide-focus', index === 0 && activeLesson === 'offer');
      card.setAttribute('aria-label', 'Offer Resonance Order: ' + activePattern.title);
      card.classList.toggle('is-ready', ready);
      card.dataset.crystalariumPatternId = activePattern.id;
      card.dataset.cardArt = ready ? 'ready' : 'in-progress';
      card.append(node('strong', '', activePattern.title));
      const goals = node('div', 'crystalarium-live-goals');
      for (const goal of activePattern.goals) {
        const count = [...state.cells, ...state.shelf].filter(
          (piece) => piece?.family === goal.family && piece.tier === goal.tier,
        ).length;
        const item = node('div', 'crystalarium-live-goal');
        item.append(
          image(sprite({ family: goal.family, tier: goal.tier })),
          node('span', '', Math.min(count, goal.quantity) + ' / ' + goal.quantity),
        );
        goals.append(item);
      }
      card.append(goals);
      if (activePattern.harmonies) {
        card.append(
          node('small', '', 'Harmony ' + state.harmonies + ' / ' + activePattern.harmonies),
        );
      }
      card.append(node('em', '', ready ? 'Ready to offer' : 'In progress'));
      rail.append(card);
    }
    if (visible.length === 0) {
      const card = this.button('', 'offer', this.actions.offer, true);
      card.classList.add('crystalarium-live-order-card', 'is-complete');
      card.append(
        node('strong', '', 'All orders complete'),
        node('small', '', 'Enjoy free crystal growing'),
      );
      rail.append(card);
    }
    orderRow.append(rail);
    const orderFooter = node(
      'p',
      'crystalarium-live-order-foot',
      'Only an eligible glowing card can be offered.',
    );
    orders.append(ordersTitle, orderHelp, orderRow, orderFooter);

    const tools = node('section', 'crystalarium-live-tools');
    tools.append(node('h2', '', 'Garden Tools'));
    const toolRow = node('div', 'crystalarium-live-tool-row');
    const entries: readonly [string, string, string, () => void][] = [
      ['harmony', 'Harmony', 'harmony', this.actions.harmony],
      ['polish', 'Polish', 'polish', this.actions.polish],
      ['wash', 'Brook Wash', 'brook-wash', this.actions.wash],
      [
        'fresh',
        view.resetArmed ? 'Confirm new board' : 'Fresh Board',
        'fresh-board',
        this.actions.fresh,
      ],
    ];
    for (const [key, label, icon, action] of entries) {
      const allowed = !firstLesson;
      const tool = this.button('', key, action, !allowed);
      tool.classList.add('crystalarium-live-tool');
      tool.append(image(ASSETS + 'context-controls/' + icon + '.svg'), node('span', '', label));
      toolRow.append(tool);
    }
    tools.append(toolRow);

    // Keep gameplay feedback accessible without occupying the garden's
    // limited height with a permanent, low-value status strip.
    const message = node('div', 'crystalarium-live-sr-status', view.message);
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    scene.append(garden, producers, orders, tools);
    if (prompt) {
      // Put the tutorial in the order panel; it cannot compress the main board.
      // The genuine controller still enforces each first-lesson action.
      const guide = node('aside', 'crystalarium-live-guide');
      guide.setAttribute('aria-label', 'Crystalarium guide');
      guide.setAttribute('aria-live', 'polite');
      const instruction = node('div', 'crystalarium-live-guide-copy');
      instruction.append(
        node('strong', '', prompt.title),
        node(
          'span',
          '',
          activeLesson === 'grow'
            ? 'Tap the glowing Low generator in the middle to grow your first crystal.'
            : prompt.instruction,
        ),
      );
      guide.append(instruction, this.button('Skip guide', 'skip-guide', this.actions.skipGuide));
      orders.insertBefore(guide, orderRow);
    }
    const children: HTMLElement[] = [header, scene, message];

    if (this.storageOpen) {
      const layer = node('div', 'crystalarium-live-storage-backdrop');
      const chamber = node('section', 'crystalarium-live-storage');
      chamber.setAttribute('role', 'dialog');
      chamber.setAttribute('aria-modal', 'true');
      chamber.setAttribute('aria-label', 'Storage Chamber');
      const closeStorage = this.button('×', 'storage-close', () => {
        this.storageOpen = false;
        this.storageKeyboardSource = null;
        this.renderCurrent();
      });
      closeStorage.classList.add('crystalarium-live-storage-close');
      closeStorage.setAttribute('aria-label', 'Close Storage');
      closeStorage.title = 'Close Storage';
      chamber.append(
        closeStorage,
        node('h2', '', 'Storage Chamber'),
        node(
          'p',
          'crystalarium-live-storage-help',
          storedCount +
            ' / ' +
            state.shelf.length +
            ' slots used · Drag to rearrange · Tap to return to the board',
        ),
      );
      const slots = node('div', 'crystalarium-live-storage-grid');
      slots.setAttribute('role', 'group');
      slots.setAttribute('aria-label', 'Four by three crystal storage');
      for (let index = 0; index < state.shelf.length; index += 1) {
        const piece = state.shelf[index];
        const slot = this.button(
          '',
          'shelf-' + index,
          () => this.activateStoredSlot(index),
          false,
          true,
        );
        slot.classList.add('crystalarium-live-storage-slot');
        slot.classList.toggle('is-empty', !piece);
        slot.classList.toggle('is-selected', this.storageKeyboardSource === index);
        slot.setAttribute('aria-pressed', String(this.storageKeyboardSource === index));
        slot.setAttribute(
          'aria-label',
          piece
            ? 'Stored crystal ' +
                (index + 1) +
                ': ' +
                piece.family +
                ' ' +
                CRYSTAL_TIER_NAMES[piece.tier] +
                '. Activate to return to board; Shift+Enter to rearrange.'
            : 'Empty storage slot ' + (index + 1) + '. Shift+Enter to place a selected crystal.',
        );
        slot.addEventListener('keydown', (event) => {
          if (event.shiftKey && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            event.stopPropagation();
            this.rearrangeStorageByKeyboard(index);
          }
        });
        if (piece) slot.append(image(sprite(piece)));
        slots.append(slot);
      }
      chamber.append(slots);
      layer.append(chamber);
      children.push(layer);
    }
    // Reuse one pointer-transparent effect layer across DOM redraws. A cue
    // is consumed once, even if focus, sound or tutorial redraws this view.
    // Never detach the effect canvas during unrelated controller redraws.
    // Reparenting it on every button press can blank the active animation.
    const effectLayer = this.growthFx.layer;
    if (effectLayer.parentElement !== this.root) this.root.append(effectLayer);
    for (const child of Array.from(this.root.children)) {
      if (child !== effectLayer) child.remove();
    }
    for (const child of children) this.root.insertBefore(child, effectLayer);
    this.growthFx.render(this.root, view.growthCue);
    rail.scrollLeft = scrollLeft;
    if (this.storageOpen) {
      const focusSelector = selectedKey?.startsWith('shelf-')
        ? '[data-crystalarium-action="' + selectedKey + '"]'
        : '[data-crystalarium-action="storage-close"]';
      this.root.querySelector<HTMLButtonElement>(focusSelector)?.focus({ preventScroll: true });
    } else if (selectedKey) {
      const query =
        selectedKey === 'storage-close'
          ? '[data-crystalarium-action="storage"]'
          : restoreCell
            ? '[data-crystalarium-cell="' + selectedKey + '"]'
            : '[data-crystalarium-action="' + selectedKey + '"]';
      this.root.querySelector<HTMLButtonElement>(query)?.focus({ preventScroll: true });
    }
  }

  public destroy(): void {
    this.growthFx.destroy();
    this.dragging.destroy();
    this.root.remove();
    this.latest = null;
  }
}
