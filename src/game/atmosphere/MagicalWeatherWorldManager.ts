import Phaser from 'phaser';
import { STARDEW_DROP_DISCOVERY_ID } from '../../content/r5Weather';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  getBrowserMagicalWeatherService,
  isWeatherDiscoveryAvailable,
  type MagicalWeatherDefinition,
  type MagicalWeatherState,
} from './MagicalWeatherService';
import { supportsOutdoorAtmosphere } from './OutdoorWorldScenes';

const STARDEW_POSITION = { x: 2780, y: 1500 } as const;
const STARDEW_WORLD_FLAG = 'flag:r5-stardew-drop-found';
const SPARKLE_FIELD_NAME = 'magical-weather-sparkle-world';

interface PositionedGameObject extends Phaser.GameObjects.GameObject {
  x: number;
  y: number;
}

interface SceneWeatherState {
  scene: Phaser.Scene;
  effects: Phaser.GameObjects.Container | null;
  discoveryMarker: Phaser.GameObjects.Container | null;
  button: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
  cycleKey: Phaser.Input.Keyboard.Key | null;
  sparkleRecycleSeed: number;
}

function isPositionedGameObject(object: Phaser.GameObjects.GameObject): object is PositionedGameObject {
  const candidate = object as Partial<PositionedGameObject>;
  return typeof candidate.x === 'number' && typeof candidate.y === 'number';
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  return (
    (scene.children.list.find(
      (object) =>
        object instanceof Phaser.Physics.Arcade.Sprite &&
        object.texture.key.startsWith('player-unicorn-'),
    ) as Phaser.Physics.Arcade.Sprite | undefined) ?? null
  );
}

export class MagicalWeatherWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly discoveryService = new DiscoveryService(this.saveService);
  private readonly service = getBrowserMagicalWeatherService(this.saveService);
  private readonly states = new Map<string, SceneWeatherState>();
  private readonly unsubscribe: () => void;
  private refreshCounter = 0;

  public constructor(private readonly game: Phaser.Game) {
    this.unsubscribe = this.service.subscribe((state) => this.applyState(state));
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => this.unsubscribe());
  }

  private update(): void {
    this.refreshCounter += 1;
    if (this.refreshCounter >= 30) {
      this.refreshCounter = 0;
      this.service.refreshAutomatic();
    }

    for (const scene of this.game.scene.getScenes(false)) {
      if (!supportsOutdoorAtmosphere(scene.scene.key) || !scene.scene.isActive()) {
        continue;
      }
      const state = this.ensureSceneState(scene);
      if (state.cycleKey && Phaser.Input.Keyboard.JustDown(state.cycleKey)) {
        this.service.cycleMode();
        this.renderDefinition(state, this.service.getDefinition());
      }
      this.updateSparkleField(state);
      this.updateWeatherDiscovery(state);
    }

    for (const [sceneKey, state] of this.states) {
      if (!state.scene.scene.isActive()) {
        this.destroySceneState(state);
        this.states.delete(sceneKey);
      }
    }
  }

  private ensureSceneState(scene: Phaser.Scene): SceneWeatherState {
    const existing = this.states.get(scene.scene.key);
    if (existing?.button.active) {
      return existing;
    }

    this.service.refreshAutomatic();
    const button = scene.add
      .text(GAME_WIDTH - 18, 196, '', {
        color: '#3e5260',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#f4fbffe8',
        padding: { x: 10, y: 6 },
      })
      .setName('magical-weather-control')
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10_000)
      .setInteractive({ useHandCursor: true });
    const hint = scene.add
      .text(GAME_WIDTH - 18, 230, 'Y / tap: weather', {
        color: '#eff9ff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        backgroundColor: '#30434ca8',
        padding: { x: 7, y: 3 },
      })
      .setName('magical-weather-hint')
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(10_000)
      .setAlpha(0.82);

    const state: SceneWeatherState = {
      scene,
      effects: null,
      discoveryMarker: null,
      button,
      hint,
      cycleKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.Y) ?? null,
      sparkleRecycleSeed: 0,
    };
    button.on('pointerdown', () => {
      this.service.cycleMode();
      this.renderDefinition(state, this.service.getDefinition());
    });
    this.states.set(scene.scene.key, state);
    this.renderDefinition(state, this.service.getDefinition());
    return state;
  }

  private applyState(weatherState: MagicalWeatherState): void {
    const definition = this.service.getDefinition();
    if (definition.id !== weatherState) {
      return;
    }
    for (const state of this.states.values()) {
      this.renderDefinition(state, definition);
    }
  }

  private renderDefinition(state: SceneWeatherState, definition: MagicalWeatherDefinition): void {
    const modeSuffix = this.service.getMode() === 'auto' ? ' · Auto' : '';
    state.button.setText(`${definition.icon} ${definition.label}${modeSuffix}`);
    this.destroyEffects(state);

    if (definition.id === 'rain') {
      state.effects = this.createRain(state.scene);
    } else if (definition.id === 'sparkle') {
      state.effects = this.createSparkleShower(state);
    }

    if (definition.id !== 'sparkle') {
      this.destroyDiscoveryMarker(state);
    }
  }

  private createRain(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const drops: Phaser.GameObjects.Rectangle[] = [];
    for (let index = 0; index < 26; index += 1) {
      const x = (index * 173 + 71) % GAME_WIDTH;
      const y = ((index * 97 + 31) % GAME_HEIGHT) - GAME_HEIGHT;
      const drop = scene.add.rectangle(x, y, 3, 28 + (index % 4) * 5, 0xcceeff, 0.42);
      drop.setAngle(12);
      drops.push(drop);
      scene.tweens.add({
        targets: drop,
        x: x - 74,
        y: y + GAME_HEIGHT * 2.25,
        duration: 1200 + (index % 5) * 95,
        delay: (index % 7) * 85,
        repeat: -1,
        ease: 'Linear',
      });
    }
    return scene.add
      .container(0, 0, drops)
      .setName('magical-weather-rain-screen')
      .setScrollFactor(0)
      .setDepth(98);
  }

  private createSparkleShower(state: SceneWeatherState): Phaser.GameObjects.Container {
    const scene = state.scene;
    const player = findPlayer(scene);
    const centre = player ?? scene.cameras.main.midPoint;
    const sparkles: Phaser.GameObjects.Text[] = [];
    for (let index = 0; index < 22; index += 1) {
      const x = centre.x + ((index * 263 + 91) % 1400) - 700;
      const y = centre.y + ((index * 173 + 53) % 900) - 450;
      const sparkle = scene.add
        .text(x, y, index % 4 === 0 ? '✦' : '·', {
          color: index % 3 === 0 ? '#f7dcff' : '#fff3aa',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 4 === 0 ? '22px' : '30px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(0.25 + (index % 4) * 0.12);
      sparkles.push(sparkle);
      scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0.18, to: 0.9 },
        angle: index % 2 === 0 ? 18 : -18,
        scale: { from: 0.82, to: 1.12 },
        duration: 1150 + (index % 6) * 130,
        delay: (index % 5) * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
    return scene.add
      .container(0, 0, sparkles)
      .setName(SPARKLE_FIELD_NAME)
      .setScrollFactor(1)
      .setDepth(99);
  }

  private updateSparkleField(state: SceneWeatherState): void {
    if (this.service.getState() !== 'sparkle' || state.effects?.name !== SPARKLE_FIELD_NAME) {
      return;
    }
    const player = findPlayer(state.scene);
    if (!player) {
      return;
    }

    const objects = state.effects.getAll();
    for (const [index, object] of objects.entries()) {
      if (!isPositionedGameObject(object)) {
        continue;
      }
      const tooFar = Math.abs(object.x - player.x) > 760 || Math.abs(object.y - player.y) > 520;
      if (!tooFar) {
        continue;
      }
      state.sparkleRecycleSeed += 1;
      object.x = player.x + ((index * 263 + state.sparkleRecycleSeed * 127) % 1400) - 700;
      object.y = player.y + ((index * 173 + state.sparkleRecycleSeed * 97) % 900) - 450;
    }
  }

  private updateWeatherDiscovery(state: SceneWeatherState): void {
    if (state.scene.scene.key !== 'WhisperingWoodsScene') {
      return;
    }
    const alreadyFound = this.discoveryService.hasDiscovery(STARDEW_DROP_DISCOVERY_ID);
    const available = isWeatherDiscoveryAvailable(this.service.getState(), 'sparkle', alreadyFound);
    if (!available) {
      this.destroyDiscoveryMarker(state);
      return;
    }

    state.discoveryMarker ??= this.createWeatherDiscoveryMarker(state.scene);
    const player = findPlayer(state.scene);
    if (!player) {
      return;
    }
    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      STARDEW_POSITION.x,
      STARDEW_POSITION.y,
    );
    if (distance > 135) {
      return;
    }

    this.discoveryService.unlockDiscovery(STARDEW_DROP_DISCOVERY_ID, STARDEW_WORLD_FLAG);
    this.destroyDiscoveryMarker(state);
    state.scene.cameras.main.flash(220, 240, 220, 255, false);
    this.showDiscoveryFeedback(state.scene);
  }

  private createWeatherDiscoveryMarker(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const glow = scene.add.circle(0, 0, 54, 0xe7d5ff, 0.18);
    const drop = scene.add
      .text(0, 0, '💧', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '42px',
      })
      .setOrigin(0.5);
    const sparkle = scene.add
      .text(28, -32, '✦', {
        color: '#fff3aa',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const marker = scene.add
      .container(STARDEW_POSITION.x, STARDEW_POSITION.y, [glow, drop, sparkle])
      .setDepth(70);
    scene.tweens.add({
      targets: marker,
      y: STARDEW_POSITION.y - 10,
      scale: 1.08,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return marker;
  }

  private showDiscoveryFeedback(scene: Phaser.Scene): void {
    const feedback = scene.add
      .text(GAME_WIDTH / 2, 128, 'Weather discovery!\nStardew Drop 💧✨', {
        color: '#4f4768',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff9eaf2',
        padding: { x: 18, y: 10 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(10_010);
    scene.time.delayedCall(2200, () => feedback.destroy());
  }

  private destroyEffects(state: SceneWeatherState): void {
    if (!state.effects) {
      return;
    }
    state.scene.tweens.killTweensOf(state.effects.getAll());
    state.effects.destroy(true);
    state.effects = null;
  }

  private destroyDiscoveryMarker(state: SceneWeatherState): void {
    if (!state.discoveryMarker) {
      return;
    }
    state.scene.tweens.killTweensOf(state.discoveryMarker);
    state.discoveryMarker.destroy(true);
    state.discoveryMarker = null;
  }

  private destroySceneState(state: SceneWeatherState): void {
    this.destroyEffects(state);
    this.destroyDiscoveryMarker(state);
    state.button.destroy();
    state.hint.destroy();
  }
}

let manager: MagicalWeatherWorldManager | null = null;

export function getMagicalWeatherWorldManager(game: Phaser.Game): MagicalWeatherWorldManager {
  manager ??= new MagicalWeatherWorldManager(game);
  return manager;
}
