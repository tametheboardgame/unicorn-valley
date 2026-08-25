import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';
import { resolveRaceRunning, updateRaceKeyboardArmed } from './RaceManualControl';
import type { RaceRunState } from './RaceRun';

const MANUAL_CONTROL_SCENES = new Set(['NovaTutorialRaceScene', 'RaceScene']);

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
}

interface RaceControlState {
  runBackground: Phaser.GameObjects.Rectangle;
  runLabel: Phaser.GameObjects.Text;
  runHint: Phaser.GameObjects.Text;
  runZone: Phaser.GameObjects.Zone;
  rightKey: Phaser.Input.Keyboard.Key | null;
  dKey: Phaser.Input.Keyboard.Key | null;
  enterKey: Phaser.Input.Keyboard.Key | null;
  spaceKey: Phaser.Input.Keyboard.Key | null;
  eKey: Phaser.Input.Keyboard.Key | null;
  keyboardArmed: boolean;
  touchRunning: boolean;
  continueWasDown: boolean;
  returnToNovaZone: Phaser.GameObjects.Zone | null;
}

function asRaceScene(scene: Phaser.Scene): RaceSceneRuntime {
  return scene as unknown as RaceSceneRuntime;
}

export class RacePlayerControlManager {
  private readonly states = new WeakMap<Phaser.Scene, RaceControlState>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.PRE_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (!MANUAL_CONTROL_SCENES.has(scene.scene.key)) {
        continue;
      }

      const state = this.ensureScene(scene);
      const runtime = asRaceScene(scene);
      const rightDown = state.rightKey?.isDown ?? false;
      const dDown = state.dKey?.isDown ?? false;
      state.keyboardArmed = updateRaceKeyboardArmed(state.keyboardArmed, rightDown, dDown);

      const running = resolveRaceRunning(state.keyboardArmed, rightDown, dDown, state.touchRunning);
      runtime.runState.forwardControlMultiplier = runtime.runState.movement.finished
        ? 0
        : running
          ? 1
          : 0;

      state.runBackground.setScale(running ? 0.96 : 1);
      state.runLabel.setScale(running ? 1.04 : 1);

      if (runtime.runState.movement.finished) {
        state.runZone.disableInteractive();
        state.runBackground.setAlpha(0.45);
        state.runLabel.setAlpha(0.45);
        state.runHint.setAlpha(0.45);
        state.touchRunning = false;

        if (scene.scene.key === 'NovaTutorialRaceScene' && !state.returnToNovaZone) {
          state.returnToNovaZone = this.createReturnToNovaZone(scene);
        }
      }

      if (scene.scene.key === 'NovaTutorialRaceScene' && runtime.runState.movement.finished) {
        const continueDown =
          (state.enterKey?.isDown ?? false) ||
          (state.spaceKey?.isDown ?? false) ||
          (state.eKey?.isDown ?? false);
        if (continueDown && !state.continueWasDown) {
          this.returnToNova(scene);
        }
        state.continueWasDown = continueDown;
      } else {
        state.continueWasDown =
          (state.enterKey?.isDown ?? false) ||
          (state.spaceKey?.isDown ?? false) ||
          (state.eKey?.isDown ?? false);
      }
    }
  }

  private ensureScene(scene: Phaser.Scene): RaceControlState {
    const existing = this.states.get(scene);
    if (existing) {
      return existing;
    }

    const keyboard = scene.input.keyboard;
    const rightKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT, true) ?? null;
    const dKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.D) ?? null;
    const enterKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null;
    const spaceKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE, true) ?? null;
    const eKey = keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null;

    const x = 142;
    const y = GAME_HEIGHT - 102;
    const runBackground = scene.add
      .rectangle(x, y, 228, 94, 0xffefb7, 0.98)
      .setName('race-run-button')
      .setStrokeStyle(5, 0xd49acb, 1)
      .setScrollFactor(0)
      .setDepth(110);
    const runLabel = scene.add
      .text(x, y - 9, 'RUN →', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setName('race-run-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);
    const runHint = scene.add
      .text(x, y + 25, 'hold button / → / D', {
        color: '#7b6782',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      })
      .setName('race-run-hint')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);
    const runZone = scene.add
      .zone(x, y, 244, 108)
      .setName('race-run-touch-zone')
      .setScrollFactor(0)
      .setDepth(112)
      .setInteractive({ useHandCursor: true });

    const state: RaceControlState = {
      runBackground,
      runLabel,
      runHint,
      runZone,
      rightKey,
      dKey,
      enterKey,
      spaceKey,
      eKey,
      keyboardArmed: !(rightKey?.isDown || dKey?.isDown),
      touchRunning: false,
      continueWasDown: false,
      returnToNovaZone: null,
    };

    const stopTouchRunning = (): void => {
      state.touchRunning = false;
    };

    runZone.on('pointerdown', () => {
      state.touchRunning = true;
    });
    runZone.on('pointerup', stopTouchRunning);
    runZone.on('pointerout', stopTouchRunning);
    runZone.on('pointerupoutside', stopTouchRunning);

    this.states.set(scene, state);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      state.touchRunning = false;
      this.states.delete(scene);
    });

    return state;
  }

  private createReturnToNovaZone(scene: Phaser.Scene): Phaser.GameObjects.Zone {
    const zone = scene.add
      .zone(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 137, 380, 118)
      .setName('race-return-to-nova-touch-zone')
      .setScrollFactor(0)
      .setDepth(220)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      zone.disableInteractive();
      this.returnToNova(scene);
    });

    return zone;
  }

  private returnToNova(scene: Phaser.Scene): void {
    const nova = RAINBOW_MEADOW_MAP.npcMarkers.find((marker) => marker.id === 'nova');
    if (nova) {
      setRainbowMeadowPlayerSpawn({
        x: nova.position.x - 185,
        y: nova.position.y + 35,
      });
    }

    saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_MEADOW_LOCATION_ID);
    scene.scene.start('NovaStoryScene', { returnScene: 'RainbowMeadowScene' });
  }
}

let browserRacePlayerControlManager: RacePlayerControlManager | null = null;

export function getRacePlayerControlManager(game: Phaser.Game): RacePlayerControlManager {
  browserRacePlayerControlManager ??= new RacePlayerControlManager(game);
  return browserRacePlayerControlManager;
}
