import Phaser from 'phaser';
import {
  PEBBLE_FOUNTAIN_REPAIRED_FLAG,
  R4_PEBBLE_SECRET_DEFINITIONS,
} from '../../content/r4PebbleStory';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { SecretDiscoveryService } from '../discovery/SecretDiscoveryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const SUPPORTED_SCENES = [
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
] as const;

const PEBBLE_WORLD_PRESENTATION_NAME = 'pebble-world-presentation';
const PEBBLE_DISCOVERY_FEEDBACK_NAME = 'pebble-discovery-feedback';

interface CuriosityMarker {
  definition: SecretDiscoveryDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface PebbleWorldState {
  scene: Phaser.Scene;
  interactKey: Phaser.Input.Keyboard.Key | null;
  markers: Map<string, CuriosityMarker>;
  pebbleContainer: Phaser.GameObjects.Container | null;
  pebblePrompt: Phaser.GameObjects.Text | null;
  fountainRepair: Phaser.GameObjects.Container | null;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  const namedPlayer = scene.children.getByName(WORLD_PLAYER_NAME);
  if (namedPlayer instanceof Phaser.Physics.Arcade.Sprite) {
    return namedPlayer;
  }

  return (
    (scene.children.list.find(
      (object) =>
        object instanceof Phaser.Physics.Arcade.Sprite &&
        object.texture.key.startsWith('player-unicorn-'),
    ) as Phaser.Physics.Arcade.Sprite | undefined) ?? null
  );
}

function pebblePosition(): { x: number; y: number } {
  const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find(({ id }) => id === 'pebble');
  if (!marker) {
    throw new Error('Pebble requires a Sunbeam Village NPC marker.');
  }
  return marker.position;
}

export class PebbleCollectionWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly secretService = new SecretDiscoveryService(this.saveService);
  private state: PebbleWorldState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    const scene = this.findActiveScene();
    if (!scene) {
      this.clearState();
      return;
    }

    const state = this.ensureState(scene);
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    this.refreshCuriosityMarkers(state);
    this.refreshVillagePresentation(state);

    let nearest: CuriosityMarker | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const marker of state.markers.values()) {
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        marker.definition.position.x,
        marker.definition.position.y,
      );
      marker.prompt.setVisible(distance <= marker.definition.interactionRadius + 85);
      if (distance <= marker.definition.interactionRadius && distance < nearestDistance) {
        nearest = marker;
        nearestDistance = distance;
      }
    }

    const pebbleDistance =
      state.scene.scene.key === 'SunbeamVillageScene'
        ? Phaser.Math.Distance.Between(player.x, player.y, pebblePosition().x, pebblePosition().y)
        : Number.POSITIVE_INFINITY;
    state.pebblePrompt?.setVisible(pebbleDistance <= 225);

    if (!state.interactKey || !Phaser.Input.Keyboard.JustDown(state.interactKey)) {
      return;
    }

    if (nearest && nearestDistance <= pebbleDistance) {
      this.activateCuriosity(state, nearest.definition);
      return;
    }

    if (pebbleDistance <= 150) {
      this.openPebbleStory(state.scene);
    }
  }

  private findActiveScene(): Phaser.Scene | null {
    for (const sceneKey of SUPPORTED_SCENES) {
      const scene = this.game.scene.getScene(sceneKey);
      if (scene?.scene.isActive()) {
        return scene;
      }
    }
    return null;
  }

  private ensureState(scene: Phaser.Scene): PebbleWorldState {
    if (this.state?.scene === scene) {
      return this.state;
    }

    this.clearState();
    this.state = {
      scene,
      interactKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null,
      markers: new Map(),
      pebbleContainer: null,
      pebblePrompt: null,
      fountainRepair: null,
    };
    return this.state;
  }

  private refreshCuriosityMarkers(state: PebbleWorldState): void {
    const available = this.secretService.listAvailable(
      R4_PEBBLE_SECRET_DEFINITIONS,
      state.scene.scene.key,
    );
    const availableIds = new Set<string>(available.map(({ id }) => id));

    for (const [id, marker] of state.markers) {
      if (!availableIds.has(id) || !marker.container.active) {
        marker.container.destroy(true);
        state.markers.delete(id);
      }
    }

    for (const definition of available) {
      if (!state.markers.has(definition.id)) {
        state.markers.set(definition.id, this.createCuriosityMarker(state.scene, definition));
      }
    }
  }

  private createCuriosityMarker(
    scene: Phaser.Scene,
    definition: SecretDiscoveryDefinition,
  ): CuriosityMarker {
    const glow = scene.add.circle(0, 0, 24, 0xffec9c, 0.1).setStrokeStyle(2, 0xffffff, 0.2);
    const glint = scene.add
      .text(0, 0, '✦', {
        color: '#fff1a8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.62);
    const prompt = scene.add
      .text(0, 48, `${definition.actionLabel}: ${definition.label}  🔎`, {
        color: '#5e5360',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#fff9edea',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = scene.add
      .zone(0, 0, definition.interactionRadius * 1.4, definition.interactionRadius * 1.4)
      .setInteractive({ useHandCursor: true });

    const container = scene.add
      .container(definition.position.x, definition.position.y, [glow, glint, prompt, zone])
      .setName(PEBBLE_WORLD_PRESENTATION_NAME)
      .setDepth(19);

    zone.on('pointerdown', () => {
      const player = findPlayer(scene);
      if (!player) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        definition.position.x,
        definition.position.y,
      );
      if (distance <= definition.interactionRadius) {
        this.activateCuriosity(this.state, definition);
      }
    });

    scene.tweens.add({
      targets: [glow, glint],
      alpha: 0.95,
      scale: 1.16,
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container, prompt };
  }

  private activateCuriosity(
    state: PebbleWorldState | null,
    definition: SecretDiscoveryDefinition,
  ): void {
    if (!state?.scene.scene.isActive()) {
      return;
    }

    const result = this.secretService.discover(definition);
    if (result.status !== 'discovered') {
      return;
    }

    const marker = state.markers.get(definition.id);
    marker?.container.destroy(true);
    state.markers.delete(definition.id);
    this.showDiscoveryFeedback(state.scene, definition.feedback);
  }

  private refreshVillagePresentation(state: PebbleWorldState): void {
    if (state.scene.scene.key !== 'SunbeamVillageScene') {
      state.pebbleContainer?.destroy(true);
      state.pebbleContainer = null;
      state.pebblePrompt = null;
      state.fountainRepair?.destroy(true);
      state.fountainRepair = null;
      return;
    }

    if (!state.pebbleContainer?.active) {
      const position = pebblePosition();
      const cover = state.scene.add.circle(0, 0, 39, 0xfff1d0, 0.98).setStrokeStyle(4, 0x7a806d, 1);
      const icon = state.scene.add
        .text(0, -2, '🪨', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '30px',
        })
        .setOrigin(0.5);
      const prompt = state.scene.add
        .text(0, 62, 'Talk: Pebble  💬', {
          color: '#4f594b',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dfed',
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5)
        .setVisible(false);
      const zone = state.scene.add.zone(0, 0, 170, 170).setInteractive({ useHandCursor: true });

      state.pebbleContainer = state.scene.add
        .container(position.x, position.y, [cover, icon, prompt, zone])
        .setName(PEBBLE_WORLD_PRESENTATION_NAME)
        .setDepth(13);
      state.pebblePrompt = prompt;

      zone.on('pointerdown', () => {
        const player = findPlayer(state.scene);
        if (!player) {
          return;
        }
        const distance = Phaser.Math.Distance.Between(player.x, player.y, position.x, position.y);
        if (distance <= 150) {
          this.openPebbleStory(state.scene);
        }
      });
    }

    const repaired = this.saveService.load()?.world.flags[PEBBLE_FOUNTAIN_REPAIRED_FLAG] === true;
    if (repaired && !state.fountainRepair?.active) {
      state.fountainRepair = this.createFountainRepair(state.scene);
    } else if (!repaired && state.fountainRepair) {
      state.fountainRepair.destroy(true);
      state.fountainRepair = null;
    }
  }

  private createFountainRepair(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const objects: Phaser.GameObjects.GameObject[] = [];
    const ring = scene.add
      .circle(1500, 1050, 118, 0xffe898, 0.08)
      .setStrokeStyle(5, 0xffe192, 0.62)
      .setDepth(11);
    objects.push(ring);

    const sparkleOffsets = [
      [-88, -30],
      [88, -30],
      [-64, 72],
      [64, 72],
    ] as const;
    for (const [xOffset, yOffset] of sparkleOffsets) {
      const sparkle = scene.add
        .text(1500 + xOffset, 1050 + yOffset, '✦', {
          color: '#fff0a0',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '24px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(12);
      objects.push(sparkle);
      scene.tweens.add({
        targets: sparkle,
        alpha: { from: 0.35, to: 1 },
        scale: { from: 0.82, to: 1.18 },
        duration: 720 + Math.abs(xOffset),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    const chime = scene.add
      .text(1500, 907, '♪  ✨  ♪', {
        color: '#fff2aa',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
        backgroundColor: '#6e80754d',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(12);
    objects.push(chime);

    return scene.add.container(0, 0, objects).setName(PEBBLE_WORLD_PRESENTATION_NAME).setDepth(12);
  }

  private openPebbleStory(scene: Phaser.Scene): void {
    if (!scene.scene.isActive()) {
      return;
    }
    scene.scene.start('PebbleStoryScene', { returnScene: 'SunbeamVillageScene' });
  }

  private showDiscoveryFeedback(scene: Phaser.Scene, message: string): void {
    const panel = scene.add
      .text(640, 125, message, {
        color: '#5b5060',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fff8eaf2',
        padding: { x: 20, y: 13 },
        wordWrap: { width: 610 },
      })
      .setName(PEBBLE_DISCOVERY_FEEDBACK_NAME)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(181)
      .setStroke('#ffffff', 1);

    scene.time.delayedCall(3000, () => panel.destroy());
  }

  private clearState(): void {
    if (!this.state) {
      return;
    }

    for (const marker of this.state.markers.values()) {
      marker.container.destroy(true);
    }
    this.state.pebbleContainer?.destroy(true);
    this.state.fountainRepair?.destroy(true);
    this.state = null;
  }
}

let browserPebbleCollectionWorldManager: PebbleCollectionWorldManager | null = null;

export function getPebbleCollectionWorldManager(game: Phaser.Game): PebbleCollectionWorldManager {
  browserPebbleCollectionWorldManager ??= new PebbleCollectionWorldManager(game);
  return browserPebbleCollectionWorldManager;
}
