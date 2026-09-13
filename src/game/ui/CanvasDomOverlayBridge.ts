import type Phaser from 'phaser';
import { UI_DESIGN_TOKENS } from './UiDesignSystem';

export interface CanvasDomOverlayPlacement {
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  minCssWidth?: number;
  minCssHeight?: number;
  clip?: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface OverlayRegistration {
  element: HTMLElement;
  resolve: () => CanvasDomOverlayPlacement | null;
}

function intersectsClip(
  placement: CanvasDomOverlayPlacement,
  clip: NonNullable<CanvasDomOverlayPlacement['clip']>,
): boolean {
  const left = placement.x;
  const top = placement.y;
  const right = placement.x + placement.width;
  const bottom = placement.y + placement.height;
  return right > clip.left && left < clip.right && bottom > clip.top && top < clip.bottom;
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
    if (
      !placement ||
      placement.visible === false ||
      (placement.clip && !intersectsClip(placement, placement.clip))
    ) {
      element.hidden = true;
      return;
    }

    const canvasRect = this.game.canvas.getBoundingClientRect();
    const hostRect = this.host.getBoundingClientRect();
    const scaleX = canvasRect.width / UI_DESIGN_TOKENS.viewport.logicalWidth;
    const scaleY = canvasRect.height / UI_DESIGN_TOKENS.viewport.logicalHeight;

    element.hidden = false;
    element.style.left = `${canvasRect.left - hostRect.left + placement.x * scaleX}px`;
    element.style.top = `${canvasRect.top - hostRect.top + placement.y * scaleY}px`;
    element.style.width = `${Math.max(
      placement.minCssWidth ?? UI_DESIGN_TOKENS.control.minimumTouchTargetPx,
      placement.width * scaleX,
    )}px`;
    element.style.height = `${Math.max(
      placement.minCssHeight ?? UI_DESIGN_TOKENS.control.nativeHeightPx,
      placement.height * scaleY,
    )}px`;
  }
}
