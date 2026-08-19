import Phaser from 'phaser';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { getNovaFirstRacePhase, type NovaFirstRacePhase } from '../story/NovaFirstRaceStory';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import { worldDepthForY } from '../world/WorldDepth';
import type { RaceRunState } from './RaceRun';

export const RACE_ENTRY_CONFIRMATION_NAME = 'race-entry-confirmation';
export const RACE_ENTRY_SIGN_NAME = 'race-entry-shared-start-sign';
export const RACE_FINISH_RESTART_ZONE_NAME = 'race-finish-restart-zone';
export const RACE_FINISH_EXIT_ZONE_NAME = 'race-finish-exit-zone';

interface RaceSceneRuntime extends Phaser.Scene {
  runState: RaceRunState;
  finishPanel?: Phaser.GameObjects.Container | null;
}

interface MeadowState {
  wasInside: boolean;
  modal: Phaser.GameObjects.Container | null;
  yesZone: Phaser.GameObjects.Zone | null;
  noZone: Phaser.GameObjects.Zone | null;
  sign: Phaser.GameObjects.Container | null;
  yesKey: Phaser.Input.Keyboard.Key | null;
  noKey: Phaser.Input.Keyboard.Key | null;
  enterKey: Phaser.Input.Keyboard.Key | null;
  escapeKey: Phaser.Input.Keyboard.Key | null;
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
      targetScene: 'NovaStoryScene',
      payload: { returnScene: 'RainbowMeadowScene' },
    };
  }

  return {
    title: 'Meet Nova before racing?',
    detail: 'Nova will show you how Rainbow Run works.',
    yesLabel: 'Yes, meet Nova',
    targetScene: 'NovaStoryScene',
    payload: { returnScene: 'RainbowMeadowScene' },
  };
}

function asRaceScene(scene: Phaser.Scene): RaceSceneRuntime {
  return scene as unknown as RaceSceneRuntime;
}

function justDown(key: Phaser.Input.Keyboard.Key | null): boolean {
  return key ? Phaser.Input.Keyboard.JustDown(key) : false;
}

export class RacePlaytestRecoveryManager {
  private readonly meadowStates = new WeakMap<Phaser.Scene, MeadowState>();
  private readonly finishStates = new WeakMap<Phaser.Scene, FinishState>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.PRE_STEP, this.update, this);
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(true)) {
      if (scene.scene.key === 'RainbowMeadowScene') {
        this.updateMeadow(scene);
      } else if (scene.scene.key === 'RaceScene') {
        this.updateRaceFinish(scene);
      }
    }
  }

  private updateMeadow(scene: Phaser.Scene): void {
    const state = this.ensureMeadowState(scene);
    const player = scene.children.getByName(WORLD_PLAYER_NAME) as Phaser.GameObjects.Sprite | null;
    const entrance = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (feature) => feature.id === 'rainbow-run-entrance',
    );
    if (!player || !entrance) {
      return;
    }

    if (state.modal) {
      if (justDown(state.yesKey) || justDown(state.enterKey)) {
        this.confirmRaceEntry(scene, state);
      } else if (justDown(state.noKey) || justDown(state.escapeKey)) {
        this.closeRaceEntry(scene, state);
      }
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      entrance.approach.x,
      entrance.approach.y,
    );
    const inside = distance <= 175;

    if (inside && !state.wasInside) {
      state.wasInside = true;
      this.openRaceEntry(scene, state);
      return;
    }

    if (!inside && distance >= 220) {
      state.wasInside = false;
    }
  }

  private ensureMeadowState(scene: Phaser.Scene): MeadowState {
    const existing = this.meadowStates.get(scene);
    if (existing) {
      return existing;
    }

    const keyboard = scene.input.keyboard;
    const state: MeadowState = {
      wasInside: false,
      modal: null,
      yesZone: null,
      noZone: null,
      sign: this.createSharedRaceStartSign(scene),
      yesKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Y) ?? null,
      noKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.N) ?? null,
      enterKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER) ?? null,
      escapeKey: keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC) ?? null,
    };
    this.meadowStates.set(scene, state);

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      state.sign?.destroy(true);
      this.destroyRaceEntry(state);
      this.meadowStates.delete(scene);
    });

    return state;
  }

  private createSharedRaceStartSign(scene: Phaser.Scene): Phaser.GameObjects.Container | null {
    const entrance = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (feature) => feature.id === 'rainbow-run-entrance',
    );
    if (!entrance) {
      return null;
    }

    const x = entrance.approach.x - 30;
    const y = entrance.approach.y - 150;
    const shadow = scene.add.rectangle(5, 7, 290, 96, 0x493958, 0.18);
    const panel = scene.add
      .rectangle(0, 0, 290, 96, 0xfff8e8, 0.96)
      .setStrokeStyle(5, 0xc989c3, 0.98);
    const heading = scene.add
      .text(0, -22, 'RACES START HERE', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const detail = scene.add
      .text(0, 17, "Nova's First Run  •  Sunrise Sprint", {
        color: '#765b7e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    return scene.add
      .container(x, y, [shadow, panel, heading, detail])
      .setName(RACE_ENTRY_SIGN_NAME)
      .setDepth(worldDepthForY(entrance.approach.y, 0.45));
  }

  private openRaceEntry(scene: Phaser.Scene, state: MeadowState): void {
    if (state.modal) {
      return;
    }

    const progress = getBrowserQuestEngine().getProgress(NOVA_FIRST_RACE_QUEST_ID);
    const copy = resolveRaceEntryPrompt(getNovaFirstRacePhase(progress));

    scene.physics.world.pause();

    const shade = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x392f44,
      0.36,
    );
    const shadow = scene.add.rectangle(
      GAME_WIDTH / 2 + 8,
      GAME_HEIGHT / 2 + 10,
      660,
      310,
      0x493958,
      0.28,
    );
    const panel = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 650, 300, 0xfff8e8, 0.995)
      .setStrokeStyle(6, 0xb689b8, 1);
    const title = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 78, copy.title, {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5);
    const detail = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 24, copy.detail, {
        color: '#735b80',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        align: 'center',
        wordWrap: { width: 560 },
      })
      .setOrigin(0.5);
    const yesButton = scene.add
      .rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 76, 240, 72, 0xffefb7, 1)
      .setStrokeStyle(4, 0xd49acb, 1);
    const yesText = scene.add
      .text(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 76, copy.yesLabel, {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const noButton = scene.add
      .rectangle(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 76, 220, 72, 0xf1e2fb, 1)
      .setStrokeStyle(4, 0xb895c8, 1);
    const noText = scene.add
      .text(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 76, 'Not now', {
        color: '#60486d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const hint = scene.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 127, 'Y / Enter = yes   •   N / Esc = no', {
        color: '#8a748f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5);

    state.modal = scene.add
      .container(0, 0, [
        shade,
        shadow,
        panel,
        title,
        detail,
        yesButton,
        yesText,
        noButton,
        noText,
        hint,
      ])
      .setName(RACE_ENTRY_CONFIRMATION_NAME)
      .setScrollFactor(0)
      .setDepth(230);

    state.yesZone = scene.add
      .zone(GAME_WIDTH / 2 - 145, GAME_HEIGHT / 2 + 76, 250, 84)
      .setName(`${RACE_ENTRY_CONFIRMATION_NAME}-yes`)
      .setScrollFactor(0)
      .setDepth(240)
      .setInteractive({ useHandCursor: true });
    state.noZone = scene.add
      .zone(GAME_WIDTH / 2 + 145, GAME_HEIGHT / 2 + 76, 230, 84)
      .setName(`${RACE_ENTRY_CONFIRMATION_NAME}-no`)
      .setScrollFactor(0)
      .setDepth(240)
      .setInteractive({ useHandCursor: true });

    state.yesZone.on('pointerdown', () => this.confirmRaceEntry(scene, state));
    state.noZone.on('pointerdown', () => this.closeRaceEntry(scene, state));
  }

  private confirmRaceEntry(scene: Phaser.Scene, state: MeadowState): void {
    const progress = getBrowserQuestEngine().getProgress(NOVA_FIRST_RACE_QUEST_ID);
    const copy = resolveRaceEntryPrompt(getNovaFirstRacePhase(progress));
    this.destroyRaceEntry(state);
    scene.physics.world.resume();
    scene.scene.start(copy.targetScene, copy.payload);
  }

  private closeRaceEntry(scene: Phaser.Scene, state: MeadowState): void {
    this.destroyRaceEntry(state);
    scene.physics.world.resume();
  }

  private destroyRaceEntry(state: MeadowState): void {
    state.yesZone?.destroy();
    state.noZone?.destroy();
    state.modal?.destroy(true);
    state.yesZone = null;
    state.noZone = null;
    state.modal = null;
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
    scene.scene.restart();
  }

  private exitRace(scene: Phaser.Scene): void {
    const raceEntrance = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (feature) => feature.id === 'rainbow-run-entrance',
    );
    if (raceEntrance) {
      setRainbowMeadowPlayerSpawn({
        x: raceEntrance.approach.x - 260,
        y: raceEntrance.approach.y,
      });
    }
    saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_MEADOW_LOCATION_ID);
    scene.scene.start('RainbowMeadowScene');
  }
}

let browserRacePlaytestRecoveryManager: RacePlaytestRecoveryManager | null = null;

export function getRacePlaytestRecoveryManager(game: Phaser.Game): RacePlaytestRecoveryManager {
  browserRacePlaytestRecoveryManager ??= new RacePlaytestRecoveryManager(game);
  return browserRacePlaytestRecoveryManager;
}
