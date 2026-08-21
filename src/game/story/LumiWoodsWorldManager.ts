import Phaser from 'phaser';
import {
  LUMI_CHARACTER_ID,
  R5_LUMI_SECRETS,
  STARWELL_REVEALED_FLAG,
} from '../../content/r5LumiWoodsStory';
import type { SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { SecretDiscoveryService } from '../discovery/SecretDiscoveryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { WORLD_PLAYER_NAME } from '../world/WorldTraversalPolishManager';

const PRESENTATION_NAME = 'lumi-woods-presentation';
const LUMI_POSITION = { x: 2980, y: 1530 } as const;

interface ClueMarker {
  definition: SecretDiscoveryDefinition;
  container: Phaser.GameObjects.Container;
  prompt: Phaser.GameObjects.Text;
}

interface LumiWoodsState {
  scene: Phaser.Scene;
  interactKey: Phaser.Input.Keyboard.Key | null;
  markers: Map<string, ClueMarker>;
  starwell: Phaser.GameObjects.Container | null;
  lumi: Phaser.GameObjects.Container | null;
  lumiPrompt: Phaser.GameObjects.Text | null;
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
    const player = findPlayer(scene);
    if (!player) {
      return;
    }

    this.refreshClues(state);
    this.refreshStarwell(state);

    let nearest: ClueMarker | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const marker of state.markers.values()) {
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        marker.definition.position.x,
        marker.definition.position.y,
      );
      marker.prompt.setVisible(distance <= marker.definition.interactionRadius + 90);
      if (distance <= marker.definition.interactionRadius && distance < nearestDistance) {
        nearest = marker;
        nearestDistance = distance;
      }
    }

    const lumiDistance = state.lumi
      ? Phaser.Math.Distance.Between(player.x, player.y, LUMI_POSITION.x, LUMI_POSITION.y)
      : Number.POSITIVE_INFINITY;
    state.lumiPrompt?.setVisible(lumiDistance <= 220);

    if (!state.interactKey || !Phaser.Input.Keyboard.JustDown(state.interactKey)) {
      return;
    }
    if (nearest && nearestDistance <= lumiDistance) {
      this.activateClue(state, nearest.definition);
      return;
    }
    if (lumiDistance <= 150) {
      this.openLumiStory(scene);
    }
  }

  private ensureState(scene: Phaser.Scene): LumiWoodsState {
    if (this.state?.scene === scene) {
      return this.state;
    }
    this.clearState();
    this.state = {
      scene,
      interactKey: scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.E) ?? null,
      markers: new Map(),
      starwell: null,
      lumi: null,
      lumiPrompt: null,
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

  private createClueMarker(
    scene: Phaser.Scene,
    definition: SecretDiscoveryDefinition,
  ): ClueMarker {
    const isFireflies = definition.id === 'secret:woods-firefly-spiral';
    const isStarwell = definition.id === 'secret:woods-starwell';
    const objects: Phaser.GameObjects.GameObject[] = [];

    const glow = scene.add.circle(0, 0, isStarwell ? 42 : 30, isFireflies ? 0xf4efa4 : 0xbce8b1, 0.12);
    objects.push(glow);

    if (isFireflies) {
      for (let index = 0; index < 7; index += 1) {
        const angle = (Math.PI * 2 * index) / 7;
        const mote = scene.add.circle(Math.cos(angle) * 34, Math.sin(angle) * 24, 5, 0xf7ef9c, 0.86);
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

    const prompt = scene.add
      .text(0, 58, `${definition.actionLabel}: ${definition.label}`, {
        color: '#dcefd6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#284940ed',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = scene.add
      .zone(0, 0, definition.interactionRadius * 1.4, definition.interactionRadius * 1.4)
      .setInteractive({ useHandCursor: true });
    objects.push(prompt, zone);

    const container = scene.add
      .container(definition.position.x, definition.position.y, objects)
      .setName(PRESENTATION_NAME)
      .setDepth(20);

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
        this.activateClue(this.state, definition);
      }
    });

    scene.tweens.add({
      targets: glow,
      alpha: { from: 0.08, to: 0.34 },
      scale: { from: 0.9, to: 1.18 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    return { definition, container, prompt };
  }

  private activateClue(
    state: LumiWoodsState | null,
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
    state.scene.cameras.main.flash(definition.id === 'secret:woods-starwell' ? 280 : 160, 236, 255, 205, false);
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
  }

  private refreshStarwell(state: LumiWoodsState): void {
    const revealed = this.saveService.load()?.world.flags[STARWELL_REVEALED_FLAG] === true;
    if (!revealed) {
      state.starwell?.destroy(true);
      state.starwell = null;
      state.lumi?.destroy(true);
      state.lumi = null;
      state.lumiPrompt = null;
      return;
    }

    if (!state.starwell?.active) {
      const wellX = 2920;
      const wellY = 1700;
      const rim = state.scene.add.ellipse(0, 0, 260, 120, 0x546454, 1).setStrokeStyle(10, 0x7b8871, 1);
      const water = state.scene.add.ellipse(0, -2, 218, 82, 0x263f50, 1);
      const objects: Phaser.GameObjects.GameObject[] = [rim, water];
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        const star = state.scene.add.circle(Math.cos(angle) * 80, Math.sin(angle) * 28 - 3, 4, 0xe6f6ff, 0.8);
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
    const prompt = state.scene.add
      .text(0, 82, 'Talk: Lumi  💬', {
        color: '#dcefd6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#284940ed',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setVisible(false);
    const zone = state.scene.add.zone(0, 0, 180, 180).setInteractive({ useHandCursor: true });

    state.lumi = state.scene.add
      .container(LUMI_POSITION.x, LUMI_POSITION.y, [
        glow,
        tail,
        body,
        mane,
        head,
        horn,
        eye,
        firefly,
        prompt,
        zone,
      ])
      .setName(PRESENTATION_NAME)
      .setDepth(19);
    state.lumiPrompt = prompt;

    zone.on('pointerdown', () => {
      const player = findPlayer(state.scene);
      if (!player) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        LUMI_POSITION.x,
        LUMI_POSITION.y,
      );
      if (distance <= 150) {
        this.openLumiStory(state.scene);
      }
    });

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
    scene.scene.start('LumiStoryScene', { returnScene: 'WhisperingWoodsScene' });
  }

  private clearState(): void {
    if (!this.state) {
      return;
    }
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
