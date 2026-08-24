import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  getBrowserAtmosphericTimeService,
  type AtmosphericTimeDefinition,
  type AtmosphericTimeState,
} from './AtmosphericTimeService';
import { supportsOutdoorAtmosphere } from './OutdoorWorldScenes';

const PRESENTATION_NAME = 'atmospheric-time-presentation';
const AMBIENCE_NAME = 'atmospheric-time-ambient-cue';
const ATMOSPHERE_WORLD_DEPTH = 3;

interface SceneTimeState {
  scene: Phaser.Scene;
  overlay: Phaser.GameObjects.Rectangle;
  ambience: Phaser.GameObjects.Container | null;
  stars: Phaser.GameObjects.Container | null;
  button: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
  cycleKey: Phaser.Input.Keyboard.Key | null;
}

export class AtmosphericTimeWorldManager {
  private readonly service = getBrowserAtmosphericTimeService(getBrowserSaveService());
  private readonly states = new Map<string, SceneTimeState>();
  private readonly unsubscribe: () => void;

  public constructor(private readonly game: Phaser.Game) {
    this.unsubscribe = this.service.subscribe((state) => this.applyState(state));
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => this.unsubscribe());
  }

  private update(): void {
    this.service.advanceAutomatic(this.game.loop.delta);

    for (const scene of this.game.scene.getScenes(false)) {
      if (!supportsOutdoorAtmosphere(scene.scene.key) || !scene.scene.isActive()) {
        continue;
      }
      const state = this.ensureSceneState(scene);
      if (state.cycleKey && Phaser.Input.Keyboard.JustDown(state.cycleKey)) {
        this.service.cycleMode();
        this.renderDefinition(state, this.service.getDefinition());
      }
    }

    for (const [sceneKey, state] of this.states) {
      if (!state.scene.scene.isActive()) {
        this.destroySceneState(state);
        this.states.delete(sceneKey);
      }
    }
  }

  private ensureSceneState(scene: Phaser.Scene): SceneTimeState {
    const existing = this.states.get(scene.scene.key);
    if (existing?.overlay.active) {
      return existing;
    }

    const overlay = scene.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0)
      .setScrollFactor(0)
      .setDepth(ATMOSPHERE_WORLD_DEPTH)
      .setName(PRESENTATION_NAME);
    const button = scene.add
      .text(GAME_WIDTH - 18, 126, '', {
        color: '#46545d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8e8',
        padding: { x: 10, y: 6 },
      })
      .setName('atmospheric-time-control')
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10_000)
      .setInteractive({ useHandCursor: true });
    const hint = scene.add
      .text(GAME_WIDTH - 18, 160, 'T / tap: sky', {
        color: '#eaf3f2',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        backgroundColor: '#30434ca8',
        padding: { x: 7, y: 3 },
      })
      .setName('atmospheric-time-hint')
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10_000)
      .setAlpha(0.82);

    const state: SceneTimeState = {
      scene,
      overlay,
      ambience: null,
      stars: null,
      button,
      hint,
      cycleKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.T) ?? null,
    };
    button.on('pointerdown', () => {
      this.service.cycleMode();
      this.renderDefinition(state, this.service.getDefinition());
    });
    this.states.set(scene.scene.key, state);
    this.renderDefinition(state, this.service.getDefinition());
    return state;
  }

  private applyState(timeState: AtmosphericTimeState): void {
    const definition = this.service.getDefinition();
    if (definition.id !== timeState) {
      return;
    }
    for (const state of this.states.values()) {
      this.renderDefinition(state, definition);
    }
  }

  private renderDefinition(state: SceneTimeState, definition: AtmosphericTimeDefinition): void {
    state.overlay.setFillStyle(definition.overlayColor, definition.overlayAlpha);
    const modeSuffix = this.service.getMode() === 'auto' ? ' · Auto' : '';
    state.button.setText(`${definition.icon} ${definition.label}${modeSuffix}`);
    this.setAmbientCue(state, definition.id);
    this.setNightStarsVisible(state, definition.id === 'night');
  }

  private setAmbientCue(state: SceneTimeState, timeState: AtmosphericTimeState): void {
    state.ambience?.destroy(true);
    state.ambience = null;

    const objects: Phaser.GameObjects.GameObject[] = [];
    if (timeState === 'morning') {
      objects.push(
        state.scene.add.circle(145, 150, 86, 0xfff0b8, 0.13),
        state.scene.add.rectangle(GAME_WIDTH / 2, 108, GAME_WIDTH, 110, 0xdff2ff, 0.055),
      );
    } else if (timeState === 'afternoon') {
      objects.push(
        state.scene.add.circle(GAME_WIDTH - 210, 94, 98, 0xffe995, 0.16),
        state.scene.add.rectangle(GAME_WIDTH / 2, 104, GAME_WIDTH, 96, 0xfff6cf, 0.045),
      );
    } else if (timeState === 'sunset') {
      objects.push(
        state.scene.add.circle(GAME_WIDTH - 175, 190, 105, 0xffc274, 0.13),
        state.scene.add.rectangle(GAME_WIDTH / 2, 162, GAME_WIDTH, 120, 0xf59a7d, 0.06),
      );
    }

    if (objects.length === 0) {
      return;
    }

    for (const object of objects) {
      if ('setScrollFactor' in object && typeof object.setScrollFactor === 'function') {
        object.setScrollFactor(0);
      }
    }
    state.ambience = state.scene.add
      .container(0, 0, objects)
      .setName(AMBIENCE_NAME)
      .setScrollFactor(0)
      .setDepth(ATMOSPHERE_WORLD_DEPTH + 0.1);
  }

  private setNightStarsVisible(state: SceneTimeState, visible: boolean): void {
    if (!visible) {
      state.stars?.setVisible(false);
      return;
    }
    if (state.stars) {
      state.stars.setVisible(true);
      return;
    }

    const stars = [
      [130, 120],
      [330, 180],
      [550, 100],
      [820, 160],
      [1030, 105],
      [1160, 220],
    ].map(([x, y], index) =>
      state.scene.add.circle(x, y, index % 2 === 0 ? 3 : 2, 0xf4f4cf, 0.78).setScrollFactor(0),
    );
    state.stars = state.scene.add
      .container(0, 0, stars)
      .setName(`${PRESENTATION_NAME}:stars`)
      .setScrollFactor(0)
      .setDepth(ATMOSPHERE_WORLD_DEPTH + 0.2);
    state.scene.tweens.add({
      targets: stars,
      alpha: { from: 0.35, to: 0.95 },
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private destroySceneState(state: SceneTimeState): void {
    state.overlay.destroy();
    state.ambience?.destroy(true);
    state.stars?.destroy(true);
    state.button.destroy();
    state.hint.destroy();
  }
}

let manager: AtmosphericTimeWorldManager | null = null;

export function getAtmosphericTimeWorldManager(game: Phaser.Game): AtmosphericTimeWorldManager {
  manager ??= new AtmosphericTimeWorldManager(game);
  return manager;
}
