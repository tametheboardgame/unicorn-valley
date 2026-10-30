import type { CrystalariumGrowthCue } from './CrystalariumPortraitView';

const ASSETS = '/design-assets/crystalarium-c17/growth-potion-assets/';
const POUR_FRAMES = 12;
const FRAME_MS = 95;

function effectImage(className: string): HTMLImageElement {
  const image = document.createElement('img');
  image.className = className;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.decoding = 'async';
  image.draggable = false;
  return image;
}

/**
 * C20 visual-only use of the approved 12-frame pouring artwork. Only a
 * successful, persisted canonical growth action supplies a new cue. This
 * renderer never mutates saves, debits potion, or blocks another action.
 */
export class CrystalariumGrowthPotionFx {
  public readonly layer: HTMLDivElement;
  private lastCueId = 0;
  private readonly timers: number[] = [];

  public constructor() {
    this.layer = document.createElement('div');
    this.layer.className = 'crystalarium-live-growth-fx';
    this.layer.setAttribute('aria-hidden', 'true');
    // Lazy-loaded with the actual illustrated game, not on the game home screen.
    for (let index = 1; index <= POUR_FRAMES; index += 1) {
      const image = new Image();
      image.src = ASSETS + 'pour-' + String(index).padStart(2, '0') + '.webp';
    }
  }

  public render(root: HTMLElement, cue: CrystalariumGrowthCue | null | undefined): void {
    if (!cue || cue.id <= this.lastCueId) return;
    this.lastCueId = cue.id;
    this.cancel();
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const well = root.querySelector<HTMLElement>(
      '[data-crystalarium-action="well-' + cue.family + '"]',
    );
    const cell = root.querySelector<HTMLElement>(
      '[data-crystalarium-cell="' + cue.cellIndex + '"]',
    );
    if (!well || !cell) return;

    const rootBounds = root.getBoundingClientRect();
    const wellBounds = well.getBoundingClientRect();
    const cellBounds = cell.getBoundingClientRect();
    if (!wellBounds.width || !cellBounds.width) return;

    const pour = effectImage('crystalarium-live-pour-frame');
    const size = Math.max(115, Math.min(190, wellBounds.width * 1.65));
    pour.style.width = size + 'px';
    pour.style.height = size + 'px';
    pour.style.left = wellBounds.left - rootBounds.left + (wellBounds.width - size) / 2 + 'px';
    pour.style.top = Math.max(0, wellBounds.top - rootBounds.top - size * 0.68) + 'px';

    const splash = effectImage('crystalarium-live-pour-splash');
    splash.style.width = Math.max(56, Math.min(96, wellBounds.width * 1.1)) + 'px';
    splash.style.left =
      wellBounds.left - rootBounds.left + wellBounds.width / 2 - 42 + 'px';
    splash.style.top =
      wellBounds.top - rootBounds.top + wellBounds.height * 0.27 + 'px';

    const growth = effectImage('crystalarium-live-crystal-emergence');
    growth.style.width = cellBounds.width + 10 + 'px';
    growth.style.height = cellBounds.height + 10 + 'px';
    growth.style.left = cellBounds.left - rootBounds.left - 5 + 'px';
    growth.style.top = cellBounds.top - rootBounds.top - 5 + 'px';
    this.layer.append(pour, splash, growth);
    this.layer.dataset.crystalariumGrowthId = String(cue.id);
    this.layer.dataset.crystalariumGrowthFamily = cue.family;
    this.layer.dataset.crystalariumGrowthCell = String(cue.cellIndex);

    for (let frame = 0; frame < POUR_FRAMES; frame += 1) {
      this.timers.push(
        window.setTimeout(() => {
          pour.src = ASSETS + 'pour-' + String(frame + 1).padStart(2, '0') + '.webp';
          pour.dataset.crystalariumPourFrame = String(frame + 1);
          if (frame >= 7 && frame <= 10) {
            splash.src =
              ASSETS + 'splash-' + String(frame - 6).padStart(2, '0') + '.webp';
            growth.src =
              ASSETS + 'growth-' + String(frame - 6).padStart(2, '0') + '.webp';
          }
        }, frame * FRAME_MS),
      );
    }
    this.timers.push(window.setTimeout(() => this.cancel(), POUR_FRAMES * FRAME_MS + 160));
  }

  public destroy(): void {
    this.cancel();
    this.layer.remove();
  }

  private cancel(): void {
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.length = 0;
    this.layer.replaceChildren();
    delete this.layer.dataset.crystalariumGrowthId;
    delete this.layer.dataset.crystalariumGrowthFamily;
    delete this.layer.dataset.crystalariumGrowthCell;
  }
}
