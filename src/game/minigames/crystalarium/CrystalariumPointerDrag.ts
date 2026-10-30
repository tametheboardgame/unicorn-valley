import { createCrystalArtElement } from './CrystalariumCrystalArt';
import { combineCrystalPieces, type CrystalPiece } from './CrystalariumOpeningRules';

export interface CrystalariumDragActions {
  move(source: number, target: number): void;
  shelve(source: number): void;
  wash(source: number): void;
  restore(source: number, target: number): void;
  tapShelf(source: number): void;
  invalid(): void;
}
type Origin = { kind: 'cell' | 'shelf'; index: number; piece: CrystalPiece };
interface CurrentDrag {
  pointerId: number;
  origin: Origin;
  x: number;
  y: number;
  dragging: boolean;
  ghost: HTMLElement | null;
}

/** DOM pointer handling is deliberately presentation-only: rules and saves stay in FullMode. */
export class CrystalariumPointerDrag {
  private current: CurrentDrag | null = null;
  private lastDropAt = 0;
  private lastShelfTapAt = 0;
  private lastShelfTapIndex = -1;

  public constructor(
    private readonly root: HTMLElement,
    private readonly actions: CrystalariumDragActions,
    private readonly getPiece: (origin: {
      kind: 'cell' | 'shelf';
      index: number;
    }) => CrystalPiece | null,
  ) {
    root.addEventListener('pointerdown', this.onDown);
    root.addEventListener('pointermove', this.onMove);
    root.addEventListener('pointerup', this.onUp);
    root.addEventListener('pointercancel', this.onCancel);
    root.addEventListener('click', this.onClickCapture, true);
  }

  private readonly onClickCapture = (event: MouseEvent): void => {
    // The pointer-up already restored an occupied Storage slot. Ignore only
    // the synthetic follow-up click for that exact slot, not other controls.
    const tappedShelf =
      event.target instanceof Element
        ? event.target.closest<HTMLElement>('[data-crystalarium-action^="shelf-"]')
        : null;
    if (
      tappedShelf &&
      Date.now() - this.lastShelfTapAt < 500 &&
      Number(tappedShelf.dataset.crystalariumAction?.slice(6)) === this.lastShelfTapIndex
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    if (Date.now() - this.lastDropAt > 250) return;
    // A drag may generate a synthetic click on the board/drop source. Never
    // swallow a subsequent genuine tap on a stored crystal or the close cross.
    if (event.target instanceof Element && event.target.closest('.crystalarium-live-storage')) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  private readonly onDown = (event: PointerEvent): void => {
    if (this.current || !(event.target instanceof Element)) return;
    const cell = event.target.closest<HTMLElement>('[data-crystalarium-cell]');
    const shelf = event.target.closest<HTMLElement>('[data-crystalarium-action^="shelf-"]');
    const origin = cell
      ? { kind: 'cell' as const, index: Number(cell.dataset.crystalariumCell) }
      : shelf
        ? { kind: 'shelf' as const, index: Number(shelf.dataset.crystalariumAction?.slice(6)) }
        : null;
    if (!origin) return;
    const piece = this.getPiece(origin);
    if (!piece) return;
    this.current = {
      pointerId: event.pointerId,
      origin: { ...origin, piece },
      x: event.clientX,
      y: event.clientY,
      dragging: false,
      ghost: null,
    };
  };

  private readonly onMove = (event: PointerEvent): void => {
    const current = this.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.dragging && Math.hypot(dx, dy) < 10) return;
    if (!current.dragging) {
      current.dragging = true;
      // A plain tap must complete as a native button click; only a genuine
      // drag captures the pointer. Capturing every tap can swallow its click.
      const source = this.root.querySelector<HTMLElement>(
        current.origin.kind === 'cell'
          ? '[data-crystalarium-cell="' + current.origin.index + '"]'
          : '[data-crystalarium-action="shelf-' + current.origin.index + '"]',
      );
      source?.setPointerCapture(event.pointerId);
      const ghost = document.createElement('div');
      ghost.className = 'crystalarium-drag-ghost';
      ghost.append(createCrystalArtElement(current.origin.piece));
      document.body.append(ghost);
      current.ghost = ghost;
      this.root.classList.add('is-dragging-crystal');
      this.showDropTargets(current.origin);
    }
    event.preventDefault();
    current.ghost?.style.setProperty('left', event.clientX + 'px');
    current.ghost?.style.setProperty('top', event.clientY + 'px');
    this.showHoveredTarget(event.clientX, event.clientY);
  };

  private readonly onUp = (event: PointerEvent): void => {
    const current = this.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.dragging) {
      this.clear();
      if (current.origin.kind === 'shelf') {
        this.lastShelfTapAt = Date.now();
        this.lastShelfTapIndex = current.origin.index;
        this.actions.tapShelf(current.origin.index);
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target?.closest<HTMLElement>('[data-crystalarium-cell]');
    const shelf = target?.closest<HTMLElement>('[data-crystalarium-action^="shelf-"]');
    const storageDock = target?.closest<HTMLElement>('[data-crystalarium-storage-drop]');
    const wash = target?.closest<HTMLElement>(
      '[data-crystalarium-action="wash"], [data-crystalarium-action="wash-dock"]',
    );
    this.lastDropAt = Date.now();
    this.clear();
    if (current.origin.kind === 'cell') {
      if (cell && Number(cell.dataset.crystalariumCell) !== current.origin.index) {
        this.actions.move(current.origin.index, Number(cell.dataset.crystalariumCell));
      } else if (shelf || storageDock) {
        this.actions.shelve(current.origin.index);
      } else if (wash) {
        this.actions.wash(current.origin.index);
      } else {
        this.actions.invalid();
      }
    } else if (cell) {
      this.actions.restore(current.origin.index, Number(cell.dataset.crystalariumCell));
    } else if (
      shelf &&
      Number(shelf.dataset.crystalariumAction?.slice(6)) === current.origin.index
    ) {
      // Small touch movement inside the same slot is still one tap.
      this.lastShelfTapAt = Date.now();
      this.lastShelfTapIndex = current.origin.index;
      this.actions.tapShelf(current.origin.index);
    } else {
      this.actions.invalid();
    }
  };

  private readonly onCancel = (): void => this.clear();

  /** Preview legal destinations without mutating the controller or saved state. */
  private showDropTargets(origin: Origin): void {
    for (const cell of this.root.querySelectorAll<HTMLElement>('[data-crystalarium-cell]')) {
      const index = Number(cell.dataset.crystalariumCell);
      const other = this.getPiece({ kind: 'cell', index });
      const valid =
        (origin.kind !== 'cell' || index !== origin.index) &&
        (!other || (origin.kind === 'cell' && combineCrystalPieces(origin.piece, other) !== null));
      cell.dataset.crystalariumDrop =
        origin.kind === 'cell' && index === origin.index ? 'origin' : valid ? 'valid' : 'blocked';
    }
    const shelfFull = Array.from({ length: 4 }, (_, index) =>
      this.getPiece({ kind: 'shelf', index }),
    ).every(Boolean);
    for (const shelf of this.root.querySelectorAll<HTMLElement>(
      '[data-crystalarium-action^="shelf-"]',
    )) {
      shelf.dataset.crystalariumDrop = origin.kind === 'cell' && !shelfFull ? 'valid' : 'blocked';
    }
    for (const storageDock of this.root.querySelectorAll<HTMLElement>(
      '[data-crystalarium-storage-drop]',
    )) {
      storageDock.dataset.crystalariumDrop =
        origin.kind === 'cell' && !shelfFull ? 'valid' : 'blocked';
    }
    for (const wash of this.root.querySelectorAll<HTMLElement>(
      '[data-crystalarium-action="wash"], [data-crystalarium-action="wash-dock"]',
    )) {
      wash.dataset.crystalariumDrop = origin.kind === 'cell' ? 'valid' : 'blocked';
    }
  }

  private showHoveredTarget(x: number, y: number): void {
    for (const previous of this.root.querySelectorAll<HTMLElement>('[data-crystalarium-over]')) {
      delete previous.dataset.crystalariumOver;
    }
    const target = document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>('[data-crystalarium-drop]');
    if (target && this.root.contains(target)) {
      target.dataset.crystalariumOver = 'true';
    }
  }

  private clear(): void {
    this.current?.ghost?.remove();
    this.current = null;
    this.root.classList.remove('is-dragging-crystal');
    for (const target of this.root.querySelectorAll<HTMLElement>('[data-crystalarium-drop]')) {
      delete target.dataset.crystalariumDrop;
      delete target.dataset.crystalariumOver;
    }
  }

  public destroy(): void {
    this.clear();
    this.root.removeEventListener('pointerdown', this.onDown);
    this.root.removeEventListener('pointermove', this.onMove);
    this.root.removeEventListener('pointerup', this.onUp);
    this.root.removeEventListener('pointercancel', this.onCancel);
    this.root.removeEventListener('click', this.onClickCapture, true);
  }
}
