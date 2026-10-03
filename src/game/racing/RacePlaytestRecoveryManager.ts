import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { NovaFirstRacePhase } from '../story/NovaFirstRaceStory';
import type { RaceRunState } from './RaceRun';

export const RACE_ENTRY_CONFIRMATION_NAME = 'race-entry-confirmation';
export const RACE_ENTRY_SIGN_NAME = 'race-entry-shared-start-sign';
export const RACE_FINISH_RESTART_ZONE_NAME = 'race-finish-restart-zone';
export const RACE_FINISH_EXIT_ZONE_NAME = 'race-finish-exit-zone';

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
  finishPanel?: Phaser.GameObjects.Container | null;
  restartRace(): void;
  exitRace(): void;
}

interface FinishState {
  installed: boolean;
  restartZone: Phaser.GameObjects.Zone | null;
  exitZone: Phaser.GameObjects.Zone | null;
  enterKey: Phaser.Input.Keyboard.Key | null;
  rKey: Phaser.Input.Keyboard.Key | null;
  mKey: Phaser.Input.Keyboard.Key | null;
}

export interface RaceEntryPromptCopy {
  title: string;
  detail: string;
  yesLabel: string;
  targetScene: string;
  payload?: object;
}

export function resolveRaceEntryPrompt(phase: NovaFirstRacePhase): RaceEntryPromptCopy {
  if (phase === 'ready-to-race') {
    return {
      title: "Start Nova's First Run?",
      detail: 'A gentle practice race with Nova.',
      yesLabel: 'Yes, start!',
      targetScene: 'NovaTutorialRaceScene',
    };
  }

  if (phase === 'complete') {
    return {
      title: 'Start Sunrise Sprint?',
      detail: 'The full Rainbow Run race starts here too.',
      yesLabel: 'Yes, race!',
      targetScene: 'RaceScene',
    };
  }

  if (phase === 'result-ready') {
    return {
      title: 'Go back to Nova?',
      detail: 'Nova is waiting to hear how your first run went.',
      yesLabel: 'Yes, find Nova',
      targetScene: 'RainbowRunEntryScene',
    };
  }

  return {
    title: 'Meet Nova before racing?',
    detail: 'Nova will show you how Rainbow Run works.',
    yesLabel: 'Yes, meet Nova',
    targetScene: 'RainbowRunEntryScene',
  };
}

function asRaceScene(scene: Phaser.Scene): RaceSceneRuntime {
  return scene as unknown as RaceSceneRuntime;
}

function justDown(key: Phaser.Input.Keyboard.Key | null): boolean {
  return key ? Phaser.Input.Keyboard.JustDown(key) : false;
}

/**
 * Fallback interaction zones for the race finish panel.
 *
 * Rainbow Run entry/quest ownership moved to RainbowRunEntryScene in H4.4A. This manager no
 * longer watches Rainbow Meadow or creates race-entry presentation there.
 */
export class RacePlaytestRecoveryManager {
  private readonly finishStates = new WeakMap<Phaser.Scene, FinishState>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.PRE_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (scene.scene.key === 'RaceScene') {
        this.updateRaceFinish(scene);
      }
    }
  }

  private updateRaceFinish(scene: Phaser.Scene): void {
    const runtime = asRaceScene(scene);
    if (!runtime.runState?.movement.finished || !runtime.finishPanel) {
      return;
    }

    const state = this.ensureFinishState(scene);
    if (!state.installed) {
      this.installFinishZones(scene, state);
    }

    if (justDown(state.enterKey) || justDown(state.rKey)) {
      this.restartRace(scene);
    } else if (justDown(state.mKey)) {
      this.exitRace(scene);
    }
  }

  private ensureFinishState(scene: Phaser.Scene): FinishState {
    const existing = this.finishStates.get(scene);
    if (existing) {
      return existing;
    }

    const keyboard = scene.input.keyboard;
    const state: FinishState = {
      installed: false,
      restartZone: null,
      exitZone: null,
      enterKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null,
      rKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R) ?? null,
      mKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.M) ?? null,
    };
    this.finishStates.set(scene, state);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      state.restartZone?.destroy();
      state.exitZone?.destroy();
      this.finishStates.delete(scene);
    });

    return state;
  }

  private installFinishZones(scene: Phaser.Scene, state: FinishState): void {
    state.installed = true;
    const y = GAME_HEIGHT / 2 + 190;

    state.restartZone = scene.add
      .zone(GAME_WIDTH / 2 - 145, y, 250, 88)
      .setName(RACE_FINISH_RESTART_ZONE_NAME)
      .setScrollFactor(0)
      .setDepth(260)
      .setInteractive({ useHandCursor: true });
    state.exitZone = scene.add
      .zone(GAME_WIDTH / 2 + 145, y, 250, 88)
      .setName(RACE_FINISH_EXIT_ZONE_NAME)
      .setScrollFactor(0)
      .setDepth(260)
      .setInteractive({ useHandCursor: true });

    state.restartZone.on('pointerdown', () => this.restartRace(scene));
    state.exitZone.on('pointerdown', () => this.exitRace(scene));
  }

  private restartRace(scene: Phaser.Scene): void {
    asRaceScene(scene).restartRace();
  }

  private exitRace(scene: Phaser.Scene): void {
    asRaceScene(scene).exitRace();
  }
}

let browserRacePlaytestRecoveryManager: RacePlaytestRecoveryManager | null = null;

export function getRacePlaytestRecoveryManager(game: Phaser.Game): RacePlaytestRecoveryManager {
  browserRacePlaytestRecoveryManager ??= new RacePlaytestRecoveryManager(game);
  return browserRacePlaytestRecoveryManager;
}
