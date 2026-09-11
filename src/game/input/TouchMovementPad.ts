import type Phaser from 'phaser';
import { CONCEPT_UI, createFixedGraphics, drawConceptIcon } from '../ui/ConceptUi';
import type { PointerTouchInputAdapter } from './PointerTouchInputAdapter';

const SCENE_PAUSE_EVENT = 'pause';
const SCENE_RESUME_EVENT = 'resume';

let preferredTouchControlsVisible: boolean | null = null;
const padsByScene = new WeakMap<Phaser.Scene, TouchMovementPad>();

export function shouldShowTouchMovementPad(
  maxTouchPoints: number,
  hasTouchStart: boolean,
): boolean {
  return preferredTouchControlsVisible === true || maxTouchPoints > 0 || hasTouchStart;
}

export function shouldUsePortraitTouchControls(
  width: number,
  height: number,
  maxTouchPoints: number,
  hasTouchStart: boolean,
): boolean {
  return (
    shouldShowTouchMovementPad(maxTouchPoints, hasTouchStart) && width <= 700 && height > width
  );
}

function hasPrimaryCoarsePointer(): boolean {
  return (
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(pointer: coarse)').matches
  );
}

function isTouchCapable(): boolean {
  return (
    (globalThis.navigator?.maxTouchPoints ?? 0) > 0 ||
    'ontouchstart' in globalThis ||
    hasPrimaryCoarsePointer()
  );
}

function shouldDefaultTouchMovementPadVisible(): boolean {
  const compactViewport = typeof globalThis.innerWidth === 'number' && globalThis.innerWidth <= 900;
  // Touchscreen laptops commonly report maxTouchPoints/ontouchstart even though their primary
  // interaction is a fine mouse/trackpad. Do not turn the mobile movement pad on merely because
  // such a secondary touch surface exists. Tablets/phones normally expose a coarse primary pointer;
  // compact touch viewports remain supported as a defensive fallback.
  return isTouchCapable() && (hasPrimaryCoarsePointer() || compactViewport);
}

function shouldRenderPortraitDomControls(): boolean {
  if (typeof globalThis.document === 'undefined') {
    return false;
  }

  return shouldUsePortraitTouchControls(
    globalThis.innerWidth,
    globalThis.innerHeight,
    globalThis.navigator?.maxTouchPoints ?? 0,
    'ontouchstart' in globalThis,
  );
}

/**
 * Responsive movement controls with no legacy canvas fallback.
 *
 * Portrait phone uses the DOM controls below the gameplay window. Every canvas presentation uses
 * the same concept-grade movement pad and Gallop button. Desktop keeps that canvas presentation
 * hidden by default unless touch controls are explicitly enabled.
 */
export class TouchMovementPad {
  private readonly objects: Array<
    Phaser.GameObjects.Arc | Phaser.GameObjects.Text | Phaser.GameObjects.Graphics
  > = [];
  private readonly buttons: Phaser.GameObjects.Arc[] = [];
  private portraitMode = shouldRenderPortraitDomControls();
  private domRoot: HTMLDivElement | null = null;
  private visible = true;
  private scenePaused = false;
  private destroyed = false;

  public static ensure(scene: Phaser.Scene, input: PointerTouchInputAdapter): TouchMovementPad {
    return padsByScene.get(scene) ?? new TouchMovementPad(scene, input);
  }

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly input: PointerTouchInputAdapter,
  ) {
    padsByScene.set(scene, this);
    this.scene.events.on(SCENE_PAUSE_EVENT, this.handleScenePause, this);
    this.scene.events.on(SCENE_RESUME_EVENT, this.handleSceneResume, this);
    globalThis.addEventListener?.('blur', this.handleWindowBlur);
    globalThis.document?.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.createPresentation();
    this.setVisible(
      preferredTouchControlsVisible ??
        (shouldDefaultTouchMovementPadVisible() || this.portraitMode),
      false,
    );
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public togglePreferredVisibility(): boolean {
    if (isTouchCapable()) {
      return true;
    }
    const nextVisible = !this.visible;
    this.setVisible(nextVisible, true);
    return nextVisible;
  }

  public refresh(): void {
    const portraitMode = shouldRenderPortraitDomControls();
    if (portraitMode === this.portraitMode) {
      const shouldAutoShow = shouldDefaultTouchMovementPadVisible() || portraitMode;
      if (preferredTouchControlsVisible === null && this.visible !== shouldAutoShow) {
        this.setVisible(shouldAutoShow, false);
      }
      return;
    }

    this.releaseInput();
    this.clearPresentation();
    this.portraitMode = portraitMode;
    if (preferredTouchControlsVisible === null) {
      this.visible = shouldDefaultTouchMovementPadVisible() || portraitMode;
    }
    this.createPresentation();
    this.applyVisibility();
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.scene.events.off(SCENE_PAUSE_EVENT, this.handleScenePause, this);
    this.scene.events.off(SCENE_RESUME_EVENT, this.handleSceneResume, this);
    globalThis.removeEventListener?.('blur', this.handleWindowBlur);
    globalThis.document?.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.releaseInput();
    this.clearPresentation();
    if (padsByScene.get(this.scene) === this) {
      padsByScene.delete(this.scene);
    }
  }

  private readonly handleWindowBlur = (): void => {
    this.releaseInput();
  };

  private readonly handleVisibilityChange = (): void => {
    if (globalThis.document?.hidden) {
      this.releaseInput();
    }
  };

  private setVisible(visible: boolean, remember: boolean): void {
    this.visible = visible;
    if (remember) {
      preferredTouchControlsVisible = visible;
    }

    if (!visible) {
      this.releaseInput();
    }

    this.applyVisibility();
  }

  private handleScenePause(): void {
    this.scenePaused = true;
    this.releaseInput();
    this.applyVisibility();
  }

  private handleSceneResume(): void {
    this.scenePaused = false;
    this.applyVisibility();
  }

  private createPresentation(): void {
    if (this.portraitMode) {
      this.createPortraitDomControls();
      return;
    }
    this.createConceptCanvasControls();
  }

  private clearPresentation(): void {
    this.domRoot?.remove();
    this.domRoot = null;
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
    this.buttons.length = 0;
  }

  private applyVisibility(): void {
    const renderedVisible = this.visible && !this.scenePaused;
    if (this.domRoot) {
      this.domRoot.hidden = !renderedVisible;
    }

    for (const object of this.objects) {
      object.setVisible(renderedVisible);
    }
    for (const button of this.buttons) {
      if (renderedVisible) {
        button.setInteractive({ useHandCursor: true });
      } else {
        button.disableInteractive();
      }
    }
  }

  private releaseInput(): void {
    this.input.setAxis('MOVE_X', 0);
    this.input.setAxis('MOVE_Y', 0);
    this.input.setButton('GALLOP', false);
  }

  private createConceptCanvasControls(): void {
    const originX = 142;
    const originY = 574;
    const spacing = 72;

    const shadow = this.scene.add
      .circle(originX + 7, originY + 9, 124, CONCEPT_UI.shadow, 0.2)
      .setScrollFactor(0)
      .setDepth(114);
    const backdrop = this.scene.add
      .circle(originX, originY, 120, CONCEPT_UI.creamHighlight, 0.38)
      .setName('tablet-movement-pad')
      .setStrokeStyle(5, CONCEPT_UI.creamHighlight, 0.72)
      .setScrollFactor(0)
      .setDepth(115);
    const innerRing = this.scene.add
      .circle(originX, originY, 108, CONCEPT_UI.purpleDeep, 0.13)
      .setStrokeStyle(3, CONCEPT_UI.lavenderLine, 0.52)
      .setScrollFactor(0)
      .setDepth(115);
    const centre = this.scene.add
      .circle(originX, originY, 31, CONCEPT_UI.creamHighlight, 0.48)
      .setStrokeStyle(3, CONCEPT_UI.lavenderLine, 0.72)
      .setScrollFactor(0)
      .setDepth(116);
    const centreMark = this.scene.add
      .text(originX, originY - 1, '✦', {
        color: '#76518a',
        fontFamily: 'Trebuchet MS, Segoe UI, system-ui, sans-serif',
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(117);
    this.objects.push(shadow, backdrop, innerRing, centre, centreMark);

    this.createButton(originX, originY - spacing, '▲', 'MOVE_Y', -1, 'up');
    this.createButton(originX, originY + spacing, '▼', 'MOVE_Y', 1, 'down');
    this.createButton(originX - spacing, originY, '◀', 'MOVE_X', -1, 'left');
    this.createButton(originX + spacing, originY, '▶', 'MOVE_X', 1, 'right');
    this.createGallopButton(1200, 600);
  }

  private createPortraitDomControls(): void {
    const root = globalThis.document.createElement('div');
    root.className = 'mobile-touch-controls';
    root.setAttribute('role', 'group');
    root.setAttribute('aria-label', 'Unicorn movement controls');

    const dpad = globalThis.document.createElement('div');
    dpad.className = 'mobile-touch-dpad';
    dpad.setAttribute('aria-label', 'Movement');

    const directions = [
      ['up', '▲', 'MOVE_Y', -1],
      ['left', '◀', 'MOVE_X', -1],
      ['right', '▶', 'MOVE_X', 1],
      ['down', '▼', 'MOVE_Y', 1],
    ] as const;

    for (const [direction, label, axis, value] of directions) {
      const button = globalThis.document.createElement('button');
      button.type = 'button';
      button.className = `mobile-touch-button mobile-touch-${direction}`;
      button.textContent = label;
      button.setAttribute('aria-label', `Move ${direction}`);
      this.bindDomHold(
        button,
        () => this.input.setAxis(axis, value),
        () => this.input.setAxis(axis, 0),
      );
      dpad.append(button);
    }

    const gallop = globalThis.document.createElement('button');
    gallop.type = 'button';
    gallop.className = 'mobile-touch-button mobile-touch-gallop';
    gallop.textContent = '✦\nGallop';
    gallop.setAttribute('aria-label', 'Gallop');
    this.bindDomHold(
      gallop,
      () => this.input.setButton('GALLOP', true),
      () => this.input.setButton('GALLOP', false),
    );

    root.append(dpad, gallop);
    (globalThis.document.querySelector('#game-shell') ?? globalThis.document.body).append(root);
    this.domRoot = root;
  }

  private bindDomHold(button: HTMLButtonElement, press: () => void, release: () => void): void {
    const start = (event: PointerEvent): void => {
      event.preventDefault();
      button.classList.add('is-active');
      press();
    };
    const stop = (event: PointerEvent): void => {
      event.preventDefault();
      button.classList.remove('is-active');
      release();
    };

    button.addEventListener('pointerdown', start);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
    button.addEventListener('pointerleave', stop);
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    axis: 'MOVE_X' | 'MOVE_Y',
    value: number,
    direction: 'up' | 'down' | 'left' | 'right',
  ): void {
    const radius = 43;
    const shadow = this.scene.add
      .circle(x + 4, y + 6, radius + 4, CONCEPT_UI.shadow, 0.24)
      .setScrollFactor(0)
      .setDepth(116);
    const halo = this.scene.add
      .circle(x, y, radius + 4, CONCEPT_UI.creamHighlight, 0.88)
      .setStrokeStyle(3, CONCEPT_UI.purpleStrong, 0.72)
      .setScrollFactor(0)
      .setDepth(116);
    const button = this.scene.add
      .circle(x, y, radius, CONCEPT_UI.purple, 1)
      .setName(`touch-movement-${direction}`)
      .setStrokeStyle(4, CONCEPT_UI.purpleStrong, 1)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y, label, {
        color: '#fffaf1',
        fontFamily: 'Trebuchet MS, Segoe UI, system-ui, sans-serif',
        fontSize: '31px',
        fontStyle: 'bold',
      })
      .setName(`touch-movement-${direction}-label`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(118);

    const press = (): void => {
      button.setScale(0.94);
      text.setScale(0.94);
      this.input.setAxis(axis, value);
    };
    const release = (): void => {
      button.setScale(1);
      text.setScale(1);
      this.input.setAxis(axis, 0);
    };
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.buttons.push(button);
    this.objects.push(shadow, halo, button, text);
  }

  private createGallopButton(x: number, y: number): void {
    const radius = 55;
    const shadow = this.scene.add
      .circle(x + 5, y + 7, radius + 5, CONCEPT_UI.shadow, 0.24)
      .setScrollFactor(0)
      .setDepth(116);
    const halo = this.scene.add
      .circle(x, y, radius + 5, CONCEPT_UI.creamHighlight, 0.94)
      .setStrokeStyle(3, CONCEPT_UI.goldStrong, 0.72)
      .setScrollFactor(0)
      .setDepth(116);
    const icon = createFixedGraphics(this.scene, 'touch-movement-gallop-icon', 119);
    drawConceptIcon(icon, 'gallop', x, y - 17, 0.82, CONCEPT_UI.goldDeep);
    const button = this.scene.add
      .circle(x, y, radius, CONCEPT_UI.gold, 1)
      .setName('touch-movement-gallop')
      .setStrokeStyle(5, CONCEPT_UI.goldStrong, 0.96)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y + 20, 'Gallop', {
        color: '#6a421f',
        fontFamily: 'Trebuchet MS, Segoe UI, system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('touch-movement-gallop-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(120);

    const press = (): void => {
      button.setScale(0.95);
      text.setScale(0.96);
      this.input.setButton('GALLOP', true);
    };
    const release = (): void => {
      button.setScale(1);
      text.setScale(1);
      this.input.setButton('GALLOP', false);
    };
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.buttons.push(button);
    this.objects.push(shadow, halo, icon, button, text);
  }
}
