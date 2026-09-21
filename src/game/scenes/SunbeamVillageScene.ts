import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConstants';
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
    const layout = SUNBEAM_VILLAGE_LAYOUT;
    this.add
      .rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xf2d986)
      .setName('sunbeam-composition:base');
    this.add
      .rectangle(map.width / 2, map.height / 2 + 120, map.width, 1220, 0xa9da92, 0.92)
      .setName('sunbeam-composition:grass');

    this.createDistrictGrounding();
    this.createPlaza();
    this.createPathNetwork();

    this.createBakeryExterior();
    this.createAccessoryShopExterior();
    this.createStoryHouseExterior();
    this.createFountain();
    this.createNpcLabels();
    this.createWillowGarden();
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
    const { mainApproaches, shopBranches, willowBranch, residentialBranch } =
      SUNBEAM_VILLAGE_LAYOUT.pathNetwork;
    const routes = [
      ...mainApproaches.map((points) => ({ points, outerWidth: 126, innerWidth: 94 })),
      ...shopBranches.map((points) => ({ points, outerWidth: 76, innerWidth: 54 })),
      { points: willowBranch, outerWidth: 76, innerWidth: 54 },
      { points: residentialBranch, outerWidth: 76, innerWidth: 54 },
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

  private createBakeryExterior(): void {
    const building = SUNBEAM_VILLAGE_LAYOUT.buildings.bakery;
    const objects: Phaser.GameObjects.GameObject[] = [
      this.add.zone(0, 0, 2, 2).setName('village-shopfront:bakery:identity'),
      this.add.ellipse(10, 188, building.width + 92, 82, 0x604c55, 0.18),
    ];

    const cottage = this.add.graphics();
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

    objects.push(
      this.add.rectangle(-148, -188, 50, 112, 0xb87857, 1).setStrokeStyle(5, 0x8c604e, 0.9),
      this.add.rectangle(-148, -250, 64, 20, 0x8c604e, 1),
    );

    for (const [side, x] of [
      ['left', -118],
      ['right', 118],
    ] as const) {
      const window = this.add
        .rectangle(x, 8, 94, 86, 0xbde9f0, 1)
        .setName(`village-shopfront:bakery:window:${side}`)
        .setStrokeStyle(8, 0xfff0cf, 1);
      objects.push(
        window,
        this.add.circle(x, -34, 43, 0xbde9f0, 1).setStrokeStyle(8, 0xfff0cf, 1),
        this.add.rectangle(x, 5, 7, 78, 0xffffff, 0.58),
        this.add.rectangle(x, 5, 82, 7, 0xffffff, 0.58),
        this.add.rectangle(x, 70, 118, 22, 0xa96a4f, 1),
      );
      for (const offset of [-34, 0, 34]) {
        objects.push(this.add.circle(x + offset, 57, 11, 0xffb27d, 0.96));
      }
    }

    const door = this.add
      .rectangle(0, 88, 112, 140, 0x7f5847, 1)
      .setName('village-shopfront:bakery:door')
      .setStrokeStyle(8, 0xffeed0, 0.96);
    objects.push(
      door,
      this.add.circle(0, 20, 54, 0x7f5847, 1).setStrokeStyle(8, 0xffeed0, 0.96),
      this.add.rectangle(0, 62, 70, 70, 0xc6edf0, 0.94),
      this.add.circle(38, 100, 7, 0xffd56e, 1),
      this.add.rectangle(0, 156, 158, 28, 0xd2aa77, 1),
      this.add.rectangle(0, -48, 286, 32, 0xfff4d9, 1),
    );
    for (const x of [-110, -55, 0, 55, 110]) {
      objects.push(this.add.circle(x, -31, 18, x % 110 === 0 ? 0xffd079 : 0xf29b72, 1));
    }

    objects.push(
      this.add
        .text(0, -86, '🥐', { fontFamily: 'system-ui, sans-serif', fontSize: '45px' })
        .setOrigin(0.5),
      this.add
        .text(-105, 205, 'SUNBEAM BAKERY', {
          color: '#684c45',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dff0',
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5),
      this.add
        .text(-105, 238, 'DOOR OPEN • COME IN', {
          color: '#745b52',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          backgroundColor: '#fff4c9dc',
          padding: { x: 8, y: 4 },
        })
        .setName('village-shopfront:bakery:entry-cue')
        .setOrigin(0.5),
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
    ];

    const facade = this.add.graphics();
    facade.fillStyle(0xd89ad5, 1);
    facade.fillRoundedRect(-188, -150, 376, 310, 24);
    facade.lineStyle(7, 0x8f668b, 0.78);
    facade.strokeRoundedRect(-188, -150, 376, 310, 24);
    facade.fillStyle(0xefb7e8, 1);
    facade.fillTriangle(-226, -132, -42, -282, 22, -132);
    facade.fillTriangle(-34, -132, 98, -244, 224, -132);
    facade.lineStyle(6, 0x8f668b, 0.76);
    facade.strokeTriangle(-226, -132, -42, -282, 22, -132);
    facade.strokeTriangle(-34, -132, 98, -244, 224, -132);
    facade.fillStyle(0xffe2f4, 0.55);
    facade.fillRoundedRect(-166, -139, 332, 18, 9);
    objects.push(facade);

    objects.push(
      this.add.rectangle(-148, -105, 42, 118, 0xbe75b9, 1).setStrokeStyle(5, 0x865e82, 0.86),
      this.add.circle(-148, -172, 32, 0xf6c4ee, 1).setStrokeStyle(5, 0x865e82, 0.86),
    );

    const leftWindow = this.add
      .ellipse(-105, 12, 104, 126, 0xc7edf0, 1)
      .setName('village-shopfront:accessory-shop:window:left')
      .setStrokeStyle(8, 0xffedf9, 0.96);
    const rightWindow = this.add
      .ellipse(118, 22, 92, 112, 0xc7edf0, 1)
      .setName('village-shopfront:accessory-shop:window:right')
      .setStrokeStyle(8, 0xffedf9, 0.96);
    objects.push(
      leftWindow,
      rightWindow,
      this.add.rectangle(-105, 14, 7, 104, 0xffffff, 0.52),
      this.add.rectangle(118, 22, 7, 92, 0xffffff, 0.52),
      this.add.ellipse(-105, 82, 126, 28, 0xb879aa, 1),
      this.add.ellipse(118, 82, 112, 26, 0xb879aa, 1),
    );

    const door = this.add
      .rectangle(18, 98, 104, 140, 0x765064, 1)
      .setName('village-shopfront:accessory-shop:door')
      .setStrokeStyle(7, 0xffedf9, 0.95);
    objects.push(
      door,
      this.add.ellipse(18, 31, 104, 58, 0x765064, 1).setStrokeStyle(7, 0xffedf9, 0.95),
      this.add.ellipse(18, 72, 64, 58, 0xc9edf0, 0.94),
      this.add.circle(53, 106, 7, 0xffd56e, 1),
      this.add.rectangle(18, 168, 146, 26, 0xc79a75, 1),
      this.add.ellipse(-12, -74, 184, 42, 0xffeef8, 1),
      this.add.ellipse(-66, -75, 58, 36, 0xf6a6d8, 0.96),
      this.add.ellipse(42, -75, 58, 36, 0xd9a7ef, 0.96),
    );

    objects.push(
      this.add
        .text(-12, -78, '🎀', { fontFamily: 'system-ui, sans-serif', fontSize: '40px' })
        .setOrigin(0.5),
      this.add
        .text(60, 214, 'TWINKLE & THREAD', {
          color: '#684c66',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dff0',
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5),
      this.add
        .text(60, 247, 'DOOR OPEN • COME IN', {
          color: '#745b70',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          backgroundColor: '#fff4c9dc',
          padding: { x: 8, y: 4 },
        })
        .setName('village-shopfront:accessory-shop:entry-cue')
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
    ];

    const storyHouse = this.add.graphics();
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
      this.add.rectangle(142, -228, 54, 148, 0x6d7783, 1).setStrokeStyle(5, 0x4f5f70, 0.9),
      this.add.rectangle(142, -308, 68, 22, 0x4f5f70, 1),
      this.add.circle(0, -178, 46, 0xc3e8f2, 1).setStrokeStyle(8, 0xfff1d7, 0.94),
      this.add
        .text(0, -180, '📖', { fontFamily: 'system-ui, sans-serif', fontSize: '27px' })
        .setOrigin(0.5),
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

    const door = this.add
      .rectangle(0, 112, 108, 154, 0x604c4b, 1)
      .setName('village-shopfront:library:door')
      .setStrokeStyle(8, 0xffefd3, 0.94);
    objects.push(
      door,
      this.add.circle(0, 37, 54, 0x604c4b, 1).setStrokeStyle(8, 0xffefd3, 0.94),
      this.add.rectangle(0, 78, 68, 82, 0xc0e4ea, 0.92),
      this.add.circle(38, 124, 7, 0xffd56e, 1),
      this.add.rectangle(0, 190, 160, 28, 0xb78c68, 1),
      this.add.rectangle(-181, -62, 22, 166, 0xf4cc7a, 0.72),
      this.add.rectangle(181, -62, 22, 166, 0xd99ac8, 0.62),
    );

    objects.push(
      this.add
        .text(118, 228, 'STORY HOUSE', {
          color: '#4d5968',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dff0',
          padding: { x: 12, y: 7 },
        })
        .setOrigin(0.5),
      this.add
        .text(118, 261, 'DOOR OPEN • COME IN', {
          color: '#596473',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          backgroundColor: '#fff4c9dc',
          padding: { x: 8, y: 4 },
        })
        .setName('village-shopfront:library:entry-cue')
        .setOrigin(0.5),
    );

    this.add
      .container(building.x, building.y, objects)
      .setName('village-shopfront:library:wall')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.structure);
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

  private createNpcLabels(): void {
    for (const marker of SUNBEAM_VILLAGE_MAP.npcMarkers) {
      this.add
        .text(marker.position.x, marker.position.y + 61, marker.label, {
          color: '#5c4961',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dfcc',
          padding: { x: 7, y: 4 },
        })
        .setName(`village-npc-label:${marker.id}`)
        .setOrigin(0.5)
        .setDepth(9);
    }
  }

  private createWillowGarden(): void {
    const planted = isWillowGardenPlanted(getBrowserSaveService().load());
    const { x, y } = SUNBEAM_VILLAGE_LAYOUT.willowGarden;
    const objects: Phaser.GameObjects.GameObject[] = [
      this.add
        .ellipse(0, 0, 310, 145, planted ? 0x8a694d : 0x9b7758, 0.95)
        .setStrokeStyle(5, 0x6e8e57, 0.75),
    ];

    if (planted) {
      for (const offset of [-105, -52, 0, 52, 105]) {
        objects.push(
          this.add.circle(offset, -18, 28, 0xffefab, 0.18),
          this.add
            .text(offset, -20, '🌙', {
              fontFamily: 'system-ui, sans-serif',
              fontSize: '34px',
            })
            .setOrigin(0.5),
        );
      }
    } else {
      for (const offset of [-75, 0, 75]) {
        objects.push(
          this.add.rectangle(offset, -9, 5, 30, 0x6d985f, 0.85),
          this.add.circle(offset, -27, 8, 0x94b971, 0.9),
        );
      }
    }

    objects.push(
      this.add
        .text(0, 92, planted ? "Willow's Moonflowers" : "Willow's garden", {
          color: '#5d4c5e',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dfcc',
          padding: { x: 8, y: 5 },
        })
        .setOrigin(0.5),
    );

    this.add
      .container(x, y, objects)
      .setName('sunbeam-composition:willow-garden')
      .setDepth(SUNBEAM_VILLAGE_LAYERS.groundDetail);
  }

  private createEntrances(): void {
    const west = SUNBEAM_VILLAGE_LAYOUT.entrances.moonflowerGlade.position;
    const east = SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.position;

    const createGate = (
      id: string,
      x: number,
      y: number,
      label: string,
      labelX: number,
      labelOriginX: number,
    ): void => {
      const gate = this.add
        .rectangle(0, 0, 110, 370, 0x74a56d, 0.9)
        .setStrokeStyle(4, 0x5f8f5c, 0.72);
      const sign = this.add
        .text(labelX, -145, label, {
          color: '#59485f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
          backgroundColor: '#fff7dedd',
          padding: { x: 10, y: 6 },
        })
        .setOrigin(labelOriginX, 0);
      this.add
        .container(x, y, [gate, sign])
        .setName(`sunbeam-composition:gateway:${id}`)
        .setDepth(SUNBEAM_VILLAGE_LAYERS.gateway);
    };

    createGate('moonflower-glade', west.x + 5, west.y, '← Moonflower Glade', 80, 0);
    createGate('rainbow-meadow', east.x - 5, east.y, 'Rainbow Meadow →', -135, 1);
  }

  private createFlowers(): void {
    // Keep the H3.2 movement corridors and shop approaches clear. These are edge accents only;
    // H3.8 will own the final authored flower-box and village-prop composition.
    const flowerPositions = [
      [420, 1160],
      [890, 1120],
      [2510, 1110],
      [2640, 1260],
      [390, 1580],
      [950, 1660],
      [2020, 1630],
      [2530, 1540],
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
