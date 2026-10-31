import type { CrystalariumGrowthCue } from './CrystalariumPortraitView';

const ASSETS = '/design-assets/crystalarium-c17/growth-potion-assets/';
const POUR_FRAMES = 12;
const EFFECT_FRAMES = 4;
const FRAME_MS = 95;
const END_FADE_MS = 160;
const MAX_DRAW_RATE_MS = 1000 / 30;

function loadFrames(prefix: string, count: number): HTMLImageElement[] {
  return Array.from({ length: count }, (_, index) => {
    const image = new Image();
    image.decoding = 'async';
    image.src = ASSETS + prefix + '-' + String(index + 1).padStart(2, '0') + '.webp';
    return image;
  });
}

interface GrowthPlacement {
  readonly pourX: number;
  readonly pourY: number;
  readonly pourSize: number;
  readonly splashX: number;
  readonly splashY: number;
  readonly splashSize: number;
  readonly crystalX: number;
  readonly crystalY: number;
  readonly crystalWidth: number;
  readonly crystalHeight: number;
}

/**
 * C20 artwork-only growth feedback. A single, persistent canvas composites the
 * predecoded C17 frames atomically; no DOM image is ever hidden/swapped during
 * playback. Gameplay and persistence have already finished when a cue arrives.
 */
export class CrystalariumGrowthPotionFx {
  public readonly layer: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly pours = loadFrames('pour', POUR_FRAMES);
  private readonly splashes = loadFrames('splash', EFFECT_FRAMES);
  private readonly growths = loadFrames('growth', EFFECT_FRAMES);
  private readonly imagesReady: Promise<boolean>;
  private lastCueId = 0;
  private generation = 0;
  private frameRequest: number | null = null;
  private destroyed = false;

  public constructor() {
    this.layer = document.createElement('div');
    this.layer.className = 'crystalarium-live-growth-fx';
    this.layer.setAttribute('aria-hidden', 'true');
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'crystalarium-live-growth-canvas';
    this.canvas.setAttribute('aria-hidden', 'true');
    this.layer.append(this.canvas);

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
    const generation = this.generation;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    void this.imagesReady.then((ready) => {
      if (!ready || this.destroyed || generation !== this.generation) return;
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
      if (!rootBounds.width || !rootBounds.height || !wellBounds.width || !cellBounds.width) {
        return;
      }

      const pourSize = Math.max(115, Math.min(190, wellBounds.width * 1.65));
      const splashSize = Math.max(56, Math.min(96, wellBounds.width * 1.1));
      const placement: GrowthPlacement = {
        pourX: wellBounds.left - rootBounds.left + (wellBounds.width - pourSize) / 2,
        pourY: Math.max(0, wellBounds.top - rootBounds.top - pourSize * 0.68),
        pourSize,
        splashX: wellBounds.left - rootBounds.left + wellBounds.width / 2 - splashSize / 2,
        splashY: wellBounds.top - rootBounds.top + wellBounds.height * 0.27,
        splashSize,
        crystalX: cellBounds.left - rootBounds.left - 5,
        crystalY: cellBounds.top - rootBounds.top - 5,
        crystalWidth: cellBounds.width + 10,
        crystalHeight: cellBounds.height + 10,
      };

      // The potion only occupies the well and one board socket. A
      // full-viewport high-DPI canvas was needlessly clearing millions of
      // pixels on every refresh and competing with real pointer input.
      const left = Math.max(
        0,
        Math.floor(Math.min(placement.pourX, placement.splashX, placement.crystalX)),
      );
      const top = Math.max(
        0,
        Math.floor(Math.min(placement.pourY, placement.splashY, placement.crystalY)),
      );
      const right = Math.min(
        rootBounds.width,
        Math.ceil(
          Math.max(
            placement.pourX + placement.pourSize,
            placement.splashX + placement.splashSize,
            placement.crystalX + placement.crystalWidth,
          ),
        ),
      );
      const bottom = Math.min(
        rootBounds.height,
        Math.ceil(
          Math.max(
            placement.pourY + placement.pourSize,
            placement.splashY + placement.splashSize,
            placement.crystalY + placement.crystalHeight,
          ),
        ),
      );
      const width = Math.max(1, right - left);
      const height = Math.max(1, bottom - top);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      this.canvas.style.left = left + 'px';
      this.canvas.style.top = top + 'px';
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';
      this.canvas.width = Math.round(width * ratio);
      this.canvas.height = Math.round(height * ratio);
      const context = this.canvas.getContext('2d', { alpha: true });
      if (!context) return;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const startedAt = performance.now();
      this.layer.dataset.crystalariumGrowthId = String(cue.id);
      this.layer.dataset.crystalariumGrowthFamily = cue.family;
      this.layer.dataset.crystalariumGrowthCell = String(cue.cellIndex);
      this.layer.dataset.crystalariumCompositor = 'canvas';

      let lastDrawAt = -Infinity;
      const draw = (now: number): void => {
        if (this.destroyed || generation !== this.generation) return;
        if (now - lastDrawAt < MAX_DRAW_RATE_MS) {
          this.frameRequest = window.requestAnimationFrame(draw);
          return;
        }
        lastDrawAt = now;
        const elapsed = Math.max(0, now - startedAt);
        const progress = Math.min(elapsed / FRAME_MS, POUR_FRAMES - 1);
        const index = Math.floor(progress);
        const next = Math.min(index + 1, POUR_FRAMES - 1);
        const blend = progress - index;
        const fade = Math.max(
          0,
          Math.min(1, (POUR_FRAMES * FRAME_MS + END_FADE_MS - elapsed) / END_FADE_MS),
        );

        // One atomic canvas repaint, rather than toggling 20 translucent DOM
        // elements. The previous fully decoded frame remains visible while
        // the next frame blends in, preventing inter-frame blank flashes.
        context.clearRect(0, 0, width, height);
        context.save();
        context.globalAlpha = fade;
        context.drawImage(
          this.pours[index],
          placement.pourX - left,
          placement.pourY - top,
          placement.pourSize,
          placement.pourSize,
        );
        if (next !== index && blend > 0) {
          context.globalAlpha = fade * blend;
          context.drawImage(
            this.pours[next],
            placement.pourX - left,
            placement.pourY - top,
            placement.pourSize,
            placement.pourSize,
          );
        }
        const effectIndex = index >= 7 ? Math.min(index - 7, EFFECT_FRAMES - 1) : -1;
        if (effectIndex >= 0) {
          context.globalAlpha = fade;
          context.drawImage(
            this.splashes[effectIndex],
            placement.splashX - left,
            placement.splashY - top,
            placement.splashSize,
            placement.splashSize,
          );
          context.drawImage(
            this.growths[effectIndex],
            placement.crystalX - left,
            placement.crystalY - top,
            placement.crystalWidth,
            placement.crystalHeight,
          );
        }
        context.restore();
        this.layer.dataset.crystalariumPourFrame = String(index + 1);
        this.layer.dataset.crystalariumFramesPainted = String(
          Number(this.layer.dataset.crystalariumFramesPainted || 0) + 1,
        );
        // Retained after the brief visual effect finishes, so browser
        // regression can verify real painting without a frame-timing race.
        this.layer.dataset.crystalariumLastGrowthId = String(cue.id);
        this.layer.dataset.crystalariumLastGrowthCell = String(cue.cellIndex);
        this.layer.dataset.crystalariumLastFramesPainted =
          this.layer.dataset.crystalariumFramesPainted;
        if (elapsed < POUR_FRAMES * FRAME_MS + END_FADE_MS) {
          this.frameRequest = window.requestAnimationFrame(draw);
        } else {
          this.cancel();
        }
      };

      // Render the first frame before requesting any subsequent animation frame.
      draw(startedAt);
    });
  }

  public destroy(): void {
    this.destroyed = true;
    this.cancel();
    this.layer.remove();
  }

  private cancel(): void {
    this.generation += 1;
    if (this.frameRequest !== null) window.cancelAnimationFrame(this.frameRequest);
    this.frameRequest = null;
    const context = this.canvas.getContext('2d');
    if (context) context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    delete this.layer.dataset.crystalariumGrowthId;
    delete this.layer.dataset.crystalariumGrowthFamily;
    delete this.layer.dataset.crystalariumGrowthCell;
    delete this.layer.dataset.crystalariumCompositor;
    delete this.layer.dataset.crystalariumPourFrame;
    delete this.layer.dataset.crystalariumFramesPainted;
  }
}
