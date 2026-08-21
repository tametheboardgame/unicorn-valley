import Phaser from 'phaser';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  getBrowserAtmosphericTimeService,
  type AtmosphericTimeDefinition,
  type AtmosphericTimeState,
} from './AtmosphericTimeService';

const SUPPORTED_SCENES = new Set(['CrystalBrookScene', 'WhisperingWoodsScene']);
const PRESENTATION_NAME = 'atmospheric-time-presentation';

interface SceneTimeState {
  scene: Phaser.Scene;
  overlay: Phaser.GameObjects.Rectangle;
  button: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
  cycleKey: Phaser.Input.Keyboard.Key | null;
}

export class AtmosphericTimeWorldManager {
  private readonly service = getBrowserAtmosphericTimeService(getBrowserSaveService().load());
  private readonly states = new Map<string, SceneTimeState>();
  private readonly unsubscribe: () => void;

  public constructor(private readonly game: Phaser.Game) {
    this.unsubscribe = this.service.subscribe((state) => this.applyState(state));
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => this.unsubscribe());
  }

  private update(): void {
    for (const scene of this.game.scene.getScenes(false)) {
      if (!SUPPORTED_SCENES.has(scene.scene.key) || !scene.scene.isActive()) {
        continue;
      }
      const state = this.ensureSceneState(scene);
      if (state.cycleKey && Phaser.Input.Keyboard.JustDown(state.cycleKey)) {
        this.service.cycle();
      }
    }

    for (const [sceneKey, state] of this.states) {
      if (!state.scene.scene.isActive()) {
        state.overlay.destroy();
        state.button.destroy();
        state.hint.destroy();
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
      .rectangle(640, 360, 1280, 720, 0xffffff, 0)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(96)
      .setName(PRESENTATION_NAME)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    const button = scene.add
      .text(1220, 24, '', {
        color: '#46545d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8e8',
        padding: { x: 12, y: 8 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(130)
      .setInteractive({ useHandCursor: true });
    const hint = scene.add
      .text(1220, 70, 'tap or T to change', {
        color: '#dce8e8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        backgroundColor: '#30434ca8',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(130)
      .setAlpha(0.85);

    button.on('pointerdown', () => this.service.cycle());
    const state: SceneTimeState = {
      scene,
      overlay,
      button,
      hint,
      cycleKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.T) ?? null,
    };
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
    state.button.setText(`${definition.icon} ${definition.label}`);

    if (definition.id === 'night') {
      this.ensureNightStars(state.scene);
    } else {
      state.scene.children.getAll(PRESENTATION_NAME).forEach((object) => {
        if (object !== state.overlay && object !== state.button && object !== state.hint) {
          object.destroy();
        }
      });
    }
  }

  private ensureNightStars(scene: Phaser.Scene): void {
    const existing = scene.children.getByName(`${PRESENTATION_NAME}:stars`);
    if (existing) {
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
      scene.add
        .circle(x, y, index % 2 === 0 ? 3 : 2, 0xf4f4cf, 0.78)
        .setScrollFactor(0)
        .setDepth(97),
    );
    const container = scene.add
      .container(0, 0, stars)
      .setName(`${PRESENTATION_NAME}:stars`)
      .setScrollFactor(0)
      .setDepth(97);
    scene.tweens.add({
      targets: stars,
      alpha: { from: 0.35, to: 0.95 },
      duration: 1250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    container.setVisible(true);
  }
}

let manager: AtmosphericTimeWorldManager | null = null;

export function getAtmosphericTimeWorldManager(game: Phaser.Game): AtmosphericTimeWorldManager {
  manager ??= new AtmosphericTimeWorldManager(game);
  return manager;
}
