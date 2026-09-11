import Phaser from 'phaser';
import {
  LUMI_CHARACTER_ID,
  R5_LUMI_SECRETS,
  STARWELL_REVEALED_FLAG,
} from '../../content/r5LumiWoodsStory';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { SecretDiscoveryService } from '../discovery/SecretDiscoveryService';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';
import { rememberWorldReturnState } from '../world/WorldArrivalState';
import { setWhisperingWoodsPlayerSpawn } from '../world/WhisperingWoodsMap';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const PRESENTATION_NAME = 'lumi-woods-presentation';
const LUMI_POSITION = { x: 2980, y: 1530 } as const;
const REGISTRY_OWNER = 'lumi-woods-story';

interface ClueMarker {
  definition: SecretDiscoveryDefinition;
  container: Phaser.GameObjects.Container;
}

interface LumiWoodsState {
  scene: Phaser.Scene;
  markers: Map<SecretDiscoveryDefinition['id'], ClueMarker>;
  starwell: Phaser.GameObjects.Container | null;
  lumi: Phaser.GameObjects.Container | null;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.Physics.Arcade.Sprite ? player : null;
}

export class LumiWoodsWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly secretService = new SecretDiscoveryService(this.saveService);
  private state: LumiWoodsState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    const scene = this.game.scene.getScene('WhisperingWoodsScene');
    if (!scene?.scene.isActive()) {
      this.clearState();
      return;
    }

    const state = this.ensureState(scene);
    this.refreshClues(state);
    this.refreshStarwell(state);
    this.syncInteractionTargets(state);
  }

  private ensureState(scene: Phaser.Scene): LumiWoodsState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.clearState();
    this.state = {
      scene,
      markers: new Map(),
      starwell: null,
      lumi: null,
    };
    return this.state;
  }

  private refreshClues(state: LumiWoodsState): void {
    const available = this.secretService.listAvailable(R5_LUMI_SECRETS, 'WhisperingWoodsScene');
    const availableIds = new Set(available.map(({ id }) => id));

    for (const [id, marker] of state.markers) {
      if (!availableIds.has(id) || !marker.container.active) {
        marker.container.destroy(true);
        state.markers.delete(id);
      }
    }

    for (const definition of available) {
      if (!state.markers.has(definition.id)) {
        state.markers.set(definition.id, this.createClueMarker(state.scene, definition));
      }
    }
  }

  private createClueMarker(scene: Phaser.Scene, definition: SecretDiscoveryDefinition): ClueMarker {
    const isFireflies = definition.id === 'secret:woods-firefly-spiral';
    const isStarwell = definition.id === 'secret:woods-starwell';
    const objects: Phaser.GameObjects.GameObject[] = [];

    const glow = scene.add.circle(
      0,
      0,
      isStarwell ? 42 : 30,
      isFireflies ? 0xf4efa4 : 0xbce8b1,
      0.12,
    );
    objects.push(glow);

    if (isFireflies) {
      for (let index = 0; index < 7; index += 1) {
        const angle = (Math.PI * 2 * index) / 7;
        const mote = scene.add.circle(
          Math.cos(angle) * 34,
          Math.sin(angle) * 24,
          5,
          0xf7ef9c,
          0.86,
        );
        objects.push(mote);
        scene.tweens.add({
          targets: mote,
          angle: 360,
          x: Math.cos(angle + 1.3) * 42,
          y: Math.sin(angle + 1.3) * 32,
          duration: 1250 + index * 90,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
    } else {
      const icon = scene.add
        .text(0, 0, isStarwell ? '✦' : '♪', {
          color: isStarwell ? '#fff0a8' : '#d5f3bf',
          fontFamily: 'system-ui, sans-serif',
          fontSize: isStarwell ? '31px' : '24px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      objects.push(icon);
    }

    const container = scene.add
      .container(definition.position.x, definition.position.y, objects)
      .setName(PRESENTATION_NAME)
      .setDepth(20);

    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.08, to: 0.34 },
      scale: { from: 0.9, to: 1.18 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container };
  }

  private syncInteractionTargets(state: LumiWoodsState): void {
    const targets: InteractionTarget[] = [];
    for (const marker of state.markers.values()) {
      const { definition } = marker;
      targets.push({
        id: `interaction:${definition.id}`,
        label: definition.label,
        actionLabel: 'Inspect',
        actionKind: 'inspect',
        position: definition.position,
        interactionRadius: definition.interactionRadius,
        priority: 20,
        visible: () => marker.container.active,
        result: { type: 'callback', activate: () => this.activateClue(state, definition) },
      });
    }

    if (state.lumi?.active) {
      targets.push({
        id: 'interaction:woods-lumi',
        label: 'Lumi',
        actionLabel: 'Talk',
        actionKind: 'talk',
        position: LUMI_POSITION,
        interactionRadius: 150,
        priority: 30,
        visible: () => state.lumi?.active === true,
        result: { type: 'callback', activate: () => this.openLumiStory(state.scene) },
      });
    }

    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private activateClue(state: LumiWoodsState | null, definition: SecretDiscoveryDefinition): void {
    if (!state?.scene.scene.isActive()) {
      return;
    }
    const result = this.secretService.discover(definition);
    if (result.status !== 'discovered') {
      return;
    }

    state.markers.get(definition.id)?.container.destroy(true);
    state.markers.delete(definition.id);
    state.scene.cameras.main.flash(
      definition.id === 'secret:woods-starwell' ? 280 : 160,
      236,
      255,
      205,
      false,
    );
    const feedback = state.scene.add
      .text(640, 130, definition.feedback, {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#efffeef2',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(140);
    state.scene.time.delayedCall(3800, () => feedback.destroy());
    this.refreshStarwell(state);
    this.syncInteractionTargets(state);
  }

  private refreshStarwell(state: LumiWoodsState): void {
    const revealed = this.saveService.load()?.world.flags[STARWELL_REVEALED_FLAG] === true;
    if (!revealed) {
      state.starwell?.destroy(true);
      state.starwell = null;
      state.lumi?.destroy(true);
      state.lumi = null;
      return;
    }

    if (!state.starwell?.active) {
      const wellX = 2920;
      const wellY = 1700;
      const rim = state.scene.add
        .ellipse(0, 0, 260, 120, 0x546454, 1)
        .setStrokeStyle(10, 0x7b8871, 1);
      const water = state.scene.add.ellipse(0, -2, 218, 82, 0x263f50, 1);
      const objects: Phaser.GameObjects.GameObject[] = [rim, water];
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        const star = state.scene.add.circle(
          Math.cos(angle) * 80,
          Math.sin(angle) * 28 - 3,
          4,
          0xe6f6ff,
          0.8,
        );
        objects.push(star);
        state.scene.tweens.add({
          targets: star,
          alpha: { from: 0.25, to: 1 },
          duration: 700 + index * 80,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
        });
      }
      state.starwell = state.scene.add
        .container(wellX, wellY, objects)
        .setName(PRESENTATION_NAME)
        .setDepth(12);
    }

    if (!state.lumi?.active) {
      this.createLumi(state);
    }
  }

  private createLumi(state: LumiWoodsState): void {
    const glow = state.scene.add.circle(0, -5, 52, 0xd9f7ad, 0.13);
    const body = state.scene.add.ellipse(0, 0, 90, 60, 0xb7d7c6, 1);
    const head = state.scene.add.circle(34, -34, 30, 0xd9ead8, 1);
    const mane = state.scene.add.ellipse(3, -30, 30, 74, 0x668c82, 0.98).setAngle(20);
    const horn = state.scene.add.triangle(49, -73, 0, 28, 8, 0, 16, 28, 0xe9dfa7, 1).setAngle(20);
    const eye = state.scene.add.circle(43, -38, 4, 0x3a514e, 1);
    const tail = state.scene.add.ellipse(-55, -8, 24, 66, 0x86afa0, 0.98).setAngle(-35);
    const firefly = state.scene.add.circle(-20, -70, 6, 0xf7ef9c, 0.92);

    state.lumi = state.scene.add
      .container(LUMI_POSITION.x, LUMI_POSITION.y, [glow, tail, body, mane, head, horn, eye, firefly])
      .setName(PRESENTATION_NAME)
      .setDepth(19);

    state.scene.tweens.add({
      targets: firefly,
      x: 18,
      y: -92,
      duration: 1300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private openLumiStory(scene: Phaser.Scene): void {
    const player = findPlayer(scene);
    if (player) {
      rememberWorldReturnState('WhisperingWoodsScene', player, setWhisperingWoodsPlayerSpawn);
    }
    scene.scene.start('LumiStoryScene', { returnScene: 'WhisperingWoodsScene' });
  }

  private clearState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    for (const marker of this.state.markers.values()) {
      marker.container.destroy(true);
    }
    this.state.starwell?.destroy(true);
    this.state.lumi?.destroy(true);
    this.state = null;
  }
}

let manager: LumiWoodsWorldManager | null = null;

export function getLumiWoodsWorldManager(game: Phaser.Game): LumiWoodsWorldManager {
  manager ??= new LumiWoodsWorldManager(game);
  return manager;
}

export { LUMI_CHARACTER_ID };
