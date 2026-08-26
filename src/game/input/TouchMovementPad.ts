import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from './PointerTouchInputAdapter';

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
    this.scene.events.on(Phaser.Scenes.Events.PAUSE, this.handleScenePause, this);
    this.scene.events.on(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);

    if (shouldRenderPortraitDomControls()) {
      this.createPortraitDomControls();
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

    this.setVisible(preferredTouchControlsVisible ?? shouldDefaultTouchMovementPadVisible(), false);
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public togglePreferredVisibility(): boolean {
    const nextVisible = !this.visible;
    this.setVisible(nextVisible, true);
    return nextVisible;
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.handleScenePause, this);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.handleSceneResume, this);
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
    const button = this.scene.add
      .circle(x, y, 29, 0xfffbef, 0.72)
      .setName(`touch-movement-${direction}`)
      .setStrokeStyle(4, 0x9d72ad, 0.85)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y, label, {
        color: '#5c4568',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
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

  private createGallopButton(x: number, y: number): void {
    const button = this.scene.add
      .circle(x, y, 35, 0xfffbef, 0.78)
      .setName('touch-movement-gallop')
      .setStrokeStyle(4, 0xb17bbd, 0.9)
      .setScrollFactor(0)
      .setDepth(117)
      .setInteractive({ useHandCursor: true });
    const text = this.scene.add
      .text(x, y - 2, '✦', {
        color: '#765080',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setName('touch-movement-gallop-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(118);
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

    const press = (): void => this.input.setButton('GALLOP', true);
    const release = (): void => this.input.setButton('GALLOP', false);
    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.buttons.push(button);
    this.objects.push(button, text, hint);
  }
}
