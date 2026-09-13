import type Phaser from 'phaser';
import { UI_DESIGN_TOKENS } from './UiDesignSystem';

export interface CanvasDomOverlayBounds {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface CanvasDomOverlayPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  minCssWidth?: number;
  minCssHeight?: number;
  visibilityBounds?: CanvasDomOverlayBounds;
  visibilityMode?: 'intersect' | 'contain';
}

export interface OverlayRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CanvasDomOverlayStyle {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface OverlayRegistration {
  element: HTMLElement;
  resolve: () => CanvasDomOverlayPlacement | null;
}

function satisfiesVisibilityBounds(
  placement: CanvasDomOverlayPlacement,
  bounds: CanvasDomOverlayBounds,
): boolean {
  const left = placement.x;
  const top = placement.y;
  const right = placement.x + placement.width;
  const bottom = placement.y + placement.height;

  if (placement.visibilityMode === 'contain') {
    return left >= bounds.left && top >= bounds.top && right <= bounds.right && bottom <= bounds.bottom;
  }

  return right > bounds.left && left < bounds.right && bottom > bounds.top && top < bounds.bottom;
}

export function calculateCanvasDomOverlayStyle(
  canvasRect: OverlayRect,
  hostRect: OverlayRect,
  placement: CanvasDomOverlayPlacement,
): CanvasDomOverlayStyle | null {
  if (
    placement.visible === false ||
    (placement.visibilityBounds &&
      !satisfiesVisibilityBounds(placement, placement.visibilityBounds))
  ) {
    return null;
  }

  const scaleX = canvasRect.width / UI_DESIGN_TOKENS.viewport.logicalWidth;
  const scaleY = canvasRect.height / UI_DESIGN_TOKENS.viewport.logicalHeight;
  return {
    left: canvasRect.left - hostRect.left + placement.x * scaleX,
    top: canvasRect.top - hostRect.top + placement.y * scaleY,
    width: Math.max(
      placement.minCssWidth ?? UI_DESIGN_TOKENS.control.minimumTouchTargetPx,
      placement.width * scaleX,
    ),
    height: Math.max(
      placement.minCssHeight ?? UI_DESIGN_TOKENS.control.nativeHeightPx,
      placement.height * scaleY,
    ),
  };
}

export class CanvasDomOverlayBridge {
  private readonly registrations = new Set<OverlayRegistration>();

  public constructor(
    private readonly game: Phaser.Game,
    private readonly host: HTMLElement,
  ) {
    this.game.events.on('poststep', this.sync, this);
  }

  public register(
    element: HTMLElement,
    resolve: () => CanvasDomOverlayPlacement | null,
  ): () => void {
    element.style.position = 'absolute';
    element.style.boxSizing = 'border-box';
    element.style.zIndex = String(UI_DESIGN_TOKENS.depth.domOverlay);
    element.addEventListener('pointerdown', (event) => event.stopPropagation());
    this.host.append(element);

    const registration = { element, resolve };
    this.registrations.add(registration);
    this.syncOne(registration);

    return () => {
      this.registrations.delete(registration);
      element.remove();
    };
  }

  public destroy(): void {
    this.game.events.off('poststep', this.sync, this);
    for (const registration of this.registrations) registration.element.remove();
    this.registrations.clear();
  }

  private readonly sync = (): void => {
    for (const registration of this.registrations) this.syncOne(registration);
  };

  private syncOne(registration: OverlayRegistration): void {
    const placement = registration.resolve();
    const element = registration.element;
    if (!placement) {
      element.hidden = true;
      return;
    }

    const style = calculateCanvasDomOverlayStyle(
      this.game.canvas.getBoundingClientRect(),
      this.host.getBoundingClientRect(),
      placement,
    );
    if (!style) {
      element.hidden = true;
      return;
    }

    element.hidden = false;
    element.style.left = `${style.left}px`;
    element.style.top = `${style.top}px`;
    element.style.width = `${style.width}px`;
    element.style.height = `${style.height}px`;
  }
}
