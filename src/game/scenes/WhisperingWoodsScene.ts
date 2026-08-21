import Phaser from 'phaser';
import {
  GLOWFERN_ARCH_DISCOVERY_ID,
  MOONCAP_GROVE_DISCOVERY_ID,
  WHISPERING_WOODS_REGION_DISCOVERY_ID,
} from '../../content/r5WhisperingWoods';
import type { DiscoveryId } from '../../content/contentTypes';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { worldDepthForY } from '../world/WorldDepth';
import { WHISPERING_WOODS_LOCATION_ID, WHISPERING_WOODS_MAP } from '../world/WhisperingWoodsMap';

const COLLISION_TEXTURE_KEY = 'whispering-woods-collision-pixel';
const PLAYER_TEXTURE_KEY = 'player-unicorn-whispering-woods';
const WOODS_VISITED_FLAG = 'flag:visited-whispering-woods';

export class WhisperingWoodsScene extends Phaser.Scene {
  private readonly audio = getVerticalSliceAudio();
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private discoveryService: DiscoveryService | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private readonly discoveryMarkers = new Map<DiscoveryId, Phaser.GameObjects.Container>();

  public constructor() {
    super('WhisperingWoodsScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, WHISPERING_WOODS_LOCATION_ID);
    this.discoveryService = new DiscoveryService(saveService);
    const firstVisit = !this.discoveryService.hasDiscovery(WHISPERING_WOODS_REGION_DISCOVERY_ID);
    if (firstVisit) {
      this.discoveryService.unlockDiscovery(WHISPERING_WOODS_REGION_DISCOVERY_ID, WOODS_VISITED_FLAG);
    }

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);
    const map = WHISPERING_WOODS_MAP;
    this.physics.world.setBounds(
      map.margin,
      map.margin,
      map.width - map.margin * 2,
      map.height - map.margin * 2,
    );
    this.collisionGroup = this.createCollisionMap();
    this.player = new PlayerEntity(this, map.playerSpawn.x, map.playerSpawn.y, PLAYER_TEXTURE_KEY);
    this.player.sprite.setDisplaySize(112, 92);
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));
    this.physics.add.collider(this.player.sprite, this.collisionGroup);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    if (
      shouldShowTouchMovementPad(
        globalThis.navigator?.maxTouchPoints ?? 0,
        'ontouchstart' in globalThis,
      )
    ) {
      this.touchMovementPad = new TouchMovementPad(this, this.pointerInput);
    }

    this.createDiscoveryMarkers();
    this.cameras.main.setBackgroundColor('#294f48');
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.11, 0.11);
    this.cameras.main.setDeadzone(260, 150);
    this.createHud();

    this.audio.enterScene(this.scene.key);
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    if (firstVisit) {
      this.showFeedback('New place discovered!\nWhispering Woods 🌲✨');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.audio.leaveScene(this.scene.key);
      this.feedbackTimer?.destroy();
      this.feedbackTimer = null;
      this.touchMovementPad?.destroy();
      this.touchMovementPad = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.player?.destroy();
      this.player = null;
      this.collisionGroup = null;
      this.discoveryService = null;
      for (const marker of this.discoveryMarkers.values()) {
        marker.destroy(true);
      }
      this.discoveryMarkers.clear();
      this.feedbackText = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }
    this.inputController.update();
    if (this.inputController.justPressed('BACK')) {
      this.scene.start('TitleScene');
      return;
    }

    const movement = resolvePlayerMovement(
      this.inputController.getAxis('MOVE_X'),
      this.inputController.getAxis('MOVE_Y'),
      DEFAULT_PLAYER_SPEED,
      this.player.getFacing(),
    );
    this.player.applyMovement(movement);
    this.player.updatePresentation(time);
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));
    this.tryUnlockDiscoveries();
  }

  private tryUnlockDiscoveries(): void {
    if (!this.player || !this.discoveryService) {
      return;
    }
    for (const spot of WHISPERING_WOODS_MAP.discoverySpots) {
      const marker = this.discoveryMarkers.get(spot.discoveryId);
      if (!marker) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        spot.position.x,
        spot.position.y,
      );
      if (distance > spot.collectionRadius) {
        continue;
      }
      this.discoveryService.unlockDiscovery(spot.discoveryId);
      marker.destroy(true);
      this.discoveryMarkers.delete(spot.discoveryId);
      this.audio.playSfx('discovery');
      this.showFeedback(`New discovery!\n${spot.label} ✨`);
      break;
    }
  }

  private createDiscoveryMarkers(): void {
    if (!this.discoveryService) {
      return;
    }
    for (const spot of WHISPERING_WOODS_MAP.discoverySpots) {
      if (this.discoveryService.hasDiscovery(spot.discoveryId)) {
        continue;
      }
      const symbol =
        spot.discoveryId === MOONCAP_GROVE_DISCOVERY_ID
          ? '🍄'
          : spot.discoveryId === GLOWFERN_ARCH_DISCOVERY_ID
            ? '🌿'
            : '✦';
      const glow = this.add.circle(0, 0, 42, 0xb9f3bc, 0.16);
      const icon = this.add
        .text(0, 0, symbol, { fontFamily: 'system-ui, sans-serif', fontSize: '38px' })
        .setOrigin(0.5);
      const marker = this.add
        .container(spot.position.x, spot.position.y, [glow, icon])
        .setDepth(worldDepthForY(spot.position.y, 0.4));
      this.tweens.add({
        targets: [glow, icon],
        alpha: { from: 0.5, to: 1 },
        scale: { from: 0.92, to: 1.08 },
        duration: 1050,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      this.discoveryMarkers.set(spot.discoveryId, marker);
    }
  }

  private createEnvironment(): void {
    const map = WHISPERING_WOODS_MAP;
    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0x315f52).setDepth(0);
    this.add.circle(750, 590, 700, 0x457866, 0.36).setDepth(1);
    this.add.circle(1850, 1550, 760, 0x284f48, 0.28).setDepth(1);
    this.add.circle(2860, 800, 650, 0x3e705c, 0.32).setDepth(1);

    this.createMainPaths();
    this.createLayeredCanopy();
    this.createMooncaps();
    this.createGlowfernArch();
    this.createNavigationLights();
    this.createAmbientMotes();
  }

  private createMainPaths(): void {
    const path = this.add.graphics().setDepth(2);
    path.lineStyle(132, 0x866f57, 0.82);
    path.beginPath();
    path.moveTo(100, 1090);
    path.lineTo(720, 1090);
    path.lineTo(1230, 980);
    path.lineTo(1680, 1110);
    path.lineTo(2090, 1080);
    path.lineTo(2530, 930);
    path.lineTo(2940, 820);
    path.strokePath();
    path.lineStyle(72, 0xa58b68, 0.7);
    path.strokePath();

    path.lineStyle(54, 0x7b684f, 0.56);
    path.beginPath();
    path.moveTo(1180, 980);
    path.lineTo(1180, 620);
    path.strokePath();
    path.beginPath();
    path.moveTo(2170, 1050);
    path.lineTo(2340, 1320);
    path.lineTo(2550, 1510);
    path.strokePath();
  }

  private createLayeredCanopy(): void {
    const trees = [
      [520, 510, 1.18],
      [820, 420, 1.05],
      [1390, 430, 1.2],
      [1660, 1490, 1.15],
      [2140, 1810, 1.08],
      [2690, 540, 1.22],
      [3070, 1190, 1.1],
      [720, 1760, 1.12],
      [1260, 1900, 1.08],
    ] as const;
    for (const [x, y, scale] of trees) {
      const trunk = this.add.rectangle(0, -55, 42, 110, 0x5f4a3d, 1);
      const lower = this.add.circle(-38, -120, 86, 0x244a3d, 1);
      const right = this.add.circle(48, -118, 94, 0x2d5948, 1);
      const top = this.add.circle(5, -185, 98, 0x376a55, 1);
      const crown = this.add.circle(-5, -208, 68, 0x4a7b60, 0.72);
      this.add
        .container(x, y, [trunk, lower, right, top, crown])
        .setScale(scale)
        .setDepth(worldDepthForY(y, 0.3));
    }

    const canopy = this.add.graphics().setDepth(45).setAlpha(0.12);
    canopy.fillStyle(0x173b34, 1);
    canopy.fillCircle(280, 80, 360);
    canopy.fillCircle(1000, 40, 410);
    canopy.fillCircle(1900, 20, 430);
    canopy.fillCircle(2860, 70, 390);
  }

  private createMooncaps(): void {
    const positions = [
      [1100, 600],
      [1160, 655],
      [1230, 610],
      [1280, 675],
    ] as const;
    for (const [x, y] of positions) {
      this.add.ellipse(x, y, 54, 28, 0xc7ddf0, 0.95).setDepth(worldDepthForY(y, 0.1));
      this.add.circle(x, y - 5, 30, 0xdff6ff, 0.16).setDepth(worldDepthForY(y, 0.05));
    }
  }

  private createGlowfernArch(): void {
    const x = 1980;
    const y = 1080;
    const roots = this.add.graphics().setDepth(worldDepthForY(y, 0.15));
    roots.lineStyle(28, 0x66503d, 1);
    roots.beginPath();
    roots.moveTo(x - 105, y + 80);
    roots.lineTo(x - 70, y - 45);
    roots.lineTo(x, y - 105);
    roots.lineTo(x + 70, y - 45);
    roots.lineTo(x + 105, y + 80);
    roots.strokePath();
    for (const [offsetX, offsetY] of [
      [-86, 20],
      [-64, -28],
      [65, -28],
      [88, 18],
    ] as const) {
      this.add
        .text(x + offsetX, y + offsetY, '🌿', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '32px',
        })
        .setOrigin(0.5)
        .setDepth(worldDepthForY(y, 0.25));
    }
  }

  private createNavigationLights(): void {
    const points = [
      [520, 1065],
      [980, 1000],
      [1450, 1030],
      [1880, 1090],
      [2300, 1010],
      [2700, 890],
    ] as const;
    for (const [x, y] of points) {
      this.add.circle(x, y, 11, 0xcaf5a7, 0.75).setDepth(6);
      this.add.circle(x, y, 28, 0xb4ef9d, 0.1).setDepth(5);
    }
  }

  private createAmbientMotes(): void {
    const motes = [
      [890, 760],
      [1500, 720],
      [1820, 1260],
      [2440, 700],
      [2840, 1380],
    ] as const;
    for (const [index, [x, y]] of motes.entries()) {
      const mote = this.add.circle(x, y, 5, index % 2 === 0 ? 0xd8f7ae : 0xc6eaff, 0.72).setDepth(16);
      this.tweens.add({
        targets: mote,
        y: y - 24,
        alpha: { from: 0.25, to: 0.9 },
        duration: 1200 + index * 130,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();
    for (const collider of WHISPERING_WOODS_MAP.colliders) {
      const blocker = group.create(
        collider.x,
        collider.y,
        COLLISION_TEXTURE_KEY,
      ) as Phaser.Physics.Arcade.Image;
      blocker.setDisplaySize(collider.width, collider.height).setVisible(false).refreshBody();
    }
    return group;
  }

  private ensureCollisionTexture(): void {
    if (this.textures.exists(COLLISION_TEXTURE_KEY)) {
      return;
    }
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(0, 0, 2, 2);
    graphics.generateTexture(COLLISION_TEXTURE_KEY, 2, 2);
    graphics.destroy();
  }

  private createHud(): void {
    this.add
      .text(GAME_WIDTH / 2, 24, 'Whispering Woods', {
        color: '#e9f5df',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        backgroundColor: '#24483fe8',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);
    this.add
      .text(GAME_WIDTH / 2, 72, 'The little green lights always follow a safe path.', {
        color: '#dcefd5',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        backgroundColor: '#24483fd9',
        padding: { x: 12, y: 6 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);
    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 118, '', {
        color: '#38594e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#efffeeea',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(122)
      .setVisible(false);
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedbackText?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(3800, () => {
      this.feedbackText?.setVisible(false);
      this.feedbackTimer = null;
    });
  }
}
