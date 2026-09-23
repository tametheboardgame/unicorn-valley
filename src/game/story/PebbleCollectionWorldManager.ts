import Phaser from 'phaser';
import {
  PEBBLE_FOUNTAIN_REPAIRED_FLAG,
  R4_PEBBLE_SECRET_DEFINITIONS,
} from '../../content/r4PebbleStory';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { SecretDiscoveryService } from '../discovery/SecretDiscoveryService';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';

const SUPPORTED_SCENES = [
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
] as const;

const PEBBLE_WORLD_PRESENTATION_NAME = 'pebble-world-presentation';
const REGISTRY_OWNER = 'pebble-hidden-objects';

interface CuriosityMarker {
  definition: SecretDiscoveryDefinition;
  container: Phaser.GameObjects.Container;
}

interface PebbleWorldState {
  scene: Phaser.Scene;
  markers: Map<string, CuriosityMarker>;
  fountainRepair: Phaser.GameObjects.Container | null;
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
    this.refreshCuriosityMarkers(state);
    this.refreshVillagePresentation(state);
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
      markers: new Map(),
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

    this.publishTargets(state);
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

    const container = scene.add
      .container(definition.position.x, definition.position.y, [glow, glint])
      .setName(PEBBLE_WORLD_PRESENTATION_NAME)
      .setDepth(19);


    scene.tweens.add({
      targets: [glow, glint],
      alpha: 0.95,
      scale: 1.16,
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container };
  }

  private publishTargets(state: PebbleWorldState): void {
    const targets: InteractionTarget[] = [...state.markers.values()].map(
      ({ definition, container }) => ({
        id: `interaction:${definition.id}`,
        label: definition.label,
        actionLabel: definition.actionLabel,
        actionKind: 'pick-up',
        position: definition.position,
        interactionRadius: definition.interactionRadius,
        priority: 25,
        visible: () => container.active,
        directArea: {
          width: definition.interactionRadius * 1.4,
          height: definition.interactionRadius * 1.4,
        },
        result: {
          type: 'callback',
          activate: () => this.activateCuriosity(state, definition),
        },
      }),
    );
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
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
    this.publishTargets(state);
    getWorldFeedbackPresenter(state.scene).showReaction(
      definition.feedback,
      definition.position,
      3000,
    );
  }

  private refreshVillagePresentation(state: PebbleWorldState): void {
    if (state.scene.scene.key !== 'SunbeamVillageScene') {
      state.fountainRepair?.destroy(true);
      state.fountainRepair = null;
      return;
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

  private clearState(): void {
    if (!this.state) {
      return;
    }

    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const marker of this.state.markers.values()) {
      marker.container.destroy(true);
    }
    this.state.fountainRepair?.destroy(true);
    this.state = null;
  }
}

let browserPebbleCollectionWorldManager: PebbleCollectionWorldManager | null = null;

export function getPebbleCollectionWorldManager(game: Phaser.Game): PebbleCollectionWorldManager {
  browserPebbleCollectionWorldManager ??= new PebbleCollectionWorldManager(game);
  return browserPebbleCollectionWorldManager;
}
