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
import { InteractionPrompt } from '../ui/InteractionPrompt';
import { MOONFLOWER_GLADE_MAP, setMoonflowerGladePlayerSpawn } from '../world/MoonflowerGladeMap';
import { SUNBEAM_VILLAGE_LOCATION_ID, SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';

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
    actionLabel: 'Look inside',
    position: landmarkApproach('bakery'),
    interactionRadius: 155,
    result: {
      type: 'message',
      title: 'Sunbeam Bakery',
      message: 'Warm berry buns are cooling by the window. This shop will open properly soon.',
    },
  },
  {
    id: 'interaction:village-accessory-shop',
    label: 'Twinkle & Thread',
    actionLabel: 'Peek in',
    position: landmarkApproach('accessory-shop'),
    interactionRadius: 155,
    result: {
      type: 'message',
      title: 'Twinkle & Thread',
      message: 'Ribbons, bows and sparkly accessories fill the window. The door is not open yet.',
    },
  },
  {
    id: 'interaction:village-library',
    label: 'Story House',
    actionLabel: 'Visit',
    position: landmarkApproach('library'),
    interactionRadius: 160,
    result: {
      type: 'message',
      title: 'Story House',
      message: 'A little library packed with valley stories. More shelves will be ready later.',
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
    result: {
      type: 'scene-transition',
      sceneKey: 'WillowStoryScene',
      payload: {
        returnScene: 'SunbeamVillageScene',
      },
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
    actionLabel: 'Look beyond',
    position: entranceApproach('rainbow-meadow'),
    interactionRadius: 175,
    priority: 20,
    result: {
      type: 'message',
      title: 'Rainbow Meadow',
      message:
        'The bright meadow is just beyond the bridge. That path will open in a later adventure.',
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
    this.add.rectangle(map.width / 2, map.height / 2, map.width, map.height, 0xf2d986);
    this.add.rectangle(map.width / 2, map.height / 2 + 120, map.width, 1220, 0xa9da92, 0.92);

    const paths = this.add.graphics().setDepth(2);
    paths.lineStyle(125, 0xf3dfad, 1);
    paths.beginPath();
    paths.moveTo(120, 950);
    paths.lineTo(760, 950);
    paths.lineTo(1500, 1050);
    paths.lineTo(2240, 950);
    paths.lineTo(2880, 950);
    paths.strokePath();
    paths.lineStyle(92, 0xf7e9c5, 0.95);
    for (const landmark of map.landmarks.slice(0, 3)) {
      paths.beginPath();
      paths.moveTo(landmark.approach.x, landmark.approach.y);
      paths.lineTo(landmark.position.x, landmark.position.y + 155);
      paths.strokePath();
    }

    this.add
      .rectangle(map.square.x, map.square.y, map.square.width, map.square.height, 0xe9c88f, 0.7)
      .setStrokeStyle(10, 0xd5aa72, 0.6)
      .setDepth(3);

    this.createBuilding(900, 470, 450, 320, 0xf7a96f, 0xffdf9c, '🥐', 'SUNBEAM BAKERY');
    this.createBuilding(1500, 430, 430, 320, 0xd99bd4, 0xffd9ef, '🎀', 'TWINKLE & THREAD');
    this.createBuilding(2110, 480, 490, 330, 0x87b8d8, 0xd9f1ff, '📚', 'STORY HOUSE');
    this.createFountain();
    this.createNpcMarkers();
    this.createWillowGarden();
    this.createEntrances();
    this.createBunting();
    this.createFlowers();
  }

  private createBuilding(
    x: number,
    y: number,
    width: number,
    height: number,
    wallColour: number,
    roofColour: number,
    icon: string,
    label: string,
  ): void {
    this.add.rectangle(x, y, width, height, wallColour, 1).setDepth(6);
    this.add
      .triangle(x, y - height / 2 - 95, 0, 150, width / 2 + 45, 0, width + 90, 150, roofColour, 1)
      .setDepth(7);
    this.add.rectangle(x, y + height / 2 - 70, 92, 140, 0x8e654f, 1).setDepth(8);
    this.add.circle(x, y - 25, 53, 0xfffbdf, 0.95).setDepth(8);
    this.add
      .text(x, y - 25, icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
      })
      .setOrigin(0.5)
      .setDepth(9);
    this.add
      .text(x, y + height / 2 + 34, label, {
        color: '#684c52',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#fff8dfdd',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5)
      .setDepth(9);
  }

  private createFountain(): void {
    this.add.circle(1500, 1050, 110, 0x8fb9c5, 1).setDepth(7);
    this.add.circle(1500, 1050, 86, 0x9fe6ed, 1).setDepth(8);
    this.add.circle(1500, 1050, 38, 0xffdc77, 1).setDepth(9);
    this.add
      .text(1500, 1050, '☀', {
        color: '#fff5c4',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);
  }

  private createNpcMarkers(): void {
    for (const marker of SUNBEAM_VILLAGE_MAP.npcMarkers) {
      this.add
        .circle(marker.position.x, marker.position.y, 42, 0xfff3c6, 0.9)
        .setStrokeStyle(4, marker.id === 'willow' ? 0x6ba271 : 0xb28ab9, 0.95)
        .setDepth(8);
      this.add
        .text(marker.position.x, marker.position.y, marker.id === 'willow' ? '🌿' : '✦', {
          color: '#6c5272',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '28px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(9);
      this.add
        .text(marker.position.x, marker.position.y + 61, marker.label, {
          color: '#5c4961',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
          backgroundColor: '#fff8dfcc',
          padding: { x: 7, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(9);
    }
  }

  private createWillowGarden(): void {
    const planted = isWillowGardenPlanted(getBrowserSaveService().load());
    const x = 980;
    const y = 1390;
    this.add
      .ellipse(x, y, 310, 145, planted ? 0x8a694d : 0x9b7758, 0.95)
      .setStrokeStyle(5, 0x6e8e57, 0.75)
      .setDepth(5);

    if (planted) {
      const positions = [-105, -52, 0, 52, 105];
      for (const offset of positions) {
        this.add.circle(x + offset, y - 18, 28, 0xffefab, 0.18).setDepth(6);
        this.add
          .text(x + offset, y - 20, '🌙', {
            fontFamily: 'system-ui, sans-serif',
            fontSize: '34px',
          })
          .setOrigin(0.5)
          .setDepth(7);
      }
    } else {
      for (const offset of [-75, 0, 75]) {
        this.add.rectangle(x + offset, y - 9, 5, 30, 0x6d985f, 0.85).setDepth(6);
        this.add.circle(x + offset, y - 27, 8, 0x94b971, 0.9).setDepth(7);
      }
    }

    this.add
      .text(x, y + 92, planted ? "Willow's Moonflowers" : "Willow's garden", {
        color: '#5d4c5e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff8dfcc',
        padding: { x: 8, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  private createEntrances(): void {
    this.add.rectangle(125, 950, 110, 370, 0x74a56d, 0.9).setDepth(5);
    this.add.rectangle(2875, 950, 110, 370, 0x74a56d, 0.9).setDepth(5);
    this.add
      .text(205, 805, '← Moonflower Glade', {
        color: '#59485f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dedd',
        padding: { x: 10, y: 6 },
      })
      .setDepth(10);
    this.add
      .text(2740, 805, 'Rainbow Meadow →', {
        color: '#59485f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#fff7dedd',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(1, 0)
      .setDepth(10);
  }

  private createBunting(): void {
    const graphics = this.add.graphics().setDepth(11);
    graphics.lineStyle(6, 0x8f6a75, 0.75);
    graphics.lineBetween(800, 745, 2200, 745);
    const colours = [0xf28aa5, 0xf5c968, 0x7cc6d8, 0x9bc477, 0xc99ed5];
    for (let x = 830, index = 0; x <= 2170; x += 85, index += 1) {
      this.add
        .triangle(x, 766, 0, 0, 30, 0, 15, 38, colours[index % colours.length], 0.95)
        .setDepth(12);
    }
  }

  private createFlowers(): void {
    const flowerPositions = [
      [620, 760],
      [700, 690],
      [2350, 720],
      [2420, 800],
      [790, 1420],
      [980, 1510],
      [2050, 1490],
      [2250, 1390],
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
      .setDepth(116)
      .setVisible(false);
  }
}
