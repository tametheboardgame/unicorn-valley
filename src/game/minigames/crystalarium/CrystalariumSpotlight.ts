/**
 * C22: pointer-transparent, geometry-anchored guidance for the real controls.
 * This layer never owns input, game rules, saved state or a duplicate button.
 * Four rectangles dim the root while leaving the live target's hit box open.
 */
export class CrystalariumSpotlight {
  private readonly layer = document.createElement('div');
  private readonly shade = Array.from({ length: 4 }, () => document.createElement('div'));
  private readonly arrow = document.createElement('div');
  private target: HTMLElement | null = null;
  private observer: ResizeObserver | null = null;
  private frame: number | null = null;

  public constructor(private readonly root: HTMLElement) {
    this.layer.className = 'crystalarium-live-spotlight';
    this.layer.setAttribute('aria-hidden', 'true');
    this.layer.dataset.crystalariumSpotlight = 'true';
    for (const panel of this.shade) {
      panel.className = 'crystalarium-live-spotlight-shade';
      this.layer.append(panel);
    }
    this.arrow.className = 'crystalarium-live-spotlight-arrow';
    this.layer.append(this.arrow);
  }

  private readonly schedule = (): void => {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.position();
    });
  };

  /** Accept a DOM element already wired to the canonical controller. */
  public show(target: HTMLElement | null, label: string): void {
    this.clear();
    if (!target || (target instanceof HTMLButtonElement && target.disabled) || !this.root.contains(target)) return;
    this.target = target;
    this.arrow.textContent = label;
    this.root.append(this.layer);
    this.position();
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(this.schedule);
      this.observer.observe(this.root);
      this.observer.observe(target);
    }
    window.addEventListener('resize', this.schedule);
    // Captures only native scroll events, never click, touch or pointer gestures.
    this.root.addEventListener('scroll', this.schedule, true);
  }

  private position(): void {
    const target = this.target;
    if (!target || !this.root.contains(target)) return this.clear();
    const root = this.root.getBoundingClientRect();
    const bounds = target.getBoundingClientRect();
    const w = root.width;
    const h = root.height;
    const left = Math.max(0, Math.min(w, bounds.left - root.left - 5));
    const top = Math.max(0, Math.min(h, bounds.top - root.top - 5));
    const right = Math.max(left, Math.min(w, bounds.right - root.left + 5));
    const bottom = Math.max(top, Math.min(h, bounds.bottom - root.top + 5));
    if (right - left < 10 || bottom - top < 10) {
      this.layer.hidden = true;
      return;
    }
    this.layer.hidden = false;
    const regions = [
      [0, 0, w, top],
      [0, top, left, bottom - top],
      [right, top, w - right, bottom - top],
      [0, bottom, w, h - bottom],
    ];
    for (const [i, rect] of regions.entries()) {
      const panel = this.shade[i];
      panel.style.left = rect[0] + 'px';
      panel.style.top = rect[1] + 'px';
      panel.style.width = rect[2] + 'px';
      panel.style.height = rect[3] + 'px';
    }
    // Never place the arrow/cue over the actual clickable/drop target.
    const cueW = 112;
    const cueH = 30;
    const mid = (left + right) / 2;
    let x = 0;
    let y = 0;
    let direction = 'down';
    if (top >= cueH + 12) {
      x = Math.max(4, Math.min(w - cueW - 4, mid - cueW / 2));
      y = top - cueH - 7;
    } else if (h - bottom >= cueH + 12) {
      x = Math.max(4, Math.min(w - cueW - 4, mid - cueW / 2));
      y = bottom + 7;
      direction = 'up';
    } else if (w - right >= cueW + 12) {
      x = right + 7;
      y = Math.max(4, Math.min(h - cueH - 4, (top + bottom) / 2 - cueH / 2));
      direction = 'left';
    } else if (left >= cueW + 12) {
      x = left - cueW - 7;
      y = Math.max(4, Math.min(h - cueH - 4, (top + bottom) / 2 - cueH / 2));
      direction = 'right';
    } else {
      this.arrow.hidden = true;
      return;
    }
    this.arrow.hidden = false;
    this.arrow.dataset.direction = direction;
    this.arrow.style.left = x + 'px';
    this.arrow.style.top = y + 'px';
  }

  public clear(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.observer?.disconnect();
    this.observer = null;
    window.removeEventListener('resize', this.schedule);
    this.root.removeEventListener('scroll', this.schedule, true);
    this.layer.remove();
    this.target = null;
  }

  public destroy(): void {
    this.clear();
  }
}
