import Phaser from 'phaser';
import {
  BROOK_CRYSTAL_DISCOVERY_ID,
  CRYSTAL_BROOK_REGION_DISCOVERY_ID,
  PRISM_GROTTO_DISCOVERY_ID,
  SINGING_SHELL_DISCOVERY_ID,
} from '../../content/r5CrystalBrook';
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
import {
  CRYSTAL_BROOK_LOCATION_ID,
  CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE,
  CRYSTAL_BROOK_ICE_BRIDGES,
  CRYSTAL_BROOK_MAP,
  CRYSTAL_BROOK_MEADOW_GORGE,
  CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS,
  CRYSTAL_BROOK_REFLECTION_FEEDER,
  CRYSTAL_BROOK_REFLECTION_POOL,
  CRYSTAL_BROOK_UPSTREAM_CASCADE,
  CRYSTAL_BROOK_WATER_GLINTS,
  CRYSTAL_BROOK_WATERCOURSE,
  type CrystalBrookWatercoursePoint,
} from '../world/CrystalBrookMap';
import { worldDepthForY } from '../world/WorldDepth';

const COLLISION_TEXTURE_KEY = 'crystal-brook-collision-pixel';
const PLAYER_TEXTURE_KEY = 'player-unicorn-crystal-brook';
const BROOK_VISITED_FLAG = 'flag:visited-crystal-brook';

type WaterWidthKey = 'outerWidth' | 'innerWidth' | 'deepWidth';

function buildRibbonPolygon(
  points: readonly { x: number; y: number }[],
  halfWidthAt: (index: number) => number,
): Phaser.Math.Vector2[] {
  const left: Phaser.Math.Vector2[] = [];
  const right: Phaser.Math.Vector2[] = [];

  for (let index = 0; index < points.length; index += 1) {
    const previous = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = -dy / length;
    const normalY = dx / length;
    const halfWidth = halfWidthAt(index);
    const point = points[index];

    left.push(
      new Phaser.Math.Vector2(point.x + normalX * halfWidth, point.y + normalY * halfWidth),
    );
    right.push(
      new Phaser.Math.Vector2(point.x - normalX * halfWidth, point.y - normalY * halfWidth),
    );
  }

  return [...left, ...right.reverse()];
}

function fillVariableRibbon(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly CrystalBrookWatercoursePoint[],
  widthKey: WaterWidthKey,
  colour: number,
  alpha: number,
): void {
  graphics.fillStyle(colour, alpha);
  graphics.fillPoints(
    buildRibbonPolygon(points, (index) => points[index][widthKey] / 2),
    true,
  );
}

function fillConstantRibbon(
  graphics: Phaser.GameObjects.Graphics,
  points: readonly { x: number; y: number }[],
  width: number,
  colour: number,
  alpha: number,
): void {
  graphics.fillStyle(colour, alpha);
  graphics.fillPoints(
    buildRibbonPolygon(points, () => width / 2),
    true,
  );
}

function smoothPoints(
  points: readonly { x: number; y: number }[],
  samplesPerSpan = 6,
): { x: number; y: number }[] {
  if (points.length < 3) {
    return points.map(({ x, y }) => ({ x, y }));
  }

  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const sampleCount = Math.max(points.length, (points.length - 1) * samplesPerSpan + 1);

  return Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    return {
      x: Phaser.Math.Interpolation.CatmullRom(xs, t),
      y: Phaser.Math.Interpolation.CatmullRom(ys, t),
    };
  });
}

function smoothWatercourse(
  points: readonly CrystalBrookWatercoursePoint[],
): CrystalBrookWatercoursePoint[] {
  if (points.length < 3) {
    return points.map((point) => ({ ...point }));
  }

  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const outerWidths = points.map(({ outerWidth }) => outerWidth);
  const innerWidths = points.map(({ innerWidth }) => innerWidth);
  const deepWidths = points.map(({ deepWidth }) => deepWidth);
  const sampleCount = (points.length - 1) * 5 + 1;

  return Array.from({ length: sampleCount }, (_, index) => {
    const t = index / (sampleCount - 1);
    return {
      x: Phaser.Math.Interpolation.CatmullRom(xs, t),
      y: Phaser.Math.Interpolation.CatmullRom(ys, t),
      outerWidth: Math.max(1, Phaser.Math.Interpolation.CatmullRom(outerWidths, t)),
      innerWidth: Math.max(1, Phaser.Math.Interpolation.CatmullRom(innerWidths, t)),
      deepWidth: Math.max(1, Phaser.Math.Interpolation.CatmullRom(deepWidths, t)),
    };
  });
}

export class CrystalBrookScene extends Phaser.Scene {
  private readonly audio = getVerticalSliceAudio();
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private discoveryService: DiscoveryService | null = null;
  private inventoryService: InventoryService | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private readonly treasureObjects = new Map<string, Phaser.GameObjects.Container>();
  private secretMarker: Phaser.GameObjects.Container | null = null;

  public constructor() {
    super('CrystalBrookScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, CRYSTAL_BROOK_LOCATION_ID);
    this.discoveryService = new DiscoveryService(saveService);
    this.inventoryService = new InventoryService(saveService);

    const firstVisit = !this.discoveryService.hasDiscovery(CRYSTAL_BROOK_REGION_DISCOVERY_ID);
    if (firstVisit) {
      this.discoveryService.unlockDiscovery(CRYSTAL_BROOK_REGION_DISCOVERY_ID, BROOK_VISITED_FLAG);
    }

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, PLAYER_TEXTURE_KEY, appearance);

    const map = CRYSTAL_BROOK_MAP;
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

    this.createTreasurePickups();
    this.createSecretMarker();

    this.cameras.main.setBackgroundColor('#8fd8ce');
    this.cameras.main.setBounds(0, 0, map.width, map.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.11, 0.11);
    this.cameras.main.setDeadzone(260, 150);
    this.createHud();

    this.audio.enterScene(this.scene.key);
    this.input.once('pointerdown', () => void this.audio.unlock());
    this.input.keyboard?.once('keydown', () => void this.audio.unlock());

    if (firstVisit) {
      this.showFeedback('New place discovered!\nCrystal Brook 💎💧');
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
      this.inventoryService = null;
      for (const treasure of this.treasureObjects.values()) {
        treasure.destroy(true);
      }
      this.treasureObjects.clear();
      this.secretMarker?.destroy(true);
      this.secretMarker = null;
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

    this.tryCollectTreasure();
    this.tryDiscoverSecretRoute();
  }

  private tryCollectTreasure(): void {
    if (!this.player || !this.discoveryService || !this.inventoryService) {
      return;
    }

    for (const spot of CRYSTAL_BROOK_MAP.collectableSpots) {
      const object = this.treasureObjects.get(spot.id);
      if (!object) {
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

      this.inventoryService.addItem(spot.itemId, 1);
      this.discoveryService.unlockDiscovery(spot.discoveryId);
      const saveService = getBrowserSaveService();
      const save = saveService.load() ?? saveService.createNewGame();
      saveService.save({
        ...save,
        world: {
          ...save.world,
          flags: { ...save.world.flags, [spot.flagId]: true },
        },
      });
      object.destroy(true);
      this.treasureObjects.delete(spot.id);
      this.audio.playSfx('collect');
      this.cameras.main.flash(160, 226, 255, 242, false);
      this.showFeedback(`Found ${spot.label}! ✨`);
      break;
    }
  }

  private tryDiscoverSecretRoute(): void {
    if (!this.player || !this.discoveryService || !this.secretMarker) {
      return;
    }
    const route = CRYSTAL_BROOK_MAP.secretRoutes[0];
    const distance = Phaser.Math.Distance.Between(
      this.player.sprite.x,
      this.player.sprite.y,
      route.position.x,
      route.position.y,
    );
    if (distance > route.discoveryRadius) {
      return;
    }

    this.discoveryService.unlockDiscovery(route.discoveryId);
    this.secretMarker.destroy(true);
    this.secretMarker = null;
    this.audio.playSfx('discovery');
    this.cameras.main.flash(260, 255, 239, 176, false);
    this.showFeedback('Secret place discovered!\nPrism Grotto 🌈');
  }

  private createTreasurePickups(): void {
    const save = getBrowserSaveService().load();
    for (const spot of CRYSTAL_BROOK_MAP.collectableSpots) {
      if (save?.world.flags[spot.flagId] === true) {
        continue;
      }

      const crystal = spot.discoveryId === BROOK_CRYSTAL_DISCOVERY_ID;
      const icon = this.add
        .text(0, 0, crystal ? '💎' : '🐚', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: crystal ? '44px' : '42px',
        })
        .setOrigin(0.5);
      const glow = this.add.circle(0, 5, 46, crystal ? 0x9fe8ff : 0xffe7b5, 0.2);
      const sparkle = this.add
        .text(28, -34, '✦', {
          color: '#fff8c2',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      const container = this.add
        .container(spot.position.x, spot.position.y, [glow, icon, sparkle])
        .setDepth(worldDepthForY(spot.position.y, 0.35));
      this.tweens.add({
        targets: container,
        y: spot.position.y - 9,
        scale: 1.06,
        duration: 950,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
      this.treasureObjects.set(spot.id, container);
    }
  }

  private createSecretMarker(): void {
    if (this.discoveryService?.hasDiscovery(PRISM_GROTTO_DISCOVERY_ID)) {
      return;
    }
    const route = CRYSTAL_BROOK_MAP.secretRoutes[0];
    const glow = this.add.circle(0, 0, 62, 0xf7d6ff, 0.14);
    const sparkle = this.add
      .text(0, 0, '✦', {
        color: '#fff2aa',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.secretMarker = this.add
      .container(route.position.x, route.position.y, [glow, sparkle])
      .setDepth(worldDepthForY(route.position.y, 0.3));
    this.tweens.add({
      targets: [glow, sparkle],
      alpha: { from: 0.28, to: 1 },
      scale: { from: 0.88, to: 1.18 },
      duration: 1150,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createEnvironment(): void {
    const map = CRYSTAL_BROOK_MAP;
    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xa8e0bd).setDepth(0);
    this.add.circle(760, 510, 610, 0xc8edbf, 0.48).setDepth(1);
    this.add.circle(1950, 1560, 730, 0x91d1ab, 0.28).setDepth(1);
    this.add.circle(3050, 740, 650, 0xbde7c1, 0.38).setDepth(1);

    const pathNetwork = this.add.graphics().setName('crystal-brook:main-path').setDepth(2.86);

    const drawSegments = (
      segments: readonly (readonly { x: number; y: number }[])[],
      width: number,
      colour: number,
    ): void => {
      pathNetwork.lineStyle(width, colour, 1);
      pathNetwork.fillStyle(colour, 1);
      for (const segment of segments) {
        const first = segment[0];
        if (!first) {
          continue;
        }
        const smoothedSegment = smoothPoints(segment);
        pathNetwork.beginPath();
        pathNetwork.moveTo(smoothedSegment[0].x, smoothedSegment[0].y);
        for (const point of smoothedSegment.slice(1)) {
          pathNetwork.lineTo(point.x, point.y);
        }
        pathNetwork.strokePath();
        for (const point of segment) {
          pathNetwork.fillCircle(point.x, point.y, width / 2);
        }
      }
    };

    // Paint every outer edge first, then every inner surface. This makes the Crystal Cup
    // branch a genuine joined path rather than laying its darker outer band over the main trail.
    drawSegments(CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS, 128, 0xd7c18f);
    drawSegments([CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE], 82, 0xd7c18f);
    drawSegments(CRYSTAL_BROOK_PATH_PRESENTATION_SEGMENTS, 108, 0xf0dfb2);
    drawSegments([CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE], 64, 0xf0dfb2);

    this.add
      .zone(
        CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE[0].x,
        CRYSTAL_BROOK_CRYSTAL_CUP_PRESENTATION_ROUTE[0].y,
        2,
        2,
      )
      .setName('crystal-brook:crystal-cup-spur');

    this.createWater();
    this.createMeadowGorge();
    this.createIceBridges();
    this.createSteppingStones();
    this.createSecretTrail();
    this.createBanks();
    this.createNpcVisitPoints();
    this.createAmbientSparkles();
  }

  private createWater(): void {
    const watercourse = smoothWatercourse(CRYSTAL_BROOK_WATERCOURSE);
    const outerWater = this.add.graphics().setName('crystal-brook:watercourse-outer').setDepth(3);
    fillVariableRibbon(outerWater, watercourse, 'outerWidth', 0x579da4, 0.58);

    const innerWater = this.add
      .graphics()
      .setName('crystal-brook:watercourse-inner')
      .setDepth(3.03);
    fillVariableRibbon(innerWater, watercourse, 'innerWidth', 0x78cbd0, 0.86);

    const deepChannel = this.add
      .graphics()
      .setName('crystal-brook:watercourse-deep')
      .setDepth(3.06);
    fillVariableRibbon(deepChannel, watercourse, 'deepWidth', 0x438f9d, 0.58);

    const reflectionFeeder = this.add
      .graphics()
      .setName('crystal-brook:reflection-feeder')
      .setDepth(3.01);
    fillConstantRibbon(
      reflectionFeeder,
      CRYSTAL_BROOK_REFLECTION_FEEDER.points,
      CRYSTAL_BROOK_REFLECTION_FEEDER.outerWidth,
      0x579da4,
      0.42,
    );
    fillConstantRibbon(
      reflectionFeeder,
      CRYSTAL_BROOK_REFLECTION_FEEDER.points,
      CRYSTAL_BROOK_REFLECTION_FEEDER.innerWidth,
      0x78cbd0,
      0.72,
    );

    this.add
      .ellipse(
        CRYSTAL_BROOK_REFLECTION_POOL.x,
        CRYSTAL_BROOK_REFLECTION_POOL.y,
        292,
        138,
        0x579da4,
        0.62,
      )
      .setName('crystal-brook:reflection-pool-outer')
      .setDepth(3);
    this.add
      .ellipse(
        CRYSTAL_BROOK_REFLECTION_POOL.x,
        CRYSTAL_BROOK_REFLECTION_POOL.y,
        232,
        102,
        0x78cbd0,
        0.86,
      )
      .setName('crystal-brook:reflection-pool-inner')
      .setDepth(3.03);
    this.add
      .ellipse(
        CRYSTAL_BROOK_REFLECTION_POOL.x,
        CRYSTAL_BROOK_REFLECTION_POOL.y,
        118,
        48,
        0x438f9d,
        0.56,
      )
      .setName('crystal-brook:reflection-pool-deep')
      .setDepth(3.06);

    const cascade = this.add.graphics().setName('crystal-brook:upstream-cascade').setDepth(3.08);
    const cascadeX = CRYSTAL_BROOK_UPSTREAM_CASCADE.x;
    const cascadeY = CRYSTAL_BROOK_UPSTREAM_CASCADE.y;
    cascade.fillStyle(0x78cbd0, 0.72);
    cascade.fillPoints(
      [
        new Phaser.Math.Vector2(cascadeX - 62, cascadeY - 86),
        new Phaser.Math.Vector2(cascadeX + 64, cascadeY - 92),
        new Phaser.Math.Vector2(cascadeX + 52, cascadeY + 72),
        new Phaser.Math.Vector2(cascadeX - 50, cascadeY + 80),
      ],
      true,
    );
    cascade.fillStyle(0xcdf5f1, 0.34);
    for (const offset of [-34, -8, 20, 44]) {
      cascade.fillRoundedRect(
        cascadeX + offset - 6,
        cascadeY - 74 + Math.abs(offset) * 0.14,
        12,
        132 - Math.abs(offset) * 0.28,
        6,
      );
    }
    cascade.fillStyle(0xe9ffff, 0.34);
    cascade.fillEllipse(cascadeX, cascadeY + 82, 150, 34);

    const glints = this.add.graphics().setName('crystal-brook:water-glints').setDepth(3.12);
    glints.lineStyle(5, 0xeaffff, 0.34);
    for (const glint of CRYSTAL_BROOK_WATER_GLINTS) {
      const radians = Phaser.Math.DegToRad(glint.angle);
      const dx = Math.cos(radians) * (glint.width / 2);
      const dy = Math.sin(radians) * (glint.width / 2);
      glints.beginPath();
      glints.moveTo(glint.x - dx, glint.y - dy);
      glints.lineTo(glint.x + dx, glint.y + dy);
      glints.strokePath();
    }
  }

  private createMeadowGorge(): void {
    const gorge = CRYSTAL_BROOK_MEADOW_GORGE;

    const recess = this.add.graphics().setName('crystal-brook:meadow-gorge:recess').setDepth(2.72);
    recess.fillStyle(0x263b3e, 0.97);
    recess.fillPoints(
      [
        new Phaser.Math.Vector2(-70, gorge.recess.y - 190),
        new Phaser.Math.Vector2(gorge.recess.x + 70, gorge.recess.y - 210),
        new Phaser.Math.Vector2(gorge.recess.x + 128, gorge.recess.y - 108),
        new Phaser.Math.Vector2(gorge.recess.x + 114, gorge.recess.y + 116),
        new Phaser.Math.Vector2(gorge.recess.x + 48, gorge.recess.y + 220),
        new Phaser.Math.Vector2(-70, gorge.recess.y + 206),
      ],
      true,
    );

    const recessDepth = this.add
      .graphics()
      .setName('crystal-brook:meadow-gorge:recess-depth')
      .setDepth(2.74);
    recessDepth.fillStyle(0x172b30, 0.98);
    recessDepth.fillPoints(
      [
        new Phaser.Math.Vector2(-80, gorge.recess.y - 142),
        new Phaser.Math.Vector2(gorge.recess.x + 34, gorge.recess.y - 150),
        new Phaser.Math.Vector2(gorge.recess.x + 76, gorge.recess.y - 74),
        new Phaser.Math.Vector2(gorge.recess.x + 70, gorge.recess.y + 96),
        new Phaser.Math.Vector2(gorge.recess.x + 18, gorge.recess.y + 158),
        new Phaser.Math.Vector2(-80, gorge.recess.y + 150),
      ],
      true,
    );

    const pathFloor = this.add
      .graphics()
      .setName('crystal-brook:meadow-gorge:path-floor')
      .setDepth(2.84);
    const drawPathFloor = (width: number, colour: number): void => {
      pathFloor.lineStyle(width, colour, 1);
      pathFloor.fillStyle(colour, 1);
      pathFloor.beginPath();
      pathFloor.moveTo(gorge.pathFloor[0].x, gorge.pathFloor[0].y);
      for (const point of gorge.pathFloor.slice(1)) {
        pathFloor.lineTo(point.x, point.y);
      }
      pathFloor.strokePath();
      for (const point of gorge.pathFloor) {
        pathFloor.fillCircle(point.x, point.y, width / 2);
      }
    };
    drawPathFloor(128, 0xd7c18f);
    drawPathFloor(108, 0xf0dfb2);

    this.add
      .ellipse(
        gorge.waterThroat.centre.x - 18,
        gorge.waterThroat.centre.y,
        gorge.waterThroat.width,
        gorge.waterThroat.height,
        0x1e4b56,
        0.68,
      )
      .setName('crystal-brook:meadow-gorge:water-throat')
      .setDepth(3.07);

    const throatFoam = this.add
      .graphics()
      .setName('crystal-brook:meadow-gorge:water-foam')
      .setDepth(3.13);
    throatFoam.lineStyle(5, 0xeaffff, 0.44);
    throatFoam.beginPath();
    throatFoam.moveTo(gorge.waterOpening.x - 68, gorge.waterOpening.y + 4);
    throatFoam.lineTo(gorge.waterOpening.x + 54, gorge.waterOpening.y - 4);
    throatFoam.strokePath();

    const rocks = this.add
      .container(0, 0)
      .setName('crystal-brook:meadow-gorge:rocks')
      .setDepth(3.22);

    for (const [index, rock] of gorge.rockFaces.entries()) {
      const halfWidth = rock.width / 2;
      const halfHeight = rock.height / 2;
      const body = this.add
        .polygon(
          rock.x,
          rock.y,
          [
            -halfWidth * 0.96,
            halfHeight * 0.18,
            -halfWidth * 0.78,
            -halfHeight * 0.56,
            -halfWidth * 0.28,
            -halfHeight * 0.96,
            halfWidth * 0.42,
            -halfHeight * 0.76,
            halfWidth * 0.94,
            -halfHeight * 0.18,
            halfWidth * 0.76,
            halfHeight * 0.62,
            halfWidth * 0.12,
            halfHeight * 0.92,
            -halfWidth * 0.62,
            halfHeight * 0.7,
          ],
          rock.colour,
          1,
        )
        .setStrokeStyle(4, 0x455b59, 0.88)
        .setAngle(rock.angle);

      const highlight = this.add
        .ellipse(
          rock.x - rock.width * 0.08,
          rock.y - rock.height * 0.2,
          rock.width * 0.58,
          rock.height * 0.28,
          0x91a49c,
          index % 2 === 0 ? 0.26 : 0.2,
        )
        .setAngle(rock.angle - 4);

      rocks.add([body, highlight]);
    }

    for (const crystal of gorge.crystals) {
      rocks.add(
        this.add
          .triangle(
            crystal.x,
            crystal.y,
            0,
            50 * crystal.scale,
            18 * crystal.scale,
            0,
            36 * crystal.scale,
            50 * crystal.scale,
            crystal.colour,
            0.88,
          )
          .setStrokeStyle(2, 0xf3ffff, 0.72),
      );
    }

    for (const [index, mist] of gorge.mist.entries()) {
      const plume = this.add
        .ellipse(mist.x, mist.y, mist.width, mist.height, 0xeaffff, 0.18)
        .setName(`crystal-brook:meadow-gorge:mist:${index}`)
        .setDepth(3.15);
      this.tweens.add({
        targets: plume,
        alpha: { from: 0.12, to: 0.28 },
        scaleX: { from: 0.94, to: 1.08 },
        duration: 1200 + index * 180,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    const sign = gorge.sign;
    const signContainer = this.add
      .container(sign.x, sign.y)
      .setName('crystal-brook:meadow-gorge:rainbow-meadow-sign')
      .setAngle(sign.angle)
      .setDepth(worldDepthForY(sign.y, 0.42));

    signContainer.add([
      this.add
        .polygon(
          0,
          0,
          [-94, -38, -66, -54, 54, -48, 96, -20, 82, 36, 20, 50, -70, 42, -100, 10],
          0x71847f,
          1,
        )
        .setStrokeStyle(4, 0x4d625f, 0.94),
      this.add
        .polygon(
          -22,
          -8,
          [-62, -18, -46, -32, 38, -30, 58, -10, 44, 18, -34, 22],
          0x91a7a0,
          0.36,
        )
        .setStrokeStyle(2, 0xc6d9d2, 0.28),
      this.add
        .text(0, 2, sign.label, {
          color: '#29413f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          align: 'center',
          stroke: '#b9cbc5',
          strokeThickness: 1,
        })
        .setOrigin(0.5),
      this.add
        .triangle(76, -42, 0, 34, 13, 0, 26, 34, 0xa9edf2, 0.9)
        .setStrokeStyle(2, 0xf2ffff, 0.76),
      this.add
        .triangle(88, -26, 0, 24, 9, 0, 18, 24, 0xc9bbef, 0.86)
        .setStrokeStyle(2, 0xf5f0ff, 0.72),
    ]);

    this.add
      .zone(gorge.waterOpening.x, gorge.waterOpening.y, 2, 2)
      .setName('crystal-brook:meadow-gorge:water-opening');
    this.add
      .zone(gorge.pathOpening.x, gorge.pathOpening.y, 2, 2)
      .setName('crystal-brook:meadow-gorge:path-opening');
  }

  private createIceBridges(): void {
    for (const bridge of CRYSTAL_BROOK_ICE_BRIDGES) {
      const container = this.add
        .container(bridge.centre.x, bridge.centre.y)
        .setName(`crystal-brook:ice-bridge:${bridge.id}`)
        .setAngle(bridge.angle)
        .setDepth(3.5);

      const shadow = this.add
        .ellipse(8, 10, bridge.length + 26, bridge.deckWidth + 22, 0x31566a, 0.16)
        .setOrigin(0.5);
      const deck = this.add.graphics();
      deck.fillStyle(0xa8e7f1, 0.78);
      deck.fillRoundedRect(
        -bridge.length / 2,
        -bridge.deckWidth / 2,
        bridge.length,
        bridge.deckWidth,
        bridge.deckWidth / 2,
      );
      deck.lineStyle(4, 0xedffff, 0.9);
      deck.strokeRoundedRect(
        -bridge.length / 2,
        -bridge.deckWidth / 2,
        bridge.length,
        bridge.deckWidth,
        bridge.deckWidth / 2,
      );
      deck.fillStyle(0xe8ffff, 0.32);
      deck.fillRoundedRect(
        -bridge.length / 2 + 18,
        -bridge.deckWidth * 0.22,
        bridge.length - 36,
        bridge.deckWidth * 0.44,
        bridge.deckWidth * 0.22,
      );

      container.add([shadow, deck]);

      const facetCount = 7;
      const facetSpacing = (bridge.length - 46) / facetCount;
      for (let index = 0; index < facetCount; index += 1) {
        const x = -bridge.length / 2 + 23 + facetSpacing * (index + 0.5);
        const facetWidth = facetSpacing * 0.9;
        container.add(
          this.add
            .polygon(
              x,
              index % 2 === 0 ? -4 : 4,
              [
                -facetWidth / 2,
                0,
                -facetWidth * 0.16,
                -bridge.deckWidth * 0.38,
                facetWidth / 2,
                -bridge.deckWidth * 0.14,
                facetWidth * 0.2,
                bridge.deckWidth * 0.34,
              ],
              index % 2 === 0 ? 0xc9f5fa : 0x9fdce9,
              0.34,
            )
            .setStrokeStyle(1, 0xf6ffff, 0.24),
        );
      }

      for (const side of [-1, 1] as const) {
        const railY = side * (bridge.deckWidth / 2 + 11);
        const rail = this.add.graphics();
        rail.lineStyle(5, 0xb7edf5, 0.92);
        rail.beginPath();
        rail.moveTo(-bridge.length / 2 + 12, railY);
        rail.lineTo(bridge.length / 2 - 12, railY);
        rail.strokePath();

        rail.lineStyle(2, 0xeaffff, 0.72);
        const postXs: number[] = [];
        for (let x = -bridge.length / 2 + 26; x <= bridge.length / 2 - 20; x += 52) {
          postXs.push(x);
        }
        for (let index = 0; index < postXs.length - 1; index += 1) {
          const x1 = postXs[index];
          const x2 = postXs[index + 1];
          const braceOffset = side * 14;
          rail.beginPath();
          rail.moveTo(x1, railY);
          rail.lineTo((x1 + x2) / 2, railY + braceOffset);
          rail.lineTo(x2, railY);
          rail.strokePath();
        }
        container.add(rail);

        for (const [index, x] of postXs.entries()) {
          const crystalHeight = index % 3 === 0 ? 42 : index % 2 === 0 ? 31 : 25;
          container.add(
            this.add
              .triangle(
                x,
                railY,
                0,
                crystalHeight,
                12,
                0,
                24,
                crystalHeight,
                index % 3 === 0 ? 0xa9edf4 : 0xc8bcf0,
                0.92,
              )
              .setStrokeStyle(2, 0xf7ffff, 0.82)
              .setAngle(side < 0 ? 180 : 0),
          );
        }
      }

      container.add(
        this.add
          .rectangle(0, -bridge.deckWidth * 0.12, bridge.length - 54, 4, 0xffffff, 0.34)
          .setAngle(-1),
      );
    }
  }

  private createSteppingStones(): void {
    for (const [index, point] of CRYSTAL_BROOK_MAP.steppingStones.entries()) {
      this.add
        .ellipse(point.x, point.y, 92, 50, index % 2 === 0 ? 0xa8a8a0 : 0xb8b4a7, 1)
        .setStrokeStyle(4, 0x81877d, 0.8)
        .setDepth(worldDepthForY(point.y, 0.1));
      this.add
        .circle(point.x - 20, point.y - 5, 7, 0xe7f0dc, 0.36)
        .setDepth(worldDepthForY(point.y, 0.12));
    }
  }

  private createSecretTrail(): void {
    const route = CRYSTAL_BROOK_MAP.secretRoutes[0];
    const path = this.add.graphics().setDepth(2);
    path.lineStyle(48, 0xd8c7a4, 0.52);
    path.beginPath();
    path.moveTo(route.trail[0].x, route.trail[0].y);
    for (const point of route.trail.slice(1)) {
      path.lineTo(point.x, point.y);
    }
    path.strokePath();

    for (const [index, point] of route.trail.entries()) {
      this.add
        .text(point.x, point.y - 24, index % 2 === 0 ? '·' : '✦', {
          color: '#f8e5ff',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 2 === 0 ? '26px' : '17px',
        })
        .setOrigin(0.5)
        .setAlpha(0.5)
        .setDepth(worldDepthForY(point.y, 0.2));
    }
  }

  private createBanks(): void {
    const clumps = [
      [520, 520],
      [700, 1700],
      [1670, 410],
      [1890, 1770],
      [2440, 510],
      [3170, 560],
      [3260, 1530],
    ] as const;
    for (const [x, y] of clumps) {
      const depth = worldDepthForY(y, 0.15);
      this.add.ellipse(x, y, 180, 100, 0x6eaa76, 0.86).setDepth(depth);
      this.add.ellipse(x + 70, y + 10, 150, 90, 0x7eba7d, 0.82).setDepth(depth);
      for (let offset = -50; offset <= 50; offset += 25) {
        this.add
          .rectangle(x + offset, y - 70, 7, 54, 0x579064, 0.85)
          .setAngle(offset / 8)
          .setDepth(depth + 0.1);
      }
    }
  }

  private createNpcVisitPoints(): void {
    for (const point of CRYSTAL_BROOK_MAP.npcVisitPoints) {
      this.add.circle(point.position.x, point.position.y, 26, 0xf7e8bd, 0.26).setDepth(5);
      this.add
        .text(point.position.x, point.position.y - 34, '✧', {
          color: '#fff4bd',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '23px',
        })
        .setOrigin(0.5)
        .setAlpha(0.55)
        .setDepth(6);
    }
  }

  private createAmbientSparkles(): void {
    const positions = [
      [820, 820],
      [1120, 410],
      [1580, 890],
      [2050, 720],
      [2390, 1510],
      [3020, 920],
      [3200, 1760],
    ] as const;
    for (const [index, [x, y]] of positions.entries()) {
      const sparkle = this.add
        .text(x, y, index % 3 === 0 ? '✦' : '·', {
          color: index % 2 === 0 ? '#e8ffff' : '#fff3ba',
          fontFamily: 'system-ui, sans-serif',
          fontSize: index % 3 === 0 ? '18px' : '30px',
        })
        .setOrigin(0.5)
        .setAlpha(0.4)
        .setDepth(worldDepthForY(y, -0.1));
      this.tweens.add({
        targets: sparkle,
        alpha: { from: 0.22, to: 0.78 },
        y: y - 12,
        duration: 1150 + index * 110,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const group = this.physics.add.staticGroup();
    for (const collider of CRYSTAL_BROOK_MAP.colliders) {
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
      .text(GAME_WIDTH / 2, 24, 'Crystal Brook', {
        color: '#47606b',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        backgroundColor: '#effff3f2',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);

    this.add
      .text(
        GAME_WIDTH / 2,
        72,
        'Follow the water, hop between stones, and look for little treasures.',
        {
          color: '#587077',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          backgroundColor: '#f5fff2df',
          padding: { x: 12, y: 6 },
        },
      )
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(114);

    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 120, '', {
        color: '#4c5b69',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#f5fff2ee',
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

export const CRYSTAL_BROOK_DISCOVERY_IDS: readonly DiscoveryId[] = [
  CRYSTAL_BROOK_REGION_DISCOVERY_ID,
  BROOK_CRYSTAL_DISCOVERY_ID,
  SINGING_SHELL_DISCOVERY_ID,
  PRISM_GROTTO_DISCOVERY_ID,
];
