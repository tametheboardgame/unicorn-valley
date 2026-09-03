import Phaser from 'phaser';
import { STARLIGHT_BEACH_REGION_DISCOVERY_ID } from '../../content/r65StarlightBeach';
import type { DiscoveryId } from '../../content/contentTypes';
import { getVerticalSliceAudio } from '../audio/VerticalSliceAudio';
import { GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import { InventoryService } from '../inventory/InventoryService';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { STARLIGHT_BEACH_LOCATION_ID, STARLIGHT_BEACH_MAP } from '../world/StarlightBeachMap';
import { worldDepthForY } from '../world/WorldDepth';

const COLLISION_TEXTURE_KEY = 'starlight-beach-collision-pixel';
const PLAYER_TEXTURE_KEY = 'player-unicorn-starlight-beach';
const BEACH_AUDIO_SCENE_KEY = 'CrystalBrookScene';

export class StarlightBeachScene extends Phaser.Scene {
  private readonly audio = getVerticalSliceAudio();
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private discoveryService: DiscoveryService | null = null;
  private inventoryService: InventoryService | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private readonly discoveryMarkers = new Map<DiscoveryId, Phaser.GameObjects.Container>();

  public constructor() {
    super('StarlightBeachScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, STARLIGHT_BEACH_LOCATION_ID);
    this.discoveryService = new DiscoveryService(saveService);
    this.inventoryService = new InventoryService(saveService);
    const firstVisit = !this.discoveryService.hasDiscovery(STARLIGHT_BEACH_REGION_DISCOVERY_ID);
    if (firstVisit) {
      this.discoveryService.unlockDiscovery(STARLIGHT_BEACH_REGION_DISCOVERY_ID);
    }

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);
    const map = STARLIGHT_BEACH_MAP;
    this.physics.world.setBounds(
      map.margin,
      map.margin,
      map.width - map.margin * 2,
      map.height - map.margin * 2,
    );

    const blockers = this.createCollisionMap();
    this.player = new PlayerEntity(this, map.playerSpawn.x, map.playerSpawn.y, PLAYER_TEXTURE_KEY);
    this.player.sprite.setDisplaySize(112, 92);
    this.physics.add.collider(this.player.sprite, blockers);

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
    this.createHud();
    this.cameras.main.setBackgroundColor('#9ed9e5');
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.11, 0.11);
    this.cameras.main.setDeadzone(260, 150);

    this.audio.enterScene(BEACH_AUDIO_SCENE_KEY);
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());
    if (firstVisit) {
      this.showFeedback('New place discovered!\nStarlight Beach 🏖️✨');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdown());
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

    this.player.applyMovement(
      resolvePlayerMovement(
        this.inputController.getAxis('MOVE_X'),
        this.inputController.getAxis('MOVE_Y'),
        DEFAULT_PLAYER_SPEED,
        this.player.getFacing(),
      ),
    );
    this.player.updatePresentation(time);
    this.player.sprite.setDepth(worldDepthForY(this.player.sprite.y, 0.5));
    this.tryUnlockDiscoveries();
  }

  private createEnvironment(): void {
    const map = STARLIGHT_BEACH_MAP;
    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xf4dca8).setDepth(0);
    this.add.rectangle(map.width / 2, 2080, map.width, 440, 0x4bb7cf, 1).setDepth(1);
    this.add.rectangle(map.width / 2, 1915, map.width, 120, 0x84d8df, 0.95).setDepth(2);

    const shoreline = this.add.graphics().setDepth(3);
    shoreline.lineStyle(26, 0xf9f2d2, 0.92);
    shoreline.beginPath();
    shoreline.moveTo(120, 1840);
    shoreline.lineTo(720, 1810);
    shoreline.lineTo(1280, 1870);
    shoreline.lineTo(1840, 1830);
    shoreline.lineTo(2440, 1880);
    shoreline.lineTo(3020, 1820);
    shoreline.lineTo(3480, 1850);
    shoreline.strokePath();

    this.createShellCove();
    this.createTidePools();
    this.createStarDunes();
    this.createMoonlitPoint();
    this.createBeachPath();
    this.createLandmarkLabels();
    this.createAmbientSparkles();
  }

  private createShellCove(): void {
    this.add.ellipse(820, 820, 760, 470, 0xf7e3b7, 1).setDepth(2);
    for (const [x, y, colour] of [
      [520, 610, 0xd48f85],
      [650, 560, 0xb97d77],
      [1080, 590, 0xca8f86],
    ] as const) {
      this.add.ellipse(x, y, 150, 105, colour, 1).setDepth(worldDepthForY(y, 0.1));
    }
    for (const [x, y, symbol] of [
      [730, 820, '🐚'],
      [910, 735, '🐚'],
      [1040, 910, '✦'],
    ] as const) {
      this.add
        .text(x, y, symbol, { fontFamily: 'system-ui, sans-serif', fontSize: '28px' })
        .setOrigin(0.5)
        .setDepth(worldDepthForY(y, 0.2));
    }
  }

  private createTidePools(): void {
    for (const [x, y, width, height] of [
      [1740, 1580, 310, 160],
      [2000, 1650, 360, 180],
      [2210, 1510, 250, 135],
    ] as const) {
      this.add
        .ellipse(x, y, width, height, 0x57bed0, 0.88)
        .setStrokeStyle(8, 0xd8f1df, 0.9)
        .setDepth(4);
      this.add.ellipse(x - 20, y - 15, width * 0.55, height * 0.34, 0xbaf1e7, 0.2).setDepth(5);
    }
    for (const [x, y, symbol] of [
      [1690, 1570, '⭐'],
      [2010, 1640, '🫧'],
      [2190, 1510, '🦀'],
    ] as const) {
      this.add
        .text(x, y, symbol, { fontFamily: 'system-ui, sans-serif', fontSize: '24px' })
        .setOrigin(0.5)
        .setDepth(6);
    }
  }

  private createStarDunes(): void {
    this.add.ellipse(2470, 610, 930, 430, 0xe9c879, 1).setDepth(2);
    this.add.ellipse(2800, 760, 700, 340, 0xe5c16f, 0.96).setDepth(2);
    for (const [x, y] of [
      [2230, 680],
      [2380, 610],
      [2700, 760],
      [2870, 820],
    ] as const) {
      this.add
        .text(x, y, '🌾', { fontFamily: 'system-ui, sans-serif', fontSize: '34px' })
        .setOrigin(0.5)
        .setDepth(worldDepthForY(y, 0.2));
    }
    for (const [x, y, colour] of [
      [2350, 820, 0xe7648c],
      [2550, 840, 0x5c89db],
      [2760, 920, 0xf4b94e],
    ] as const) {
      const pole = this.add.rectangle(0, 26, 7, 78, 0x7a6047, 1);
      const flag = this.add.triangle(22, -4, 0, 0, 52, 14, 0, 30, colour, 1);
      this.add.container(x, y, [pole, flag]).setDepth(worldDepthForY(y, 0.3));
    }
  }

  private createMoonlitPoint(): void {
    this.add.ellipse(3160, 1510, 630, 400, 0xd8bb8b, 1).setDepth(3);
    for (const [x, y, scale] of [
      [3010, 1390, 1.0],
      [3260, 1450, 1.15],
      [3360, 1600, 0.9],
    ] as const) {
      this.add
        .ellipse(x, y, 150 * scale, 105 * scale, 0x8b7d85, 1)
        .setDepth(worldDepthForY(y, 0.1));
    }
    this.add.circle(3110, 1610, 46, 0xfff7cf, 0.22).setDepth(7);
    this.add.circle(3110, 1610, 17, 0xfff9dd, 0.8).setDepth(8);
  }

  private createBeachPath(): void {
    const path = this.add.graphics().setDepth(3);
    path.lineStyle(94, 0xe7c789, 0.72);
    path.beginPath();
    path.moveTo(100, 1140);
    path.lineTo(650, 1120);
    path.lineTo(1120, 1080);
    path.lineTo(1510, 1190);
    path.lineTo(1900, 1330);
    path.lineTo(2370, 1180);
    path.lineTo(2830, 1320);
    path.lineTo(3220, 1500);
    path.strokePath();
  }

  private createLandmarkLabels(): void {
    for (const landmark of STARLIGHT_BEACH_MAP.landmarks) {
      const label = this.add
        .text(0, 0, `${landmark.icon} ${landmark.label}`, {
          color: '#5d596d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          backgroundColor: '#fff9e6e8',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(0.5);
      this.add
        .container(landmark.position.x, landmark.position.y - 120, [label])
        .setDepth(worldDepthForY(landmark.position.y, 0.45));
    }
  }

  private createAmbientSparkles(): void {
    for (const [index, [x, y]] of [
      [540, 1740],
      [1220, 1790],
      [1840, 1720],
      [2580, 1800],
      [3150, 1700],
    ].entries()) {
      const sparkle = this.add
        .text(x, y, index % 2 === 0 ? '✦' : '·', {
          color: '#fff8cf',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 2 === 0 ? '24px' : '34px',
        })
        .setOrigin(0.5)
        .setDepth(9);
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.2, to: 0.95 },
        y: y - 16,
        duration: 1150 + index * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createDiscoveryMarkers(): void {
    if (!this.discoveryService) {
      return;
    }
    for (const spot of STARLIGHT_BEACH_MAP.discoverySpots) {
      if (this.discoveryService.hasDiscovery(spot.discoveryId)) {
        continue;
      }
      const glow = this.add.circle(0, 0, 38, 0xfff2ad, 0.2);
      const icon = this.add
        .text(0, 0, spot.icon, { fontFamily: 'system-ui, sans-serif', fontSize: '34px' })
        .setOrigin(0.5);
      const marker = this.add
        .container(spot.position.x, spot.position.y, [glow, icon])
        .setDepth(worldDepthForY(spot.position.y, 0.5));
      this.tweens.add({
        targets: marker,
        scale: { from: 0.94, to: 1.08 },
        duration: 1050,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      this.discoveryMarkers.set(spot.discoveryId, marker);
    }
  }

  private tryUnlockDiscoveries(): void {
    if (!this.player || !this.discoveryService || !this.inventoryService) {
      return;
    }
    for (const spot of STARLIGHT_BEACH_MAP.discoverySpots) {
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
      if (spot.itemId && this.inventoryService.getQuantity(spot.itemId) === 0) {
        this.inventoryService.addItem(spot.itemId);
      }
      marker.destroy(true);
      this.discoveryMarkers.delete(spot.discoveryId);
      this.audio.playSfx(spot.itemId ? 'collect' : 'discovery');
      this.showFeedback(
        spot.itemId
          ? `Starlight Shell found!\n${spot.label} ✨`
          : `New discovery!\n${spot.label} ✨`,
      );
      return;
    }
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();
    for (const collider of STARLIGHT_BEACH_MAP.colliders) {
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
      .text(GAME_WIDTH / 2, 24, 'Starlight Beach', {
        color: '#536071',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        backgroundColor: '#fff8dff0',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);
    this.add
      .text(
        GAME_WIDTH / 2,
        72,
        'Follow the warm sand between Shell Cove, the Tide Pools and Star Dunes.',
        {
          color: '#536071',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          backgroundColor: '#fff8dfe0',
          padding: { x: 12, y: 6 },
        },
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);
    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 118, '', {
        color: '#4f5d6a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        backgroundColor: '#fffdf2ee',
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

  private shutdown(): void {
    this.audio.leaveScene(BEACH_AUDIO_SCENE_KEY);
    this.feedbackTimer?.destroy();
    this.touchMovementPad?.destroy();
    this.inputController?.destroy();
    this.player?.destroy();
    for (const marker of this.discoveryMarkers.values()) {
      marker.destroy(true);
    }
    this.discoveryMarkers.clear();
    this.feedbackTimer = null;
    this.touchMovementPad = null;
    this.inputController = null;
    this.pointerInput = null;
    this.player = null;
    this.discoveryService = null;
    this.inventoryService = null;
    this.feedbackText = null;
  }
}
