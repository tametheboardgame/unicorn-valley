import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';
import type { RaceRunState } from './RaceRun';

const MANUAL_CONTROL_SCENES = new Set(['NovaTutorialRaceScene', 'RaceScene']);

interface RaceInputControllerLike {
  getAxis(action: 'MOVE_X'): number;
}

interface RacePointerInputLike {
  setAxis(action: 'MOVE_X', value: number): void;
}

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
  inputController: RaceInputControllerLike | null;
  pointerInput: RacePointerInputLike | null;
  finishPanel: Phaser.GameObjects.Container | null;
}

interface RaceControlState {
  runBackground: Phaser.GameObjects.Rectangle;
  runLabel: Phaser.GameObjects.Text;
  runHint: Phaser.GameObjects.Text;
  runZone: Phaser.GameObjects.Zone;
  returnToNovaZone: Phaser.GameObjects.Zone | null;
}

function asRaceScene(scene: Phaser.Scene): RaceSceneRuntime {
  return scene as unknown as RaceSceneRuntime;
}

function clampForwardAxis(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, value));
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
      const forwardAxis = clampForwardAxis(runtime.inputController?.getAxis('MOVE_X') ?? 0);
      runtime.runState.forwardControlMultiplier = runtime.runState.movement.finished
        ? 0
        : forwardAxis;

      const running = runtime.runState.forwardControlMultiplier > 0;
      state.runBackground.setScale(running ? 0.96 : 1);
      state.runLabel.setScale(running ? 1.04 : 1);

      if (
        scene.scene.key === 'NovaTutorialRaceScene' &&
        runtime.finishPanel &&
        !state.returnToNovaZone
      ) {
        state.returnToNovaZone = this.createReturnToNovaZone(scene);
      }
    }
  }

  private ensureScene(scene: Phaser.Scene): RaceControlState {
    const existing = this.states.get(scene);
    if (existing) {
      return existing;
    }

    const x = 142;
    const y = GAME_HEIGHT - 102;
    const runBackground = scene.add
      .rectangle(x, y, 228, 94, 0xffefb7, 0.98)
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
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);
    const runHint = scene.add
      .text(x, y + 25, 'hold → / D', {
        color: '#7b6782',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(111);
    const runZone = scene.add
      .zone(x, y, 244, 108)
      .setScrollFactor(0)
      .setDepth(112)
      .setInteractive({ useHandCursor: true });

    const setTouchRunning = (running: boolean): void => {
      asRaceScene(scene).pointerInput?.setAxis('MOVE_X', running ? 1 : 0);
    };
    runZone.on('pointerdown', () => setTouchRunning(true));
    runZone.on('pointerup', () => setTouchRunning(false));
    runZone.on('pointerout', () => setTouchRunning(false));

    const state: RaceControlState = {
      runBackground,
      runLabel,
      runHint,
      runZone,
      returnToNovaZone: null,
    };
    this.states.set(scene, state);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      setTouchRunning(false);
      this.states.delete(scene);
    });

    return state;
  }

  private createReturnToNovaZone(scene: Phaser.Scene): Phaser.GameObjects.Zone {
    const zone = scene.add
      .zone(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 137, 340, 104)
      .setScrollFactor(0)
      .setDepth(170)
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
    scene.scene.start('RainbowMeadowScene');
  }
}

let browserRacePlayerControlManager: RacePlayerControlManager | null = null;

export function getRacePlayerControlManager(game: Phaser.Game): RacePlayerControlManager {
  browserRacePlayerControlManager ??= new RacePlayerControlManager(game);
  return browserRacePlayerControlManager;
}
