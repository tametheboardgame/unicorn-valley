import type { CrystalariumGrowthCue } from './CrystalariumPortraitView';

const ASSETS = '/design-assets/crystalarium-c17/growth-potion-assets/';
const POUR_FRAMES = 12;
const EFFECT_FRAMES = 4;
const FRAME_MS = 95;

function effectFrames(prefix: string, count: number, className: string): HTMLImageElement[] {
  return Array.from({ length: count }, (_, index) => {
    const image = document.createElement('img');
    image.className = className;
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.draggable = false;
    image.decoding = 'async';
    image.style.opacity = '0';
    // Each element has a permanent source; do not swap src while visible.
    image.src = ASSETS + prefix + '-' + String(index + 1).padStart(2, '0') + '.webp';
    return image;
  });
}

/**
 * Visual-only C20 pouring feedback after successful persisted well growth.
 * Decode all locked artwork once, retaining the images for later pours. The
 * previous implementation swapped src every 95ms, which could expose blank
 * decoding frames. Fixed-source layers now crossfade without that flicker.
 * No potion balance, gameplay, saves or growth timing is changed here.
 */
export class CrystalariumGrowthPotionFx {
  public readonly layer: HTMLDivElement;
  private readonly pours = effectFrames('pour', POUR_FRAMES, 'crystalarium-live-pour-frame');
  private readonly splashes = effectFrames(
    'splash',
    EFFECT_FRAMES,
    'crystalarium-live-pour-splash',
  );
  private readonly growths = effectFrames(
    'growth',
    EFFECT_FRAMES,
    'crystalarium-live-crystal-emergence',
  );
  private readonly imagesReady: Promise<boolean>;
  private readonly timers: number[] = [];
  private lastCueId = 0;
  private generation = 0;
  private destroyed = false;

  public constructor() {
    this.layer = document.createElement('div');
    this.layer.className = 'crystalarium-live-growth-fx';
    this.layer.setAttribute('aria-hidden', 'true');
    // C17 assets load only when entering the illustrated Crystalarium.
    // Decode before playback so no individual frame ever appears half-loaded.
    this.imagesReady = Promise.all(
      [...this.pours, ...this.splashes, ...this.growths].map((image) => image.decode()),
    ).then(
      () => true,
      () => false,
    );
  }

  public render(root: HTMLElement, cue: CrystalariumGrowthCue | null | undefined): void {
    if (this.destroyed || !cue || cue.id <= this.lastCueId) return;
    this.lastCueId = cue.id;
    this.cancel();
    const currentGeneration = this.generation;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    void this.imagesReady.then((ready) => {
      // New growth, leaving the game, or a failed art load cancels playback.
      // None of those cases affects the already saved crystal.
      if (!ready || this.destroyed || currentGeneration !== this.generation) return;
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

      const size = Math.max(115, Math.min(190, wellBounds.width * 1.65));
      const pourLeft = wellBounds.left - rootBounds.left + (wellBounds.width - size) / 2;
      const pourTop = Math.max(0, wellBounds.top - rootBounds.top - size * 0.68);
      for (const image of this.pours) {
        image.style.width = size + 'px';
        image.style.height = size + 'px';
        image.style.left = pourLeft + 'px';
        image.style.top = pourTop + 'px';
        image.style.opacity = '0';
      }

      const splashSize = Math.max(56, Math.min(96, wellBounds.width * 1.1));
      const splashLeft =
        wellBounds.left - rootBounds.left + wellBounds.width / 2 - splashSize / 2;
      const splashTop = wellBounds.top - rootBounds.top + wellBounds.height * 0.27;
      for (const image of this.splashes) {
        image.style.width = splashSize + 'px';
        image.style.left = splashLeft + 'px';
        image.style.top = splashTop + 'px';
        image.style.opacity = '0';
      }

      for (const image of this.growths) {
        image.style.width = cellBounds.width + 10 + 'px';
        image.style.height = cellBounds.height + 10 + 'px';
        image.style.left = cellBounds.left - rootBounds.left - 5 + 'px';
        image.style.top = cellBounds.top - rootBounds.top - 5 + 'px';
        image.style.opacity = '0';
      }

      this.layer.replaceChildren(...this.pours, ...this.splashes, ...this.growths);
      this.layer.dataset.crystalariumGrowthId = String(cue.id);
      this.layer.dataset.crystalariumGrowthFamily = cue.family;
      this.layer.dataset.crystalariumGrowthCell = String(cue.cellIndex);
      this.showFrame(0);
      for (let frame = 1; frame < POUR_FRAMES; frame += 1) {
        this.timers.push(
          window.setTimeout(() => {
            if (currentGeneration === this.generation) this.showFrame(frame);
          }, frame * FRAME_MS),
        );
      }
      this.timers.push(window.setTimeout(() => this.cancel(), POUR_FRAMES * FRAME_MS + 160));
    });
  }

  private showFrame(frame: number): void {
    for (let index = 0; index < this.pours.length; index += 1) {
      this.pours[index].style.opacity = index === frame ? '1' : '0';
    }
    this.layer.dataset.crystalariumPourFrame = String(frame + 1);
    // Preserve the final emergence frame during the last pour pose.
    const effectFrame = frame >= 7 ? Math.min(frame - 7, EFFECT_FRAMES - 1) : -1;
    for (let index = 0; index < EFFECT_FRAMES; index += 1) {
      const opacity = index === effectFrame ? '1' : '0';
      this.splashes[index].style.opacity = opacity;
      this.growths[index].style.opacity = opacity;
    }
  }

  public destroy(): void {
    this.destroyed = true;
    this.cancel();
    this.layer.remove();
  }

  private cancel(): void {
    this.generation += 1;
    for (const timer of this.timers) window.clearTimeout(timer);
    this.timers.length = 0;
    this.layer.replaceChildren();
    delete this.layer.dataset.crystalariumGrowthId;
    delete this.layer.dataset.crystalariumGrowthFamily;
    delete this.layer.dataset.crystalariumGrowthCell;
    delete this.layer.dataset.crystalariumPourFrame;
  }
}
