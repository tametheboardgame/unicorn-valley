import Phaser from 'phaser';
import type { DiscoveryId } from '../../content/contentTypes';
import { GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import { saveLocationCheckpoint } from '../save/saveLocationCheckpoint';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { RAINBOW_MEADOW_LOCATION_ID, RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import {
  setSunbeamVillagePlayerSpawn,
  SUNBEAM_VILLAGE_LOCATION_ID,
  SUNBEAM_VILLAGE_MAP,
} from '../world/SunbeamVillageMap';
import { worldDepthForY } from '../world/WorldDepth';

const COLLISION_TEXTURE_KEY = 'rainbow-meadow-collision-pixel';
const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-rainbow-meadow';
const MEADOW_DISCOVERY_ID: DiscoveryId = 'discovery:rainbow-meadow';
const MEADOW_VISITED_FLAG = 'flag:visited-rainbow-meadow';

function entranceApproach(id: string): { x: number; y: number } {
  const entrance = RAINBOW_MEADOW_MAP.entrances.find((candidate) => candidate.id === id);
  if (!entrance) {
    throw new Error(`Rainbow Meadow interaction references missing entrance: ${id}`);
  }

  return entrance.approach;
}

function hubApproach(id: string): { x: number; y: number } {
  const feature = RAINBOW_MEADOW_MAP.hubFeatures.find((candidate) => candidate.id === id);
  if (!feature) {
    throw new Error(`Rainbow Meadow interaction references missing hub feature: ${id}`);
  }

  return feature.approach;
}

function npcPosition(id: string): { x: number; y: number } {
  const marker = RAINBOW_MEADOW_MAP.npcMarkers.find((candidate) => candidate.id === id);
  if (!marker) {
    throw new Error(`Rainbow Meadow interaction references missing NPC marker: ${id}`);
  }

  return marker.position;
}

const MEADOW_INTERACTIONS = [
  {
    id: 'interaction:meadow-village-gate',
    label: 'Sunbeam Village',
    actionLabel: 'Go to village',
    position: entranceApproach('sunbeam-village'),
    interactionRadius: 170,
    priority: 20,
    result: {
      type: 'scene-transition',
      sceneKey: 'SunbeamVillageScene',
    },
  },
  {
    id: 'interaction:meadow-nova',
    label: 'Nova',
    actionLabel: 'Talk',
    position: npcPosition('nova'),
    interactionRadius: 155,
    priority: 30,
    result: {
      type: 'scene-transition',
      sceneKey: 'NovaStoryScene',
      payload: { returnScene: 'RainbowMeadowScene' },
    },
  },
  {
    id: 'interaction:meadow-ribbon-board',
    label: 'Ribbon Board',
    actionLabel: 'Look',
    position: hubApproach('ribbon-board'),
    interactionRadius: 160,
    priority: 20,
    result: {
      type: 'message',
      title: 'Rainbow Run Ribbon Board',
      message:
        'The polished board has hooks for Rainbow Run ribbons. Nova keeps the race names painted neatly beside them.',
    },
  },
  {
    id: 'interaction:meadow-race-entrance',
    label: 'Rainbow Run',
    actionLabel: 'Enter Rainbow Run',
    position: hubApproach('rainbow-run-entrance'),
    interactionRadius: 175,
    priority: 25,
    result: {
      type: 'scene-transition',
      sceneKey: 'RainbowRunEntryScene',
    },
  },
] satisfies readonly InteractionTarget[];

export class RainbowMeadowScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;
  private discoveryService: DiscoveryService | null = null;
  private readonly discoveryPickups = new Map<DiscoveryId, Phaser.GameObjects.Container>();

  public constructor() {
    super('RainbowMeadowScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, RAINBOW_MEADOW_LOCATION_ID);
    this.discoveryService = new DiscoveryService(saveService);
    const firstVisit = !this.discoveryService.hasDiscovery(MEADOW_DISCOVERY_ID);
    if (firstVisit) {
      this.discoveryService.unlockDiscovery(MEADOW_DISCOVERY_ID, MEADOW_VISITED_FLAG);
    }

    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, SAVED_PLAYER_TEXTURE_KEY, appearance);

    const map = RAINBOW_MEADOW_MAP;
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
    this.interactionPrompt = new InteractionPrompt(this, this.pointerInput);

    this.createDiscoveryPickups();

    const camera = this.cameras.main;
    camera.setBackgroundColor('#9fdf8e');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(260, 150);

    this.createHud();
    if (firstVisit) {
      this.showFeedback('New place discovered!\nRainbow Meadow 🌈');
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.feedbackTimer?.destroy();
      this.feedbackTimer = null;
      this.touchMovementPad?.destroy();
      this.touchMovementPad = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.interactionPrompt?.destroy();
      this.interactionPrompt = null;
      for (const pickup of this.discoveryPickups.values()) {
        pickup.destroy(true);
      }
      this.discoveryPickups.clear();
      this.discoveryService = null;
      this.player?.destroy();
      this.player = null;
      this.collisionGroup = null;
      this.activeInteraction = null;
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

    this.tryCollectDiscoveries();

    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      MEADOW_INTERACTIONS,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);

    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction);
    }
  }

  private activateInteraction(target: InteractionTarget): void {
    if (target.id === 'interaction:meadow-race-entrance') {
      return;
    }

    if (target.result.type === 'scene-transition') {
      if (target.result.sceneKey === 'SunbeamVillageScene') {
        const meadowEntrance = SUNBEAM_VILLAGE_MAP.entrances.find(
          (entrance) => entrance.id === 'rainbow-meadow',
        );
        if (meadowEntrance) {
          setSunbeamVillagePlayerSpawn(meadowEntrance.approach);
        }
        saveLocationCheckpoint(getBrowserSaveService(), SUNBEAM_VILLAGE_LOCATION_ID);
      }
      this.scene.start(target.result.sceneKey, target.result.payload);
      return;
    }

    if (target.result.type === 'message') {
      this.showFeedback(`${target.result.title}\n${target.result.message}`);
    }
  }

  private tryCollectDiscoveries(): void {
    if (!this.player || !this.discoveryService) {
      return;
    }

    for (const spot of RAINBOW_MEADOW_MAP.discoverySpots) {
      const pickup = this.discoveryPickups.get(spot.discoveryId);
      if (!pickup) {
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
      pickup.destroy(true);
      this.discoveryPickups.delete(spot.discoveryId);
      this.cameras.main.flash(180, 255, 244, 176, false);
      this.showFeedback(`New discovery!\n${spot.label} ✨`);
      break;
    }
  }

  private createDiscoveryPickups(): void {
    if (!this.discoveryService) {
      return;
    }

    for (const spot of RAINBOW_MEADOW_MAP.discoverySpots) {
      if (this.discoveryService.hasDiscovery(spot.discoveryId)) {
        continue;
      }

      const pickup =
        spot.id === 'prism-bloom'
          ? this.createPrismBloom(spot.position.x, spot.position.y)
          : this.createSunshowerFeather(spot.position.x, spot.position.y);
      this.discoveryPickups.set(spot.discoveryId, pickup);
    }
  }

  private createPrismBloom(x: number, y: number): Phaser.GameObjects.Container {
    const glow = this.add.circle(0, 0, 42, 0xfff5ad, 0.22);
    const stem = this.add.rectangle(0, 16, 5, 34, 0x5e9f64, 1);
    const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    const petals = colours.map((colour, index) => {
      const angle = (Math.PI * 2 * index) / colours.length - Math.PI / 2;
      return this.add.ellipse(Math.cos(angle) * 18, Math.sin(angle) * 18 - 7, 22, 34, colour, 0.98);
    });
    const centre = this.add.circle(0, -7, 10, 0xfff4b2, 1);
    const sparkle = this.add
      .text(0, -48, '✦', {
        color: '#fffbe0',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const container = this.add
      .container(x, y, [glow, stem, ...petals, centre, sparkle])
      .setDepth(worldDepthForY(y, 0.35));
    this.tweens.add({
      targets: container,
      scale: 1.1,
      angle: 3,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return container;
  }

  private createSunshowerFeather(x: number, y: number): Phaser.GameObjects.Container {
    const glow = this.add.circle(0, 0, 42, 0xffef9f, 0.2);
    const feather = this.add
      .text(0, -4, '🪶', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '46px',
      })
      .setOrigin(0.5)
      .setAngle(-20);
    const sparkle = this.add
      .text(23, -34, '✦', {
        color: '#fff8c7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const container = this.add
      .container(x, y, [glow, feather, sparkle])
      .setDepth(worldDepthForY(y, 0.35));
    this.tweens.add({
      targets: container,
      y: y - 9,
      angle: 5,
      duration: 980,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return container;
  }

  private showFeedback(message: string): void {
    this.feedbackTimer?.destroy();
    this.feedbackText?.setText(message).setVisible(true);
    this.feedbackTimer = this.time.delayedCall(4000, () => {
      this.feedbackText?.setVisible(false);
      this.feedbackTimer = null;
    });
  }

  private createEnvironment(): void {
    const map = RAINBOW_MEADOW_MAP;
    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0x9fdf8e).setDepth(0);
    this.add.circle(930, 720, 560, 0xb9eaa2, 0.55).setDepth(1);
    this.add.circle(1880, 1510, 620, 0x8ed585, 0.35).setDepth(1);
    this.add.circle(2790, 940, 650, 0xc7ec9e, 0.42).setDepth(1);

    this.createPaths();
    this.createPond();
    this.createGroves();
    this.createRaceHub();
    this.createNova();
    this.createEntranceMarker();
    this.createMeadowFlowers();
  }

  private createPaths(): void {
    const path = this.add.graphics().setDepth(2);
    path.lineStyle(138, 0xe7cf99, 0.95);
    path.beginPath();
    path.moveTo(100, 1050);
    path.lineTo(760, 1050);
    path.lineTo(1330, 1110);
    path.lineTo(1900, 1040);
    path.lineTo(2350, 1050);
    path.lineTo(3190, 1040);
    path.strokePath();

    path.lineStyle(90, 0xf5e6bc, 0.92);
    path.beginPath();
    path.moveTo(100, 1050);
    path.lineTo(760, 1050);
    path.lineTo(1330, 1110);
    path.lineTo(1900, 1040);
    path.lineTo(2350, 1050);
    path.lineTo(3190, 1040);
    path.strokePath();

    path.lineStyle(58, 0xf3e3b6, 0.82);
    path.beginPath();
    path.moveTo(1110, 1065);
    path.lineTo(1190, 610);
    path.strokePath();
    path.beginPath();
    path.moveTo(1800, 1050);
    path.lineTo(1850, 1610);
    path.strokePath();
    path.beginPath();
    path.moveTo(2500, 1060);
    path.lineTo(2510, 1260);
    path.strokePath();
  }

  private createPond(): void {
    this.add.ellipse(1570, 610, 500, 300, 0x67c8df, 0.96).setDepth(3);
    this.add.ellipse(1570, 610, 410, 225, 0x9ce6ea, 0.74).setDepth(4);
    for (const [x, y] of [
      [1430, 560],
      [1540, 660],
      [1680, 570],
    ] as const) {
      this.add.ellipse(x, y, 48, 24, 0x6fa76c, 0.95).setDepth(5);
      this.add.circle(x + 7, y - 3, 8, 0xffd5ef, 0.95).setDepth(6);
    }
  }

  private createGroves(): void {
    const trees = [
      [610, 420, 1.05],
      [735, 360, 1.15],
      [840, 455, 1],
      [880, 1640, 1.05],
      [1010, 1580, 1.15],
      [1135, 1690, 1],
      [275, 350, 0.95],
      [450, 1760, 1.05],
      [2060, 330, 1],
      [2180, 1780, 1.1],
    ] as const;

    for (const [x, y, scale] of trees) {
      this.createMeadowTree(x, y, scale);
    }
  }

  private createMeadowTree(x: number, y: number, scale: number): void {
    const trunk = this.add.rectangle(0, -48, 34, 96, 0x896349, 1);
    const left = this.add.circle(-38, -116, 68, 0x5e9d64, 1);
    const right = this.add.circle(42, -110, 76, 0x68aa68, 1);
    const top = this.add.circle(3, -164, 82, 0x78b970, 1);
    const blossom = this.add.circle(48, -150, 14, 0xffc7df, 0.78);
    this.add
      .container(x, y, [trunk, left, right, top, blossom])
      .setScale(scale)
      .setDepth(worldDepthForY(y, 0.25));
  }

  private createRaceHub(): void {
    const hub = RAINBOW_MEADOW_MAP.raceHub;
    this.add
      .rectangle(hub.x, hub.y, hub.width, hub.height, 0xf4dda2, 0.38)
      .setStrokeStyle(9, 0xe6ba74, 0.55)
      .setDepth(3);

    this.createHubTent();
    this.createRibbonBoard();
    this.createRaceEntrance();
    this.createHubFlags();

    this.add
      .text(2670, 690, 'RAINBOW RUN', {
        color: '#6b4777',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dfe8',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(720, 0.4));
  }

  private createHubTent(): void {
    const baseY = 650;
    const tent = this.add.graphics().setDepth(worldDepthForY(baseY));
    tent.fillStyle(0xfff1cb, 1);
    tent.fillRoundedRect(2385, 500, 430, 150, 22);
    tent.fillStyle(0xc79bdd, 1);
    tent.fillTriangle(2370, 515, 2600, 330, 2830, 515);
    tent.fillStyle(0xf2a0b7, 0.96);
    tent.fillTriangle(2485, 500, 2600, 350, 2715, 500);
    tent.fillStyle(0x8a684c, 1);
    tent.fillRect(2575, 555, 50, 95);
  }

  private createRibbonBoard(): void {
    const feature = RAINBOW_MEADOW_MAP.hubFeatures.find((item) => item.id === 'ribbon-board');
    if (!feature) {
      return;
    }

    const { x, y } = feature.position;
    const board = this.add
      .rectangle(x, y - 70, 300, 170, 0x8e674d, 1)
      .setStrokeStyle(8, 0x6f4d3d, 1);
    board.setDepth(worldDepthForY(y, 0.15));
    this.add.rectangle(x - 108, y + 30, 18, 130, 0x72513f, 1).setDepth(worldDepthForY(y, 0.1));
    this.add.rectangle(x + 108, y + 30, 18, 130, 0x72513f, 1).setDepth(worldDepthForY(y, 0.1));
    this.add
      .text(x, y - 116, 'RIBBONS', {
        color: '#fff1be',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y, 0.2));

    const hookColours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    for (let index = 0; index < hookColours.length; index += 1) {
      const hookX = x - 100 + index * 50;
      this.add.circle(hookX, y - 58, 7, hookColours[index], 0.75).setDepth(worldDepthForY(y, 0.2));
      this.add.rectangle(hookX, y - 24, 3, 46, 0xd8bc8a, 0.6).setDepth(worldDepthForY(y, 0.18));
    }
  }

  private createRaceEntrance(): void {
    const feature = RAINBOW_MEADOW_MAP.hubFeatures.find(
      (item) => item.id === 'rainbow-run-entrance',
    );
    if (!feature) {
      return;
    }

    const { x, y } = feature.position;
    const northPost = this.add
      .rectangle(x, y - 140, 52, 180, 0x7f5a49, 1)
      .setStrokeStyle(5, 0x654437, 1)
      .setDepth(worldDepthForY(y - 50, 0.2));
    const southPost = this.add
      .rectangle(x, y + 140, 52, 180, 0x7f5a49, 1)
      .setStrokeStyle(5, 0x654437, 1)
      .setDepth(worldDepthForY(y + 230, 0.2));

    const rainbow = this.add.graphics().setDepth(worldDepthForY(y + 15, 0.1));
    const colours = [0xf08aa3, 0xf4b66d, 0xf4db75, 0x81c77b, 0x79b9df, 0xb392da];
    for (let index = 0; index < colours.length; index += 1) {
      rainbow.lineStyle(12, colours[index], 0.96);
      rainbow.beginPath();
      rainbow.arc(x - 10, y, 128 - index * 12, -Math.PI / 2, Math.PI / 2, false);
      rainbow.strokePath();
    }

    const northFlag = this.add
      .triangle(x - 6, y - 235, 0, 0, 85, 22, 0, 44, 0xf18dad, 1)
      .setDepth(northPost.depth + 0.2);
    const southFlag = this.add
      .triangle(x - 6, y + 45, 0, 0, 85, 22, 0, 44, 0x7cc6d8, 1)
      .setDepth(southPost.depth + 0.2);
    northFlag.setAngle(0);
    southFlag.setAngle(0);

    this.add
      .text(x - 122, y, 'START', {
        color: '#66476f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dfe8',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y, 0.25));
  }

  private createHubFlags(): void {
    const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    const positions = [
      [2230, 790],
      [2260, 1330],
      [2810, 790],
      [2860, 1440],
    ] as const;
    for (const [x, y] of positions) {
      const depth = worldDepthForY(y, 0.2);
      this.add.rectangle(x, y - 75, 7, 150, 0x83614c, 1).setDepth(depth);
      this.add
        .triangle(x + 4, y - 145, 0, 0, 76, 20, 0, 40, colours[(x + y) % colours.length], 1)
        .setDepth(depth + 0.1);
    }
  }

  private createNova(): void {
    const marker = RAINBOW_MEADOW_MAP.npcMarkers.find((item) => item.id === 'nova');
    if (!marker) {
      return;
    }

    const { x, y } = marker.position;
    const body = this.add.ellipse(0, 0, 92, 62, 0xe7c3ff, 1);
    const head = this.add.circle(34, -34, 31, 0xf1d7ff, 1);
    const mane = this.add.ellipse(2, -30, 34, 80, 0x7fc8e7, 0.95).setAngle(22);
    const horn = this.add.triangle(49, -74, 0, 30, 8, 0, 16, 30, 0xffdc75, 1).setAngle(20);
    const eye = this.add.circle(44, -38, 4, 0x5b4068, 1);
    const legs = [-28, 23].flatMap((offsetX) => [
      this.add.rectangle(offsetX, 38, 11, 54, 0xd8afea, 1).setAngle(4),
      this.add.rectangle(offsetX + 18, 36, 11, 52, 0xd8afea, 1).setAngle(-4),
    ]);
    const tail = this.add.ellipse(-57, -7, 25, 72, 0xf29fc5, 0.96).setAngle(-35);
    const nova = this.add
      .container(x, y, [tail, ...legs, body, mane, head, horn, eye])
      .setDepth(worldDepthForY(y + 48, 0.2));

    this.add
      .text(x, y + 72, 'Nova', {
        color: '#5e4669',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff8dfdd',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 82, 0.3));

    this.tweens.add({
      targets: nova,
      y: y - 5,
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private createEntranceMarker(): void {
    this.add.rectangle(125, 1050, 110, 370, 0x6ba76c, 0.92).setDepth(worldDepthForY(1215));
    this.add
      .text(210, 890, '← Sunbeam Village', {
        color: '#59485f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dedd',
        padding: { x: 10, y: 6 },
      })
      .setDepth(worldDepthForY(900, 0.2));
  }

  private createMeadowFlowers(): void {
    const positions = [
      [520, 790],
      [650, 1290],
      [910, 840],
      [1320, 1390],
      [1700, 1240],
      [1980, 760],
      [2140, 1510],
      [2930, 1550],
      [3010, 610],
    ] as const;
    const colours = [0xf7a4c6, 0xffdf7e, 0xb8a1e4, 0x88cbe0];
    for (let index = 0; index < positions.length; index += 1) {
      const [x, y] = positions[index];
      const depth = worldDepthForY(y, -0.2);
      this.add.circle(x, y, 13, colours[index % colours.length], 0.95).setDepth(depth);
      this.add.circle(x + 13, y + 4, 9, colours[(index + 1) % colours.length], 0.9).setDepth(depth);
      this.add.circle(x - 11, y + 6, 8, 0xffefad, 0.92).setDepth(depth);
    }
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const collisionGroup = this.physics.add.staticGroup();

    for (const collider of RAINBOW_MEADOW_MAP.colliders) {
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
      .text(GAME_WIDTH / 2, 24, 'Rainbow Meadow', {
        color: '#5f4756',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dff2',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);

    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, 120, '', {
        color: '#5b455f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
        backgroundColor: '#fff9e8ee',
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(122)
      .setVisible(false);
  }
}
