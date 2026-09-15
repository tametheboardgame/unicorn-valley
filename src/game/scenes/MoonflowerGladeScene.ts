import Phaser from 'phaser';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { renderCottageExterior } from '../home/CottageExteriorPresentation';
import {
  FIRST_DISCOVERY_FLAG,
  FIRST_DISCOVERY_ID,
  FIRST_SPARKLE_POSITION,
} from '../intro/PipIntro';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';
import { renderHomeMeadow } from '../world/HomeMeadowPresentation';
import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import { worldDepthForY } from '../world/WorldDepth';

const COLLISION_TEXTURE_KEY = 'glade-collision-pixel';
const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-saved';
const FIRST_SPARKLE_INTERACTION_RADIUS = 132;

export class MoonflowerGladeScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private discoveryService: DiscoveryService | null = null;
  public hasFirstDiscovery = false;
  private sparkleContainer: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('MoonflowerGladeScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    this.discoveryService = new DiscoveryService(saveService);
    this.hasFirstDiscovery = this.discoveryService.hasDiscovery(FIRST_DISCOVERY_ID);

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, SAVED_PLAYER_TEXTURE_KEY, appearance);

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
      SAVED_PLAYER_TEXTURE_KEY,
    );
    this.player.sprite.setDisplaySize(112, 92);
    this.physics.add.collider(this.player.sprite, this.collisionGroup);

    // Movement remains scene-owned. Explicit interactions are owned by the shared world
    // interaction coordinator/registry rather than a second scene-local prompt/activator.
    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

    if (!this.hasFirstDiscovery) {
      this.createFirstSparkle();
    }

    const camera = this.cameras.main;
    camera.setBackgroundColor('#a8ddba');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(260, 150);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.sparkleContainer?.destroy(true);
      this.sparkleContainer = null;
      this.discoveryService = null;
      this.player?.destroy();
      this.player = null;
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

  public createFirstSparkleInteraction(): InteractionTarget | null {
    if (this.hasFirstDiscovery || !this.sparkleContainer) {
      return null;
    }

    return {
      id: 'interaction:first-moonflower-sparkle',
      label: 'Moonflower Sparkle',
      actionLabel: 'Pick up',
      actionKind: 'pick-up',
      worldAffordance: true,
      position: FIRST_SPARKLE_POSITION,
      interactionRadius: FIRST_SPARKLE_INTERACTION_RADIUS,
      priority: 30,
      directArea: {
        width: 180,
        height: 180,
        name: 'first-moonflower-sparkle-direct',
      },
      result: {
        type: 'callback',
        activate: () => this.collectFirstSparkle(),
      },
    };
  }

  private collectFirstSparkle(): void {
    if (this.hasFirstDiscovery || !this.sparkleContainer) {
      return;
    }

    this.discoveryService?.unlockDiscovery(FIRST_DISCOVERY_ID, FIRST_DISCOVERY_FLAG, {
      suppressRewardFeedback: true,
    });
    this.hasFirstDiscovery = true;
    this.sparkleContainer.destroy(true);
    this.sparkleContainer = null;
    this.cameras.main.flash(180, 213, 255, 221, false);
    getWorldFeedbackPresenter(this).showGuidance('Now go back and talk to Pip.', 4400);
  }

  private createFirstSparkle(): void {
    const glow = this.add.circle(0, 0, 38, 0x63e59a, 0.24);
    const ring = this.add.circle(0, 0, 20, 0xb9ffd2, 0.52).setStrokeStyle(4, 0xeffff4, 0.94);
    const star = this.add
      .text(0, 0, '✦', {
        color: '#7dffad',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.sparkleContainer = this.add
      .container(FIRST_SPARKLE_POSITION.x, FIRST_SPARKLE_POSITION.y, [glow, ring, star])
      .setName('pip-first-green-sparkle')
      .setDepth(18);
    this.tweens.add({
      targets: this.sparkleContainer,
      scale: 1.24,
      angle: 8,
      duration: 720,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createEnvironment(): void {
    const map = MOONFLOWER_GLADE_MAP;

    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xa8ddba).setDepth(0);
    this.add.circle(520, 1040, 390, 0x9ed7ae, 0.55).setDepth(1);
    this.add.circle(2210, 1180, 500, 0xb6e5bd, 0.48).setDepth(1);
    this.add.circle(2060, 420, 360, 0x9bd3ac, 0.5).setDepth(1);

    // Final paths, signs, gardens and stream surface/life have canonical shared owners.
    // The base scene only creates terrain/landmarks which are not subsequently suppressed.
    this.createWesternGate();
    this.createBridge();
    this.createCottage();
    renderHomeMeadow(this);
    this.createHollowTree();
    this.createMoonflowerField();
    this.createEntranceStructures();
    this.createBoundaryFoliage();
    this.createFireflies();
    this.createForegroundLayeringTest();
  }

  private createWesternGate(): void {
    const gate = MOONFLOWER_GLADE_MAP.landmarks.find((landmark) => landmark.id === 'western-gate');
    if (!gate) {
      return;
    }

    const x = gate.position.x;
    const y = gate.position.y;

    const hedge = this.add.graphics().setDepth(7);
    hedge.fillStyle(0x4f8b61, 0.98);
    hedge.fillRoundedRect(82, 110, 92, y - 205, 36);
    hedge.fillRoundedRect(82, y + 95, 92, 1800 - (y + 185), 36);
    hedge.fillStyle(0x6fa878, 0.9);
    for (let leafY = 160; leafY < y - 105; leafY += 92) {
      hedge.fillCircle(128, leafY, 58);
    }
    for (let leafY = y + 170; leafY < 1710; leafY += 92) {
      hedge.fillCircle(128, leafY, 58);
    }

    this.add.rectangle(x - 30, y, 24, 196, 0x8b6549, 1).setDepth(9);
    this.add.rectangle(x + 30, y, 24, 196, 0x8b6549, 1).setDepth(9);
    for (const gateY of [y - 60, y, y + 60]) {
      this.add.rectangle(x, gateY, 72, 16, 0xb98b5e, 1).setDepth(9);
    }
    this.add.circle(x + 18, y, 7, 0xd7dce4, 1).setDepth(10);
  }

  private createBridge(): void {
    const bridge = MOONFLOWER_GLADE_MAP.bridge;

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
    const cottage = MOONFLOWER_GLADE_MAP.landmarks.find(
      (landmark) => landmark.id === 'moonflower-cottage',
    );
    if (!cottage) {
      return;
    }
    renderCottageExterior(this, cottage.position);
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
    const lavender = 0xe0b3ff;
    const blush = 0xffb4d6;
    const sky = 0xb9d9ff;
    const pearl = 0xffefd1;
    const violet = 0xc8b0ff;

    const fieldGround = this.add.graphics().setDepth(2.28);
    fieldGround.fillStyle(0x76b77d, 0.13);
    fieldGround.fillEllipse(2240, 1320, 760, 520);
    fieldGround.fillStyle(0x8fc88f, 0.1);
    fieldGround.fillEllipse(2390, 1370, 490, 390);

    const flowers = [
      [1985, 1095, 0.88, pearl],
      [2075, 1080, 1.08, lavender],
      [2170, 1120, 0.94, blush],
      [2285, 1088, 1.12, sky],
      [2400, 1110, 0.9, violet],
      [2495, 1145, 1.02, lavender],
      [1960, 1195, 1.04, blush],
      [2055, 1170, 0.86, sky],
      [2145, 1210, 1.18, violet],
      [2245, 1180, 0.98, pearl],
      [2350, 1220, 1.08, lavender],
      [2440, 1190, 0.9, blush],
      [1995, 1285, 0.92, violet],
      [2085, 1320, 1.12, pearl],
      [2185, 1275, 0.84, blush],
      [2280, 1325, 1.2, lavender],
      [2385, 1288, 0.96, sky],
      [2475, 1340, 1.08, violet],
      [1950, 1390, 1.06, sky],
      [2050, 1370, 0.9, lavender],
      [2140, 1425, 1.16, blush],
      [2240, 1385, 0.88, pearl],
      [2345, 1435, 1.06, violet],
      [2450, 1400, 0.96, lavender],
      [2030, 1490, 0.9, pearl],
      [2125, 1515, 1.08, sky],
      [2225, 1480, 0.96, lavender],
      [2325, 1525, 1.12, blush],
      [2425, 1495, 0.9, violet],
      [2490, 1535, 0.82, pearl],
    ] as const;

    for (const [x, y, scale, colour] of flowers) {
      this.addMoonflower(x, y, scale, colour);
    }

    // The reviewed far-right blue bloom is drawn as one ordered blossom so its centre can never
    // sort beneath a petal. The overlapping lower-right pink bloom is intentionally absent.
    this.addOrderedMoonflower(2520, 1245, 1, sky);
  }

  private createEntranceStructures(): void {
    for (const entrance of MOONFLOWER_GLADE_MAP.entrances) {
      const archWidth = entrance.direction === 'east' ? 150 : 190;
      const archHeight = 170;
      const x = entrance.position.x;
      const y = entrance.position.y;

      this.add.rectangle(x - archWidth / 2, y, 26, archHeight, 0xb69a78, 0.95).setDepth(8);
      this.add.rectangle(x + archWidth / 2, y, 26, archHeight, 0xb69a78, 0.95).setDepth(8);
      this.add.ellipse(x, y - archHeight / 2, archWidth + 28, 64, 0xc9b08c, 0.95).setDepth(8);
    }
  }

  private createBoundaryFoliage(): void {
    const treePositions = [
      [430, 150],
      [820, 80],
      [1180, 80],
      [1640, 150],
      [1980, 150],
      [2520, 170],
      [2660, 330],
      [2500, 1560],
      [2280, 1650],
      [1570, 1670],
      [1120, 1650],
      [620, 1630],
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
    this.add.rectangle(1110, 1092, 9, 86, 0x5d9b68, 1).setDepth(8);

    const petalOffsets = [
      [0, -34],
      [35, -6],
      [25, 28],
      [-25, 28],
      [-35, -6],
    ] as const;

    for (const [offsetX, offsetY] of petalOffsets) {
      this.add
        .ellipse(1110 + offsetX * 0.72, 1045 + offsetY * 0.72, 42, 56, 0xdca7ff, 0.96)
        .setDepth(32);
    }

    this.add.circle(1110, 1045, 18, 0xffe5a2, 1).setDepth(33);
  }

  private addMoonflower(x: number, y: number, scale: number, petalColour: number): void {
    const baseDepth = worldDepthForY(y + 52 * scale, 0.08);

    this.add
      .ellipse(x, y + 51 * scale, 54 * scale, 14 * scale, 0x4d8358, 0.16)
      .setDepth(baseDepth - 0.34);
    this.add
      .rectangle(x, y + 25 * scale, 7 * scale, 58 * scale, 0x5f9b67, 0.95)
      .setDepth(baseDepth - 0.22);
    this.add
      .ellipse(x - 10 * scale, y + 31 * scale, 20 * scale, 9 * scale, 0x72a970, 0.84)
      .setAngle(-28)
      .setDepth(baseDepth - 0.18);
    this.add
      .ellipse(x + 10 * scale, y + 38 * scale, 18 * scale, 8 * scale, 0x6ca56d, 0.8)
      .setAngle(28)
      .setDepth(baseDepth - 0.17);

    const petalOffsets = [
      [0, -18],
      [18, -5],
      [12, 14],
      [-12, 14],
      [-18, -5],
    ] as const;

    for (const [offsetX, offsetY] of petalOffsets) {
      this.add
        .ellipse(
          x + offsetX * scale,
          y + offsetY * scale,
          28 * scale,
          38 * scale,
          petalColour,
          0.94,
        )
        .setDepth(baseDepth);
    }

    this.add.circle(x, y, 12 * scale, 0xffdca1, 1).setDepth(baseDepth + 0.04);
  }

  private addOrderedMoonflower(x: number, y: number, scale: number, petalColour: number): void {
    const baseDepth = worldDepthForY(y + 52 * scale, 0.08);
    const groundParts: Phaser.GameObjects.GameObject[] = [
      this.add.ellipse(0, 51 * scale, 54 * scale, 14 * scale, 0x4d8358, 0.16),
      this.add.rectangle(0, 25 * scale, 7 * scale, 58 * scale, 0x5f9b67, 0.95),
      this.add.ellipse(-10 * scale, 31 * scale, 20 * scale, 9 * scale, 0x72a970, 0.84).setAngle(-28),
      this.add.ellipse(10 * scale, 38 * scale, 18 * scale, 8 * scale, 0x6ca56d, 0.8).setAngle(28),
    ];
    this.add.container(x, y, groundParts).setDepth(baseDepth - 0.2);

    const blossom = this.add.graphics();
    blossom.fillStyle(petalColour, 0.96);
    for (const [offsetX, offsetY] of [
      [0, -18],
      [18, -5],
      [12, 14],
      [-12, 14],
      [-18, -5],
    ] as const) {
      blossom.fillEllipse(offsetX * scale, offsetY * scale, 28 * scale, 38 * scale);
    }
    blossom.fillStyle(0xffdca1, 1);
    blossom.fillCircle(0, 0, 12 * scale);
    this.add.container(x, y, [blossom]).setDepth(baseDepth + 0.16);
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
}
