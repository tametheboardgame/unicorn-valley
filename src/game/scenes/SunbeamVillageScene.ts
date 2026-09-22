import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { shouldShowTouchMovementPad, TouchMovementPad } from '../input/TouchMovementPad';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { PlayerEntity } from '../player/PlayerEntity';
import { parseUnicornAppearance, type UnicornAppearance } from '../player/UnicornAppearance';
import { createUnicornAppearanceTexture } from '../player/UnicornAppearanceRenderer';
import { getUnicornProductionTextureKey } from '../player/UnicornProductionArt';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  MOONFLOWER_GLADE_LOCATION_ID,
  saveLocationCheckpoint,
} from '../save/saveLocationCheckpoint';
import { isWillowGardenPlanted } from '../story/WillowMoonflowersStory';
import { createSunbeamVillageProductionPresentation } from '../visual/EnvironmentProductionPresentationManager';
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import {
  RAINBOW_MEADOW_LOCATION_ID,
  RAINBOW_MEADOW_MAP,
  setRainbowMeadowPlayerSpawn,
} from '../world/RainbowMeadowMap';
import {
  setSunbeamVillagePlayerSpawn,
  SUNBEAM_VILLAGE_LOCATION_ID,
  SUNBEAM_VILLAGE_MAP,
} from '../world/SunbeamVillageMap';
import { SUNBEAM_VILLAGE_LAYERS, SUNBEAM_VILLAGE_LAYOUT } from '../world/SunbeamVillageLayout';
import { worldDepthForY } from '../world/WorldDepth';

const COLLISION_TEXTURE_KEY = 'village-collision-pixel';
const SAVED_PLAYER_TEXTURE_KEY = 'player-unicorn-village';

function landmarkApproach(id: string): { x: number; y: number } {
  const landmark = SUNBEAM_VILLAGE_MAP.landmarks.find((candidate) => candidate.id === id);
  if (!landmark) {
    throw new Error(`Sunbeam Village interaction references missing landmark: ${id}`);
  }

  return landmark.approach;
}

function entranceApproach(id: string): { x: number; y: number } {
  const entrance = SUNBEAM_VILLAGE_MAP.entrances.find((candidate) => candidate.id === id);
  if (!entrance) {
    throw new Error(`Sunbeam Village interaction references missing entrance: ${id}`);
  }

  return entrance.approach;
}

function npcPosition(id: string): { x: number; y: number } {
  const marker = SUNBEAM_VILLAGE_MAP.npcMarkers.find((candidate) => candidate.id === id);
  if (!marker) {
    throw new Error(`Sunbeam Village interaction references missing NPC marker: ${id}`);
  }

  return marker.position;
}

function residenceApproach(id: string): { x: number; y: number } {
  const residence = SUNBEAM_VILLAGE_LAYOUT.residences.find((candidate) => candidate.id === id);
  if (!residence) {
    throw new Error(`Sunbeam Village interaction references missing residence: ${id}`);
  }

  return residence.approach;
}

const VILLAGE_INTERACTIONS = [
  {
    id: 'interaction:village-bakery',
    label: 'Sunbeam Bakery',
    actionLabel: 'Enter',
    position: landmarkApproach('bakery'),
    interactionRadius: 155,
    result: {
      type: 'scene-transition',
      sceneKey: 'VillageInteriorScene',
      payload: {
        interiorId: 'bakery',
        returnScene: 'SunbeamVillageScene',
      },
    },
  },
  {
    id: 'interaction:village-accessory-shop',
    label: 'Twinkle & Thread',
    actionLabel: 'Enter',
    position: landmarkApproach('accessory-shop'),
    interactionRadius: 155,
    result: {
      type: 'scene-transition',
      sceneKey: 'VillageInteriorScene',
      payload: {
        interiorId: 'accessory-shop',
        returnScene: 'SunbeamVillageScene',
      },
    },
  },
  {
    id: 'interaction:village-library',
    label: 'Story House',
    actionLabel: 'Enter',
    position: landmarkApproach('library'),
    interactionRadius: 160,
    result: {
      type: 'scene-transition',
      sceneKey: 'VillageInteriorScene',
      payload: {
        interiorId: 'library',
        returnScene: 'SunbeamVillageScene',
      },
    },
  },
  {
    id: 'interaction:village-fountain',
    label: 'Sunbeam Fountain',
    actionLabel: 'Make a wish',
    position: landmarkApproach('sunbeam-fountain'),
    interactionRadius: 145,
    result: {
      type: 'message',
      title: 'Sunbeam Fountain',
      message: 'The water catches a tiny rainbow when you get close. Maybe wishes linger here.',
    },
  },
  {
    id: 'interaction:village-willow',
    label: 'Willow',
    actionLabel: 'Talk',
    position: npcPosition('willow'),
    interactionRadius: 150,
    priority: 30,
    result: { type: 'message', title: 'Willow', message: 'Talk with Willow.' },
  },
  {
    id: 'interaction:village-marigold',
    label: 'Marigold',
    actionLabel: 'Talk',
    position: npcPosition('marigold'),
    interactionRadius: 150,
    priority: 30,
    result: { type: 'message', title: 'Marigold', message: 'Talk with Marigold.' },
  },
  {
    id: 'interaction:village-residence-rosehip',
    label: 'Rosehip Cottage',
    actionLabel: 'Knock',
    position: residenceApproach('rosehip-cottage'),
    interactionRadius: 135,
    result: {
      type: 'message',
      title: 'Rosehip Cottage',
      message: "A handwritten card by the door says, 'Out in the valley. Tea another day!'",
    },
  },
  {
    id: 'interaction:village-residence-bluebell',
    label: 'Bluebell Cottage',
    actionLabel: 'Knock',
    position: residenceApproach('bluebell-cottage'),
    interactionRadius: 135,
    result: {
      type: 'message',
      title: 'Bluebell Cottage',
      message:
        'Warm light glows behind the curtains. A little note asks visitors to wait for an invitation before coming in.',
    },
  },
  {
    id: 'interaction:village-residence-sunpetal',
    label: 'Sunpetal Cottage',
    actionLabel: 'Knock',
    position: residenceApproach('sunpetal-cottage'),
    interactionRadius: 135,
    result: {
      type: 'message',
      title: 'Sunpetal Cottage',
      message: "Tiny boots and a watering can rest by the step. This is someone's home, not a shop.",
    },
  },
  {
    id: 'interaction:village-south-gate',
    label: 'Candyland Gate',
    actionLabel: 'Inspect',
    position: SUNBEAM_VILLAGE_LAYOUT.boundaryFence.lockedSouthGate.approach,
    interactionRadius: 150,
    result: {
      type: 'message',
      title: 'Candyland',
      message:
        'Candyland is opening soon! The unicorn theme park is still getting its rides, treats and sparkles ready for visitors.',
    },
  },
  {
    id: 'interaction:village-glade-gate',
    label: 'Moonflower Glade',
    actionLabel: 'Go home',
    position: entranceApproach('moonflower-glade'),
    interactionRadius: 170,
    priority: 20,
    result: {
      type: 'scene-transition',
      sceneKey: 'MoonflowerGladeScene',
    },
  },
  {
    id: 'interaction:village-meadow-gate',
    label: 'Rainbow Meadow',
    actionLabel: 'Visit meadow',
    position: entranceApproach('rainbow-meadow'),
    interactionRadius: 175,
    priority: 20,
    result: {
      type: 'scene-transition',
      sceneKey: 'RainbowMeadowScene',
    },
  },
] satisfies readonly InteractionTarget[];

export class SunbeamVillageScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private touchMovementPad: TouchMovementPad | null = null;
  private player: PlayerEntity | null = null;
  private collisionGroup: Phaser.Physics.Arcade.StaticGroup | null = null;
  private interactionPrompt: InteractionPrompt | null = null;
  private activeInteraction: InteractionTarget | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private feedbackTimer: Phaser.Time.TimerEvent | null = null;

  public constructor() {
    super('SunbeamVillageScene');
  }

  public create(): void {
    this.createEnvironment();
    this.ensureCollisionTexture();

    const saveService = getBrowserSaveService();
    const save = saveLocationCheckpoint(saveService, SUNBEAM_VILLAGE_LOCATION_ID);
    const appearance = parseUnicornAppearance(save.profile.appearance);
    createUnicornAppearanceTexture(this, SAVED_PLAYER_TEXTURE_KEY, appearance);

    const map = SUNBEAM_VILLAGE_MAP;
    this.physics.world.setBounds(
      map.margin,
      map.margin,
      map.width - map.margin * 2,
      map.height - map.margin,
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

    const camera = this.cameras.main;
    camera.setBackgroundColor('#f3d98e');
    camera.setBounds(0, 0, map.width, map.height);
    camera.startFollow(this.player.sprite, true, 0.11, 0.11);
    camera.setDeadzone(260, 150);

    this.createHud();

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

    this.activeInteraction = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      VILLAGE_INTERACTIONS,
    );
    this.interactionPrompt?.setTarget(this.activeInteraction);

    if (this.inputController.justPressed('INTERACT') && this.activeInteraction) {
      this.activateInteraction(this.activeInteraction);
    }
  }

  private activateInteraction(target: InteractionTarget): void {
    if (target.result.type === 'scene-transition') {
      if (target.result.sceneKey === 'MoonflowerGladeScene') {
        const villageEntrance = MOONFLOWER_GLADE_MAP.entrances.find(
          (entrance) => entrance.id === 'sunbeam-village',
        );
        if (villageEntrance) {
          setMoonflowerGladePlayerSpawn(villageEntrance.approach);
        }
        saveLocationCheckpoint(getBrowserSaveService(), MOONFLOWER_GLADE_LOCATION_ID);
      } else if (target.result.sceneKey === 'RainbowMeadowScene') {
        const villageEntrance = RAINBOW_MEADOW_MAP.entrances.find(
          (entrance) => entrance.id === 'sunbeam-village',
        );
        if (villageEntrance) {
          setRainbowMeadowPlayerSpawn(villageEntrance.approach);
        }
        saveLocationCheckpoint(getBrowserSaveService(), RAINBOW_MEADOW_LOCATION_ID);
      } else if (target.result.sceneKey === 'VillageInteriorScene') {
        setSunbeamVillagePlayerSpawn(target.position);
      }
      this.scene.start(target.result.sceneKey, target.result.payload);
      return;
    }

    if (target.result.type === 'message') {
      this.showFeedback(`${target.result.title}\n${target.result.message}`);
    }
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
    const map = SUNBEAM_VILLAGE_MAP;
    this.add
      .rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xa9da92, 1)
      .setName('sunbeam-composition:base');

    this.createDistrictGrounding();
    this.createPlaza();
    this.createPathNetwork();
    this.createVillageBoundaryFence();

    this.createBakeryExterior();
    this.createAccessoryShopExterior();
    this.createStoryHouseExterior();
    this.createVillageBunting();
    this.createFountain();
    this.createWillowGarden();
    this.createResidentialExpansion();
    this.createUnicornPlayground();
    this.createEntrances();
    this.createFlowers();

    // Sunbeam's production detail is now composed by the scene itself instead of being injected
    // later by the global environment manager. This keeps one lifecycle authority for H3 work.
    createSunbeamVillageProductionPresentation(this);
  }

  private createDistrictGrounding(): void {
    const districtColours: Record<string, number> = {
      'west-approach': 0xb9df9e,
      'high-street': 0xd8e8a8,
      'central-plaza': 0xcde6a7,
      'willow-garden': 0x8fc984,
      residential: 0xb8dc96,
      'east-approach': 0xb9df9e,
    };

    for (const district of SUNBEAM_VILLAGE_LAYOUT.districts) {
      this.add
        .ellipse(
          district.centre.x,
          district.centre.y,
          district.radiusX * 2,
          district.radiusY * 2,
          districtColours[district.id],
          district.id === 'central-plaza' ? 0.1 : 0.14,
        )
        .setName(`sunbeam-district:${district.id}`)
        .setDepth(SUNBEAM_VILLAGE_LAYERS.districtGround);
    }
  }

  private createPlaza(): void {
    const { centre, width, height, northShopApron } = SUNBEAM_VILLAGE_LAYOUT.plaza;
    const graphics = this.add
      .graphics()
      .setName('sunbeam-composition:plaza')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.plaza);

    graphics.fillStyle(0xe4cc96, 0.94);
    graphics.fillEllipse(centre.x, centre.y, width, height);
    graphics.fillStyle(0xecd8aa, 0.76);
    graphics.fillEllipse(centre.x - 105, centre.y + 18, width * 0.64, height * 0.72);
    graphics.fillEllipse(centre.x + 118, centre.y - 14, width * 0.58, height * 0.68);

    const apronTop = northShopApron.y - northShopApron.height / 2;
    const apronBottom = northShopApron.y + northShopApron.height / 2;
    const outerTopHalf = 40;
    const outerBottomHalf = northShopApron.width / 2;
    graphics.fillStyle(0xd9bf87, 0.98);
    graphics.fillTriangle(
      northShopApron.x - outerTopHalf,
      apronTop,
      northShopApron.x + outerTopHalf,
      apronTop,
      northShopApron.x + outerBottomHalf,
      apronBottom,
    );
    graphics.fillTriangle(
      northShopApron.x - outerTopHalf,
      apronTop,
      northShopApron.x + outerBottomHalf,
      apronBottom,
      northShopApron.x - outerBottomHalf,
      apronBottom,
    );

    const innerTop = apronTop + 4;
    const innerBottom = northShopApron.y + 34;
    graphics.fillStyle(0xf2e3bd, 0.96);
    graphics.fillTriangle(
      northShopApron.x - 28,
      innerTop,
      northShopApron.x + 28,
      innerTop,
      northShopApron.x + 62,
      innerBottom,
    );
    graphics.fillTriangle(
      northShopApron.x - 28,
      innerTop,
      northShopApron.x + 62,
      innerBottom,
      northShopApron.x - 62,
      innerBottom,
    );

    graphics.fillStyle(0xd2b980, 0.58);
    for (const [offsetX, offsetY, stoneWidth] of [
      [-52, 48, 42],
      [0, 62, 48],
      [54, 46, 40],
    ] as const) {
      graphics.fillEllipse(northShopApron.x + offsetX, northShopApron.y + offsetY, stoneWidth, 22);
    }

    graphics.lineStyle(18, 0xf2e3be, 0.88);
    graphics.strokeEllipse(centre.x, centre.y, 360, 270);

    graphics.fillStyle(0xd2b980, 0.68);
    for (const [x, y, stoneWidth, stoneHeight] of [
      [centre.x - 250, centre.y - 44, 54, 28],
      [centre.x - 205, centre.y + 126, 62, 30],
      [centre.x - 78, centre.y + 184, 48, 26],
      [centre.x + 92, centre.y + 178, 58, 28],
      [centre.x + 226, centre.y + 112, 50, 26],
      [centre.x + 270, centre.y - 32, 58, 28],
      [centre.x + 188, centre.y - 154, 54, 26],
      [centre.x - 176, centre.y - 148, 52, 28],
    ] as const) {
      graphics.fillEllipse(x, y, stoneWidth, stoneHeight);
    }

    for (const [x, y] of [
      [centre.x - 255, centre.y - 118],
      [centre.x - 255, centre.y + 118],
      [centre.x + 255, centre.y - 118],
      [centre.x + 255, centre.y + 118],
    ] as const) {
      const marker = this.add
        .container(x, y, [
          this.add.ellipse(0, 18, 48, 22, 0x806b58, 0.18),
          this.add.rectangle(0, 0, 22, 34, 0xc7b08b, 1).setStrokeStyle(3, 0x9b8268, 0.9),
          this.add.circle(0, -22, 16, 0xe8cf84, 1).setStrokeStyle(3, 0xb99755, 0.9),
          this.add
            .text(0, -23, '✦', {
              color: '#fff5cf',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5),
        ])
        .setName('sunbeam-composition:plaza-marker')
        .setDepth(SUNBEAM_VILLAGE_LAYERS.plaza + 0.1);
      marker.setAlpha(0.94);
    }
  }

  private createPathNetwork(): void {
    const graphics = this.add
      .graphics()
      .setName('sunbeam-composition:path-network')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.path);
    const {
      mainApproaches,
      shopBranches,
      willowBranch,
      southernRoad,
      residentialSideRoads,
    } = SUNBEAM_VILLAGE_LAYOUT.pathNetwork;
    const routes = [
      ...mainApproaches.map((points) => ({ points, outerWidth: 126, innerWidth: 94 })),
      ...shopBranches.map((points) => ({ points, outerWidth: 76, innerWidth: 54 })),
      { points: willowBranch, outerWidth: 76, innerWidth: 54 },
      { points: southernRoad, outerWidth: 84, innerWidth: 60 },
      ...residentialSideRoads.map((points) => ({ points, outerWidth: 68, innerWidth: 48 })),
    ] as const;

    const drawStroke = (
      points: readonly { x: number; y: number }[],
      width: number,
      colour: number,
      alpha: number,
    ): void => {
      const first = points[0];
      if (!first) {
        return;
      }

      graphics.lineStyle(width, colour, alpha);
      graphics.beginPath();
      graphics.moveTo(first.x, first.y);
      for (const point of points.slice(1)) {
        graphics.lineTo(point.x, point.y);
      }
      graphics.strokePath();

      graphics.fillStyle(colour, alpha);
      for (const point of points) {
        graphics.fillCircle(point.x, point.y, width / 2);
      }
    };

    // Draw every route's edging first, then every route's walking surface. This merges branch
    // junctions into one continuous road network instead of painting branch borders over the
    // centre of the main road.
    for (const route of routes) {
      drawStroke(route.points, route.outerWidth, 0xd2b680, 0.98);
    }
    for (const route of routes) {
      drawStroke(route.points, route.innerWidth, 0xf4e4ba, 1);
    }
  }

  private createVillageBoundaryFence(): void {
    const { segments, posts, thickness, postSize, lockedSouthGate } =
      SUNBEAM_VILLAGE_LAYOUT.boundaryFence;
    const objects: Phaser.GameObjects.GameObject[] = [];

    for (const segment of segments) {
      const horizontal = segment.orientation === 'horizontal';
      const width = horizontal ? segment.length : thickness;
      const height = horizontal ? thickness : segment.length;

      objects.push(
        this.add
          .rectangle(segment.x, segment.y, width, height, 0xa9865d, 1)
          .setName(`sunbeam-composition:village-boundary:fence:${segment.id}`)
          .setStrokeStyle(3, 0x6f573f, 0.92),
        this.add.rectangle(
          segment.x,
          segment.y - (horizontal ? 2 : 0),
          horizontal ? segment.length - 10 : 5,
          horizontal ? 5 : segment.length - 10,
          0xd5b27f,
          0.74,
        ),
      );
    }

    for (const post of posts) {
      objects.push(
        this.add
          .rectangle(post.x, post.y, postSize, postSize, 0x8b694d, 1)
          .setName(`sunbeam-composition:village-boundary:post:${post.id}`)
          .setStrokeStyle(4, 0x684e3b, 0.94),
        this.add.circle(post.x, post.y - 2, 7, 0xd4aa70, 0.9),
      );
    }

    objects.push(
      this.add
        .rectangle(
          lockedSouthGate.x,
          lockedSouthGate.y - 30,
          lockedSouthGate.width - 24,
          16,
          0x9b744f,
          1,
        )
        .setName('sunbeam-composition:village-boundary:locked-south-gate:rail:lower')
        .setStrokeStyle(3, 0x684e3b, 0.94),
      this.add
        .rectangle(
          lockedSouthGate.x,
          lockedSouthGate.y - 62,
          lockedSouthGate.width - 24,
          16,
          0xa9845b,
          1,
        )
        .setName('sunbeam-composition:village-boundary:locked-south-gate:rail:upper')
        .setStrokeStyle(3, 0x684e3b, 0.94),
    );

    this.add
      .container(0, 0, objects)
      .setName('sunbeam-composition:village-boundary')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.structureShadow);

    const candySignX = lockedSouthGate.x;
    const candySignY = lockedSouthGate.y - 92;
    const candySignObjects: Phaser.GameObjects.GameObject[] = [
      this.add
        .rectangle(candySignX, candySignY, 210, 68, 0xffefbf, 1)
        .setName('sunbeam-composition:village-boundary:locked-south-gate:sign')
        .setStrokeStyle(6, 0xe878a6, 0.98),
      this.add.rectangle(candySignX, candySignY - 27, 196, 8, 0x8ed0dd, 0.96),
      this.add.circle(candySignX - 88, candySignY - 5, 14, 0xf18aaf, 1),
      this.add.circle(candySignX + 88, candySignY - 5, 14, 0x86c9dc, 1),
      this.add.circle(candySignX - 72, candySignY + 21, 9, 0xf6ca67, 1),
      this.add.circle(candySignX + 72, candySignY + 21, 9, 0xc39ddd, 1),
      this.add
        .text(candySignX, candySignY - 2, 'CANDYLAND\nOPENING SOON', {
          color: '#7b4767',
          fontFamily: 'Georgia, serif',
          fontSize: '14px',
          fontStyle: 'bold',
          align: 'center',
          lineSpacing: -1,
        })
        .setName('sunbeam-composition:village-boundary:locked-south-gate:sign:text')
        .setOrigin(0.5),
      this.add
        .text(candySignX - 110, candySignY - 2, '🍭', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '26px',
        })
        .setName('sunbeam-composition:village-boundary:locked-south-gate:lollipop:left')
        .setOrigin(0.5),
      this.add
        .text(candySignX + 110, candySignY - 2, '🍬', {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '25px',
        })
        .setName('sunbeam-composition:village-boundary:locked-south-gate:candy:right')
        .setOrigin(0.5),
    ];

    this.add
      .container(0, 0, candySignObjects)
      .setName('sunbeam-composition:village-boundary:locked-south-gate:sign-layer')
      .setDepth(worldDepthForY(lockedSouthGate.y, 1.4));
  }

  private createBakeryExterior(): void {
    const building = SUNBEAM_VILLAGE_LAYOUT.buildings.bakery;
    const objects: Phaser.GameObjects.GameObject[] = [
      this.add.zone(0, 0, 2, 2).setName('village-shopfront:bakery:identity'),
      this.add.ellipse(10, 188, building.width + 92, 82, 0x604c55, 0.18),
      this.add
        .rectangle(-148, -188, 50, 112, 0xb87857, 1)
        .setName('village-shopfront:bakery:feature:chimney')
        .setStrokeStyle(5, 0x8c604e, 0.9),
      this.add.rectangle(-148, -250, 64, 20, 0x8c604e, 1),
    ];

    const cottage = this.add.graphics().setName('village-shopfront:bakery:structure');
    cottage.fillStyle(0xf6b071, 1);
    cottage.fillRoundedRect(-building.width / 2, -138, building.width, 286, 38);
    cottage.lineStyle(7, 0x9a6a55, 0.74);
    cottage.strokeRoundedRect(-building.width / 2, -138, building.width, 286, 38);
    cottage.fillStyle(0xffe2a3, 1);
    cottage.fillTriangle(-245, -125, 0, -272, 245, -125);
    cottage.lineStyle(7, 0x9b745c, 0.78);
    cottage.strokeTriangle(-245, -125, 0, -272, 245, -125);
    cottage.fillStyle(0xfff0c6, 0.5);
    cottage.fillRoundedRect(-184, -128, 368, 20, 10);
    objects.push(cottage);

    for (const [side, x] of [
      ['left', -118],
      ['right', 118],
    ] as const) {
      const windowArch = this.add
        .circle(x, -34, 43, 0xbde9f0, 1)
        .setName(`village-shopfront:bakery:window:${side}:arch`)
        .setStrokeStyle(8, 0xfff0cf, 1);
      const window = this.add
        .rectangle(x, 8, 94, 86, 0xbde9f0, 1)
        .setName(`village-shopfront:bakery:window:${side}`)
        .setStrokeStyle(8, 0xfff0cf, 1);
      objects.push(
        windowArch,
        window,
        this.add.rectangle(x, 5, 7, 78, 0xffffff, 0.58),
        this.add.rectangle(x, 5, 82, 7, 0xffffff, 0.58),
        this.add.rectangle(x, 70, 118, 22, 0xa96a4f, 1),
      );
      for (const offset of [-34, 0, 34]) {
        objects.push(this.add.circle(x + offset, 57, 11, 0xffb27d, 0.96));
      }
    }

    const doorArch = this.add
      .circle(0, 20, 54, 0x7f5847, 1)
      .setName('village-shopfront:bakery:door-arch')
      .setStrokeStyle(8, 0xffeed0, 0.96);
    const door = this.add
      .rectangle(0, 88, 112, 140, 0x7f5847, 1)
      .setName('village-shopfront:bakery:door')
      .setStrokeStyle(8, 0xffeed0, 0.96);
    objects.push(
      doorArch,
      door,
      this.add.rectangle(0, 62, 70, 70, 0xc6edf0, 0.94),
      this.add.circle(38, 100, 7, 0xffd56e, 1),
      this.add.rectangle(0, 156, 158, 28, 0xd2aa77, 1),
      this.add.rectangle(0, -66, 286, 32, 0xfff4d9, 1),
    );
    for (const x of [-110, -55, 0, 55, 110]) {
      objects.push(this.add.circle(x, -49, 18, x % 110 === 0 ? 0xffd079 : 0xf29b72, 1));
    }

    objects.push(
      this.add
        .rectangle(0, -116, 320, 56, 0xffedc4, 1)
        .setName('village-shopfront:bakery:sign')
        .setStrokeStyle(6, 0xa86f50, 0.96),
      this.add
        .text(0, -117, 'SUNBEAM BAKERY', {
          color: '#70493d',
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
      this.add.circle(-142, -116, 8, 0xf5b269, 0.96),
      this.add.circle(142, -116, 8, 0xf5b269, 0.96),
    );

    this.add
      .container(building.x, building.y, objects)
      .setName('village-shopfront:bakery:wall')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.structure);
  }

  private createAccessoryShopExterior(): void {
    const building = SUNBEAM_VILLAGE_LAYOUT.buildings.accessoryShop;
    const objects: Phaser.GameObjects.GameObject[] = [
      this.add.zone(0, 0, 2, 2).setName('village-shopfront:accessory-shop:identity'),
      this.add.ellipse(6, 198, building.width + 82, 80, 0x604c55, 0.18),
      this.add
        .rectangle(-148, -215, 42, 110, 0xbe75b9, 1)
        .setName('village-shopfront:accessory-shop:feature:turret')
        .setStrokeStyle(5, 0x865e82, 0.86),
      this.add.circle(-148, -279, 31, 0xf6c4ee, 1).setStrokeStyle(5, 0x865e82, 0.86),
    ];

    const facade = this.add.graphics().setName('village-shopfront:accessory-shop:structure');
    facade.fillStyle(0xd89ad5, 1);
    facade.fillRoundedRect(-188, -150, 376, 310, 24);
    facade.lineStyle(7, 0x8f668b, 0.78);
    facade.strokeRoundedRect(-188, -150, 376, 310, 24);
    facade.fillStyle(0xefb7e8, 1);
    facade.fillTriangle(-226, -132, -42, -282, 22, -132);
    facade.fillTriangle(-34, -132, 98, -244, 224, -132);
    facade.lineStyle(6, 0x8f668b, 0.76);
    facade.beginPath();
    facade.moveTo(-226, -132);
    facade.lineTo(-42, -282);
    facade.lineTo(12, -160);
    facade.lineTo(98, -244);
    facade.lineTo(224, -132);
    facade.strokePath();
    facade.beginPath();
    facade.moveTo(-226, -132);
    facade.lineTo(224, -132);
    facade.strokePath();
    facade.fillStyle(0xffe2f4, 0.55);
    facade.fillRoundedRect(-166, -139, 332, 18, 9);
    objects.push(facade);

    const leftWindow = this.add
      .ellipse(-105, 12, 104, 126, 0xc7edf0, 1)
      .setName('village-shopfront:accessory-shop:window:left')
      .setStrokeStyle(8, 0xffedf9, 0.96);
    const rightWindow = this.add
      .ellipse(132, 18, 88, 108, 0xc7edf0, 1)
      .setName('village-shopfront:accessory-shop:window:right')
      .setStrokeStyle(8, 0xffedf9, 0.96);
    const windowDisplay = this.add
      .container(0, 0, [
        this.add.rectangle(-128, 43, 7, 45, 0x9b6f87, 0.92),
        this.add.rectangle(-82, 43, 7, 45, 0x9b6f87, 0.92),
        this.add.ellipse(-128, 15, 28, 18, 0xf3a5d4, 0.96).setAngle(-18),
        this.add.ellipse(-82, 15, 28, 18, 0xc9a6ef, 0.96).setAngle(18),
        this.add.circle(-105, 18, 7, 0xffe3a2, 0.98),
        this.add.circle(-105, 50, 5, 0xffffff, 0.72),
      ])
      .setName('village-shopfront:accessory-shop:window-display');

    objects.push(
      leftWindow,
      rightWindow,
      this.add.rectangle(-105, 14, 7, 104, 0xffffff, 0.52),
      this.add.rectangle(132, 18, 7, 88, 0xffffff, 0.52),
      this.add.ellipse(-105, 82, 126, 28, 0xb879aa, 1),
      this.add.ellipse(132, 78, 108, 26, 0xb879aa, 1),
      windowDisplay,
    );

    const doorArch = this.add
      .ellipse(18, 31, 104, 58, 0x765064, 1)
      .setName('village-shopfront:accessory-shop:door-arch')
      .setStrokeStyle(7, 0xffedf9, 0.95);
    const door = this.add
      .rectangle(18, 98, 104, 140, 0x765064, 1)
      .setName('village-shopfront:accessory-shop:door')
      .setStrokeStyle(7, 0xffedf9, 0.95);
    objects.push(
      doorArch,
      door,
      this.add.ellipse(18, 72, 64, 58, 0xc9edf0, 0.94),
      this.add.circle(53, 106, 7, 0xffd56e, 1),
      this.add.rectangle(18, 168, 146, 26, 0xc79a75, 1),
      this.add.ellipse(24, -102, 246, 54, 0xffeef8, 1),
      this.add.ellipse(-92, -103, 70, 40, 0xf6a6d8, 0.96),
      this.add.ellipse(140, -103, 70, 40, 0xd9a7ef, 0.96),
    );

    objects.push(
      this.add
        .rectangle(24, -102, 218, 44, 0xfff4fb, 0.96)
        .setName('village-shopfront:accessory-shop:sign')
        .setStrokeStyle(4, 0xb573ad, 0.9),
      this.add
        .text(24, -103, 'TWINKLE & THREAD', {
          color: '#704f70',
          fontFamily: 'Georgia, serif',
          fontSize: '17px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
      this.add
        .text(-100, -104, '✦', {
          color: '#fff2b2',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
      this.add
        .text(148, -104, '✦', {
          color: '#fff2b2',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    this.add
      .container(building.x, building.y, objects)
      .setName('village-shopfront:accessory-shop:wall')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.structure);
  }

  private createStoryHouseExterior(): void {
    const building = SUNBEAM_VILLAGE_LAYOUT.buildings.library;
    const objects: Phaser.GameObjects.GameObject[] = [
      this.add.zone(0, 0, 2, 2).setName('village-shopfront:library:identity'),
      this.add.ellipse(12, 214, building.width + 86, 84, 0x604c55, 0.18),
      this.add
        .rectangle(142, -228, 54, 148, 0x6d7783, 1)
        .setName('village-shopfront:library:feature:chimney')
        .setStrokeStyle(5, 0x4f5f70, 0.9),
      this.add.rectangle(142, -308, 68, 22, 0x4f5f70, 1),
    ];

    const storyHouse = this.add.graphics().setName('village-shopfront:library:structure');
    storyHouse.fillStyle(0x80b0d2, 1);
    storyHouse.fillRect(-205, -176, 410, 350);
    storyHouse.lineStyle(8, 0x53758d, 0.82);
    storyHouse.strokeRect(-205, -176, 410, 350);
    storyHouse.fillStyle(0xcceafb, 1);
    storyHouse.fillTriangle(-252, -160, 0, -338, 252, -160);
    storyHouse.lineStyle(7, 0x587589, 0.82);
    storyHouse.strokeTriangle(-252, -160, 0, -338, 252, -160);
    storyHouse.fillStyle(0x6f9bbb, 1);
    storyHouse.fillRect(-205, -176, 42, 350);
    storyHouse.fillRect(163, -176, 42, 350);
    storyHouse.fillStyle(0xe8f5ff, 0.46);
    storyHouse.fillRect(-155, -164, 310, 18);
    objects.push(storyHouse);

    objects.push(
      this.add
        .circle(0, -178, 46, 0xc3e8f2, 1)
        .setName('village-shopfront:library:feature:attic-window')
        .setStrokeStyle(8, 0xfff1d7, 0.94),
      this.add.rectangle(0, -178, 5, 76, 0xffffff, 0.52),
      this.add.rectangle(0, -178, 76, 5, 0xffffff, 0.52),
    );

    for (const [side, x] of [
      ['left', -118],
      ['right', 118],
    ] as const) {
      const window = this.add
        .rectangle(x, 8, 86, 138, 0xb9e5ef, 1)
        .setName(`village-shopfront:library:window:${side}`)
        .setStrokeStyle(9, 0xfff1d7, 0.96);
      objects.push(
        window,
        this.add.rectangle(x, 8, 7, 126, 0xffffff, 0.52),
        this.add.rectangle(x, 8, 74, 7, 0xffffff, 0.52),
        this.add.rectangle(x, 86, 104, 20, 0x6489a2, 1),
      );
    }

    const doorArch = this.add
      .circle(0, 37, 54, 0x604c4b, 1)
      .setName('village-shopfront:library:door-arch')
      .setStrokeStyle(8, 0xffefd3, 0.94);
    const door = this.add
      .rectangle(0, 112, 108, 154, 0x604c4b, 1)
      .setName('village-shopfront:library:door')
      .setStrokeStyle(8, 0xffefd3, 0.94);
    objects.push(
      doorArch,
      door,
      this.add.rectangle(0, 78, 68, 82, 0xc0e4ea, 0.92),
      this.add.circle(38, 124, 7, 0xffd56e, 1),
      this.add.rectangle(0, 190, 160, 28, 0xb78c68, 1),
      this.add.rectangle(-181, -62, 22, 166, 0xf4cc7a, 0.72),
      this.add.rectangle(181, -62, 22, 166, 0xd99ac8, 0.62),
    );

    objects.push(
      this.add
        .rectangle(0, -102, 236, 48, 0xf7e7c4, 1)
        .setName('village-shopfront:library:sign')
        .setStrokeStyle(6, 0x5b6f82, 0.94),
      this.add.rectangle(-107, -102, 12, 54, 0x6f94ad, 0.92),
      this.add.rectangle(107, -102, 12, 54, 0x6f94ad, 0.92),
      this.add
        .text(0, -103, 'STORY HOUSE', {
          color: '#4f5d6c',
          fontFamily: 'Georgia, serif',
          fontSize: '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    this.add
      .container(building.x, building.y, objects)
      .setName('village-shopfront:library:wall')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.structure);
  }

  private createVillageBunting(): void {
    const graphics = this.add
      .graphics()
      .setName('sunbeam-composition:bunting')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.structureDetail + 0.35);
    const colours = [0xf39bb5, 0xf3c96f, 0x86c9dd, 0x9dcc7d, 0xc9a2df];

    const drawSpan = (
      start: { x: number; y: number },
      end: { x: number; y: number },
      flagCount: number,
    ): void => {
      graphics.lineStyle(4, 0x7b654f, 0.58);
      graphics.beginPath();
      for (let index = 0; index <= 18; index += 1) {
        const t = index / 18;
        const x = Phaser.Math.Linear(start.x, end.x, t);
        const y = Phaser.Math.Linear(start.y, end.y, t) + Math.sin(Math.PI * t) * 22;
        if (index === 0) {
          graphics.moveTo(x, y);
        } else {
          graphics.lineTo(x, y);
        }
      }
      graphics.strokePath();

      for (let index = 1; index <= flagCount; index += 1) {
        const t = index / (flagCount + 1);
        const x = Phaser.Math.Linear(start.x, end.x, t);
        const y = Phaser.Math.Linear(start.y, end.y, t) + Math.sin(Math.PI * t) * 22;
        graphics.fillStyle(colours[(index - 1) % colours.length], 0.92);
        graphics.fillTriangle(x - 13, y + 2, x + 13, y + 2, x, y + 28);
      }

      graphics.fillStyle(0xffe7a3, 0.9);
      graphics.fillCircle(start.x, start.y, 6);
      graphics.fillCircle(end.x, end.y, 6);
    };

    // Two short eave-to-eave strings keep celebration detail in the high-street gaps without
    // crossing doors, facade signs, the fountain ring or resident gathering routes.
    drawSpan({ x: 930, y: 306 }, { x: 1215, y: 286 }, 6);
    drawSpan({ x: 1690, y: 286 }, { x: 2015, y: 338 }, 7);
  }

  private createFountain(): void {
    const { x, y } = SUNBEAM_VILLAGE_LAYOUT.fountain;
    const objects: Phaser.GameObjects.GameObject[] = [
      this.add.circle(0, 0, 110, 0x8fb9c5, 1),
      this.add.circle(0, 0, 86, 0x9fe6ed, 1),
      this.add.circle(0, 0, 38, 0xffdc77, 1),
      this.add
        .text(0, 0, '☀', {
          color: '#fff5c4',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '38px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    ];
    this.add
      .container(x, y, objects)
      .setName('sunbeam-fountain:basin')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.structureDetail);
  }

  private createWillowGarden(): void {
    const planted = isWillowGardenPlanted(getBrowserSaveService().load());
    const { x, y, width, height, beds, fenceSegments, fencePosts, sign } =
      SUNBEAM_VILLAGE_LAYOUT.willowGarden;
    const objects: Phaser.GameObjects.GameObject[] = [
      this.add
        .ellipse(0, 12, width + 34, height + 34, 0x98c98b, 0.34)
        .setName('sunbeam-composition:willow-garden:ground'),
      this.add
        .ellipse(0, 18, width - 24, height - 34, 0xb9d99f, 0.3)
        .setStrokeStyle(4, 0x7da06a, 0.38),
    ];

    for (const bed of beds) {
      objects.push(
        this.add
          .rectangle(bed.x, bed.y, bed.width, bed.height, planted ? 0x7e5e45 : 0x8d6d50, 0.98)
          .setName(`sunbeam-composition:willow-garden:bed:${bed.id}`)
          .setStrokeStyle(6, 0x6f8f58, 0.96),
        this.add.rectangle(bed.x, bed.y + bed.height / 2 - 7, bed.width - 16, 8, 0xb58d62, 0.8),
      );

      for (const offsetX of [-42, 0, 42]) {
        if (planted) {
          objects.push(
            this.add.circle(bed.x + offsetX, bed.y + 4, 20, 0xffefab, 0.15),
            this.add
              .text(bed.x + offsetX, bed.y, '☾', {
                color: '#fff1a8',
                fontFamily: 'Georgia, serif',
                fontSize: '30px',
                fontStyle: 'bold',
              })
              .setOrigin(0.5),
            this.add.rectangle(bed.x + offsetX, bed.y + 23, 4, 24, 0x6d985f, 0.88),
          );
        } else {
          objects.push(
            this.add.rectangle(bed.x + offsetX, bed.y + 10, 4, 26, 0x6d985f, 0.88),
            this.add.circle(bed.x + offsetX - 6, bed.y - 4, 7, 0x91b96f, 0.96),
            this.add.circle(bed.x + offsetX + 6, bed.y - 1, 7, 0xa2c77b, 0.96),
          );
        }
      }
    }

    for (const segment of fenceSegments) {
      objects.push(
        this.add
          .rectangle(segment.x, segment.y, segment.width, segment.height, 0xb79262, 1)
          .setName(`sunbeam-composition:willow-garden:fence:${segment.id}`)
          .setStrokeStyle(3, 0x765943, 0.9),
      );
    }

    for (const post of fencePosts) {
      objects.push(
        this.add
          .rectangle(post.x, post.y, 30, 30, 0x8b694d, 1)
          .setName(`sunbeam-composition:willow-garden:post:${post.id}`)
          .setStrokeStyle(4, 0x684e3b, 0.96),
        this.add.circle(post.x, post.y - 2, 6, 0xd7b276, 0.92),
      );
    }

    // A small potting bench adds working-garden character without turning the district into
    // another dense prop cluster. H3.8 remains responsible for wider village-life dressing.
    objects.push(
      this.add.rectangle(188, 58, 86, 16, 0x9d7354, 1).setStrokeStyle(3, 0x72533f, 0.92),
      this.add.rectangle(160, 88, 10, 52, 0x7e5b45, 1),
      this.add.rectangle(216, 88, 10, 52, 0x7e5b45, 1),
      this.add.circle(168, 42, 14, 0xd59d6f, 1).setStrokeStyle(3, 0x8c664d, 0.9),
      this.add.circle(205, 42, 12, 0xc98772, 1).setStrokeStyle(3, 0x8c664d, 0.9),
    );

    // Keep the H3.5 physical plaque, now integrated on the front edge of the expanded garden.
    objects.push(
      this.add.rectangle(sign.x - 110, sign.y + 26, 10, 54, 0x775844, 1),
      this.add.rectangle(sign.x + 110, sign.y + 26, 10, 54, 0x775844, 1),
      this.add
        .rectangle(sign.x, sign.y, sign.width, sign.height, 0xf2dfad, 1)
        .setName('sunbeam-composition:willow-garden:sign')
        .setStrokeStyle(5, 0x775844, 0.95),
      this.add
        .text(sign.x, sign.y, planted ? "WILLOW'S MOONFLOWERS" : "WILLOW'S GARDEN", {
          color: '#5d4c4d',
          fontFamily: 'Georgia, serif',
          fontSize: '15px',
          fontStyle: 'bold',
        })
        .setName('sunbeam-composition:willow-garden:sign:text')
        .setOrigin(0.5),
      this.add.circle(sign.x - 126, sign.y, 8, 0xffe48b, 0.96),
      this.add.circle(sign.x + 126, sign.y, 8, 0xffe48b, 0.96),
    );

    this.add
      .container(x, y, objects)
      .setName('sunbeam-composition:willow-garden')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.groundDetail);
  }

  private createResidentialExpansion(): void {
    const palettes = {
      'rosehip-cottage': {
        wall: 0xf2c08e,
        roof: 0xb96f69,
        trim: 0xffedcf,
        door: 0x7f5c50,
        accent: 0xd98ca0,
      },
      'bluebell-cottage': {
        wall: 0xb9d4df,
        roof: 0x7189a7,
        trim: 0xf6efdc,
        door: 0x5f6880,
        accent: 0x8fa9d6,
      },
      'sunpetal-cottage': {
        wall: 0xf2d98e,
        roof: 0xc4875f,
        trim: 0xfff0ca,
        door: 0x8b674b,
        accent: 0xe0a65d,
      },
    } as const;

    const styles = {
      'rosehip-cottage': {
        bodyInset: 0,
        cornerRadius: 30,
        roofPeakX: -42,
        roofLift: 94,
        doorX: -36,
        doorWidth: 64,
        windowXs: [-112, 82],
        porchWidth: 116,
        chimneyX: 102,
        atticWindow: false,
        porchCanopy: false,
      },
      'bluebell-cottage': {
        bodyInset: 18,
        cornerRadius: 18,
        roofPeakX: 22,
        roofLift: 116,
        doorX: 48,
        doorWidth: 60,
        windowXs: [-62],
        porchWidth: 100,
        chimneyX: null,
        atticWindow: true,
        porchCanopy: false,
      },
      'sunpetal-cottage': {
        bodyInset: 4,
        cornerRadius: 26,
        roofPeakX: 64,
        roofLift: 82,
        doorX: -72,
        doorWidth: 68,
        windowXs: [26, 112],
        porchWidth: 126,
        chimneyX: null,
        atticWindow: false,
        porchCanopy: true,
      },
    } as const;

    for (const residence of SUNBEAM_VILLAGE_LAYOUT.residences) {
      const palette = palettes[residence.id];
      const style = styles[residence.id];
      const bodyWidth = residence.width - style.bodyInset * 2;
      const bodyTop = -residence.height / 2 + 66;
      const bodyBottom = residence.height / 2 - 10;
      const bodyHeight = bodyBottom - bodyTop;
      const roofBaseY = bodyTop + 10;
      const roofPeakY = roofBaseY - style.roofLift;
      const doorHeight = 88;
      const doorY = bodyBottom - doorHeight / 2 - 8;
      const stepY = bodyBottom + 8;
      const windowY = bodyBottom - 72;

      const objects: Phaser.GameObjects.GameObject[] = [
        this.add.ellipse(0, residence.height / 2 - 4, residence.width + 72, 66, 0x5f554b, 0.16),
        this.add
          .ellipse(0, 20, residence.width + 96, residence.height + 58, 0x9dce8d, 0.2)
          .setName(`sunbeam-residence:${residence.id}:garden`),
      ];

      if (style.chimneyX !== null) {
        objects.push(
          this.add
            .rectangle(style.chimneyX, roofPeakY + 44, 30, 76, 0x9b6855, 1)
            .setName(`sunbeam-residence:${residence.id}:chimney`)
            .setStrokeStyle(4, 0x76584d, 0.76),
        );
      }

      const cottage = this.add
        .graphics()
        .setName(`sunbeam-residence:${residence.id}:structure`);
      cottage.fillStyle(palette.wall, 1);
      cottage.fillRoundedRect(
        -bodyWidth / 2,
        bodyTop,
        bodyWidth,
        bodyHeight,
        style.cornerRadius,
      );
      cottage.lineStyle(6, 0x7c6654, 0.72);
      cottage.strokeRoundedRect(
        -bodyWidth / 2,
        bodyTop,
        bodyWidth,
        bodyHeight,
        style.cornerRadius,
      );
      cottage.fillStyle(palette.roof, 1);
      cottage.fillTriangle(
        -residence.width / 2 - 18,
        roofBaseY,
        style.roofPeakX,
        roofPeakY,
        residence.width / 2 + 18,
        roofBaseY,
      );
      cottage.lineStyle(6, 0x76584d, 0.74);
      cottage.strokeTriangle(
        -residence.width / 2 - 18,
        roofBaseY,
        style.roofPeakX,
        roofPeakY,
        residence.width / 2 + 18,
        roofBaseY,
      );
      objects.push(cottage);

      if (style.atticWindow) {
        objects.push(
          this.add
            .circle(style.roofPeakX, roofPeakY + 48, 22, 0xc7edf0, 1)
            .setName(`sunbeam-residence:${residence.id}:attic-window`)
            .setStrokeStyle(5, palette.trim, 0.96),
        );
      }

      objects.push(
        this.add
          .rectangle(style.doorX, doorY, style.doorWidth, doorHeight, palette.door, 1)
          .setName(`sunbeam-residence:${residence.id}:door`)
          .setStrokeStyle(5, palette.trim, 0.95),
        this.add.circle(style.doorX + style.doorWidth * 0.3, doorY + 10, 5, 0xffd873, 1),
        this.add
          .rectangle(style.doorX, stepY, style.porchWidth, 26, 0xc7ab7b, 1)
          .setName(`sunbeam-residence:${residence.id}:step`)
          .setStrokeStyle(3, 0x907154, 0.76),
      );

      if (style.porchCanopy) {
        objects.push(
          this.add
            .rectangle(style.doorX, doorY - 60, style.porchWidth + 18, 16, palette.roof, 1)
            .setName(`sunbeam-residence:${residence.id}:porch-canopy`)
            .setStrokeStyle(3, 0x76584d, 0.7),
          this.add.rectangle(style.doorX - style.porchWidth / 2 + 10, doorY - 18, 8, 70, palette.trim, 0.92),
          this.add.rectangle(style.doorX + style.porchWidth / 2 - 10, doorY - 18, 8, 70, palette.trim, 0.92),
        );
      }

      for (const [index, windowX] of style.windowXs.entries()) {
        objects.push(
          this.add
            .rectangle(windowX, windowY, 58, 58, 0xc7edf0, 1)
            .setName(`sunbeam-residence:${residence.id}:window:${index + 1}`)
            .setStrokeStyle(5, palette.trim, 0.96),
          this.add.rectangle(windowX, windowY, 5, 48, 0xffffff, 0.5),
          this.add.rectangle(windowX, windowY, 48, 5, 0xffffff, 0.5),
          this.add.rectangle(windowX, windowY + 38, 70, 14, palette.accent, 0.94),
        );
      }

      objects.push(
        this.add.circle(-residence.width / 2 + 30, residence.height / 2 - 22, 13, palette.accent, 0.92),
        this.add.circle(residence.width / 2 - 26, residence.height / 2 - 26, 11, palette.accent, 0.9),
      );

      this.add
        .container(residence.x, residence.y, objects)
        .setName(`sunbeam-residence:${residence.id}`)
        .setDepth(SUNBEAM_VILLAGE_LAYERS.structure);
    }
  }

  private createUnicornPlayground(): void {
    const playground = SUNBEAM_VILLAGE_LAYOUT.playground;
    const ground = this.add
      .graphics()
      .setName('sunbeam-playground:ground');

    ground.fillStyle(0xc9e3a2, 0.62);
    ground.lineStyle(5, 0x8ebc7c, 0.46);
    ground.beginPath();
    ground.moveTo(-playground.width / 2 + 24, -48);
    ground.lineTo(-playground.width / 2 + 70, -playground.height / 2 + 28);
    ground.lineTo(-65, -playground.height / 2 + 8);
    ground.lineTo(84, -playground.height / 2 + 20);
    ground.lineTo(playground.width / 2 - 18, -86);
    ground.lineTo(playground.width / 2 - 4, 34);
    ground.lineTo(playground.width / 2 - 48, playground.height / 2 - 22);
    ground.lineTo(44, playground.height / 2 - 4);
    ground.lineTo(-100, playground.height / 2 - 18);
    ground.lineTo(-playground.width / 2 + 18, 74);
    ground.closePath();
    ground.fillPath();
    ground.strokePath();

    const playObjects: Phaser.GameObjects.GameObject[] = [
      ground,
      this.add.ellipse(-44, 104, 220, 52, 0x5f6650, 0.1),
      this.add
        .rectangle(-58, 46, 170, 18, 0xc88a62, 1)
        .setAngle(-7)
        .setName('sunbeam-playground:seesaw')
        .setStrokeStyle(3, 0x8b604a, 0.88),
      this.add
        .triangle(-58, 68, 0, 30, 22, 0, 44, 30, 0xe4b567, 1)
        .setOrigin(0.5, 1)
        .setStrokeStyle(3, 0xa97748, 0.86),
    ];

    const slide = this.add.graphics().setName('sunbeam-playground:slide');
    slide.fillStyle(0x86c9dc, 1);
    slide.lineStyle(4, 0x5f8fa3, 0.88);
    slide.fillRoundedRect(62, -92, 26, 102, 10);
    slide.strokeRoundedRect(62, -92, 26, 102, 10);
    slide.fillStyle(0xf2bd67, 1);
    slide.fillTriangle(75, -80, 75, 8, 144, 52);
    slide.lineStyle(4, 0x9f7045, 0.88);
    slide.strokeTriangle(75, -80, 75, 8, 144, 52);
    slide.lineStyle(5, 0x8b6f57, 0.9);
    slide.lineBetween(48, -84, 48, 8);
    slide.lineBetween(42, -68, 64, -68);
    slide.lineBetween(42, -44, 64, -44);
    slide.lineBetween(42, -20, 64, -20);
    playObjects.push(slide);

    const climbingFrame = this.add
      .graphics()
      .setName('sunbeam-playground:climbing-frame');
    climbingFrame.lineStyle(7, 0xb57998, 0.95);
    climbingFrame.strokeRoundedRect(-184, -116, 106, 92, 22);
    climbingFrame.lineStyle(5, 0xf0c36a, 0.94);
    climbingFrame.lineBetween(-158, -110, -158, -28);
    climbingFrame.lineBetween(-132, -110, -132, -28);
    climbingFrame.lineBetween(-106, -110, -106, -28);
    climbingFrame.lineBetween(-180, -84, -82, -84);
    climbingFrame.lineBetween(-180, -56, -82, -56);
    playObjects.push(climbingFrame);

    for (const [x, y, radius, colour] of [
      [144, 94, 25, 0xf2a3c1],
      [174, 55, 17, 0xf4d56f],
      [126, 130, 15, 0xc4a2df],
      [-12, -126, 15, 0x8fc8db],
    ] as const) {
      playObjects.push(
        this.add.circle(x, y, radius, colour, 0.96).setStrokeStyle(3, 0xffffff, 0.4),
      );
    }

    for (const [x, y, colour] of [
      [-18, 118, 0xf3c66c],
      [18, 132, 0x8dc9d8],
      [52, 116, 0xd59bd9],
      [86, 132, 0xf09ab4],
    ] as const) {
      playObjects.push(
        this.add
          .text(x, y, '✦', {
            color: `#${colour.toString(16).padStart(6, '0')}`,
            fontFamily: 'system-ui, sans-serif',
            fontSize: '24px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
    }

    for (const [x, y, width, height, leafA, leafB] of [
      [-150, -190, 88, 46, 0x6fa66f, 0x8cc27b],
      [-70, -202, 96, 50, 0x5f9a68, 0x86bc76],
      [20, -195, 90, 48, 0x72aa70, 0x98ca81],
      [106, -202, 98, 52, 0x639c67, 0x88bd74],
      [174, -184, 76, 42, 0x79ad73, 0x9aca82],
    ] as const) {
      playObjects.push(
        this.add
          .ellipse(x, y, width, height, leafA, 1)
          .setName('sunbeam-playground:shrub')
          .setStrokeStyle(3, 0x527b57, 0.6),
        this.add.ellipse(x - width * 0.2, y - 10, width * 0.56, height * 0.72, leafB, 0.94),
        this.add.ellipse(x + width * 0.2, y - 8, width * 0.52, height * 0.68, leafB, 0.88),
      );
    }
    for (const [x, y, colour] of [
      [-108, -209, 0xf1a0bc],
      [-20, -209, 0xf4cd68],
      [73, -211, 0xc39edd],
      [151, -198, 0x88ccdb],
    ] as const) {
      playObjects.push(this.add.circle(x, y, 7, colour, 0.96));
    }

    this.add
      .container(playground.x, playground.y, playObjects)
      .setName('sunbeam-composition:unicorn-playground')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.groundDetail + 0.2);

    const childAppearances: Record<string, UnicornAppearance> = {
      poppy: {
        bodyColour: 'pink',
        eyeColour: 'violet',
        maneStyle: 'fluffy',
        maneColour: 'rose',
        tailStyle: 'puff',
        tailColour: 'rose',
        hornStyle: 'short',
        marking: 'heart',
        accessory: 'bow',
      },
      milo: {
        bodyColour: 'mint',
        eyeColour: 'green',
        maneStyle: 'swept',
        maneColour: 'gold',
        tailStyle: 'swish',
        tailColour: 'gold',
        hornStyle: 'short',
        marking: 'star',
        accessory: 'none',
      },
      lulu: {
        bodyColour: 'lavender',
        eyeColour: 'blue',
        maneStyle: 'soft',
        maneColour: 'aqua',
        tailStyle: 'curl',
        tailColour: 'aqua',
        hornStyle: 'short',
        marking: 'sparkles',
        accessory: 'flower',
      },
      bean: {
        bodyColour: 'buttercup',
        eyeColour: 'amber',
        maneStyle: 'crest',
        maneColour: 'coral',
        tailStyle: 'ribbon',
        tailColour: 'coral',
        hornStyle: 'short',
        marking: 'freckles',
        accessory: 'ribbon',
      },
    };

    playground.children.forEach((child, index) => {
      const textureKey = `sunbeam-playground-child-${child.id}`;
      createUnicornAppearanceTexture(this, textureKey, childAppearances[child.id]);
      const sprite = this.add
        .sprite(child.x, child.y, getUnicornProductionTextureKey(textureKey, 'idle'))
        .setName(`sunbeam-playground:child:${child.id}`)
        .setDisplaySize(74, 61)
        .setFlipX(child.facing === 'left')
        .setDepth(SUNBEAM_VILLAGE_LAYERS.structureDetail + 0.5 + index * 0.02);

      this.tweens.add({
        targets: sprite,
        x: child.x + child.roamX,
        y: child.y + child.roamY,
        angle: index % 2 === 0 ? 2 : -2,
        duration: 1150 + index * 180,
        delay: index * 170,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        onYoyo: () => sprite.setFlipX(!sprite.flipX),
        onRepeat: () => sprite.setFlipX(!sprite.flipX),
      });
    });
  }

  private createEntrances(): void {
    const west = SUNBEAM_VILLAGE_LAYOUT.entrances.moonflowerGlade.position;
    const east = SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.position;

    const createGate = (
      id: string,
      x: number,
      y: number,
      label: string,
      direction: 'west' | 'east',
    ): void => {
      const boardX = direction === 'west' ? 285 : -285;
      const boardY = -145;
      const boardWidth = 300;
      const supportY = -94;
      const supportOffset = 118;
      const gatePostX = direction === 'west' ? 55 : -55;
      const arrow = direction === 'west' ? '←' : '→';
      const accent = direction === 'west' ? 0xa999dc : 0xf3bd72;
      const objects: Phaser.GameObjects.GameObject[] = [
        this.add.ellipse(gatePostX, -96, 64, 30, 0x5b554e, 0.18),
        this.add.ellipse(gatePostX, 96, 64, 30, 0x5b554e, 0.18),
        this.add
          .rectangle(gatePostX, -98, 30, 92, 0x7b674f, 1)
          .setName(`sunbeam-composition:gateway:${id}:post:north`)
          .setStrokeStyle(4, 0x5f503f, 0.92),
        this.add
          .rectangle(gatePostX, 98, 30, 92, 0x7b674f, 1)
          .setName(`sunbeam-composition:gateway:${id}:post:south`)
          .setStrokeStyle(4, 0x5f503f, 0.92),
        this.add.circle(gatePostX, -150, 22, accent, 1).setStrokeStyle(4, 0xfff3cf, 0.9),
        this.add.circle(gatePostX, 150, 22, accent, 1).setStrokeStyle(4, 0xfff3cf, 0.9),
        this.add.rectangle(boardX - supportOffset, supportY, 9, 58, 0x755640, 1),
        this.add.rectangle(boardX + supportOffset, supportY, 9, 58, 0x755640, 1),
        this.add
          .rectangle(boardX, boardY, boardWidth, 58, 0xf2dfad, 1)
          .setName(`sunbeam-composition:gateway:${id}:sign`)
          .setStrokeStyle(5, 0x755640, 0.96),
        this.add
          .text(boardX, boardY - 1, `${arrow} ${label}`, {
            color: '#5d4b4c',
            fontFamily: 'Georgia, serif',
            fontSize: '17px',
            fontStyle: 'bold',
          })
          .setName(`sunbeam-composition:gateway:${id}:sign:text`)
          .setOrigin(0.5),
      ];

      this.add
        .container(x, y, objects)
        .setName(`sunbeam-composition:gateway:${id}`)
        .setDepth(SUNBEAM_VILLAGE_LAYERS.gateway);
    };

    createGate('moonflower-glade', west.x + 5, west.y, 'MOONFLOWER GLADE', 'west');
    createGate('rainbow-meadow', east.x - 5, east.y, 'RAINBOW MEADOW', 'east');
  }

  private createFlowers(): void {
    // Keep the H3.2 movement corridors and shop approaches clear. These are edge accents only;
    // H3.8 will own the final authored flower-box and village-prop composition.
    const flowerPositions = [
      [420, 1160],
      [890, 1120],
      [2450, 1045],
      [2780, 1280],
      [950, 1660],
      [1900, 1760],
    ] as const;
    for (const [x, y] of flowerPositions) {
      this.add.circle(x, y, 18, 0xffa6c8, 0.95).setDepth(4);
      this.add.circle(x + 18, y + 5, 12, 0xffe47f, 0.95).setDepth(4);
      this.add.circle(x - 15, y + 7, 11, 0xc8a7e8, 0.95).setDepth(4);
    }
  }

  private createCollisionMap(): Phaser.Physics.Arcade.StaticGroup {
    const collisionGroup = this.physics.add.staticGroup();

    for (const collider of SUNBEAM_VILLAGE_MAP.colliders) {
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
      .text(GAME_WIDTH / 2, 24, 'Sunbeam Village', {
        color: '#5f4756',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '27px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dff2',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(SUNBEAM_VILLAGE_LAYERS.ui);

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
