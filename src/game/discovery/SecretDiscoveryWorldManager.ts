import Phaser from 'phaser';
import {
  MOONLIT_TRAIL_REVEALED_FLAG,
  R4_SECRET_DEFINITIONS,
  type SecretDiscoveryDefinition,
  type SecretFeedbackTier,
} from '../../content/r4Secrets';
import { getBrowserSaveService } from '../save/browserSaveService';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';
import { SecretDiscoveryService } from './SecretDiscoveryService';

interface SecretMarker {
  definition: SecretDiscoveryDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface GladeState {
  scene: Phaser.Scene;
  interactKey: Phaser.Input.Keyboard.Key | null;
  markers: Map<string, SecretMarker>;
  path: Phaser.GameObjects.Container | null;
}

const SECRET_MARKER_PREFIX = 'secret-discovery-marker:';
export const SECRET_REVEALED_PATH_NAME = 'secret-revealed-moonlit-trail';
export const SECRET_FEEDBACK_NAME = 'secret-discovery-feedback';

function findPlayer(scene: Phaser.Scene): Phaser.GameObjects.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.GameObjects.Sprite ? player : null;
}

function feedbackStyle(tier: SecretFeedbackTier): {
  background: string;
  fontSize: string;
  flash: boolean;
} {
  if (tier === 'grand') {
    return { background: '#fff0b9f2', fontSize: '25px', flash: true };
  }
  if (tier === 'secret') {
    return { background: '#f4e8fff2', fontSize: '23px', flash: true };
  }
  return { background: '#fff9edf0', fontSize: '21px', flash: false };
}

export class SecretDiscoveryWorldManager {
  private readonly service = new SecretDiscoveryService(getBrowserSaveService());
  private gladeState: GladeState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    const scene = this.game.scene.getScene('MoonflowerGladeScene');
    if (!scene?.scene.isActive()) {
      this.clearGladeState();
      return;
    }

    const state = this.ensureGladeState(scene);
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    this.refreshPath(state);

    const available = this.service.listAvailable(R4_SECRET_DEFINITIONS, scene.scene.key);
    const availableIds = new Set<string>(available.map(({ id }) => id));

    for (const [id, marker] of state.markers) {
      if (!availableIds.has(id) || !marker.container.active) {
        marker.container.destroy(true);
        state.markers.delete(id);
      }
    }

    for (const definition of available) {
      if (!state.markers.has(definition.id)) {
        state.markers.set(definition.id, this.createMarker(scene, definition));
      }
    }

    let nearest: SecretMarker | null = null;
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

    if (nearest && state.interactKey && Phaser.Input.Keyboard.JustDown(state.interactKey)) {
      this.activateSecret(state, nearest.definition);
    }
  }

  private ensureGladeState(scene: Phaser.Scene): GladeState {
    if (this.gladeState?.scene === scene) {
      return this.gladeState;
    }

    this.clearGladeState();
    this.gladeState = {
      scene,
      interactKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null,
      markers: new Map(),
      path: null,
    };
    return this.gladeState;
  }

  private createMarker(scene: Phaser.Scene, definition: SecretDiscoveryDefinition): SecretMarker {
    const glint = scene.add
      .text(0, 0, definition.pattern === 'conditional-clue' ? '♪' : '✦', {
        color: definition.pattern === 'conditional-clue' ? '#e7c7ff' : '#fff0a5',
        fontFamily: 'system-ui, sans-serif',
        fontSize: definition.pattern === 'hidden-path' ? '30px' : '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(definition.pattern === 'hidden-object' ? 0.55 : 0.72);
    const glow = scene.add
      .circle(0, 0, definition.pattern === 'hidden-path' ? 30 : 22, 0xfff1ab, 0.08)
      .setStrokeStyle(2, 0xffffff, 0.18);
    const prompt = scene.add
      .text(0, 50, `${definition.actionLabel}: ${definition.label}  ✨`, {
        color: '#5d496c',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#fff9edea',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = scene.add
      .zone(0, 0, definition.interactionRadius * 1.35, definition.interactionRadius * 1.35)
      .setInteractive({ useHandCursor: true });

    const container = scene.add
      .container(definition.position.x, definition.position.y, [glow, glint, prompt, zone])
      .setName(`${SECRET_MARKER_PREFIX}${definition.id}`)
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
        this.activateSecret(this.gladeState, definition);
      }
    });

    scene.tweens.add({
      targets: [glow, glint],
      alpha: definition.pattern === 'hidden-object' ? 0.82 : 1,
      scale: definition.pattern === 'hidden-path' ? 1.22 : 1.14,
      duration: definition.pattern === 'hidden-object' ? 1250 : 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container, prompt };
  }

  private activateSecret(state: GladeState | null, definition: SecretDiscoveryDefinition): void {
    if (!state?.scene.scene.isActive()) {
      return;
    }

    const result = this.service.discover(definition);
    if (result.status !== 'discovered') {
      return;
    }

    const marker = state.markers.get(definition.id);
    marker?.container.destroy(true);
    state.markers.delete(definition.id);
    this.showFeedback(state.scene, definition.feedback, definition.feedbackTier);
    this.refreshPath(state);
  }

  private refreshPath(state: GladeState): void {
    const save = getBrowserSaveService().load();
    const shouldShow = save?.world.flags[MOONLIT_TRAIL_REVEALED_FLAG] === true;
    if (!shouldShow) {
      state.path?.destroy(true);
      state.path = null;
      return;
    }
    if (state.path?.active) {
      return;
    }

    const definition: SecretDiscoveryDefinition | undefined = R4_SECRET_DEFINITIONS.find(
      ({ pattern }) => pattern === 'hidden-path',
    );
    if (!definition?.revealedPath) {
      return;
    }

    const objects: Phaser.GameObjects.GameObject[] = [];
    for (const [index, point] of definition.revealedPath.entries()) {
      const glow = state.scene.add.circle(point.x, point.y, 22, 0xffeca0, 0.16).setDepth(7);
      const petal = state.scene.add
        .text(point.x, point.y, index % 2 === 0 ? '✦' : '·', {
          color: index % 2 === 0 ? '#fff1a8' : '#dfc5ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 2 === 0 ? '21px' : '32px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(8);
      objects.push(glow, petal);
      state.scene.tweens.add({
        targets: [glow, petal],
        alpha: { from: 0.38, to: 0.95 },
        duration: 780 + index * 70,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    state.path = state.scene.add.container(0, 0, objects).setName(SECRET_REVEALED_PATH_NAME);
  }

  private showFeedback(scene: Phaser.Scene, message: string, tier: SecretFeedbackTier): void {
    const style = feedbackStyle(tier);
    if (style.flash) {
      scene.cameras.main.flash(tier === 'grand' ? 260 : 170, 255, 238, 176, false);
    }

    const panel = scene.add
      .text(640, tier === 'grand' ? 150 : 125, message, {
        color: '#5b4668',
        fontFamily: 'system-ui, sans-serif',
        fontSize: style.fontSize,
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: style.background,
        padding: { x: 20, y: 13 },
        wordWrap: { width: 610 },
      })
      .setName(SECRET_FEEDBACK_NAME)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(180)
      .setStroke('#ffffff', 1);

    scene.time.delayedCall(tier === 'grand' ? 3900 : 3000, () => panel.destroy());
  }

  private clearGladeState(): void {
    if (!this.gladeState) {
      return;
    }
    for (const marker of this.gladeState.markers.values()) {
      marker.container.destroy(true);
    }
    this.gladeState.path?.destroy(true);
    this.gladeState = null;
  }
}

let browserSecretDiscoveryWorldManager: SecretDiscoveryWorldManager | null = null;

export function getSecretDiscoveryWorldManager(game: Phaser.Game): SecretDiscoveryWorldManager {
  browserSecretDiscoveryWorldManager ??= new SecretDiscoveryWorldManager(game);
  return browserSecretDiscoveryWorldManager;
}
