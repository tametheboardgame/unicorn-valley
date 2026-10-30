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
  private latest: CrystalariumPortraitPresentation | null = null;
  private storageOpen = false;

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
        shelve: actions.dragShelve,
        wash: actions.dragWash,
        restore: actions.dragRestore,
        invalid: actions.dragInvalid,
      },
      ({ kind, index }) =>
        (kind === 'cell' ? this.latest?.state.cells[index] : this.latest?.state.shelf[index]) ??
        null,
    );
  }

  private button(
    text: string,
    command: string,
    callback: () => void,
    disabled = false,
  ): HTMLButtonElement {
    const element = node('button', 'crystalarium-live-button', text);
    element.type = 'button';
    element.disabled = disabled;
    element.dataset.crystalariumAction = command;
    element.addEventListener('click', () => {
      if (!element.disabled) callback();
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
    const prompt = view.guide;
    const activeLesson = prompt?.lessonStep;
    const firstLesson = activeLesson !== undefined;
    const isReady = canOfferPattern(state);
    const pattern = activeResonancePattern(state);
    const unlocked = unlockedCrystalFamilies(state);

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
    gardenTitle.append(node('h2', '', 'Crystal Garden'), node('small', '', '7 × 6 · 42 sockets'));
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
    frame.append(
      node('div', 'crystalarium-live-underlay'),
      board,
      image(ASSETS + 'board-frame-only-approved-candidate.webp'),
    );
    frame.lastElementChild?.classList.add('crystalarium-live-frame-art');
    boardViewport.append(frame);
    const gardenFooter = node('div', 'crystalarium-live-board-footer');
    const storageButton = this.button(
      'Storage',
      'storage',
      () => {
        this.storageOpen = true;
        this.renderCurrent();
      },
      firstLesson,
    );
    storageButton.classList.add('crystalarium-live-storage-entry');
    storageButton.prepend(image(ASSETS + 'storage-chamber/storage-chest-closed.svg'));
    gardenFooter.append(storageButton, node('small', '', 'Three families · six tiers each'));
    garden.append(gardenTitle, boardViewport, gardenFooter);

    const producers = node('aside', 'crystalarium-live-producers');
    producers.setAttribute('aria-label', 'Growth Potion and crystal wells');
    const potion = node('section', 'crystalarium-live-potion');
    potion.append(
      node('h2', '', 'Growth Potion'),
      image(
        ASSETS + 'growth-potion-assets/reservoir-full.webp',
        'Decorative Growth Potion reservoir',
      ),
      node('small', '', 'Balance pending'),
    );
    producers.append(potion);
    CRYSTAL_FAMILIES.forEach((family) => {
      const available = unlocked.includes(family);
      const well = this.button(
        '',
        'well-' + family,
        () => this.actions.growFromWell(family),
        !available || firstLesson,
      );
      well.classList.add('crystalarium-live-well');
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
        node('small', '', available ? 'Grow shard' : 'Locked'),
      );
      producers.append(well);
    });

    const orders = node('section', 'crystalarium-live-orders');
    const ordersTitle = node('div', 'crystalarium-live-section-title');
    ordersTitle.append(node('h2', '', 'Resonance Orders'), node('small', '', 'Scroll sideways'));
    const orderHelp = node(
      'p',
      'crystalarium-live-orders-caption',
      'Live state · one active order until C18 queue migration',
    );
    const orderRow = node('div', 'crystalarium-live-orders-row');
    const rail = node('div', 'crystalarium-live-orders-scroll');
    rail.setAttribute('aria-label', 'Current Resonance Order');
    const inspecting = activeLesson === 'inspect';
    const offering = isReady && (!firstLesson || activeLesson === 'offer');
    const card = this.button(
      '',
      inspecting ? 'inspect-goal' : 'offer',
      inspecting ? this.actions.inspectGoal : this.actions.offer,
      !(pattern && (inspecting || offering)),
    );
    card.classList.add('crystalarium-live-order-card');
    card.classList.toggle('is-guide-focus', inspecting || activeLesson === 'offer');
    card.setAttribute('aria-label', inspecting ? 'Inspect the matching crystal goal' : 'Offer Resonance Order');
    card.classList.toggle('is-ready', isReady);
    card.style.backgroundImage =
      "url('" +
      ASSETS +
      'resonance-orders/order-card-' +
      (isReady ? 'ready' : 'in-progress') +
      ".webp')";
    if (pattern) {
      card.append(node('strong', '', pattern.title));
      const goals = node('div', 'crystalarium-live-goals');
      for (const goal of pattern.goals) {
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
      if (pattern.harmonies)
        card.append(node('small', '', 'Harmony ' + state.harmonies + ' / ' + pattern.harmonies));
      card.append(node('em', '', isReady ? 'Ready to offer' : 'In progress'));
    } else {
      card.append(
        node('strong', '', 'All orders complete'),
        node('small', '', 'Enjoy free crystal growing'),
      );
    }
    rail.append(card);
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
      ['guide', 'Guide', 'help', this.actions.guide],
      ['grow', 'Grow', 'skip-guide', this.actions.grow],
    ];
    for (const [key, label, icon, action] of entries) {
      const allowed = !firstLesson || (activeLesson === 'grow' && key === 'grow');
      const tool = this.button('', key, action, !allowed);
      tool.classList.add('crystalarium-live-tool');
      tool.classList.toggle('is-guide-focus', activeLesson === 'grow' && key === 'grow');
      if (activeLesson === 'grow' && key === 'grow') {
        tool.setAttribute('aria-label', 'Tutorial: Grow a crystal shard');
        tool.setAttribute('data-crystalarium-guide-target', 'true');
      }
      tool.append(image(ASSETS + 'context-controls/' + icon + '.svg'), node('span', '', label));
      toolRow.append(tool);
    }
    if (refinedSourceTier(state) !== null) {
      toolRow.append(
        this.button('Grow refined', 'grow-refined', this.actions.growRefined, firstLesson),
      );
    }
    tools.append(toolRow);

    const message = node('footer', 'crystalarium-live-message', view.message);
    message.setAttribute('aria-live', 'polite');
    scene.append(garden, producers, orders, tools);
    const children: HTMLElement[] = [header];
    if (prompt) {
      // Inline instructions never cover or intercept the board, wells or tools.
      // The genuine controller still enforces each first-lesson action.
      const guide = node('aside', 'crystalarium-live-guide');
      guide.setAttribute('aria-label', 'Crystalarium guide');
      guide.setAttribute('aria-live', 'polite');
      const instruction = node('div', 'crystalarium-live-guide-copy');
      instruction.append(
        node('strong', '', prompt.title),
        node('span', '', prompt.instruction),
      );
      guide.append(instruction, this.button('Skip guide', 'skip-guide', this.actions.skipGuide));
      children.push(guide);
    }
    children.push(scene, message);

    if (this.storageOpen) {
      const layer = node('div', 'crystalarium-live-storage-backdrop');
      const chamber = node('section', 'crystalarium-live-storage');
      chamber.setAttribute('role', 'dialog');
      chamber.setAttribute('aria-modal', 'true');
      chamber.setAttribute('aria-label', 'Storage Chamber');
      chamber.append(
        node('h2', '', 'Storage Chamber'),
        node('p', '', 'Current save: four shelf slots. Twelve-slot expansion follows C19.'),
      );
      const slots = node('div', 'crystalarium-live-storage-grid');
      for (let index = 0; index < 12; index += 1) {
        const piece = state.shelf[index];
        const slot = this.button(
          '',
          'shelf-' + index,
          () => {
            if (piece) this.actions.restore(index);
          },
          index >= state.shelf.length,
        );
        slot.classList.add('crystalarium-live-storage-slot');
        slot.setAttribute(
          'aria-label',
          index >= state.shelf.length
            ? 'Future storage slot, unavailable'
            : piece
              ? 'Return stored crystal ' + (index + 1)
              : 'Empty storage slot ' + (index + 1),
        );
        if (piece) slot.append(image(sprite(piece)));
        slots.append(slot);
      }
      chamber.append(slots);
      chamber.append(
        this.button('Store selected', 'shelve', this.actions.shelve, view.selected === null),
      );
      chamber.append(
        this.button('Return to Board', 'storage-close', () => {
          this.storageOpen = false;
          this.renderCurrent();
        }),
      );
      layer.append(chamber);
      children.push(layer);
    }
    this.root.replaceChildren(...children);
    rail.scrollLeft = scrollLeft;
    if (selectedKey) {
      const query = restoreCell
        ? '[data-crystalarium-cell="' + selectedKey + '"]'
        : '[data-crystalarium-action="' + selectedKey + '"]';
      this.root.querySelector<HTMLButtonElement>(query)?.focus({ preventScroll: true });
    }
  }

  public destroy(): void {
    this.dragging.destroy();
    this.root.remove();
    this.latest = null;
  }
}
