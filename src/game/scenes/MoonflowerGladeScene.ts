import Phaser from 'phaser';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PlayerEntity } from '../player/PlayerEntity';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import {
  ensurePlayerPlaceholderTexture,
  PLAYER_PLACEHOLDER_TEXTURE_KEY,
} from '../player/PlayerPlaceholderTexture';
import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';

const COLLISION_TEXTURE_KEY = 'glade-collision-pixel';

export class MoonflowerGladeScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;

  public constructor() {
    super('MoonflowerGladeScene');
  }

  public create(): void {
    this.createEnvironment();
    ensurePlayerPlaceholderTexture(this);
    this.ensureCollisionTexture();

    const map = MOONFLOWER_GLADE_MAP;
    this.physics.world.setBounds(
      map.margin,
      map.margin,
      map.width - map.margin * 2,
      map.height - map.margin * 2,
    );

    this.collisionGroup = this.createCollisionMap();
    this.player = new PlayerEntity(
      this,
      map.playerSpawn.x,
      map.playerSpawn.y,
      PLAYER_PLACEHOLDER_TEXTURE_KEY,
    );
    this.physics.add.collider(this.player.sprite, this.collisionGroup);
    this.inputController = new InputController([new KeyboardInputAdapter(this)]);

    const camera = this.cameras.main;
    camera.setBackgroundColor('#a8ddba');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(260, 150);

    this.createHud();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.player?.destroy();
      this.player = null;
      this.collisionGroup?.clear(true, true);
      this.collisionGroup = null;
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
  }

  private createEnvironment(): void {
    const map = MOONFLOWER_GLADE_MAP;

    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xa8ddba).setDepth(0);
    this.add.circle(520, 1040, 390, 0x9ed7ae, 0.55).setDepth(1);
    this.add.circle(2210, 1180, 500, 0xb6e5bd, 0.48).setDepth(1);
    this.add.circle(2060, 420, 360, 0x9bd3ac, 0.5).setDepth(1);

    this.createPaths();
    this.createStreamAndBridge();
    this.createCottage();
    this.createGarden();
    this.createDisplayStump();
    this.createHollowTree();
    this.createMoonflowerField();
    this.createEntranceMarkers();
    this.createBoundaryFoliage();
    this.createFireflies();
    this.createForegroundLayeringTest();
  }

  private createPaths(): void {
    const path = this.add.graphics().setDepth(2);
    path.lineStyle(112, 0xead7aa, 0.92);
    path.beginPath();
    path.moveTo(560, 720);
    path.lineTo(830, 820);
    path.lineTo(1100, 870);
    path.lineTo(1400, 900);
    path.lineTo(1750, 900);
    path.lineTo(2150, 900);
    path.lineTo(2690, 900);
    path.strokePath();

    path.lineStyle(92, 0xe4cf9f, 0.9);
    path.beginPath();
    path.moveTo(1770, 930);
    path.lineTo(1840, 1160);
    path.lineTo(1940, 1420);
    path.lineTo(1980, 1720);
    path.strokePath();

    path.lineStyle(56, 0xf1e3bd, 0.75);
    path.beginPath();
    path.moveTo(760, 850);
    path.lineTo(840, 1070);
    path.strokePath();
  }

  private createStreamAndBridge(): void {
    const bridge = MOONFLOWER_GLADE_MAP.bridge;

    this.add.rectangle(1400, 900, 220, 1800, 0x72c8df, 0.96).setDepth(3);
    this.add.rectangle(1400, 900, 92, 1800, 0xb9ecf0, 0.33).setDepth(4);

    for (let y = 150; y < 1750; y += 210) {
      this.add.ellipse(1375, y, 72, 18, 0xe8ffff, 0.28).setDepth(5);
      this.add.ellipse(1440, y + 85, 58, 14, 0xe8ffff, 0.22).setDepth(5);
    }

    this.add
      .rectangle(bridge.x, bridge.y, bridge.width, bridge.height, 0xd7b47b, 1)
      .setStrokeStyle(8, 0xa87a4f, 1)
      .setDepth(9);

    for (let x = bridge.x - bridge.width / 2 + 35; x < bridge.x + bridge.width / 2; x += 48) {
      this.add.rectangle(x, bridge.y, 7, bridge.height - 18, 0xb88d5f, 0.78).setDepth(10);
    }

    this.add.rectangle(bridge.x, bridge.y - 92, bridge.width + 20, 15, 0x9f754f, 1).setDepth(15);
    this.add.rectangle(bridge.x, bridge.y + 92, bridge.width + 20, 18, 0x8d6548, 1).setDepth(30);

    for (const x of [bridge.x - 170, bridge.x + 170]) {
      this.add.circle(x, bridge.y - 92, 16, 0xb88a5c, 1).setDepth(16);
      this.add.circle(x, bridge.y + 92, 17, 0xa87652, 1).setDepth(31);
    }
  }

  private createCottage(): void {
    const cottage = this.add.graphics().setDepth(10);
    cottage.fillStyle(0xfff0cf, 1);
    cottage.fillRoundedRect(350, 350, 420, 300, 72);
    cottage.fillStyle(0xb791d4, 1);
    cottage.fillEllipse(560, 355, 470, 260);
    cottage.fillStyle(0x8d68b2, 1);
    cottage.fillTriangle(350, 390, 560, 185, 770, 390);
    cottage.fillStyle(0x8d6548, 1);
    cottage.fillRoundedRect(520, 515, 82, 135, 28);
    cottage.fillStyle(0xb8e7ef, 1);
    cottage.fillRoundedRect(405, 440, 78, 72, 18);
    cottage.fillRoundedRect(640, 440, 78, 72, 18);
    cottage.fillStyle(0xffffff, 0.7);
    cottage.fillCircle(576, 575, 6);

    this.add
      .text(560, 690, 'Moonflower Cottage', {
        color: '#5c416e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
        backgroundColor: '#fff8eccc',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(12);

    this.addMoonflower(350, 650, 1.15);
    this.addMoonflower(760, 650, 1.05);
  }

  private createGarden(): void {
    this.add
      .rectangle(890, 620, 280, 190, 0x9e7656, 0.75)
      .setStrokeStyle(8, 0xd7b77f, 0.95)
      .setDepth(6);

    for (const y of [565, 620, 675]) {
      this.add.rectangle(890, y, 230, 18, 0x6f543f, 0.6).setDepth(7);
    }

    for (const x of [810, 860, 920, 970]) {
      this.add.circle(x, 575 + ((x / 10) % 2) * 55, 13, 0xffd3f1, 0.9).setDepth(8);
      this.add.circle(x + 8, 583 + ((x / 10) % 2) * 55, 8, 0xe6c1ff, 0.9).setDepth(8);
    }
  }

  private createDisplayStump(): void {
    this.add.ellipse(850, 1130, 118, 70, 0x8a6248, 1).setDepth(9);
    this.add.ellipse(850, 1100, 118, 54, 0xc79b70, 1).setDepth(10);
    this.add.circle(850, 1098, 17, 0xf4d79f, 0.72).setDepth(11);
    this.add.circle(850, 1098, 6, 0xfff7cb, 0.9).setDepth(12);
  }

  private createHollowTree(): void {
    const tree = this.add.graphics().setDepth(10);
    tree.fillStyle(0x8c6349, 1);
    tree.fillRoundedRect(2115, 395, 170, 300, 60);
    tree.fillStyle(0x5b413a, 1);
    tree.fillEllipse(2200, 555, 76, 112);
    tree.fillStyle(0x477a58, 1);
    tree.fillCircle(2120, 350, 150);
    tree.fillCircle(2250, 330, 180);
    tree.fillStyle(0x5f966a, 1);
    tree.fillCircle(2190, 280, 180);
    tree.fillCircle(2290, 420, 130);

    this.add.circle(2200, 555, 22, 0x2f2638, 0.92).setDepth(12);
    this.add.circle(2200, 555, 8, 0xb98ce8, 0.28).setDepth(13);
  }

  private createMoonflowerField(): void {
    const positions = [
      [1920, 1110, 1],
      [2020, 1080, 1.2],
      [2120, 1140, 0.9],
      [2210, 1070, 1.1],
      [1900, 1260, 1.05],
      [2020, 1300, 1.25],
      [2160, 1260, 1.1],
      [2260, 1360, 0.95],
      [2050, 1420, 1.05],
    ] as const;

    for (const [x, y, scale] of positions) {
      this.addMoonflower(x, y, scale);
    }
  }

  private createEntranceMarkers(): void {
    for (const entrance of MOONFLOWER_GLADE_MAP.entrances) {
      const isEast = entrance.direction === 'east';
      const archWidth = isEast ? 150 : 190;
      const archHeight = 170;
      const x = entrance.position.x;
      const y = entrance.position.y;

      this.add.rectangle(x - archWidth / 2, y, 26, archHeight, 0xb69a78, 0.95).setDepth(8);
      this.add.rectangle(x + archWidth / 2, y, 26, archHeight, 0xb69a78, 0.95).setDepth(8);
      this.add.ellipse(x, y - archHeight / 2, archWidth + 28, 64, 0xc9b08c, 0.95).setDepth(8);

      this.add
        .text(x, y - 132, entrance.label, {
          color: '#54415f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          backgroundColor: '#fff9edcc',
          padding: { x: 9, y: 5 },
        })
        .setOrigin(0.5)
        .setDepth(11);
    }
  }

  private createBoundaryFoliage(): void {
    const treePositions = [
      [170, 220],
      [430, 150],
      [820, 170],
      [1180, 150],
      [1640, 150],
      [1980, 150],
      [2520, 170],
      [2660, 330],
      [2500, 1560],
      [2280, 1650],
      [1570, 1670],
      [1120, 1650],
      [620, 1630],
      [250, 1510],
      [150, 1160],
      [160, 620],
    ] as const;

    for (const [x, y] of treePositions) {
      this.add.rectangle(x, y + 60, 34, 110, 0x816149, 0.8).setDepth(4);
      this.add.circle(x, y, 92, 0x5d9b6d, 0.88).setDepth(5);
      this.add.circle(x + 48, y + 18, 66, 0x72ad7b, 0.84).setDepth(5);
    }
  }

  private createFireflies(): void {
    const positions = [
      [430, 840],
      [610, 1180],
      [1040, 690],
      [1660, 620],
      [1820, 1050],
      [2290, 770],
      [2400, 1190],
      [1740, 1460],
    ] as const;

    positions.forEach(([x, y], index) => {
      const firefly = this.add.circle(x, y, 7, 0xfff4a3, 0.35).setDepth(18);
      this.tweens.add({
        targets: firefly,
        alpha: 0.95,
        scale: 1.45,
        duration: 850 + index * 95,
        yoyo: true,
        repeat: -1,
        delay: index * 110,
      });
    });
  }

  private createForegroundLayeringTest(): void {
    this.add.rectangle(1110, 1110, 13, 120, 0x5d9b68, 1).setDepth(8);

    const petalOffsets = [
      [0, -34],
      [35, -6],
      [25, 28],
      [-25, 28],
      [-35, -6],
    ] as const;

    for (const [offsetX, offsetY] of petalOffsets) {
      this.add.ellipse(1110 + offsetX, 1040 + offsetY, 58, 78, 0xdca7ff, 0.96).setDepth(32);
    }

    this.add.circle(1110, 1040, 25, 0xffe5a2, 1).setDepth(33);
  }

  private addMoonflower(x: number, y: number, scale: number): void {
    this.add.rectangle(x, y + 24 * scale, 7 * scale, 54 * scale, 0x5f9b67, 0.95).setDepth(6);

    const petalOffsets = [
      [0, -18],
      [18, -5],
      [12, 14],
      [-12, 14],
      [-18, -5],
    ] as const;

    for (const [offsetX, offsetY] of petalOffsets) {
      this.add
        .ellipse(x + offsetX * scale, y + offsetY * scale, 28 * scale, 38 * scale, 0xe0b3ff, 0.94)
        .setDepth(7);
    }

    this.add.circle(x, y, 12 * scale, 0xffdca1, 1).setDepth(8);
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const collisionGroup = this.physics.add.staticGroup();

    for (const collider of MOONFLOWER_GLADE_MAP.colliders) {
      const blocker = collisionGroup.create(
        collider.x,
        collider.y,
        COLLISION_TEXTURE_KEY,
      ) as Phaser.Physics.Arcade.Image;
      blocker.setDisplaySize(collider.width, collider.height).setVisible(false).refreshBody();
    }

    return collisionGroup;
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
      .text(28, 28, 'Moonflower Glade', {
        color: '#49355e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '26px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8dd',
        padding: { x: 14, y: 9 },
      })
      .setScrollFactor(0)
      .setDepth(100);

    this.add
      .text(28, 82, 'WASD / arrows to explore  •  Escape to title', {
        color: '#5a4869',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        backgroundColor: '#fff9e8c8',
        padding: { x: 11, y: 7 },
      })
      .setScrollFactor(0)
      .setDepth(100);
  }
}
