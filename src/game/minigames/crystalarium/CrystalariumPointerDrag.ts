import { createCrystalArtElement } from './CrystalariumCrystalArt';
import type { CrystalPiece } from './CrystalariumOpeningRules';

export interface CrystalariumDragActions {
  move(source: number, target: number): void;
  shelve(source: number): void;
  wash(source: number): void;
  restore(source: number, target: number): void;
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

  public constructor(
    private readonly root: HTMLElement,
    private readonly actions: CrystalariumDragActions,
    private readonly getPiece: (origin: { kind: 'cell' | 'shelf'; index: number }) => CrystalPiece | null,
  ) {
    root.addEventListener('pointerdown', this.onDown);
    root.addEventListener('pointermove', this.onMove);
    root.addEventListener('pointerup', this.onUp);
    root.addEventListener('pointercancel', this.onCancel);
    root.addEventListener('click', this.onClickCapture, true);
  }

  private readonly onClickCapture = (event: MouseEvent): void => {
    if (Date.now() - this.lastDropAt > 250) return;
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
    (cell ?? shelf)?.setPointerCapture(event.pointerId);
  };

  private readonly onMove = (event: PointerEvent): void => {
    const current = this.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    if (!current.dragging && Math.hypot(dx, dy) < 10) return;
    if (!current.dragging) {
      current.dragging = true;
      const ghost = document.createElement('div');
      ghost.className = 'crystalarium-drag-ghost';
      ghost.append(createCrystalArtElement(current.origin.piece));
      document.body.append(ghost);
      current.ghost = ghost;
      this.root.classList.add('is-dragging-crystal');
    }
    event.preventDefault();
    current.ghost?.style.setProperty('left', event.clientX + 'px');
    current.ghost?.style.setProperty('top', event.clientY + 'px');
  };

  private readonly onUp = (event: PointerEvent): void => {
    const current = this.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.dragging) {
      this.clear();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target?.closest<HTMLElement>('[data-crystalarium-cell]');
    const shelf = target?.closest<HTMLElement>('[data-crystalarium-action^="shelf-"]');
    const wash = target?.closest<HTMLElement>('[data-crystalarium-action="wash"]');
    this.lastDropAt = Date.now();
    this.clear();
    if (current.origin.kind === 'cell') {
      if (cell && Number(cell.dataset.crystalariumCell) !== current.origin.index) {
        this.actions.move(current.origin.index, Number(cell.dataset.crystalariumCell));
      } else if (shelf) {
        this.actions.shelve(current.origin.index);
      } else if (wash) {
        this.actions.wash(current.origin.index);
      } else {
        this.actions.invalid();
      }
    } else if (cell) {
      this.actions.restore(current.origin.index, Number(cell.dataset.crystalariumCell));
    } else {
      this.actions.invalid();
    }
  };

  private readonly onCancel = (): void => this.clear();

  private clear(): void {
    this.current?.ghost?.remove();
    this.current = null;
    this.root.classList.remove('is-dragging-crystal');
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
