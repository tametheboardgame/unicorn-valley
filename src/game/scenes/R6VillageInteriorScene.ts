import Phaser from 'phaser';
import type { ItemId, QuestId } from '../../content/contentTypes';
import {
  MAPLE_CAKE_MOONFLOWER_FLAG,
  MAPLE_CAKE_QUEST_ID,
  MAPLE_CAKE_RAINBOW_FLAG,
  MAPLE_CAKE_SUNSHINE_FLAG,
  MAPLE_CHARACTER_ID,
  TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_MAP_QUEST_ID,
  TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
  TANSY_CHARACTER_ID,
  WOBBLY_CAKE_ITEM_ID,
  type MapleCakeTheme,
} from '../../content/r6VillageContent';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DiscoveryService } from '../discovery/DiscoveryService';
import { StoryHouseService } from '../discovery/StoryHouseService';
import { BakeryService } from '../economy/BakeryService';
import { ShopPurchaseTapGuard } from '../economy/ShopPurchaseTapGuard';
import { ShopService } from '../economy/ShopService';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { gameEventBus } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import { setInteractionModalActive } from '../interaction/InteractionModalState';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getSceneInteractionRegistry } from '../interaction/SceneInteractionRegistry';
import { R6_SUPPORTING_RESIDENTS } from '../population/R6SupportingResidentContent';
import type {
  SupportingResidentDefinition,
  SupportingResidentId,
} from '../population/AmbientPopulationTypes';
import { getVillageInteriorOccupancyService } from '../population/VillageInteriorOccupancy';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getQuestStepId } from '../quests/QuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import {
  getVillageInteriorAnchor,
  getVillageInteriorMap,
  isVillageInteriorId,
  VILLAGE_INTERIOR_SCENE_DATA_KEY,
  type VillageInteriorDefinition,
  type VillageInteriorId,
} from '../world/VillageInteriorMap';
import { worldDepthForY } from '../world/WorldDepth';
import { WalkableInteriorRuntime } from './WalkableInteriorRuntime';
import { createVillageInteriorResidentPresentation } from './VillageInteriorResidentPresentation';

interface VillageInteriorSceneData {
  interiorId?: VillageInteriorId;
  returnScene?: string;
}

interface InteriorPresentationDefinition {
  title: string;
  subtitle: string;
  icon: string;
  wallColour: number;
  floorColour: number;
  accentColour: number;
}

const INTERIOR_INTERACTION_OWNER = 'village-interior';

const PRESENTATION: Readonly<Record<VillageInteriorId, InteriorPresentationDefinition>> = {
  bakery: {
    title: 'Sunbeam Bakery',
    subtitle: 'Fresh bakes, picnic treasures and Maple’s famously wobbly cake plan.',
    icon: '🥐',
    wallColour: 0xfff8ec,
    floorColour: 0xf7e7cf,
    accentColour: 0xe7a4b2,
  },
  'accessory-shop': {
    title: 'Twinkle & Thread',
    subtitle: 'Wearable treasures that grow with your adventures, never your chores.',
    icon: '🎀',
    wallColour: 0xf6d5ef,
    floorColour: 0xc894bd,
    accentColour: 0xc56fb6,
  },
  library: {
    title: 'Story House',
    subtitle: 'Maps, clue cards and little stories from places you have really found.',
    icon: '📚',
    wallColour: 0xd9edff,
    floorColour: 0x8eb5c8,
    accentColour: 0x648fac,
  },
};

function supportingResident(id: SupportingResidentId): SupportingResidentDefinition {
  const resident = R6_SUPPORTING_RESIDENTS.find((candidate) => candidate.id === id);
  if (!resident) {
    throw new Error(`Village interior requires supporting resident ${id}`);
  }
  return resident;
}

function questIsAt(questId: QuestId, stepIndex: number): boolean {
  const progress = getBrowserQuestEngine().getProgress(questId);
  return (
    progress.status === 'active' && progress.currentStepId === getQuestStepId(questId, stepIndex)
  );
}

export class VillageInteriorScene extends Phaser.Scene {
  private interiorId: VillageInteriorId = 'accessory-shop';
  private returnScene = 'SunbeamVillageScene';
  private closing = false;
  private runtime: WalkableInteriorRuntime | null = null;
  private balanceText: Phaser.GameObjects.Text | null = null;
  private occupant: Phaser.GameObjects.Container | null = null;
  private overlay: Phaser.GameObjects.Container | null = null;
  private readonly purchaseGuard = new ShopPurchaseTapGuard();
  private storyCardCursor = 0;

  public constructor() {
    super('VillageInteriorScene');
  }

  public create(data: VillageInteriorSceneData = {}): void {
    this.interiorId = isVillageInteriorId(data.interiorId) ? data.interiorId : 'accessory-shop';
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;
    this.storyCardCursor = 0;
    this.purchaseGuard.reset();
    this.data.set(VILLAGE_INTERIOR_SCENE_DATA_KEY, this.interiorId);

    const map = getVillageInteriorMap(this.interiorId);
    getVillageInteriorOccupancyService().enter(this.interiorId);
    this.createEnvironment(map, PRESENTATION[this.interiorId]);

    this.runtime = new WalkableInteriorRuntime(this, {
      playerTextureKey: `player-unicorn-village-interior:${this.interiorId}`,
      map,
      colliderNamePrefix: `village-interior-collider:${this.interiorId}`,
      onBack: () => this.leaveInterior(),
    });
    this.runtime.create();
    this.renderInteriorOccupant();
    this.registerInteractions();
    this.createHud(PRESENTATION[this.interiorId]);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.shutdownInterior());
  }

  public update(time: number): void {
    this.runtime?.update(time);
  }

  private createEnvironment(
    map: VillageInteriorDefinition,
    definition: InteriorPresentationDefinition,
  ): void {
    const shell = map.roomShell;
    const centreX = (shell.left + shell.right) / 2;
    const roomWidth = shell.right - shell.left;
    const roomHeight = shell.bottom - shell.top;

    const outsideColour = this.interiorId === 'bakery' ? 0xeadde7 : 0x5b4662;
    this.cameras.main.setBackgroundColor(this.interiorId === 'bakery' ? '#f2e7ed' : '#5d4964');
    this.add
      .rectangle(map.width / 2, map.height / 2, map.width, map.height, outsideColour, 1)
      .setName(`village-interior:${this.interiorId}:outside`)
      .setDepth(0);
    this.add
      .rectangle(
        centreX,
        (shell.top + shell.backWallBottom) / 2,
        roomWidth,
        shell.backWallBottom - shell.top,
        definition.wallColour,
        1,
      )
      .setName(`village-interior:${this.interiorId}:back-wall`)
      .setDepth(2);
    this.add
      .rectangle(
        centreX,
        (shell.backWallBottom + shell.bottom) / 2,
        roomWidth,
        shell.bottom - shell.backWallBottom,
        definition.floorColour,
        1,
      )
      .setName(`village-interior:${this.interiorId}:floor`)
      .setDepth(3);
    this.add
      .rectangle(centreX, (shell.top + shell.bottom) / 2, roomWidth, roomHeight, 0xffffff, 0)
      .setName(`village-interior:${this.interiorId}:room-shell`)
      .setStrokeStyle(10, definition.accentColour, 0.95)
      .setDepth(4);

    this.createWindow(390, 225, definition.accentColour);
    this.createWindow(1110, 225, definition.accentColour);
    this.createDoorway(map, definition.accentColour);

    if (this.interiorId === 'bakery') {
      this.createBakerySet();
    } else if (this.interiorId === 'library') {
      this.createStoryHouseSet();
    } else {
      this.createThreadSet();
    }
  }

  private createWindow(x: number, y: number, accent: number): void {
    this.add.rectangle(x, y, 210, 132, 0xbce9f4, 1).setStrokeStyle(8, accent, 0.82).setDepth(5);
    this.add.rectangle(x, y, 9, 120, 0xffffff, 0.62).setDepth(6);
    this.add.rectangle(x, y, 198, 9, 0xffffff, 0.62).setDepth(6);
    this.add.circle(x - 52, y - 34, 20, 0xffef9d, 0.82).setDepth(5.5);
  }

  private createDoorway(map: VillageInteriorDefinition, accent: number): void {
    const exit = map.anchors.exit;
    this.add
      .ellipse(
        exit.position.x,
        exit.position.y + 8,
        map.roomShell.doorWidth + 54,
        92,
        0x4b3852,
        0.72,
      )
      .setName(`village-interior:${this.interiorId}:exit`)
      .setStrokeStyle(5, accent, 0.72)
      .setDepth(worldDepthForY(exit.position.y + 20, 0.1));
    this.add
      .text(exit.position.x, exit.position.y + 4, 'Sunbeam Village', {
        color: '#fff7df',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(exit.position.y + 20, 0.2));
  }

  private createBakerySet(): void {
    const counter = getVillageInteriorAnchor('bakery', 'counter');
    const recipeShelf = getVillageInteriorAnchor('bakery', 'primary-feature');
    const cakeTable = getVillageInteriorAnchor('bakery', 'secondary-feature');

    // Light architectural detail: pale floorboards and a soft dado keep the room bright.
    for (let y = 410; y <= 930; y += 92) {
      this.add
        .rectangle(750, y, 1260, 3, 0xd9bfa6, 0.3)
        .setDepth(3.1);
    }
    this.add.rectangle(750, 337, 1280, 24, 0xf2ced4, 0.9).setDepth(4.7);
    this.add.rectangle(750, 350, 1280, 5, 0xffffff, 0.72).setDepth(4.8);

    this.createBakeryWallShelf(505, 284, 300);
    this.createBakeryWallShelf(855, 284, 260);

    // Compact production corner on the left keeps the middle of the shop open.
    const oven = this.add.graphics().setName('village-interior:bakery:oven');
    oven.fillStyle(0xf0c7a3, 1);
    oven.lineStyle(5, 0xc98d77, 0.88);
    oven.fillRoundedRect(165, 380, 130, 150, 18);
    oven.strokeRoundedRect(165, 380, 130, 150, 18);
    oven.fillStyle(0x6e5965, 1);
    oven.fillRoundedRect(191, 420, 78, 68, 14);
    oven.fillStyle(0xffc46b, 0.9);
    oven.fillEllipse(230, 463, 42, 24);
    oven.fillStyle(0xff8b66, 0.92);
    oven.fillTriangle(214, 470, 230, 435, 246, 470);
    oven.setDepth(worldDepthForY(520, 0.2));

    const prep = this.add.graphics().setName('village-interior:bakery:prep-bench');
    prep.fillStyle(0xf2d6bd, 1);
    prep.lineStyle(4, 0xc99d89, 0.82);
    prep.fillRoundedRect(330, 423, 175, 76, 15);
    prep.strokeRoundedRect(330, 423, 175, 76, 15);
    prep.fillStyle(0xfffbf0, 1);
    prep.fillEllipse(385, 444, 48, 22);
    prep.lineStyle(3, 0xc38d9d, 0.85);
    prep.lineBetween(431, 443, 466, 430);
    prep.fillStyle(0xe5b765, 1);
    prep.fillCircle(470, 446, 11);
    prep.setDepth(worldDepthForY(500, 0.22));

    // The service counter is deliberately narrower; the glass patisserie case is the hero.
    const display = this.add.graphics().setName('village-interior:bakery:counter');
    display.fillStyle(0xd99ba6, 1);
    display.lineStyle(5, 0xb97988, 0.88);
    display.fillRoundedRect(counter.position.x - 220, counter.position.y - 16, 440, 92, 20);
    display.strokeRoundedRect(counter.position.x - 220, counter.position.y - 16, 440, 92, 20);
    display.fillStyle(0xfff7e8, 1);
    display.fillRoundedRect(counter.position.x - 204, counter.position.y + 16, 408, 42, 12);
    display.lineStyle(3, 0xe9c1c8, 0.92);
    display.strokeRoundedRect(counter.position.x - 204, counter.position.y + 16, 408, 42, 12);
    display.setDepth(worldDepthForY(counter.position.y + 68, 0.3));

    const glass = this.add.graphics().setName('village-interior:bakery:patisserie-case');
    glass.fillStyle(0xdff8fb, 0.28);
    glass.lineStyle(4, 0xa6d7dd, 0.84);
    glass.fillRoundedRect(counter.position.x - 205, counter.position.y - 92, 410, 88, 18);
    glass.strokeRoundedRect(counter.position.x - 205, counter.position.y - 92, 410, 88, 18);
    glass.lineStyle(2, 0xffffff, 0.72);
    glass.lineBetween(counter.position.x - 170, counter.position.y - 76, counter.position.x + 155, counter.position.y - 76);
    glass.setDepth(worldDepthForY(counter.position.y + 68, 0.46));

    this.createBakeryDisplayCake(counter.position.x - 118, counter.position.y - 39, 0.74, {
      sponge: 0xf6c98a,
      icing: 0xf4a9c1,
      accent: 0xfff1a3,
    });
    this.createBakeryDisplayCake(counter.position.x, counter.position.y - 39, 0.64, {
      sponge: 0xe6c493,
      icing: 0xd7b6ef,
      accent: 0xaee7e0,
    });
    this.createBakeryDisplayCake(counter.position.x + 118, counter.position.y - 39, 0.7, {
      sponge: 0xf0bd83,
      icing: 0xffe4a3,
      accent: 0xf49aaa,
    });

    this.add
      .text(counter.position.x, counter.position.y + 39, 'SUNBEAM PATISSERIE', {
        color: '#744f67',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        letterSpacing: 1.2,
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(counter.position.y + 70, 0.5));

    this.createBakeryRecipeCabinet(recipeShelf.position.x, recipeShelf.position.y);
    this.createBakeryCakeShowcase(cakeTable.position.x, cakeTable.position.y);

    // Small café nook stays at the edge so the centre aisle remains generous.
    const cafe = this.add.graphics().setName('village-interior:bakery:cafe-table');
    cafe.fillStyle(0xf2d6bd, 1);
    cafe.lineStyle(4, 0xc99d89, 0.78);
    cafe.fillEllipse(1165, 745, 160, 98);
    cafe.strokeEllipse(1165, 745, 160, 98);
    cafe.fillStyle(0xf7c9d6, 1);
    cafe.fillCircle(1140, 731, 16);
    cafe.fillStyle(0xfff7e8, 1);
    cafe.fillCircle(1190, 730, 18);
    cafe.lineStyle(3, 0xb88aa0, 0.75);
    cafe.strokeCircle(1190, 730, 18);
    cafe.setDepth(worldDepthForY(790, 0.2));

    for (const x of [1075, 1255]) {
      const chair = this.add.graphics();
      chair.fillStyle(0xb98b9f, 1);
      chair.lineStyle(3, 0x8c657c, 0.78);
      chair.fillCircle(x, 785, 28);
      chair.strokeCircle(x, 785, 28);
      chair.setDepth(worldDepthForY(815, 0.18));
    }

    // Restrained magical detail rather than loose emoji clutter.
    for (const sparkle of [
      { x: 585, y: 432, r: 5 },
      { x: 1032, y: 438, r: 4 },
      { x: 314, y: 632, r: 4 },
      { x: 442, y: 645, r: 5 },
      { x: 1242, y: 640, r: 4 },
    ]) {
      this.createBakerySparkle(sparkle.x, sparkle.y, sparkle.r);
    }
  }

  private createBakeryWallShelf(x: number, y: number, width: number): void {
    const shelf = this.add.graphics();
    shelf.fillStyle(0xe9b99e, 1);
    shelf.lineStyle(3, 0xc88f7d, 0.82);
    shelf.fillRoundedRect(x - width / 2, y, width, 16, 8);
    shelf.strokeRoundedRect(x - width / 2, y, width, 16, 8);

    for (const offset of [-width * 0.3, 0, width * 0.3]) {
      shelf.fillStyle(0xf2be78, 1);
      shelf.lineStyle(2, 0xca8a61, 0.8);
      shelf.fillEllipse(x + offset, y - 18, 58, 30);
      shelf.strokeEllipse(x + offset, y - 18, 58, 30);
      shelf.lineStyle(2, 0xffe0a1, 0.72);
      shelf.lineBetween(x + offset - 15, y - 24, x + offset + 15, y - 12);
    }
    shelf.setDepth(5.35);
  }

  private createBakeryDisplayCake(
    x: number,
    y: number,
    scale: number,
    colours: { sponge: number; icing: number; accent: number },
  ): void {
    const cake = this.add.graphics();
    cake.fillStyle(0xb992a5, 0.32);
    cake.fillEllipse(x, y + 31 * scale, 88 * scale, 16 * scale);
    cake.fillStyle(0xfff8ec, 1);
    cake.lineStyle(2, 0xcaa0b1, 0.78);
    cake.fillEllipse(x, y + 23 * scale, 84 * scale, 14 * scale);
    cake.strokeEllipse(x, y + 23 * scale, 84 * scale, 14 * scale);

    cake.fillStyle(colours.sponge, 1);
    cake.fillRoundedRect(x - 31 * scale, y - 3 * scale, 62 * scale, 28 * scale, 7 * scale);
    cake.fillStyle(colours.icing, 1);
    cake.fillRoundedRect(x - 33 * scale, y - 8 * scale, 66 * scale, 13 * scale, 7 * scale);
    cake.fillCircle(x - 20 * scale, y + 4 * scale, 8 * scale);
    cake.fillCircle(x, y + 5 * scale, 9 * scale);
    cake.fillCircle(x + 21 * scale, y + 4 * scale, 8 * scale);

    cake.fillStyle(colours.sponge, 1);
    cake.fillRoundedRect(x - 21 * scale, y - 27 * scale, 42 * scale, 22 * scale, 6 * scale);
    cake.fillStyle(colours.icing, 1);
    cake.fillRoundedRect(x - 23 * scale, y - 31 * scale, 46 * scale, 11 * scale, 6 * scale);

    cake.fillStyle(colours.accent, 1);
    cake.fillCircle(x, y - 38 * scale, 7 * scale);
    cake.fillCircle(x - 15 * scale, y - 17 * scale, 3.8 * scale);
    cake.fillCircle(x + 15 * scale, y - 17 * scale, 3.8 * scale);
    cake.setDepth(worldDepthForY(y + 65, 0.42));
  }

  private createBakeryRecipeCabinet(x: number, y: number): void {
    const cabinet = this.add.graphics().setName('village-interior:bakery:recipe-shelf');
    cabinet.fillStyle(0xf4d8bf, 1);
    cabinet.lineStyle(4, 0xc99d89, 0.78);
    cabinet.fillRoundedRect(x - 68, y - 88, 136, 176, 16);
    cabinet.strokeRoundedRect(x - 68, y - 88, 136, 176, 16);
    cabinet.fillStyle(0xfffbf3, 0.95);
    cabinet.fillRoundedRect(x - 51, y - 57, 102, 42, 8);
    cabinet.fillRoundedRect(x - 51, y + 2, 102, 48, 8);
    cabinet.fillStyle(0xe7a4b2, 1);
    cabinet.fillRoundedRect(x - 34, y - 46, 18, 26, 4);
    cabinet.fillStyle(0xb6d9dc, 1);
    cabinet.fillRoundedRect(x - 8, y - 49, 22, 29, 4);
    cabinet.fillStyle(0xf3c878, 1);
    cabinet.fillRoundedRect(x + 22, y - 44, 16, 24, 4);
    cabinet.fillStyle(0xb98b9f, 1);
    cabinet.fillRoundedRect(x - 34, y + 12, 68, 6, 3);
    cabinet.setDepth(worldDepthForY(y + 85, 0.18));

    this.add
      .text(x, y - 112, 'RECIPES', {
        color: '#76566d',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 88, 0.26));
  }

  private createBakeryCakeShowcase(x: number, y: number): void {
    const stand = this.add.graphics().setName('village-interior:bakery:cake-table');
    stand.fillStyle(0xe8b3bd, 1);
    stand.lineStyle(4, 0xb97b8b, 0.8);
    stand.fillEllipse(x, y + 42, 230, 72);
    stand.strokeEllipse(x, y + 42, 230, 72);
    stand.fillStyle(0xfaf2df, 1);
    stand.fillRoundedRect(x - 18, y + 36, 36, 66, 12);
    stand.fillEllipse(x, y + 99, 96, 28);
    stand.setDepth(worldDepthForY(y + 103, 0.2));

    const cake = this.add.graphics();
    cake.fillStyle(0xf3c884, 1);
    cake.fillRoundedRect(x - 55, y - 6, 110, 42, 12);
    cake.fillStyle(0xf3a8c0, 1);
    cake.fillRoundedRect(x - 58, y - 13, 116, 18, 9);
    cake.fillCircle(x - 37, y + 2, 12);
    cake.fillCircle(x - 12, y + 4, 13);
    cake.fillCircle(x + 15, y + 3, 12);
    cake.fillCircle(x + 40, y + 2, 11);
    cake.fillStyle(0xf6d88f, 1);
    cake.fillRoundedRect(x - 39, y - 44, 78, 35, 10);
    cake.fillStyle(0xd7b6ef, 1);
    cake.fillRoundedRect(x - 42, y - 51, 84, 17, 8);
    cake.fillStyle(0xaee7e0, 1);
    cake.fillCircle(x - 23, y - 57, 7);
    cake.fillStyle(0xffef9e, 1);
    cake.fillCircle(x, y - 63, 8);
    cake.fillStyle(0xf49aaa, 1);
    cake.fillCircle(x + 24, y - 57, 7);
    cake.setDepth(worldDepthForY(y + 104, 0.31));

    const dome = this.add.graphics().setName('village-interior:bakery:magic-cake-dome');
    dome.fillStyle(0xdff8fb, 0.17);
    dome.lineStyle(4, 0xa6d7dd, 0.7);
    dome.fillEllipse(x, y - 2, 174, 152);
    dome.strokeEllipse(x, y - 2, 174, 152);
    dome.fillStyle(0xf7d98c, 1);
    dome.fillCircle(x, y - 84, 8);
    dome.setDepth(worldDepthForY(y + 104, 0.4));

    for (const point of [
      { dx: -68, dy: -48, r: 4 },
      { dx: 68, dy: -30, r: 4 },
      { dx: -60, dy: 8, r: 3 },
      { dx: 55, dy: 18, r: 3 },
    ]) {
      this.createBakerySparkle(x + point.dx, y + point.dy, point.r);
    }
  }

  private createBakerySparkle(x: number, y: number, radius: number): void {
    const sparkle = this.add.graphics();
    sparkle.fillStyle(0xffdf82, 0.95);
    sparkle.fillTriangle(x, y - radius * 2.4, x - radius, y, x + radius, y);
    sparkle.fillTriangle(x, y + radius * 2.4, x - radius, y, x + radius, y);
    sparkle.fillTriangle(x - radius * 2.4, y, x, y - radius, x, y + radius);
    sparkle.fillTriangle(x + radius * 2.4, y, x, y - radius, x, y + radius);
    sparkle.setDepth(worldDepthForY(y + 40, 0.5));
  }

  private createStoryHouseSet(): void {
    for (const x of [400, 750, 1100]) {
      this.add
        .rectangle(x, 355, 190, 220, 0x6f8aa0, 1)
        .setName(`village-interior:library:shelf:${x}`)
        .setStrokeStyle(5, 0x526f86, 0.9)
        .setDepth(worldDepthForY(465, 0.12));
      for (let row = 0; row < 3; row += 1) {
        this.add.rectangle(x, 302 + row * 62, 166, 8, 0x435d72, 0.9).setDepth(6);
        this.add
          .text(x, 278 + row * 62, '📕 📗 📘 📙', { fontFamily: UI_FONT, fontSize: '18px' })
          .setOrigin(0.5)
          .setDepth(7);
      }
    }
    const table = getVillageInteriorAnchor('library', 'primary-feature');
    this.add
      .ellipse(table.position.x, table.position.y, 390, 145, 0xf2d7a7, 1)
      .setName('village-interior:library:story-table')
      .setStrokeStyle(4, 0xb58c60, 0.75)
      .setDepth(worldDepthForY(table.position.y + 58, 0.22));
    this.add
      .text(table.position.x, table.position.y - 4, '🗺️   📖   ✨', {
        fontFamily: UI_FONT,
        fontSize: '36px',
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(table.position.y + 60, 0.3));
  }

  private createThreadSet(): void {
    const counter = getVillageInteriorAnchor('accessory-shop', 'counter');
    const display = getVillageInteriorAnchor('accessory-shop', 'primary-feature');
    const mirror = getVillageInteriorAnchor('accessory-shop', 'secondary-feature');

    this.add
      .rectangle(counter.position.x, counter.position.y, 540, 122, 0xb77baa, 1)
      .setName('village-interior:accessory-shop:counter')
      .setStrokeStyle(5, 0x8e5d86, 0.9)
      .setDepth(worldDepthForY(counter.position.y + 68, 0.3));
    for (const [x, icon] of [
      [610, '🎀'],
      [705, '🌸'],
      [800, '✨'],
      [895, '🌈'],
    ] as const) {
      this.add
        .circle(x, counter.position.y - 38, 38, 0xfff6fb, 0.86)
        .setStrokeStyle(3, 0xd8a4cf, 0.9)
        .setDepth(6);
      this.add
        .text(x, counter.position.y - 38, icon, { fontFamily: UI_FONT, fontSize: '30px' })
        .setOrigin(0.5)
        .setDepth(7);
    }
    this.add
      .rectangle(display.position.x, display.position.y, 150, 128, 0xe7b9dc, 1)
      .setName('village-interior:accessory-shop:display')
      .setStrokeStyle(4, 0x9c6c95, 0.8)
      .setDepth(worldDepthForY(display.position.y + 55, 0.22));
    this.add
      .text(display.position.x, display.position.y - 4, '🎀\n✨', {
        fontFamily: UI_FONT,
        fontSize: '30px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(display.position.y + 58, 0.3));
    this.add
      .ellipse(mirror.position.x, mirror.position.y - 38, 120, 180, 0xf8edff, 1)
      .setName('village-interior:accessory-shop:mirror')
      .setStrokeStyle(6, 0xc99bc5, 0.9)
      .setDepth(worldDepthForY(mirror.position.y + 52, 0.2));
  }

  private renderInteriorOccupant(): void {
    const occupancy = getVillageInteriorOccupancyService();
    const assignment = occupancy.getInteriorAssignment(this.interiorId);
    if (!assignment || !occupancy.isResidentAllowedInScene(assignment.residentId, this.scene.key)) {
      return;
    }

    const resident = supportingResident(assignment.residentId);
    const work = getVillageInteriorAnchor(this.interiorId, assignment.workAnchorId);
    const presentation = createVillageInteriorResidentPresentation(this, resident, {
      x: work.position.x,
      y: work.position.y,
      displaySize: { width: 152, height: 128 },
      accessories: assignment.supportedRoleAccessories,
    });
    presentation.container.setData('occupancy-role', assignment.role);
    this.occupant = presentation.container;
  }

  private registerInteractions(): void {
    const map = getVillageInteriorMap(this.interiorId);
    const targets: InteractionTarget[] = [
      {
        id: `interaction:village-interior:${this.interiorId}:exit`,
        label: 'Sunbeam Village',
        actionLabel: 'Go outside',
        actionKind: 'enter',
        position: map.anchors.exit.approach,
        interactionRadius: 145,
        priority: 40,
        result: { type: 'callback', activate: () => this.leaveInterior() },
      },
    ];

    if (this.interiorId === 'bakery') {
      targets.push(...this.createBakeryInteractions());
    } else if (this.interiorId === 'library') {
      targets.push(...this.createStoryHouseInteractions());
    } else {
      targets.push(...this.createThreadInteractions());
    }

    getSceneInteractionRegistry(this).replaceOwnerTargets(INTERIOR_INTERACTION_OWNER, targets);
  }

  private createBakeryInteractions(): InteractionTarget[] {
    const counter = getVillageInteriorAnchor('bakery', 'counter');
    const worker = getVillageInteriorAnchor('bakery', 'npc-work');
    const recipes = getVillageInteriorAnchor('bakery', 'primary-feature');
    const cake = getVillageInteriorAnchor('bakery', 'secondary-feature');
    const targets: InteractionTarget[] = [
      {
        id: 'interaction:village-interior:bakery:counter',
        label: 'Bakery counter',
        actionLabel: 'Browse',
        actionKind: 'buy',
        position: counter.approach,
        interactionRadius: 155,
        priority: 28,
        result: { type: 'callback', activate: () => this.openBakeryCounter() },
      },
      {
        id: 'interaction:village-interior:bakery:cake-table',
        label: 'Wobbly Cake table',
        actionLabel: 'Plan a cake',
        actionKind: 'use',
        position: cake.approach,
        interactionRadius: 145,
        priority: 22,
        result: { type: 'callback', activate: () => this.openCakePlan() },
      },
      {
        id: 'interaction:village-interior:bakery:recipes',
        label: 'Recipe shelf',
        actionLabel: this.shouldShowBakeryMapCorner() ? 'Search' : 'Browse',
        actionKind: 'inspect',
        position: recipes.approach,
        interactionRadius: 145,
        priority: 20,
        result: {
          type: 'callback',
          activate: () => {
            if (this.shouldShowBakeryMapCorner()) {
              this.findBakeryMapCorner();
              return;
            }
            this.showFeedback(
              'Maple’s recipe shelf contains berry buns, cloud biscuits and one page simply labelled “TRY MORE SPRINKLES”.',
              recipes.approach,
            );
          },
        },
      },
    ];

    if (this.occupant) {
      targets.push({
        id: 'interaction:village-interior:bakery:baker',
        label: 'Cinnamon',
        actionLabel: 'Talk',
        actionKind: 'talk',
        position: worker.approach,
        interactionRadius: 160,
        priority: 35,
        result: { type: 'callback', activate: () => this.talkToBakeryBaker() },
      });
    }
    return targets;
  }

  private createStoryHouseInteractions(): InteractionTarget[] {
    const worker = getVillageInteriorAnchor('library', 'npc-work');
    const storyTable = getVillageInteriorAnchor('library', 'primary-feature');
    const clueShelf = getVillageInteriorAnchor('library', 'secondary-feature');
    const targets: InteractionTarget[] = [
      {
        id: 'interaction:village-interior:library:story-table',
        label: 'Story table',
        actionLabel: 'Read',
        actionKind: 'inspect',
        position: storyTable.approach,
        interactionRadius: 150,
        priority: 24,
        result: { type: 'callback', activate: () => this.readStoryCard() },
      },
      {
        id: 'interaction:village-interior:library:clues',
        label: 'Valley clue shelf',
        actionLabel: 'Check clues',
        actionKind: 'inspect',
        position: clueShelf.approach,
        interactionRadius: 150,
        priority: 20,
        result: {
          type: 'callback',
          activate: () =>
            this.showFeedback(
              new StoryHouseService(getBrowserSaveService()).getCurrentClue(),
              clueShelf.approach,
            ),
        },
      },
    ];

    if (this.occupant) {
      targets.push({
        id: 'interaction:village-interior:library:tansy',
        label: 'Tansy',
        actionLabel: 'Talk',
        actionKind: 'talk',
        position: worker.approach,
        interactionRadius: 160,
        priority: 35,
        result: { type: 'callback', activate: () => this.talkToTansy() },
      });
    }
    return targets;
  }

  private createThreadInteractions(): InteractionTarget[] {
    const counter = getVillageInteriorAnchor('accessory-shop', 'counter');
    const display = getVillageInteriorAnchor('accessory-shop', 'primary-feature');
    return [
      {
        id: 'interaction:village-interior:accessory-shop:counter',
        label: 'Twinkle & Thread counter',
        actionLabel: 'Browse',
        actionKind: 'buy',
        position: counter.approach,
        interactionRadius: 155,
        priority: 28,
        result: { type: 'callback', activate: () => this.openThreadShop() },
      },
      {
        id: 'interaction:village-interior:accessory-shop:display',
        label: 'Accessory display',
        actionLabel: 'See what unlocked',
        actionKind: 'inspect',
        position: display.approach,
        interactionRadius: 145,
        priority: 20,
        result: { type: 'callback', activate: () => this.showThreadProgress() },
      },
    ];
  }

  private createHud(definition: InteriorPresentationDefinition): void {
    createUiShadow(this, GAME_WIDTH / 2, 46, 560, 66, 1, 0.18);
    this.add
      .text(GAME_WIDTH / 2, 34, `${definition.icon}  ${definition.title}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '27px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e8ee',
        padding: { x: 18, y: 9 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);
    this.add
      .text(GAME_WIDTH / 2, 84, definition.subtitle, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(115);
    this.balanceText = this.add
      .text(GAME_WIDTH - 120, 34, '', {
        color: '#76518a',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#f3e7f8e8',
        padding: { x: 10, y: 7 },
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(116);
    this.refreshBalance();
  }

  private openBakeryCounter(): void {
    const bakery = new BakeryService(getBrowserSaveService());
    const stock = bakery.listStock();
    this.openOverlay();
    if (!this.overlay) {
      return;
    }

    const title = this.add
      .text(GAME_WIDTH / 2, 138, 'Cinnamon’s Bakery counter', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '27px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    const note = this.add
      .text(
        GAME_WIDTH / 2,
        174,
        'Fresh treats can be bought again whenever you have enough Shimmer.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.overlay.add([title, note]);

    stock.forEach((item, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 330 + column * 310;
      const y = 285 + row * 185;
      const card = this.add
        .rectangle(x, y, 280, 154, 0xfffbf3, 0.98)
        .setStrokeStyle(4, 0xd88b62, 0.9)
        .setScrollFactor(0);
      const icon = this.add
        .text(x - 92, y - 35, item.definition.icon ?? '🥐', {
          fontFamily: UI_FONT,
          fontSize: '38px',
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      const name = this.add
        .text(x + 10, y - 42, item.definition.name, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
          wordWrap: { width: 175 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      const detail = this.add
        .text(
          x + 10,
          y - 8,
          item.isUnlocked
            ? item.isOwned
              ? 'Owned ✓'
              : `${item.price} Shimmer`
            : (item.unlockHint ?? 'Locked'),
          {
            color: UI_COLOURS.softInk,
            fontFamily: UI_FONT,
            fontSize: '12px',
            align: 'center',
            wordWrap: { width: 180 },
          },
        )
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.overlay?.add([card, icon, name, detail]);
      this.createOverlayButton(
        x,
        y + 49,
        item.isOwned ? 'Yours!' : item.isUnlocked ? `Buy • ${item.price} ✨` : 'Locked',
        () => this.buyBakeryItem(item.definition.id),
        item.isUnlocked && !item.isOwned,
      );
    });

    this.createOverlayButton(GAME_WIDTH / 2, 590, 'Back to the bakery', () => this.closeOverlay());
  }

  private openOverlay(): void {
    this.closeOverlay();
    setInteractionModalActive(this, true);
    this.overlay = this.add.container(0, 0).setDepth(20_500).setScrollFactor(0);
    const shade = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x493c50, 0.68)
      .setInteractive()
      .setScrollFactor(0);
    const panel = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 980, 520, 0xfffbef, 1)
      .setStrokeStyle(6, 0xe29b68, 1)
      .setScrollFactor(0);
    this.overlay.add([shade, panel]);
  }

  private createOverlayButton(
    x: number,
    y: number,
    labelText: string,
    onPress: () => void,
    enabled = true,
  ): void {
    if (!this.overlay) {
      return;
    }
    const fill = enabled ? UI_COLOURS.gold : UI_COLOURS.lavender;
    const button = this.add
      .rectangle(x, y, 260, 58, fill, enabled ? 1 : 0.62)
      .setStrokeStyle(3, enabled ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong, 0.95)
      .setScrollFactor(0);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    if (enabled) {
      button.setInteractive({ useHandCursor: true });
      label.setInteractive({ useHandCursor: true });
      applyButtonHover(button, fill, UI_COLOURS.blush);
      button.on('pointerdown', onPress);
      label.on('pointerdown', onPress);
    }
    this.overlay.add([button, label]);
  }

  private closeOverlay(): void {
    if (!this.overlay) {
      return;
    }
    this.overlay.destroy(true);
    this.overlay = null;
    setInteractionModalActive(this, false);
  }

  private buyBakeryItem(itemId: ItemId): void {
    if (!this.purchaseGuard.tryBegin(itemId, this.time.now)) {
      return;
    }
    const result = new BakeryService(getBrowserSaveService()).purchase(itemId);
    this.closeOverlay();
    const anchor = getVillageInteriorAnchor('bakery', 'counter').approach;
    if (result.type === 'purchased') {
      this.showFeedback(`✨ ${result.item.name} is yours! ${result.balance} Shimmer left.`, anchor);
      this.cameras.main.flash(100, 255, 236, 178, false);
    } else if (result.type === 'insufficient-funds') {
      this.showFeedback(
        `Almost! You need ${result.shortfall} more Shimmer for ${result.item.name}.`,
        anchor,
      );
    } else if (result.type === 'locked') {
      this.showFeedback(result.unlockHint, anchor);
    } else if (result.type === 'persistence-failed') {
      this.showFeedback('That did not save, so no Shimmer was spent. Please try again.', anchor);
    } else {
      this.showFeedback(
        `${result.item.name} is already tucked safely into your collection.`,
        anchor,
      );
    }
    this.refreshBalance();
  }

  private talkToBakeryBaker(): void {
    const progress = getBrowserQuestEngine().getProgress(MAPLE_CAKE_QUEST_ID);
    let message: string;
    if (progress.status === 'not-started') {
      message =
        'Cinnamon: “Maple has been sketching a celebration cake outside. If she recruits you, I have plenty of bowls and absolutely no fear of sprinkles.”';
    } else if (questIsAt(MAPLE_CAKE_QUEST_ID, 1)) {
      message =
        'Cinnamon: “Maple left three colour plans on the cake table. Pick the one you like and I’ll make sure the cake wobbles safely.”';
    } else if (questIsAt(MAPLE_CAKE_QUEST_ID, 4)) {
      message =
        'Cinnamon: “That cake is gloriously uneven. Maple is outside and definitely needs to see what you made.”';
    } else if (progress.status === 'completed') {
      message =
        'Cinnamon: “Maple’s Wobbly Cake is officially a Bakery favourite now. I keep a few celebration slices on the counter whenever I can.”';
    } else {
      message =
        'Cinnamon: “Everything on the counter is fresh today. The Berry Buns disappear fastest, but the Cloud Biscuits make the best crumbs.”';
    }
    this.showFeedback(message, getVillageInteriorAnchor('bakery', 'npc-work').approach);
  }

  private openCakePlan(): void {
    const engine = getBrowserQuestEngine();
    const progress = engine.getProgress(MAPLE_CAKE_QUEST_ID);
    const anchor = getVillageInteriorAnchor('bakery', 'secondary-feature').approach;
    if (progress.status === 'not-started') {
      this.showFeedback(
        'Maple is usually just outside the Bakery. Talk to her about her Wobbly Cake idea first.',
        anchor,
      );
      return;
    }
    if (!questIsAt(MAPLE_CAKE_QUEST_ID, 1)) {
      this.showFeedback(
        progress.status === 'completed'
          ? 'Maple’s first Wobbly Cake is already part of Village history. The cake table still carries a suspicious amount of sprinkles.'
          : 'Maple’s cake plan is not ready for decorating yet. Check in with her outside.',
        anchor,
      );
      return;
    }

    this.openOverlay();
    if (!this.overlay) {
      return;
    }
    const title = this.add
      .text(GAME_WIDTH / 2, 235, 'Pick a Wobbly Cake design', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);
    const note = this.add
      .text(
        GAME_WIDTH / 2,
        285,
        'Maple has laid out three gloriously impractical decorating plans.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '14px',
          align: 'center',
          wordWrap: { width: 620 },
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.overlay.add([title, note]);

    const choices: Array<{ theme: MapleCakeTheme; label: string; x: number }> = [
      { theme: 'sunshine', label: '☀️ Sunshine', x: 400 },
      { theme: 'moonflower', label: '🌙 Moonflower', x: 640 },
      { theme: 'rainbow', label: '🌈 Rainbow', x: 880 },
    ];
    for (const choice of choices) {
      this.createOverlayButton(choice.x, 395, choice.label, () => {
        this.finishCakeDesign(choice.theme);
        this.closeOverlay();
      });
    }
    this.createOverlayButton(GAME_WIDTH / 2, 510, 'Not yet', () => this.closeOverlay());
  }

  private finishCakeDesign(theme: MapleCakeTheme): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const flags = {
      ...save.world.flags,
      [MAPLE_CAKE_SUNSHINE_FLAG]: theme === 'sunshine',
      [MAPLE_CAKE_MOONFLOWER_FLAG]: theme === 'moonflower',
      [MAPLE_CAKE_RAINBOW_FLAG]: theme === 'rainbow',
    };
    saveService.save({ ...save, world: { ...save.world, flags } });
    gameEventBus.emit('WORLD_FLAG_CHANGED', {
      flagId: MAPLE_CAKE_SUNSHINE_FLAG,
      value: theme === 'sunshine',
    });
    gameEventBus.emit('WORLD_FLAG_CHANGED', {
      flagId: MAPLE_CAKE_MOONFLOWER_FLAG,
      value: theme === 'moonflower',
    });
    gameEventBus.emit('WORLD_FLAG_CHANGED', {
      flagId: MAPLE_CAKE_RAINBOW_FLAG,
      value: theme === 'rainbow',
    });
    new InventoryService(saveService).addItem(WOBBLY_CAKE_ITEM_ID, 1);
    this.cameras.main.flash(120, 255, 232, 172, false);
    this.time.delayedCall(0, () => {
      this.showFeedback(
        `🎂 ${
          theme === 'sunshine'
            ? 'Sunny yellow'
            : theme === 'moonflower'
              ? 'Moonflower blue'
              : 'Rainbow bright'
        } cake complete! Talk to Maple again so she can see your magnificently wobbly design.`,
        getVillageInteriorAnchor('bakery', 'secondary-feature').approach,
      );
    });
  }

  private shouldShowBakeryMapCorner(): boolean {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const discovery = new DiscoveryService(saveService);
    return (
      save.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG] === true &&
      discovery.hasDiscovery(TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID) &&
      !discovery.hasDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID)
    );
  }

  private findBakeryMapCorner(): void {
    const service = new DiscoveryService(getBrowserSaveService());
    const anchor = getVillageInteriorAnchor('bakery', 'primary-feature').approach;
    if (service.hasDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID)) {
      this.showFeedback('The flour-dusted map corner is already safely with you.', anchor);
      return;
    }
    service.unlockDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID);
    this.showFeedback(
      '🗺️ Map corner found! It had been used as a recipe bookmark and now smells faintly of berry buns.',
      anchor,
    );
    this.cameras.main.flash(100, 255, 239, 186, false);
    this.registerInteractions();
  }

  private talkToTansy(): void {
    const engine = getBrowserQuestEngine();
    let progress = engine.getProgress(TANSY_MAP_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = engine.startQuest(TANSY_MAP_QUEST_ID);
    }
    let message: string;
    if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(TANSY_MAP_QUEST_ID, 0)
    ) {
      engine.notifyCharacterTalked(TANSY_CHARACTER_ID);
      message =
        'Tansy: “Three corners escaped from my favourite map. One likes notices, one smells like baking, and one flew somewhere sunny.”';
    } else if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(TANSY_MAP_QUEST_ID, 5)
    ) {
      engine.notifyCharacterTalked(TANSY_CHARACTER_ID);
      message =
        'Tansy: “They fit! The valley has corners again. I am pinning this map down with four bookmarks this time.”';
    } else if (progress.status === 'completed') {
      message =
        'Tansy: “The repaired map is staying right here. Unless a very determined breeze learns to read.”';
    } else {
      message = new StoryHouseService(getBrowserSaveService()).getCurrentClue();
    }
    this.showFeedback(message, getVillageInteriorAnchor('library', 'npc-work').approach);
  }

  private readStoryCard(): void {
    const service = new StoryHouseService(getBrowserSaveService());
    const cards = service.listCards().filter(({ unlocked }) => unlocked);
    const anchor = getVillageInteriorAnchor('library', 'primary-feature').approach;
    if (cards.length === 0) {
      this.showFeedback(
        'No story cards have reached the shelves yet. Exploring the valley will change that.',
        anchor,
      );
      return;
    }
    const unread = cards.filter(({ read }) => !read);
    const pool = unread.length > 0 ? unread : cards;
    const card = pool[this.storyCardCursor % pool.length];
    this.storyCardCursor += 1;
    if (!card) {
      return;
    }
    service.readCard(card.id);
    this.showFeedback(`${card.icon} ${card.title}\n${card.text}`, anchor);
  }

  private openThreadShop(): void {
    if (this.closing) {
      return;
    }
    this.scene.launch('ShopScene', { returnScene: 'VillageInteriorScene' });
    this.scene.pause();
  }

  private showThreadProgress(): void {
    const stock = new ShopService(getBrowserSaveService()).listStock();
    const nextLocked = stock.find(({ isUnlocked }) => !isUnlocked);
    this.showFeedback(
      nextLocked
        ? `Next locked treasure: ${nextLocked.definition.name}. ${
            nextLocked.unlockHint ?? 'Keep exploring to reveal it.'
          }`
        : 'Every current Twinkle & Thread treasure is unlocked. The shelves are ready for whatever you discover next.',
      getVillageInteriorAnchor('accessory-shop', 'primary-feature').approach,
    );
  }

  private refreshBalance(): void {
    const balance = new ShimmerEconomyService(getBrowserSaveService()).getBalance();
    this.balanceText?.setText(`✨ ${balance}`);
  }

  private showFeedback(message: string, anchor: { x: number; y: number }): void {
    getWorldFeedbackPresenter(this).showReaction(message, anchor, 3600);
  }

  private leaveInterior(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.closeOverlay();
    this.scene.start(this.returnScene);
  }

  private shutdownInterior(): void {
    this.closeOverlay();
    getSceneInteractionRegistry(this).clearOwner(INTERIOR_INTERACTION_OWNER);
    getVillageInteriorOccupancyService().leave(this.interiorId);
    this.runtime?.destroy();
    this.runtime = null;
    this.occupant = null;
    this.balanceText = null;
    this.purchaseGuard.reset();
  }
}
