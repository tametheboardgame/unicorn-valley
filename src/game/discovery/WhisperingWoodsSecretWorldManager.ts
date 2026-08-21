import Phaser from 'phaser';
import {
  MOSSY_WHISPER_PATH_REVEALED_FLAG,
  R5_WHISPERING_WOODS_SECRETS,
} from '../../content/r5WhisperingWoods';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { getBrowserSaveService } from '../save/browserSaveService';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import { SecretDiscoveryService } from './SecretDiscoveryService';

const PRESENTATION_NAME = 'woods-secret-presentation';

interface WoodsSecretState {
  scene: Phaser.Scene;
  interactKey: Phaser.Input.Keyboard.Key | null;
  marker: Phaser.GameObjects.Container | null;
  prompt: Phaser.GameObjects.Text | null;
  path: Phaser.GameObjects.Container | null;
}

function findPlayer(scene: Phaser.Scene): Phaser.GameObjects.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.GameObjects.Sprite ? player : null;
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
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    this.refreshPath(state);
    const definition = R5_WHISPERING_WOODS_SECRETS[0];
    const available = this.service.isAvailable(definition);
    if (available && !state.marker?.active) {
      this.createMarker(state, definition);
    } else if (!available && state.marker?.active) {
      state.marker.destroy(true);
      state.marker = null;
      state.prompt = null;
    }

    if (!state.marker || !state.prompt) {
      return;
    }

    const distance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      definition.position.x,
      definition.position.y,
    );
    state.prompt.setVisible(distance <= definition.interactionRadius + 90);
    if (
      distance <= definition.interactionRadius &&
      state.interactKey &&
      Phaser.Input.Keyboard.JustDown(state.interactKey)
    ) {
      this.activate(state, definition);
    }
  }

  private ensureState(scene: Phaser.Scene): WoodsSecretState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.clearState();
    this.state = {
      scene,
      interactKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null,
      marker: null,
      prompt: null,
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
    const prompt = state.scene.add
      .text(0, 50, `${definition.actionLabel}: ${definition.label}  ✨`, {
        color: '#dbeed4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#24483feb',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add
      .zone(0, 0, definition.interactionRadius * 1.4, definition.interactionRadius * 1.4)
      .setInteractive({ useHandCursor: true });
    state.marker = state.scene.add
      .container(definition.position.x, definition.position.y, [glow, leaves, prompt, zone])
      .setName(PRESENTATION_NAME)
      .setDepth(20);
    state.prompt = prompt;

    zone.on('pointerdown', () => {
      const player = findPlayer(state.scene);
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
        this.activate(this.state, definition);
      }
    });

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
    state.prompt = null;
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
