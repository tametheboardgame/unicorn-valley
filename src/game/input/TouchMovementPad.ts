import type Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConstants';
import { browserUsesLandscapeTabletPresentation } from '../ui/LandscapeTabletPresentation';
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

function shouldDefaultTouchMovementPadVisible(): boolean {
  const touchCapable = shouldShowTouchMovementPad(
    globalThis.navigator?.maxTouchPoints ?? 0,
    'ontouchstart' in globalThis,
  );
  const coarsePointer =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(pointer: coarse)').matches;
  const compactViewport = typeof globalThis.innerWidth === 'number' && globalThis.innerWidth <= 900;
  return touchCapable && (coarsePointer || compactViewport);
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

export class TouchMovementPad {
  private readonly objects: Array<Phaser.GameObjects.Arc | Phaser.GameObjects.Text> = [];
  private readonly buttons: Phaser.GameObjects.Arc[] = [];
  private readonly tabletMode: boolean;
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
    this.tabletMode = browserUsesLandscapeTabletPresentation();
    this.scene.events.on(SCENE_PAUSE_EVENT, this.handleScenePause, this);
    this.scene.events.on(SCENE_RESUME_EVENT, this.handleSceneResume, this);
    globalThis.addEventListener?.('blur', this.handleWindowBlur);
    globalThis.document?.addEventListener('visibilitychange', this.handleVisibilityChange);

    if (shouldRenderPortraitDomControls()) {
      this.createPortraitDomControls();
    } else if (this.tabletMode) {
      this.createLandscapeTabletControls();
    } else {
      const originX = 118;
      const originY = GAME_HEIGHT - 118;
      const spacing = 62;

      this.createButton(originX, originY - spacing, '▲', 'MOVE_Y', -1, 'up');
      this.createButton(originX, originY + spacing, '▼', 'MOVE_Y', 1, 'down');
      this.createButton(originX - spacing, originY, '◀', 'MOVE_X', -1, 'left');
      this.createButton(originX + spacing, originY, '▶', 'MOVE_X', 1, 'right');
      this.createGallopButton(originX + spacing * 2.35, originY - spacing * 0.95);
    }

    this.setVisible(
      this.tabletMode
        ? true
        : (preferredTouchControlsVisible ?? shouldDefaultTouchMovementPadVisible()),
      false,
    );
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public togglePreferredVisibility(): boolean {
    if (this.tabletMode) {
      return true;
    }
    const nextVisible = !this.visible;
    this.setVisible(nextVisible, true);
    return nextVisible;
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
    this.domRoot?.remove();
    this.domRoot = null;
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
    this.buttons.length = 0;
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

  private createLandscapeTabletControls(): void {
    const originX = 132;
    const originY = 574;
    const spacing = 72;

    const backdrop = this.scene.add
      .circle(originX, originY, 116, 0x513a61, 0.2)
      .setName('tablet-movement-pad')
      .setStrokeStyle(4, 0xffffff, 0.34)
      .setScrollFactor(0)
      .setDepth(115);
    const centre = this.scene.add
      .circle(originX, originY, 31, 0xfffbef, 0.52)
      .setStrokeStyle(3, 0xc192d5, 0.64)
      .setScrollFactor(0)
      .setDepth(116);
    const centreMark = this.scene.add
      .text(originX, originY - 1, '✦', {
        color: '#8b639a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(117);
    this.objects.push(backdrop, centre, centreMark);

    this.createButton(originX, originY - spacing, '▲', 'MOVE_Y', -1, 'up', 43, 0.92);
    this.createButton(originX, originY + spacing, '▼', 'MOVE_Y', 1, 'down', 43, 0.92);
    this.createButton(originX - spacing, originY, '◀', 'MOVE_X', -1, 'left', 43, 0.92);
    this.createButton(originX + spacing, originY, '▶', 'MOVE_X', 1, 'right', 43, 0.92);
    this.createGallopButton(930, 608, true);
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
    radius = 29,
    alpha = 0.72,
  ): void {
    const button = this.scene.add
      .circle(x, y, radius, 0xfffbef, alpha)
      .setName(`touch-movement-${direction}`)
      .setStrokeStyle(4, 0x9d72ad, 0.9)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y, label, {
        color: '#5c4568',
        fontFamily: 'system-ui, sans-serif',
        fontSize: radius >= 40 ? '31px' : '23px',
        fontStyle: 'bold',
      })
      .setName(`touch-movement-${direction}-label`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(118);

    const press = (): void => this.input.setAxis(axis, value);
    const release = (): void => this.input.setAxis(axis, 0);
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.buttons.push(button);
    this.objects.push(button, text);
  }

  private createGallopButton(x: number, y: number, tablet = false): void {
    const radius = tablet ? 55 : 35;
    const button = this.scene.add
      .circle(x, y, radius, tablet ? 0xffe6a6 : 0xfffbef, tablet ? 0.96 : 0.78)
      .setName('touch-movement-gallop')
      .setStrokeStyle(tablet ? 5 : 4, tablet ? 0xd6b35f : 0xb17bbd, 0.96)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, tablet ? y - 5 : y - 2, tablet ? '✦\nGallop' : '✦', {
        color: tablet ? '#664d31' : '#765080',
        fontFamily: 'system-ui, sans-serif',
        fontSize: tablet ? '18px' : '27px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('touch-movement-gallop-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(118);

    const press = (): void => this.input.setButton('GALLOP', true);
    const release = (): void => this.input.setButton('GALLOP', false);
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.buttons.push(button);
    this.objects.push(button, text);

    if (!tablet) {
      const hint = this.scene.add
        .text(x, y + 45, 'Gallop', {
          color: '#5c4568',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          backgroundColor: '#fffbeed0',
          padding: { x: 5, y: 2 },
        })
        .setName('touch-movement-gallop-hint')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(118);
      this.objects.push(hint);
    }
  }
}
