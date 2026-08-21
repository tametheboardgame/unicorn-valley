import Phaser from 'phaser';
import {
  BROOK_ECHO_TRAIL_REVEALED_FLAG,
  BROOK_SONG_RESTORED_FLAG,
  RIPPLE_CHARACTER_ID,
  R5_CRYSTAL_BROOK_STORY_SECRETS,
} from '../../content/r5CrystalBrookStory';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { SecretDiscoveryService } from '../discovery/SecretDiscoveryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { CRYSTAL_BROOK_MAP } from '../world/CrystalBrookMap';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const PRESENTATION_NAME = 'crystal-brook-story-presentation';
const FEEDBACK_NAME = 'crystal-brook-story-feedback';

interface SecretMarker {
  definition: SecretDiscoveryDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface BrookStoryState {
  scene: Phaser.Scene;
  interactKey: Phaser.Input.Keyboard.Key | null;
  ripple: Phaser.GameObjects.Container | null;
  ripplePrompt: Phaser.GameObjects.Text | null;
  markers: Map<string, SecretMarker>;
  revealedPath: Phaser.GameObjects.Container | null;
  restoredSong: Phaser.GameObjects.Container | null;
}

function findPlayer(scene: Phaser.Scene): Phaser.Physics.Arcade.Sprite | null {
  const player = scene.children.getByName(WORLD_PLAYER_NAME);
  return player instanceof Phaser.Physics.Arcade.Sprite ? player : null;
}

function getRipplePosition(): { x: number; y: number } {
  const point = CRYSTAL_BROOK_MAP.npcVisitPoints.find(({ id }) => id === 'brook-overlook');
  if (!point) {
    throw new Error('Ripple requires the Crystal Brook overlook visit point.');
  }
  return point.position;
}

export class CrystalBrookStoryWorldManager {
  private readonly saveService = getBrowserSaveService();
  private readonly secretService = new SecretDiscoveryService(this.saveService);
  private state: BrookStoryState | null = null;

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
  }

  private update(): void {
    const scene = this.game.scene.getScene('CrystalBrookScene');
    if (!scene?.scene.isActive()) {
      this.clearState();
      return;
    }

    const state = this.ensureState(scene);
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    this.refreshSecrets(state);
    this.refreshWorldState(state);

    const ripplePosition = getRipplePosition();
    const rippleDistance = Phaser.Math.Distance.Between(
      player.x,
      player.y,
      ripplePosition.x,
      ripplePosition.y,
    );
    state.ripplePrompt?.setVisible(rippleDistance <= 220);

    let nearestSecret: SecretMarker | null = null;
    let nearestSecretDistance = Number.POSITIVE_INFINITY;
    for (const marker of state.markers.values()) {
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        marker.definition.position.x,
        marker.definition.position.y,
      );
      marker.prompt.setVisible(distance <= marker.definition.interactionRadius + 90);
      if (distance <= marker.definition.interactionRadius && distance < nearestSecretDistance) {
        nearestSecret = marker;
        nearestSecretDistance = distance;
      }
    }

    if (!state.interactKey || !Phaser.Input.Keyboard.JustDown(state.interactKey)) {
      return;
    }

    if (nearestSecret && nearestSecretDistance <= rippleDistance) {
      this.activateSecret(state, nearestSecret.definition);
      return;
    }

    if (rippleDistance <= 150) {
      this.openRippleStory(scene);
    }
  }

  private ensureState(scene: Phaser.Scene): BrookStoryState {
    if (this.state?.scene === scene) {
      return this.state;
    }

    this.clearState();
    this.state = {
      scene,
      interactKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null,
      ripple: null,
      ripplePrompt: null,
      markers: new Map(),
      revealedPath: null,
      restoredSong: null,
    };
    this.createRipple(this.state);
    return this.state;
  }

  private createRipple(state: BrookStoryState): void {
    const position = getRipplePosition();
    const glow = state.scene.add.circle(0, -4, 50, 0x9ee9e8, 0.18);
    const body = state.scene.add.ellipse(0, 0, 92, 60, 0x8ed8e4, 1);
    const head = state.scene.add.circle(35, -33, 30, 0xb7edf0, 1);
    const mane = state.scene.add.ellipse(3, -29, 30, 72, 0x6cb7cf, 0.95).setAngle(20);
    const horn = state.scene.add
      .triangle(50, -72, 0, 28, 8, 0, 16, 28, 0xe5f8ff, 1)
      .setAngle(20);
    const eye = state.scene.add.circle(44, -38, 4, 0x3e6670, 1);
    const tail = state.scene.add.ellipse(-56, -7, 24, 68, 0xa8e2c8, 0.96).setAngle(-35);
    const prompt = state.scene.add
      .text(0, 82, 'Talk: Ripple  💬', {
        color: '#3f6671',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#f4fff1ed',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 180, 180).setInteractive({ useHandCursor: true });

    state.ripple = state.scene.add
      .container(position.x, position.y, [glow, tail, body, mane, head, horn, eye, prompt, zone])
      .setName(PRESENTATION_NAME)
      .setDepth(18);
    state.ripplePrompt = prompt;

    zone.on('pointerdown', () => {
      const player = findPlayer(state.scene);
      if (!player) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(player.x, player.y, position.x, position.y);
      if (distance <= 150) {
        this.openRippleStory(state.scene);
      }
    });

    state.scene.tweens.add({
      targets: glow,
      alpha: { from: 0.1, to: 0.34 },
      scale: { from: 0.92, to: 1.12 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private refreshSecrets(state: BrookStoryState): void {
    const available = this.secretService.listAvailable(
      R5_CRYSTAL_BROOK_STORY_SECRETS,
      'CrystalBrookScene',
    );
    const availableIds = new Set(available.map(({ id }) => id));

    for (const [id, marker] of state.markers) {
      if (!availableIds.has(id) || !marker.container.active) {
        marker.container.destroy(true);
        state.markers.delete(id);
      }
    }

    for (const definition of available) {
      if (!state.markers.has(definition.id)) {
        state.markers.set(definition.id, this.createSecretMarker(state.scene, definition));
      }
    }
  }

  private createSecretMarker(
    scene: Phaser.Scene,
    definition: SecretDiscoveryDefinition,
  ): SecretMarker {
    const glow = scene.add.circle(0, 0, 26, 0xd9fbff, 0.13).setStrokeStyle(2, 0xffffff, 0.2);
    const icon = scene.add
      .text(0, 0, definition.pattern === 'hidden-path' ? '♫' : '♪', {
        color: definition.pattern === 'hidden-path' ? '#ffeaa1' : '#d9fbff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: definition.pattern === 'hidden-path' ? '29px' : '23px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setAlpha(0.68);
    const prompt = scene.add
      .text(0, 50, `${definition.actionLabel}: ${definition.label}`, {
        color: '#3f6671',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#f4fff1ed',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = scene.add
      .zone(0, 0, definition.interactionRadius * 1.4, definition.interactionRadius * 1.4)
      .setInteractive({ useHandCursor: true });
    const container = scene.add
      .container(definition.position.x, definition.position.y, [glow, icon, prompt, zone])
      .setName(PRESENTATION_NAME)
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
        this.activateSecret(this.state, definition);
      }
    });

    scene.tweens.add({
      targets: [glow, icon],
      alpha: 1,
      scale: 1.16,
      duration: 930,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container, prompt };
  }

  private activateSecret(
    state: BrookStoryState | null,
    definition: SecretDiscoveryDefinition,
  ): void {
    if (!state?.scene.scene.isActive()) {
      return;
    }

    const result = this.secretService.discover(definition);
    if (result.status !== 'discovered') {
      return;
    }

    state.markers.get(definition.id)?.container.destroy(true);
    state.markers.delete(definition.id);
    this.showFeedback(state.scene, definition.feedback);
    this.refreshWorldState(state);
  }

  private refreshWorldState(state: BrookStoryState): void {
    const save = this.saveService.load();
    const showTrail = save?.world.flags[BROOK_ECHO_TRAIL_REVEALED_FLAG] === true;
    if (showTrail && !state.revealedPath?.active) {
      const song = R5_CRYSTAL_BROOK_STORY_SECRETS.find(({ id }) => id === 'secret:brook-water-song');
      const objects: Phaser.GameObjects.GameObject[] = [];
      for (const [index, point] of (song?.revealedPath ?? []).entries()) {
        objects.push(
          state.scene.add
            .text(point.x, point.y, index % 2 === 0 ? '♪' : '·', {
              color: index % 2 === 0 ? '#e8fbff' : '#fff0ad',
              fontFamily: 'system-ui, sans-serif',
              fontSize: index % 2 === 0 ? '20px' : '30px',
            })
            .setOrigin(0.5)
            .setDepth(8),
        );
      }
      state.revealedPath = state.scene.add.container(0, 0, objects).setName(PRESENTATION_NAME);
    }
    if (!showTrail) {
      state.revealedPath?.destroy(true);
      state.revealedPath = null;
    }

    const restored = save?.world.flags[BROOK_SONG_RESTORED_FLAG] === true;
    if (restored && !state.restoredSong?.active) {
      const notes = [
        { x: 1840, y: 1020, symbol: '♪' },
        { x: 2010, y: 1110, symbol: '♫' },
        { x: 2180, y: 1160, symbol: '♪' },
      ];
      const objects = notes.map(({ x, y, symbol }) =>
        state.scene.add
          .text(x, y, symbol, {
            color: '#eaffff',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setAlpha(0.75)
          .setDepth(7),
      );
      state.restoredSong = state.scene.add.container(0, 0, objects).setName(PRESENTATION_NAME);
      state.scene.tweens.add({
        targets: objects,
        y: '-=14',
        alpha: { from: 0.45, to: 1 },
        duration: 1250,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private openRippleStory(scene: Phaser.Scene): void {
    scene.scene.start('RippleStoryScene', { returnScene: 'CrystalBrookScene' });
  }

  private showFeedback(scene: Phaser.Scene, message: string): void {
    scene.cameras.main.flash(180, 226, 255, 244, false);
    const panel = scene.add
      .text(640, 130, message, {
        color: '#3f6671',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#f4fff1f2',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(140)
      .setName(FEEDBACK_NAME);
    scene.time.delayedCall(3600, () => panel.destroy());
  }

  private clearState(): void {
    if (!this.state) {
      return;
    }
    this.state.ripple?.destroy(true);
    for (const marker of this.state.markers.values()) {
      marker.container.destroy(true);
    }
    this.state.revealedPath?.destroy(true);
    this.state.restoredSong?.destroy(true);
    this.state = null;
  }
}

let browserCrystalBrookStoryWorldManager: CrystalBrookStoryWorldManager | null = null;

export function getCrystalBrookStoryWorldManager(game: Phaser.Game): CrystalBrookStoryWorldManager {
  browserCrystalBrookStoryWorldManager ??= new CrystalBrookStoryWorldManager(game);
  return browserCrystalBrookStoryWorldManager;
}

export { RIPPLE_CHARACTER_ID };
