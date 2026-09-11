import Phaser from 'phaser';
import {
  MOSSY_WHISPER_PATH_REVEALED_FLAG,
  R5_WHISPERING_WOODS_SECRETS,
} from '../../content/r5WhisperingWoods';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { getBrowserSaveService } from '../save/browserSaveService';
import { SecretDiscoveryService } from './SecretDiscoveryService';

const PRESENTATION_NAME = 'woods-secret-presentation';
const REGISTRY_OWNER = 'woods-secret';

interface WoodsSecretState {
  scene: Phaser.Scene;
  marker: Phaser.GameObjects.Container | null;
  path: Phaser.GameObjects.Container | null;
}

export class WhisperingWoodsSecretWorldManager {
  private readonly service = new SecretDiscoveryService(getBrowserSaveService());
  private state: WoodsSecretState | null = null;

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
    this.refreshPath(state);
    const definition = R5_WHISPERING_WOODS_SECRETS[0];
    const available = this.service.isAvailable(definition);
    if (available && !state.marker?.active) {
      this.createMarker(state, definition);
    } else if (!available && state.marker?.active) {
      state.marker.destroy(true);
      state.marker = null;
    }
    this.syncInteractionTarget(state, definition, available);
  }

  private ensureState(scene: Phaser.Scene): WoodsSecretState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.clearState();
    this.state = {
      scene,
      marker: null,
      path: null,
    };
    return this.state;
  }

  private createMarker(state: WoodsSecretState, definition: SecretDiscoveryDefinition): void {
    const glow = state.scene.add.circle(0, 0, 34, 0xc8f0b4, 0.12);
    const leaves = state.scene.add
      .text(0, 0, '🍃', { fontFamily: 'system-ui, sans-serif', fontSize: '28px' })
      .setOrigin(0.5)
      .setAlpha(0.72);
    state.marker = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, leaves])
      .setName(PRESENTATION_NAME)
      .setDepth(20);

    state.scene.tweens.add({
      targets: [glow, leaves],
      alpha: 1,
      scale: 1.14,
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private syncInteractionTarget(
    state: WoodsSecretState,
    definition: SecretDiscoveryDefinition,
    available: boolean,
  ): void {
    const targets: InteractionTarget[] = [];
    if (available && state.marker?.active) {
      targets.push({
        id: `interaction:${definition.id}`,
        label: definition.label,
        actionLabel: 'Inspect',
        actionKind: 'inspect',
        position: definition.position,
        interactionRadius: definition.interactionRadius,
        priority: 20,
        visible: () => state.marker?.active === true,
        result: { type: 'callback', activate: () => this.activate(state, definition) },
      });
    }
    getSceneInteractionRegistry(state.scene).replaceOwnerTargets(REGISTRY_OWNER, targets);
  }

  private activate(state: WoodsSecretState | null, definition: SecretDiscoveryDefinition): void {
    if (!state?.scene.scene.isActive()) {
      return;
    }
    const result = this.service.discover(definition);
    if (result.status !== 'discovered') {
      return;
    }
    state.marker?.destroy(true);
    state.marker = null;
    getSceneInteractionRegistry(state.scene).clearOwner(REGISTRY_OWNER);
    this.refreshPath(state);
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
    state.scene.time.delayedCall(3600, () => feedback.destroy());
  }

  private refreshPath(state: WoodsSecretState): void {
    const revealed =
      getBrowserSaveService().load()?.world.flags[MOSSY_WHISPER_PATH_REVEALED_FLAG] === true;
    if (!revealed) {
      state.path?.destroy(true);
      state.path = null;
      return;
    }
    if (state.path?.active) {
      return;
    }

    const objects: Phaser.GameObjects.GameObject[] = [];
    const path = R5_WHISPERING_WOODS_SECRETS[0].revealedPath ?? [];
    for (const [index, point] of path.entries()) {
      objects.push(
        state.scene.add
          .text(point.x, point.y, index % 2 === 0 ? '✦' : '🍃', {
            color: '#d9f7bf',
            fontFamily: 'system-ui, sans-serif',
            fontSize: index % 2 === 0 ? '20px' : '18px',
          })
          .setOrigin(0.5)
          .setDepth(8),
      );
    }
    state.path = state.scene.add.container(0, 0, objects).setName(PRESENTATION_NAME);
  }

  private clearState(): void {
    if (!this.state) {
      return;
    }
    getSceneInteractionRegistry(this.state.scene).clearOwner(REGISTRY_OWNER);
    this.state.marker?.destroy(true);
    this.state.path?.destroy(true);
    this.state = null;
  }
}

let manager: WhisperingWoodsSecretWorldManager | null = null;

export function getWhisperingWoodsSecretWorldManager(
  game: Phaser.Game,
): WhisperingWoodsSecretWorldManager {
  manager ??= new WhisperingWoodsSecretWorldManager(game);
  return manager;
}
