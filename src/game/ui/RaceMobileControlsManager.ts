import Phaser from 'phaser';
import '../../raceMobileControls.css';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { browserUsesLandscapeTabletPresentation } from './LandscapeTabletPresentation';
import { browserHasRaceTouchCapability } from './RaceTouchCapability';

const RACE_SCENE_KEYS = new Set(['RaceScene', 'NovaTutorialRaceScene']);
const SYNC_INTERVAL_MS = 80;
const JUMP_X = GAME_WIDTH - 128;
const JUMP_Y = GAME_HEIGHT - 102;
const CONTROL_PREFIX = 'r6-wp6.18h';
const RUN_TOUCH_ZONE_NAME = 'race-run-touch-zone';

interface VisibilityGameObject extends Phaser.GameObjects.GameObject {
  setVisible(visible: boolean): this;
}

interface InputGameObject extends Phaser.GameObjects.GameObject {
  input: Phaser.Types.Input.InteractiveObject | null;
}

function canSetVisible(object: Phaser.GameObjects.GameObject): object is VisibilityGameObject {
  return 'setVisible' in object && typeof object.setVisible === 'function';
}

function hasInput(object: Phaser.GameObjects.GameObject): object is InputGameObject {
  return 'input' in object;
}

function findNestedByName(
  objects: readonly Phaser.GameObjects.GameObject[],
  name: string,
): Phaser.GameObjects.GameObject | null {
  for (const object of objects) {
    if (object.name === name) {
      return object;
    }
    if (object instanceof Phaser.GameObjects.Container) {
      const nested = findNestedByName(object.list, name);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

function near(value: number, expected: number): boolean {
  return Math.abs(value - expected) <= 2;
}

function nameRaceCanvasControls(scene: Phaser.Scene): void {
  const namedJumpTarget = scene.children.getByName(`${CONTROL_PREFIX}:canvas-jump-target`);
  if (!namedJumpTarget) {
    const jumpTarget = scene.children.list.find(
      (object) =>
        object instanceof Phaser.GameObjects.Arc &&
        near(object.x, JUMP_X) &&
        near(object.y, JUMP_Y) &&
        object.input?.enabled === true,
    );
    jumpTarget?.setName(`${CONTROL_PREFIX}:canvas-jump-target`);
  }

  const namedShadow = scene.children.getByName(`${CONTROL_PREFIX}:canvas-jump-shadow`);
  if (!namedShadow) {
    const shadow = scene.children.list.find(
      (object) =>
        object instanceof Phaser.GameObjects.Arc &&
        near(object.x, JUMP_X + 5) &&
        near(object.y, JUMP_Y + 7) &&
        !object.input,
    );
    shadow?.setName(`${CONTROL_PREFIX}:canvas-jump-shadow`);
  }

  for (const [text, name] of [
    ['JUMP', `${CONTROL_PREFIX}:canvas-jump-label`],
    ['tap / SPACE', `${CONTROL_PREFIX}:canvas-jump-hint`],
    ['← Meadow', `${CONTROL_PREFIX}:canvas-exit`],
  ] as const) {
    if (scene.children.getByName(name)) {
      continue;
    }
    const target = scene.children.list.find(
      (object) => object instanceof Phaser.GameObjects.Text && object.text === text,
    );
    target?.setName(name);
  }
}

export class RaceMobileControlsManager {
  private readonly syncThrottle = new RefreshThrottle(SYNC_INTERVAL_MS);
  private readonly pointerQuery =
    globalThis.matchMedia?.('(pointer: coarse), (any-pointer: coarse)') ?? null;
  private readonly root: HTMLElement;
  private readonly helpButton: HTMLButtonElement;
  private readonly runButton: HTMLButtonElement;
  private readonly jumpButton: HTMLButtonElement;
  private readonly leaveButton: HTMLButtonElement;
  private readonly pauseButton: HTMLButtonElement;
  private readonly resumeButton: HTMLButtonElement;
  private readonly shell: HTMLElement;
  private runHeld = false;
  private jumpHeld = false;
  private runHeldTarget: Phaser.GameObjects.GameObject | null = null;
  private jumpHeldTarget: Phaser.GameObjects.GameObject | null = null;
  private pausedRaceScene: Phaser.Scene | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.shell = document.querySelector<HTMLElement>('#game-shell') ?? document.body;

    this.root = document.createElement('section');
    this.root.className = 'race-mobile-controls';
    this.root.dataset.raceMobileControls = 'true';
    this.root.setAttribute('aria-label', 'Race controls');
    this.root.hidden = true;

    const copy = document.createElement('div');
    copy.className = 'race-mobile-copy';
    const heading = document.createElement('h2');
    heading.textContent = 'Race controls';
    const hint = document.createElement('p');
    hint.textContent = 'Hold RUN to race. Tap JUMP to clear obstacles.';
    copy.append(heading, hint);

    const controls = document.createElement('div');
    controls.className = 'race-mobile-control-grid';

    this.runButton = document.createElement('button');
    this.runButton.type = 'button';
    this.runButton.className = 'race-mobile-button race-mobile-run';
    this.runButton.dataset.raceAction = 'run';
    this.runButton.innerHTML = '<strong>RUN</strong><span>Hold to run</span>';
    this.runButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.pressRun();
    });
    for (const eventName of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
      this.runButton.addEventListener(eventName, () => this.releaseRun());
    }

    this.jumpButton = document.createElement('button');
    this.jumpButton.type = 'button';
    this.jumpButton.className = 'race-mobile-button race-mobile-jump';
    this.jumpButton.dataset.raceAction = 'jump';
    this.jumpButton.innerHTML = '<strong>JUMP</strong><span>Clear the obstacle</span>';
    this.jumpButton.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.pressJump();
    });
    for (const eventName of ['pointerup', 'pointercancel', 'pointerleave'] as const) {
      this.jumpButton.addEventListener(eventName, () => this.releaseJump());
    }

    this.helpButton = document.createElement('button');
    this.helpButton.type = 'button';
    this.helpButton.className = 'race-mobile-button race-mobile-help';
    this.helpButton.dataset.raceAction = 'help';
    this.helpButton.textContent = 'Race help';
    this.helpButton.addEventListener('click', () => this.toggleHelp());

    this.leaveButton = document.createElement('button');
    this.leaveButton.type = 'button';
    this.leaveButton.className = 'race-mobile-button race-mobile-leave';
    this.leaveButton.dataset.raceAction = 'leave';
    this.leaveButton.textContent = '← Leave race';
    this.leaveButton.addEventListener('click', () => this.leaveRace());

    this.pauseButton = document.createElement('button');
    this.pauseButton.type = 'button';
    this.pauseButton.className = 'race-mobile-button race-mobile-pause';
    this.pauseButton.dataset.raceAction = 'pause';
    this.pauseButton.textContent = 'Ⅱ Pause';
    this.pauseButton.addEventListener('click', () => this.pauseRace());

    this.resumeButton = document.createElement('button');
    this.resumeButton.type = 'button';
    this.resumeButton.className = 'race-mobile-button race-mobile-resume';
    this.resumeButton.dataset.raceAction = 'resume';
    this.resumeButton.textContent = '▶ Resume';
    this.resumeButton.addEventListener('click', () => this.resumeRace());

    for (const button of [this.runButton, this.jumpButton]) {
      button.addEventListener('contextmenu', (event) => event.preventDefault());
    }

    controls.append(
      this.runButton,
      this.jumpButton,
      this.helpButton,
      this.leaveButton,
      this.pauseButton,
      this.resumeButton,
    );
    this.root.append(copy, controls);
    this.shell.append(this.root);

    globalThis.addEventListener('blur', this.releaseHeldControls);
    globalThis.addEventListener('pagehide', this.releaseHeldControls);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.releaseHeldControls();
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
      globalThis.removeEventListener('blur', this.releaseHeldControls);
      globalThis.removeEventListener('pagehide', this.releaseHeldControls);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      this.shell.classList.remove('race-mobile-controls-active');
      this.root.remove();
    });
    this.pointerQuery?.addEventListener('change', () => this.sync());
  }

  private readonly releaseHeldControls = (): void => {
    this.releaseRun();
    this.releaseJump();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.releaseHeldControls();
    }
  };

  private update(): void {
    if (!this.syncThrottle.shouldRun(this.game.loop.time)) {
      return;
    }
    this.sync();
  }

  private sync(): void {
    if (this.pausedRaceScene && !this.pausedRaceScene.scene.isPaused()) {
      this.pausedRaceScene = null;
    }
    const scene = this.activeRaceScene() ?? this.pausedRaceScene;
    const active = Boolean(scene && browserHasRaceTouchCapability());
    const tabletMode = active && browserUsesLandscapeTabletPresentation();

    this.root.hidden = !active;
    this.root.classList.toggle('is-landscape-tablet', tabletMode);
    this.root.classList.toggle('is-paused', Boolean(this.pausedRaceScene));
    this.shell.classList.toggle('race-mobile-controls-active', active && !tabletMode);
    this.syncTabletBounds(tabletMode);

    if (!scene) {
      this.releaseHeldControls();
      return;
    }

    nameRaceCanvasControls(scene);
    this.setCanvasControlsEnabled(scene, !active);
    if (active) {
      this.syncHelpLabel(scene);
    } else {
      this.releaseHeldControls();
    }
  }

  private syncTabletBounds(tabletMode: boolean): void {
    if (!tabletMode) {
      for (const property of ['left', 'top', 'width', 'height']) {
        this.root.style.removeProperty(property);
      }
      return;
    }
    const bounds = this.game.canvas.getBoundingClientRect();
    this.root.style.left = `${bounds.left}px`;
    this.root.style.top = `${bounds.top}px`;
    this.root.style.width = `${bounds.width}px`;
    this.root.style.height = `${bounds.height}px`;
  }

  private activeRaceScene(): Phaser.Scene | null {
    return (
      this.game.scene.getScenes(true).find((scene) => RACE_SCENE_KEYS.has(scene.scene.key)) ?? null
    );
  }

  private currentRaceScene(): Phaser.Scene | null {
    return this.activeRaceScene() ?? this.pausedRaceScene;
  }

  private setCanvasControlsEnabled(scene: Phaser.Scene, enabled: boolean): void {
    for (const name of [
      `${CONTROL_PREFIX}:canvas-jump-target`,
      `${CONTROL_PREFIX}:canvas-jump-shadow`,
      `${CONTROL_PREFIX}:canvas-jump-label`,
      `${CONTROL_PREFIX}:canvas-jump-hint`,
      `${CONTROL_PREFIX}:canvas-exit`,
      'race-run-button',
      'race-run-label',
      'race-run-hint',
      RUN_TOUCH_ZONE_NAME,
      'race-assistance-control',
    ]) {
      const object = scene.children.getByName(name);
      if (object && canSetVisible(object)) {
        object.setVisible(enabled);
      }
    }

    for (const object of [
      scene.children.getByName(`${CONTROL_PREFIX}:canvas-jump-target`),
      scene.children.getByName(`${CONTROL_PREFIX}:canvas-exit`),
      scene.children.getByName(RUN_TOUCH_ZONE_NAME),
      findNestedByName(scene.children.list, 'race-assistance-toggle'),
    ]) {
      if (object && hasInput(object) && object.input) {
        object.input.enabled = enabled;
      }
    }
  }

  private syncHelpLabel(scene: Phaser.Scene): void {
    const label = findNestedByName(scene.children.list, 'race-assistance-toggle-label');
    this.helpButton.textContent =
      label instanceof Phaser.GameObjects.Text ? label.text : 'Race help: Standard';
  }

  private runTarget(scene: Phaser.Scene): Phaser.GameObjects.GameObject | null {
    return scene.children.getByName(RUN_TOUCH_ZONE_NAME);
  }

  private jumpTarget(scene: Phaser.Scene): Phaser.GameObjects.GameObject | null {
    nameRaceCanvasControls(scene);
    return scene.children.getByName(`${CONTROL_PREFIX}:canvas-jump-target`);
  }

  private pressRun(): void {
    if (this.runHeld || this.pausedRaceScene) {
      return;
    }
    const scene = this.activeRaceScene();
    const target = scene ? this.runTarget(scene) : null;
    if (!target) {
      return;
    }

    this.runHeld = true;
    this.runHeldTarget = target;
    this.runButton.classList.add('is-active');
    void getVerticalSliceAudio().unlock();
    target.emit('pointerdown');
  }

  private releaseRun(): void {
    if (!this.runHeld && !this.runHeldTarget) {
      return;
    }
    this.runHeld = false;
    this.runButton.classList.remove('is-active');
    this.runHeldTarget?.emit('pointerup');
    this.runHeldTarget = null;
  }

  private pressJump(): void {
    if (this.jumpHeld || this.pausedRaceScene) {
      return;
    }
    const scene = this.activeRaceScene();
    const target = scene ? this.jumpTarget(scene) : null;
    if (!target) {
      return;
    }

    this.jumpHeld = true;
    this.jumpHeldTarget = target;
    this.jumpButton.classList.add('is-active');
    void getVerticalSliceAudio().unlock();
    target.emit('pointerdown');
  }

  private releaseJump(): void {
    if (!this.jumpHeld && !this.jumpHeldTarget) {
      return;
    }
    this.jumpHeld = false;
    this.jumpButton.classList.remove('is-active');
    this.jumpHeldTarget?.emit('pointerup');
    this.jumpHeldTarget = null;
  }

  private toggleHelp(): void {
    const scene = this.currentRaceScene();
    if (!scene) {
      return;
    }
    const target = findNestedByName(scene.children.list, 'race-assistance-toggle');
    if (!target) {
      return;
    }
    void getVerticalSliceAudio().unlock();
    target.emit('pointerdown');
    this.syncHelpLabel(scene);
  }

  private pauseRace(): void {
    const scene = this.activeRaceScene();
    if (!scene || !browserUsesLandscapeTabletPresentation()) {
      return;
    }
    this.releaseHeldControls();
    this.pausedRaceScene = scene;
    scene.scene.pause();
    this.sync();
  }

  private resumeRace(): void {
    const scene = this.pausedRaceScene;
    if (!scene) {
      return;
    }
    if (scene.scene.isPaused()) {
      scene.scene.resume();
    }
    this.pausedRaceScene = null;
    this.sync();
  }

  private leaveRace(): void {
    const scene = this.currentRaceScene();
    if (!scene) {
      return;
    }
    this.releaseHeldControls();
    if (scene.scene.isPaused()) {
      scene.scene.resume();
    }
    this.pausedRaceScene = null;
    nameRaceCanvasControls(scene);
    const target = scene.children.getByName(`${CONTROL_PREFIX}:canvas-exit`);
    if (!target) {
      return;
    }
    void getVerticalSliceAudio().unlock();
    target.emit('pointerdown');
  }
}

let manager: RaceMobileControlsManager | null = null;

export function getRaceMobileControlsManager(game: Phaser.Game): RaceMobileControlsManager {
  manager ??= new RaceMobileControlsManager(game);
  return manager;
}
