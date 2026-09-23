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
  BAKERY_SECTIONS,
  type BakerySectionId,
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
import { getWorldConversationPresenter } from '../dialogue/WorldConversationPresenter';
import { getWorldFeedbackPresenter } from '../ui/WorldFeedbackPresenter';
import { UI_COLOURS, UI_FONT, applyButtonHover } from '../ui/uiTheme';
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
  private bakerySection: BakerySectionId = 'pastries';
  private bakeryShopFeedback = '';

  public constructor() {
    super('VillageInteriorScene');
  }

  public create(data: VillageInteriorSceneData = {}): void {
    this.interiorId = isVillageInteriorId(data.interiorId) ? data.interiorId : 'accessory-shop';
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;
    this.storyCardCursor = 0;
    this.bakerySection = 'pastries';
    this.bakeryShopFeedback = '';
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
      ...(this.interiorId === 'bakery'
        ? { cameraDeadzone: { width: 220, height: 80 } }
        : {}),
    });
    this.runtime.create();
    this.renderInteriorOccupant();
    this.registerInteractions();

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
    const roomOutline = this.add
      .graphics()
      .setName(`village-interior:${this.interiorId}:room-shell`)
      .setDepth(4);
    const doorwayHalfWidth = (shell.doorWidth + 54) / 2;
    roomOutline.lineStyle(10, definition.accentColour, 0.95);
    roomOutline.lineBetween(shell.left, shell.top, shell.right, shell.top);
    roomOutline.lineBetween(shell.left, shell.top, shell.left, shell.bottom);
    roomOutline.lineBetween(shell.right, shell.top, shell.right, shell.bottom);
    roomOutline.lineBetween(shell.left, shell.bottom, centreX - doorwayHalfWidth, shell.bottom);
    roomOutline.lineBetween(centreX + doorwayHalfWidth, shell.bottom, shell.right, shell.bottom);

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
    const shell = map.roomShell;
    const openingWidth = shell.doorWidth + 54;
    const outsideColour = this.interiorId === 'bakery' ? 0xeadde7 : 0x5b4662;
    const frameColour = this.interiorId === 'bakery' ? 0xb77f90 : accent;

    this.add
      .rectangle(exit.position.x, shell.bottom + 7, openingWidth, 34, outsideColour, 1)
      .setName(`village-interior:${this.interiorId}:exit-gap`)
      .setDepth(6);
    this.add
      .ellipse(exit.position.x, shell.bottom + 24, shell.doorWidth + 16, 44, 0xbce9f4, 0.2)
      .setDepth(4);

    const frame = this.add
      .graphics()
      .setName(`village-interior:${this.interiorId}:exit-frame`)
      .setDepth(worldDepthForY(shell.bottom + 28, 0.14));
    frame.fillStyle(frameColour, 0.94);
    frame.fillRoundedRect(exit.position.x - openingWidth / 2 - 12, shell.bottom - 31, 20, 46, 8);
    frame.fillRoundedRect(exit.position.x + openingWidth / 2 - 8, shell.bottom - 31, 20, 46, 8);
    frame.fillStyle(0xffe9dc, 0.76);
    frame.fillRoundedRect(
      exit.position.x - shell.doorWidth / 2 + 8,
      shell.bottom - 13,
      shell.doorWidth - 16,
      6,
      3,
    );
  }

  private createBakerySet(): void {
    const counter = getVillageInteriorAnchor('bakery', 'counter');
    const recipeBoard = getVillageInteriorAnchor('bakery', 'primary-feature');
    const cakeShowcase = getVillageInteriorAnchor('bakery', 'secondary-feature');

    for (let y = 410; y <= 930; y += 92) {
      this.add.rectangle(750, y, 1260, 3, 0xd9bfa6, 0.3).setDepth(3.1);
    }
    this.add.rectangle(750, 337, 1280, 24, 0xf2ced4, 0.9).setDepth(4.7);
    this.add.rectangle(750, 350, 1280, 5, 0xffffff, 0.72).setDepth(4.8);

    // Two matching rear service counters leave an open centre gap for Cinnamon.
    this.createBakeryPatisserieCounter(counter.position.x, counter.position.y);
    this.createBakeryBreadCounter(1090, counter.position.y);

    // Hero cake display now owns the middle of the room.
    this.createBakeryCakeShowcase(cakeShowcase.position.x, cakeShowcase.position.y);

    // Recipe board moves towards the front-left wall, away from the service line.
    this.createBakeryRecipeBoard(recipeBoard.position.x, recipeBoard.position.y);

    // Matching side displays keep the room balanced around the central hero cake.
    this.createBakeryCupcakeDisplay(420, 640);
    this.createBakeryDoughnutDisplay(1080, 640);

    // Café nook moves lower and gets richer table detail.
    const cafe = this.add.graphics().setName('village-interior:bakery:cafe-table');
    cafe.fillStyle(0xf2d6bd, 1);
    cafe.lineStyle(4, 0xc99d89, 0.74);
    cafe.fillEllipse(1210, 835, 170, 106);
    cafe.strokeEllipse(1210, 835, 170, 106);
    cafe.fillStyle(0xe8b79f, 1);
    cafe.fillRoundedRect(1197, 835, 26, 56, 10);
    cafe.fillEllipse(1210, 891, 82, 24);
    cafe.fillStyle(0xfff7e8, 1);
    cafe.fillEllipse(1210, 823, 134, 70);
    cafe.lineStyle(2, 0xe8b9c4, 0.75);
    cafe.strokeEllipse(1210, 823, 134, 70);
    cafe.lineStyle(2, 0xffffff, 0.7);
    cafe.strokeEllipse(1210, 820, 112, 52);

    // Two cups, a shared pastry plate and a tiny flower vase.
    cafe.fillStyle(0xd9b5df, 1);
    cafe.fillCircle(1173, 813, 17);
    cafe.lineStyle(3, 0xa77fae, 0.8);
    cafe.strokeCircle(1173, 813, 17);
    cafe.lineBetween(1187, 812, 1197, 812);
    cafe.fillStyle(0xfff0c7, 1);
    cafe.fillCircle(1245, 813, 18);
    cafe.lineStyle(3, 0xc99d89, 0.78);
    cafe.strokeCircle(1245, 813, 18);
    cafe.lineBetween(1260, 812, 1271, 812);

    cafe.fillStyle(0xf7d7a5, 1);
    cafe.fillEllipse(1208, 840, 56, 24);
    cafe.lineStyle(2, 0xc99d89, 0.72);
    cafe.strokeEllipse(1208, 840, 56, 24);
    cafe.fillStyle(0xe8aa70, 1);
    cafe.fillRoundedRect(1191, 832, 16, 11, 5);
    cafe.fillRoundedRect(1210, 831, 17, 12, 5);

    cafe.fillStyle(0xa5c99e, 1);
    cafe.fillRoundedRect(1204, 790, 12, 25, 5);
    cafe.fillStyle(0xf0a8bf, 1);
    cafe.fillCircle(1205, 787, 7);
    cafe.fillStyle(0xf5d174, 1);
    cafe.fillCircle(1216, 785, 6);
    cafe.setDepth(worldDepthForY(890, 0.2));

    this.createBakeryCafeStool(1118, 875);
    this.createBakeryCafeStool(1302, 870);

    for (const sparkle of [
      { x: 615, y: 454, r: 4 },
      { x: 885, y: 454, r: 4 },
      { x: 625, y: 626, r: 4 },
      { x: 875, y: 626, r: 4 },
      { x: 750, y: 545, r: 5 },
      { x: 750, y: 805, r: 4 },
    ]) {
      this.createBakerySparkle(sparkle.x, sparkle.y, sparkle.r);
    }
  }

  private createBakeryPatisserieCounter(x: number, y: number): void {
    const base = this.add.graphics().setName('village-interior:bakery:counter');
    base.fillStyle(0xd99ba6, 1);
    base.lineStyle(5, 0xb97988, 0.88);
    base.fillRoundedRect(x - 195, y - 12, 390, 90, 18);
    base.strokeRoundedRect(x - 195, y - 12, 390, 90, 18);
    base.fillStyle(0xfff7e8, 1);
    base.fillRoundedRect(x - 180, y + 20, 360, 40, 11);
    base.lineStyle(3, 0xe9c1c8, 0.92);
    base.strokeRoundedRect(x - 180, y + 20, 360, 40, 11);
    base.setDepth(worldDepthForY(y + 70, 0.3));

    const glass = this.add.graphics().setName('village-interior:bakery:patisserie-case');
    glass.fillStyle(0xdff8fb, 0.27);
    glass.lineStyle(4, 0xa6d7dd, 0.84);
    glass.fillRoundedRect(x - 180, y - 88, 360, 82, 16);
    glass.strokeRoundedRect(x - 180, y - 88, 360, 82, 16);
    glass.lineStyle(2, 0xffffff, 0.72);
    glass.lineBetween(x - 148, y - 73, x + 140, y - 73);
    glass.setDepth(worldDepthForY(y + 70, 0.46));

    this.createBakeryDisplayCake(x - 102, y - 38, 0.66, {
      sponge: 0xf6c98a,
      icing: 0xf4a9c1,
      accent: 0xfff1a3,
    });
    this.createBakeryDisplayCake(x, y - 38, 0.58, {
      sponge: 0xe6c493,
      icing: 0xd7b6ef,
      accent: 0xaee7e0,
    });
    this.createBakeryDisplayCake(x + 102, y - 38, 0.63, {
      sponge: 0xf0bd83,
      icing: 0xffe4a3,
      accent: 0xf49aaa,
    });

    this.add
      .text(x, y + 41, 'CAKES & PATISSERIE', {
        color: '#744f67',
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 72, 0.5));
  }

  private createBakeryBreadCounter(x: number, y: number): void {
    const base = this.add.graphics().setName('village-interior:bakery:bread-counter');
    base.fillStyle(0xe2b78f, 1);
    base.lineStyle(5, 0xbd8768, 0.86);
    base.fillRoundedRect(x - 195, y - 12, 390, 90, 18);
    base.strokeRoundedRect(x - 195, y - 12, 390, 90, 18);
    base.fillStyle(0xfff8eb, 1);
    base.fillRoundedRect(x - 180, y + 20, 360, 40, 11);
    base.lineStyle(3, 0xe7c4a5, 0.92);
    base.strokeRoundedRect(x - 180, y + 20, 360, 40, 11);
    base.setDepth(worldDepthForY(y + 70, 0.3));

    const glass = this.add.graphics().setName('village-interior:bakery:bread-case');
    glass.fillStyle(0xe7f8f8, 0.23);
    glass.lineStyle(4, 0xb8d7d3, 0.8);
    glass.fillRoundedRect(x - 180, y - 94, 360, 88, 16);
    glass.strokeRoundedRect(x - 180, y - 94, 360, 88, 16);
    glass.lineStyle(2, 0xffffff, 0.68);
    glass.lineBetween(x - 148, y - 78, x + 140, y - 78);
    glass.setDepth(worldDepthForY(y + 70, 0.45));

    const boards = this.add.graphics();
    boards.fillStyle(0xc99567, 0.9);
    boards.fillRoundedRect(x - 163, y - 50, 132, 11, 5);
    boards.fillRoundedRect(x - 10, y - 50, 94, 11, 5);
    boards.fillRoundedRect(x + 96, y - 72, 72, 11, 5);
    boards.fillStyle(0xc78e67, 0.78);
    boards.fillEllipse(x - 122, y - 25, 108, 24);
    boards.fillEllipse(x + 64, y - 25, 126, 24);
    boards.lineStyle(3, 0x9e6d51, 0.72);
    boards.strokeEllipse(x - 122, y - 25, 108, 24);
    boards.strokeEllipse(x + 64, y - 25, 126, 24);
    boards.setDepth(worldDepthForY(y + 70, 0.455));

    this.createBakeryBreadLoaf(x - 139, y - 62, 'seeded');
    this.createBakeryBreadLoaf(x - 70, y - 61, 'plait');
    this.createBakeryBreadLoaf(x + 38, y - 63, 'round');
    this.createBakeryBreadLoaf(x + 131, y - 78, 'baguette');
    this.createBakeryBreadLoaf(x - 122, y - 30, 'rolls');
    this.createBakeryBreadLoaf(x + 64, y - 28, 'plait');

    this.add
      .text(x, y + 41, 'FRESH BREAD', {
        color: '#765344',
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 72, 0.5));
  }

  private createBakeryBreadLoaf(
    x: number,
    y: number,
    kind: 'round' | 'baguette' | 'seeded' | 'plait' | 'rolls',
  ): void {
    const bread = this.add.graphics();
    bread.lineStyle(2, 0xbd7647, 0.86);

    if (kind === 'round') {
      bread.fillStyle(0xeeb66f, 1);
      bread.fillEllipse(x, y, 64, 38);
      bread.strokeEllipse(x, y, 64, 38);
      bread.lineStyle(2, 0xffd99a, 0.9);
      for (const slash of [-13, 0, 13]) {
        bread.lineBetween(x + slash - 5, y - 11, x + slash + 4, y + 8);
      }
    } else if (kind === 'baguette') {
      bread.fillStyle(0xe7a95c, 1);
      bread.fillRoundedRect(x - 42, y - 13, 84, 26, 13);
      bread.strokeRoundedRect(x - 42, y - 13, 84, 26, 13);
      bread.lineStyle(2, 0xffd38f, 0.92);
      for (const slash of [-24, -8, 8, 24]) {
        bread.lineBetween(x + slash - 5, y - 9, x + slash + 4, y + 7);
      }
    } else if (kind === 'seeded') {
      bread.fillStyle(0xd99b56, 1);
      bread.fillRoundedRect(x - 34, y - 18, 68, 36, 16);
      bread.strokeRoundedRect(x - 34, y - 18, 68, 36, 16);
      bread.fillStyle(0xf4d197, 0.96);
      for (const [dx, dy] of [
        [-20, -7],
        [-9, 5],
        [2, -8],
        [14, 4],
        [23, -5],
      ] as const) {
        bread.fillEllipse(x + dx, y + dy, 5, 3);
      }
    } else if (kind === 'plait') {
      bread.fillStyle(0xf0bd72, 1);
      for (const offset of [-22, -8, 8, 22]) {
        bread.fillEllipse(x + offset, y, 30, 27);
        bread.strokeEllipse(x + offset, y, 30, 27);
      }
      bread.lineStyle(2, 0xffdfa0, 0.88);
      bread.lineBetween(x - 28, y - 8, x + 28, y + 7);
    } else {
      bread.fillStyle(0xedb46b, 1);
      for (const [dx, dy, radius] of [
        [-24, 1, 12],
        [-8, -3, 13],
        [10, 1, 12],
        [25, -2, 11],
      ] as const) {
        bread.fillCircle(x + dx, y + dy, radius);
        bread.strokeCircle(x + dx, y + dy, radius);
      }
      bread.fillStyle(0xffdb98, 0.82);
      for (const dx of [-24, -8, 10, 25]) {
        bread.fillCircle(x + dx - 2, y - 6, 3);
      }
    }

    bread.setDepth(worldDepthForY(y + 70, 0.47));
  }

  private createBakeryCupcakeDisplay(x: number, y: number): void {
    const stand = this.add.graphics().setName('village-interior:bakery:cupcake-display');
    stand.fillStyle(0xf3d7bd, 1);
    stand.lineStyle(4, 0xc99d89, 0.78);
    stand.fillEllipse(x, y + 42, 138, 54);
    stand.strokeEllipse(x, y + 42, 138, 54);
    stand.fillStyle(0xf8ecd9, 1);
    stand.fillRoundedRect(x - 13, y + 38, 26, 56, 10);
    stand.fillEllipse(x, y + 94, 72, 22);
    stand.setDepth(worldDepthForY(y + 100, 0.2));

    const tower = this.add.graphics();
    tower.lineStyle(4, 0xb97b8b, 0.82);
    tower.fillStyle(0xf7c9d6, 1);
    tower.fillEllipse(x, y + 10, 126, 32);
    tower.strokeEllipse(x, y + 10, 126, 32);
    tower.fillStyle(0xf8e7cd, 1);
    tower.fillRoundedRect(x - 8, y - 48, 16, 58, 8);
    tower.fillStyle(0xe8b3bd, 1);
    tower.fillEllipse(x, y - 42, 92, 26);
    tower.strokeEllipse(x, y - 42, 92, 26);
    tower.fillStyle(0xfff3df, 1);
    tower.fillRoundedRect(x - 6, y - 83, 12, 42, 6);
    tower.fillStyle(0xd7b6ef, 1);
    tower.fillEllipse(x, y - 78, 58, 20);
    tower.strokeEllipse(x, y - 78, 58, 20);

    const cupcakes = [
      { dx: -40, dy: 0, icing: 0xf3a8c0 },
      { dx: 0, dy: 2, icing: 0xaee7e0 },
      { dx: 40, dy: 0, icing: 0xffdfa0 },
      { dx: -24, dy: -48, icing: 0xd8b9f2 },
      { dx: 24, dy: -48, icing: 0xf49aaa },
      { dx: 0, dy: -84, icing: 0xc9e4aa },
    ] as const;
    for (const cupcake of cupcakes) {
      tower.fillStyle(0xd99365, 1);
      tower.fillRoundedRect(x + cupcake.dx - 10, y + cupcake.dy - 2, 20, 18, 4);
      tower.fillStyle(cupcake.icing, 1);
      tower.fillCircle(x + cupcake.dx, y + cupcake.dy - 7, 13);
      tower.fillStyle(0xfff4d5, 0.9);
      tower.fillCircle(x + cupcake.dx - 4, y + cupcake.dy - 12, 3);
    }
    tower.setDepth(worldDepthForY(y + 101, 0.32));

    this.createBakeryDisplayPlaque(
      x,
      y + 72,
      'Cupcake Carousel',
      0xf3bfd0,
      0xb97b8b,
      'cupcake',
    );
  }

  private createBakeryCafeStool(x: number, y: number): void {
    const stool = this.add.graphics().setName('village-interior:bakery:cafe-stool');

    // Soft shadow under the stool.
    stool.fillStyle(0x7d5a70, 0.16);
    stool.fillEllipse(x, y + 24, 62, 18);

    // Two-tone upholstered seat gives the old simple stool more depth.
    stool.fillStyle(0x9f748c, 1);
    stool.lineStyle(3, 0x7c586d, 0.82);
    stool.fillEllipse(x, y, 58, 34);
    stool.strokeEllipse(x, y, 58, 34);

    stool.fillStyle(0xc79fb4, 1);
    stool.fillEllipse(x, y - 5, 48, 23);
    stool.lineStyle(2, 0xe1bfd0, 0.78);
    stool.strokeEllipse(x, y - 6, 39, 15);

    // Simple tapered legs; deliberately no backrest.
    stool.fillStyle(0x8f647c, 1);
    stool.fillRoundedRect(x - 22, y + 11, 9, 32, 4);
    stool.fillRoundedRect(x + 13, y + 11, 9, 32, 4);
    stool.fillStyle(0xb889a1, 0.9);
    stool.fillRoundedRect(x - 19, y + 14, 3, 25, 2);
    stool.fillRoundedRect(x + 16, y + 14, 3, 25, 2);

    stool.setDepth(worldDepthForY(y + 44, 0.18));
  }

  private createBakeryDoughnutDisplay(x: number, y: number): void {
    const stand = this.add.graphics().setName('village-interior:bakery:doughnut-display');
    stand.fillStyle(0xf3d7bd, 1);
    stand.lineStyle(4, 0xc99d89, 0.78);
    stand.fillEllipse(x, y + 42, 138, 54);
    stand.strokeEllipse(x, y + 42, 138, 54);
    stand.fillStyle(0xf8ecd9, 1);
    stand.fillRoundedRect(x - 13, y + 38, 26, 56, 10);
    stand.fillEllipse(x, y + 94, 72, 22);
    stand.setDepth(worldDepthForY(y + 100, 0.2));

    const ring = this.add.graphics();
    ring.fillStyle(0xe9b3bf, 1);
    ring.lineStyle(4, 0xb97b8b, 0.82);
    ring.fillCircle(x, y - 8, 62);
    ring.strokeCircle(x, y - 8, 62);
    ring.fillStyle(0xfff8ec, 1);
    ring.fillCircle(x, y - 8, 36);
    ring.lineStyle(3, 0xf6d3dc, 0.8);
    ring.strokeCircle(x, y - 8, 36);

    for (const [angle, icing] of [
      [0, 0xf3a8c0],
      [60, 0xd8b9f2],
      [120, 0xaee7e0],
      [180, 0xffdfa0],
      [240, 0xf49aaa],
      [300, 0xc9e4aa],
    ] as const) {
      const radians = Phaser.Math.DegToRad(angle);
      const dx = Math.cos(radians) * 47;
      const dy = Math.sin(radians) * 47;
      ring.fillStyle(0xe6ad69, 1);
      ring.fillCircle(x + dx, y - 8 + dy, 18);
      ring.fillStyle(icing, 1);
      ring.fillCircle(x + dx, y - 11 + dy, 14);
      ring.fillStyle(0xfff8ec, 1);
      ring.fillCircle(x + dx, y - 11 + dy, 5);
      ring.fillStyle(0xffffff, 0.75);
      ring.fillCircle(x + dx - 5, y - 16 + dy, 2);
    }
    ring.setDepth(worldDepthForY(y + 101, 0.32));

    this.createBakeryDisplayPlaque(
      x,
      y + 72,
      'Doughnut Wheel',
      0xead2f1,
      0xa879a8,
      'doughnut',
    );
  }

  private createBakeryDisplayPlaque(
    x: number,
    y: number,
    label: string,
    fill: number,
    stroke: number,
    motif: 'cupcake' | 'doughnut',
  ): void {
    const plaque = this.add.graphics().setName(`village-interior:bakery:${motif}-plaque`);
    plaque.fillStyle(stroke, 0.18);
    plaque.fillEllipse(x + 3, y + 5, 128, 42);
    plaque.fillStyle(fill, 1);
    plaque.lineStyle(3, stroke, 0.9);
    plaque.fillRoundedRect(x - 66, y - 18, 132, 36, 16);
    plaque.strokeRoundedRect(x - 66, y - 18, 132, 36, 16);
    plaque.fillTriangle(x - 61, y + 7, x - 82, y + 19, x - 55, y + 18);
    plaque.fillTriangle(x + 61, y + 7, x + 82, y + 19, x + 55, y + 18);
    plaque.fillStyle(0xfff7e8, 0.9);
    plaque.fillCircle(x - 48, y, 8);

    if (motif === 'doughnut') {
      plaque.fillStyle(0xe6ad69, 1);
      plaque.fillCircle(x - 48, y, 6);
      plaque.fillStyle(fill, 1);
      plaque.fillCircle(x - 48, y, 2.5);
    } else {
      plaque.fillStyle(0xd99365, 1);
      plaque.fillRoundedRect(x - 53, y, 10, 7, 2);
      plaque.fillStyle(0xffe3ed, 1);
      plaque.fillCircle(x - 48, y - 3, 6);
    }
    plaque.setDepth(worldDepthForY(y + 32, 0.42));

    this.add
      .text(x + 10, y, label, {
        color: '#6c4d63',
        fontFamily: UI_FONT,
        fontSize: '10px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 32, 0.5));
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

  private createBakeryRecipeBoard(x: number, y: number): void {
    const board = this.add.graphics().setName('village-interior:bakery:recipe-shelf');
    board.fillStyle(0xf4d8bf, 1);
    board.lineStyle(4, 0xc99d89, 0.78);
    board.fillRoundedRect(x - 52, y - 92, 104, 184, 16);
    board.strokeRoundedRect(x - 52, y - 92, 104, 184, 16);
    board.fillStyle(0xfffbf3, 0.96);
    board.fillRoundedRect(x - 38, y - 65, 76, 50, 8);
    board.fillRoundedRect(x - 38, y + 5, 76, 54, 8);
    board.fillStyle(0xe7a4b2, 1);
    board.fillRoundedRect(x - 27, y - 52, 15, 28, 4);
    board.fillStyle(0xb6d9dc, 1);
    board.fillRoundedRect(x - 5, y - 55, 18, 31, 4);
    board.fillStyle(0xf3c878, 1);
    board.fillRoundedRect(x + 20, y - 50, 13, 26, 4);
    board.lineStyle(3, 0xb98b9f, 0.88);
    board.lineBetween(x - 25, y + 20, x + 25, y + 20);
    board.lineBetween(x - 25, y + 34, x + 14, y + 34);
    board.setDepth(worldDepthForY(y + 95, 0.2));

    this.add
      .text(x, y - 116, 'RECIPES', {
        color: '#76566d',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 96, 0.28));
  }

  private createBakeryCakeShowcase(x: number, y: number): void {
    const rug = this.add.graphics();
    rug.fillStyle(0xf6dbe2, 0.72);
    rug.lineStyle(4, 0xe5b0be, 0.62);
    rug.fillEllipse(x, y + 72, 330, 150);
    rug.strokeEllipse(x, y + 72, 330, 150);
    rug.setDepth(worldDepthForY(y + 115, 0.08));

    const stand = this.add.graphics().setName('village-interior:bakery:cake-table');
    stand.fillStyle(0xe8b3bd, 1);
    stand.lineStyle(5, 0xb97b8b, 0.82);
    stand.fillEllipse(x, y + 54, 285, 86);
    stand.strokeEllipse(x, y + 54, 285, 86);
    stand.fillStyle(0xfaf2df, 1);
    stand.fillRoundedRect(x - 22, y + 38, 44, 86, 14);
    stand.fillEllipse(x, y + 122, 122, 32);
    stand.setDepth(worldDepthForY(y + 126, 0.2));

    const cake = this.add.graphics();
    cake.fillStyle(0xf4c67d, 1);
    cake.fillRoundedRect(x - 72, y - 4, 144, 48, 13);
    cake.fillStyle(0xf2a3bd, 1);
    cake.fillRoundedRect(x - 76, y - 13, 152, 21, 10);
    for (const dripX of [-50, -17, 18, 50]) {
      cake.fillCircle(x + dripX, y + 5, 14);
    }

    cake.fillStyle(0xf4d68c, 1);
    cake.fillRoundedRect(x - 53, y - 52, 106, 42, 12);
    cake.fillStyle(0xd8b9f2, 1);
    cake.fillRoundedRect(x - 57, y - 61, 114, 20, 10);
    cake.fillCircle(x - 35, y - 43, 11);
    cake.fillCircle(x, y - 42, 12);
    cake.fillCircle(x + 35, y - 43, 11);

    cake.fillStyle(0xf8d899, 1);
    cake.fillRoundedRect(x - 32, y - 91, 64, 32, 10);
    cake.fillStyle(0xaee7e0, 1);
    cake.fillRoundedRect(x - 36, y - 99, 72, 17, 8);

    cake.fillStyle(0xffef9e, 1);
    cake.fillCircle(x, y - 117, 10);
    cake.fillStyle(0xf49aaa, 1);
    cake.fillCircle(x - 25, y - 104, 7);
    cake.fillStyle(0xa9d9ee, 1);
    cake.fillCircle(x + 26, y - 104, 7);
    cake.setDepth(worldDepthForY(y + 128, 0.31));

    const dome = this.add.graphics().setName('village-interior:bakery:magic-cake-dome');
    dome.fillStyle(0xdff8fb, 0.14);
    dome.lineStyle(5, 0xa6d7dd, 0.68);
    dome.fillEllipse(x, y - 4, 250, 238);
    dome.strokeEllipse(x, y - 4, 250, 238);
    dome.fillStyle(0xf7d98c, 1);
    dome.fillCircle(x, y - 129, 9);
    dome.setDepth(worldDepthForY(y + 128, 0.4));

    for (const point of [
      { dx: -104, dy: -75, r: 5 },
      { dx: 104, dy: -52, r: 5 },
      { dx: -108, dy: 15, r: 4 },
      { dx: 108, dy: 30, r: 4 },
      { dx: -70, dy: -118, r: 3 },
      { dx: 72, dy: -112, r: 3 },
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

    // Boutique wall treatment: lighter than the old magenta block and deliberately distinct from Bakery.
    for (let y = 390; y <= 930; y += 105) {
      this.add.rectangle(750, y, 1260, 3, 0xd7b4cf, 0.24).setDepth(3.1);
    }
    this.add.rectangle(750, 342, 1260, 18, 0xe8c7df, 0.88).setDepth(4.6);

    const rug = this.add.graphics().setName('village-interior:accessory-shop:runway-rug');
    rug.fillStyle(0xf2dff0, 0.82);
    rug.lineStyle(4, 0xc99bc5, 0.54);
    rug.fillRoundedRect(560, 560, 330, 340, 90);
    rug.strokeRoundedRect(560, 560, 330, 340, 90);
    rug.lineStyle(2, 0xffffff, 0.55);
    rug.strokeRoundedRect(586, 586, 278, 288, 70);
    rug.setDepth(3.2);

    this.createThreadWallRack(280, 500);
    this.createThreadCounter(counter.position.x, counter.position.y);
    this.createThreadDisplayIsland(display.position.x, display.position.y, 'ribbons');
    this.createThreadDisplayIsland(830, 715, 'home');
    this.createThreadMirror(mirror.position.x, mirror.position.y);
  }

  private createThreadWallRack(x: number, y: number): void {
    const rack = this.add.graphics().setName('village-interior:accessory-shop:wall-rack');
    rack.fillStyle(0xf9edf7, 1);
    rack.lineStyle(4, 0xa8759d, 0.8);
    rack.fillRoundedRect(x - 78, y - 125, 156, 250, 22);
    rack.strokeRoundedRect(x - 78, y - 125, 156, 250, 22);
    rack.fillStyle(0xd5a9c9, 1);
    rack.fillRoundedRect(x - 57, y - 92, 114, 12, 6);
    rack.fillRoundedRect(x - 57, y + 8, 114, 12, 6);

    for (const [dx, colour] of [
      [-38, 0xf5a9c5],
      [0, 0xbca8eb],
      [38, 0x9edbd7],
    ] as const) {
      rack.fillStyle(colour, 1);
      rack.fillCircle(x + dx, y - 52, 16);
      rack.fillTriangle(x + dx - 13, y - 42, x + dx - 2, y - 7, x + dx + 2, y - 42);
      rack.fillTriangle(x + dx + 13, y - 42, x + dx + 2, y - 7, x + dx - 2, y - 42);
    }

    rack.fillStyle(0xfff4d2, 1);
    rack.fillCircle(x - 36, y + 55, 17);
    rack.fillStyle(0xe9c0ef, 1);
    rack.fillCircle(x, y + 55, 17);
    rack.fillStyle(0xb5e1db, 1);
    rack.fillCircle(x + 36, y + 55, 17);
    rack.setDepth(worldDepthForY(y + 126, 0.2));
  }

  private createThreadCounter(x: number, y: number): void {
    const counter = this.add.graphics().setName('village-interior:accessory-shop:counter');
    counter.fillStyle(0xb77baa, 1);
    counter.lineStyle(5, 0x8e5d86, 0.9);
    counter.fillRoundedRect(x - 195, y - 18, 390, 96, 22);
    counter.strokeRoundedRect(x - 195, y - 18, 390, 96, 22);
    counter.fillStyle(0xfff6fb, 0.95);
    counter.fillRoundedRect(x - 174, y + 16, 348, 44, 13);
    counter.lineStyle(3, 0xd8a4cf, 0.88);
    counter.strokeRoundedRect(x - 174, y + 16, 348, 44, 13);

    counter.fillStyle(0xf3c5d9, 1);
    counter.fillCircle(x - 105, y - 34, 18);
    counter.fillStyle(0xbba7ea, 1);
    counter.fillCircle(x - 35, y - 34, 18);
    counter.fillStyle(0xa2d8d2, 1);
    counter.fillCircle(x + 35, y - 34, 18);
    counter.fillStyle(0xffdea0, 1);
    counter.fillCircle(x + 105, y - 34, 18);
    counter.setDepth(worldDepthForY(y + 78, 0.3));

    this.add
      .text(x, y + 38, 'STYLE DESK', {
        color: '#744f67',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 80, 0.42));
  }

  private createThreadDisplayIsland(
    x: number,
    y: number,
    theme: 'ribbons' | 'home',
  ): void {
    const display = this.add
      .graphics()
      .setName(`village-interior:accessory-shop:display-${theme}`);
    display.fillStyle(0x6b4b64, 0.12);
    display.fillEllipse(x + 4, y + 44, 196, 42);
    display.fillStyle(theme === 'ribbons' ? 0xe9bfdc : 0xd8c9ef, 1);
    display.lineStyle(4, theme === 'ribbons' ? 0xa96f98 : 0x8d77ae, 0.78);
    display.fillRoundedRect(x - 94, y - 34, 188, 72, 22);
    display.strokeRoundedRect(x - 94, y - 34, 188, 72, 22);
    display.fillStyle(0xfff8ef, 1);
    display.fillEllipse(x, y - 20, 148, 38);

    if (theme === 'ribbons') {
      for (const [dx, colour] of [
        [-48, 0xf2a8c0],
        [0, 0xa8d8d4],
        [48, 0xd5b8ef],
      ] as const) {
        display.fillStyle(colour, 1);
        display.fillCircle(x + dx, y - 23, 14);
        display.fillTriangle(x + dx - 10, y - 13, x + dx - 2, y + 13, x + dx + 2, y - 13);
        display.fillTriangle(x + dx + 10, y - 13, x + dx + 2, y + 13, x + dx - 2, y - 13);
      }
    } else {
      // Tiny physical samples of the cottage stock: cushion, lamp and rug swatch.
      display.fillStyle(0xbfe2ef, 1);
      display.fillRoundedRect(x - 65, y - 38, 42, 32, 12);
      display.lineStyle(2, 0x89b9ca, 0.78);
      display.strokeRoundedRect(x - 65, y - 38, 42, 32, 12);

      display.fillStyle(0xffdda0, 1);
      display.fillCircle(x, y - 30, 17);
      display.fillStyle(0xb28bb9, 1);
      display.fillRoundedRect(x - 4, y - 14, 8, 20, 4);

      display.fillStyle(0xf0a8bf, 1);
      display.fillRoundedRect(x + 26, y - 38, 52, 30, 8);
      display.lineStyle(3, 0xffd36f, 0.9);
      display.lineBetween(x + 31, y - 32, x + 70, y - 32);
      display.lineStyle(3, 0xa8d8d4, 0.9);
      display.lineBetween(x + 31, y - 23, x + 70, y - 23);
      display.lineStyle(3, 0xbca8eb, 0.9);
      display.lineBetween(x + 31, y - 14, x + 70, y - 14);
    }
    display.setDepth(worldDepthForY(y + 48, 0.24));
  }

  private createThreadMirror(x: number, y: number): void {
    const mirror = this.add.graphics().setName('village-interior:accessory-shop:mirror');
    mirror.fillStyle(0x6b4b64, 0.1);
    mirror.fillEllipse(x + 6, y + 80, 116, 24);
    mirror.fillStyle(0xd9b6d3, 1);
    mirror.lineStyle(5, 0xa5739c, 0.84);
    mirror.fillRoundedRect(x - 58, y - 94, 116, 188, 56);
    mirror.strokeRoundedRect(x - 58, y - 94, 116, 188, 56);
    mirror.fillStyle(0xf8f0ff, 1);
    mirror.fillRoundedRect(x - 44, y - 79, 88, 158, 44);
    mirror.lineStyle(3, 0xffffff, 0.7);
    mirror.lineBetween(x - 25, y - 55, x + 18, y - 10);
    mirror.lineBetween(x - 16, y - 66, x + 28, y - 20);
    mirror.fillStyle(0xb783a8, 1);
    mirror.fillRoundedRect(x - 10, y + 88, 20, 46, 8);
    mirror.fillEllipse(x, y + 134, 78, 22);
    mirror.setDepth(worldDepthForY(y + 136, 0.2));
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
        result: { type: 'callback', activate: () => this.openBakeryCounter('pastries') },
      },
      {
        id: 'interaction:village-interior:bakery:bread-counter',
        label: 'Fresh bread counter',
        actionLabel: 'Browse',
        actionKind: 'buy',
        position: { x: 1090, y: 565 },
        interactionRadius: 155,
        priority: 28,
        result: { type: 'callback', activate: () => this.openBakeryCounter('bread') },
      },
      {
        id: 'interaction:village-interior:bakery:doughnuts',
        label: 'Doughnut display',
        actionLabel: 'Browse',
        actionKind: 'buy',
        position: { x: 1080, y: 755 },
        interactionRadius: 145,
        priority: 27,
        result: { type: 'callback', activate: () => this.openBakeryCounter('doughnuts') },
      },
      {
        id: 'interaction:village-interior:bakery:cupcakes',
        label: 'Cupcake tower',
        actionLabel: 'Browse',
        actionKind: 'buy',
        position: { x: 420, y: 755 },
        interactionRadius: 145,
        priority: 27,
        result: { type: 'callback', activate: () => this.openBakeryCounter('cupcakes') },
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
        result: { type: 'callback', activate: () => this.openBakeryBakerConversation() },
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
    const worker = getVillageInteriorAnchor('accessory-shop', 'npc-work');
    const display = getVillageInteriorAnchor('accessory-shop', 'primary-feature');
    const mirror = getVillageInteriorAnchor('accessory-shop', 'secondary-feature');
    return [
      {
        id: 'interaction:village-interior:accessory-shop:counter',
        label: 'Style desk',
        actionLabel: 'Browse',
        actionKind: 'buy',
        position: counter.approach,
        interactionRadius: 155,
        priority: 28,
        result: { type: 'callback', activate: () => this.openThreadShop('accessories') },
      },
      {
        id: 'interaction:village-interior:accessory-shop:shopkeeper',
        label: 'Velvet',
        actionLabel: 'Talk',
        actionKind: 'talk',
        position: worker.approach,
        interactionRadius: 160,
        priority: 35,
        result: { type: 'callback', activate: () => this.openThreadShopkeeperConversation() },
      },
      {
        id: 'interaction:village-interior:accessory-shop:wall-rack',
        label: 'Ribbon wall',
        actionLabel: 'Browse wearables',
        actionKind: 'buy',
        position: { x: 385, y: 570 },
        interactionRadius: 145,
        priority: 23,
        result: { type: 'callback', activate: () => this.openThreadShop('accessories') },
      },
      {
        id: 'interaction:village-interior:accessory-shop:display',
        label: 'Accessory gallery',
        actionLabel: 'Browse wearables',
        actionKind: 'buy',
        position: display.approach,
        interactionRadius: 145,
        priority: 22,
        result: { type: 'callback', activate: () => this.openThreadShop('accessories') },
      },
      {
        id: 'interaction:village-interior:accessory-shop:home-display',
        label: 'Cottage accents',
        actionLabel: 'Browse décor',
        actionKind: 'buy',
        position: { x: 830, y: 825 },
        interactionRadius: 150,
        priority: 22,
        result: { type: 'callback', activate: () => this.openThreadShop('decorations') },
      },
      {
        id: 'interaction:village-interior:accessory-shop:mirror',
        label: 'Dressing mirror',
        actionLabel: 'Admire',
        actionKind: 'inspect',
        position: mirror.approach,
        interactionRadius: 140,
        priority: 18,
        result: {
          type: 'callback',
          activate: () =>
            this.showFeedback(
              'The mirror catches every sparkle. Velvet has angled it so even the shyest accessory gets a dramatic entrance.',
              mirror.approach,
            ),
        },
      },
    ];
  }

  private openBakeryCounter(section: BakerySectionId = this.bakerySection): void {
    this.bakerySection = section;
    const bakery = new BakeryService(getBrowserSaveService());
    const stock = bakery.listStock();
    const visibleStock = stock.filter((item) => item.section === section);
    this.openOverlay();
    if (!this.overlay) {
      return;
    }

    const title = this.add
      .text(GAME_WIDTH / 2, 126, 'Cinnamon’s Bakery', {
        color: '#563f63',
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('bakery-shop-title')
      .setScrollFactor(0);
    const note = this.add
      .text(
        GAME_WIDTH / 2,
        158,
        'Small batches are baked each morning — when they’re gone, they’re gone for the day.',
        {
          color: '#806985',
          fontFamily: UI_FONT,
          fontSize: '12px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setScrollFactor(0);
    this.overlay.add([title, note]);

    BAKERY_SECTIONS.forEach((tab, index) => {
      const x = 280 + index * 240;
      const selected = tab.id === section;
      const surface = this.add.graphics().setScrollFactor(0);
      surface.fillStyle(0x4b3045, 0.12);
      surface.fillRoundedRect(x - 92 + 4, 188 + 4, 184, 52, 18);
      surface.fillStyle(selected ? 0xf3d9a4 : 0xead4ee, 1);
      surface.lineStyle(3, selected ? 0xb7834e : 0xb486a8, 0.95);
      surface.fillRoundedRect(x - 92, 188, 184, 52, 18);
      surface.strokeRoundedRect(x - 92, 188, 184, 52, 18);
      const hit = this.add
        .rectangle(x, 214, 196, 64, 0xffffff, 0.001)
        .setAlpha(0.001)
        .setInteractive({ useHandCursor: true })
        .setScrollFactor(0);
      const count = stock.filter((item) => item.section === tab.id).length;
      const label = this.add
        .text(x, 214, `${tab.icon} ${tab.label}  ${count}`, {
          color: selected ? '#664631' : '#5d4360',
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      hit.on('pointerdown', () => this.openBakeryCounter(tab.id));
      this.overlay?.add([surface, hit, label]);
    });

    visibleStock.forEach((item, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      const x = 320 + column * 320;
      const y = 345 + row * 155;

      const card = this.add.graphics().setScrollFactor(0);
      card.fillStyle(0x4b3045, 0.1);
      card.fillRoundedRect(x - 140 + 5, y - 68 + 6, 280, 136, 18);
      card.fillStyle(item.isSoldOut ? 0xf2ece9 : 0xfffbef, 1);
      card.lineStyle(3, item.isUnlocked ? 0xd3a0ae : 0xbfa8c7, 0.9);
      card.fillRoundedRect(x - 140, y - 68, 280, 136, 18);
      card.strokeRoundedRect(x - 140, y - 68, 280, 136, 18);

      const iconWell = this.add
        .circle(x - 104, y - 18, 27, item.isUnlocked ? 0xf1d7cf : 0xe6dfea, 1)
        .setStrokeStyle(2, item.isUnlocked ? 0xc995a4 : 0xb7a4c1, 0.85)
        .setScrollFactor(0);
      const icon = this.add
        .text(x - 104, y - 18, item.definition.icon ?? '🥐', {
          fontFamily: UI_FONT,
          fontSize: '29px',
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      const name = this.add
        .text(x - 67, y - 34, item.definition.name, {
          color: '#5b4662',
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
          wordWrap: { width: 180 },
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0);

      const status = !item.isUnlocked
        ? (item.unlockHint ?? 'Locked')
        : item.isOwned
          ? 'Owned ✓'
          : item.isSoldOut
            ? 'Sold out • back tomorrow'
            : `${item.price} Shimmer • ${item.remainingStock}/${item.maxDailyStock} left`;
      const detail = this.add
        .text(x - 67, y, status, {
          color: item.isSoldOut ? '#8d6f7b' : '#806985',
          fontFamily: UI_FONT,
          fontSize: '10px',
          wordWrap: { width: 182 },
        })
        .setOrigin(0, 0.5)
        .setScrollFactor(0);

      this.overlay?.add([card, iconWell, icon, name, detail]);
      this.createOverlayButton(
        x,
        y + 33,
        item.isOwned
          ? 'Yours'
          : !item.isUnlocked
            ? 'Locked'
            : item.isSoldOut
              ? 'Sold out'
              : `Buy • ${item.price} ✨`,
        () => this.buyBakeryItem(item.definition.id),
        item.isUnlocked && !item.isOwned && !item.isSoldOut,
        220,
        36,
      );
    });

    if (this.bakeryShopFeedback) {
      const feedback = this.add
        .text(GAME_WIDTH / 2, 610, this.bakeryShopFeedback, {
          color: '#704d61',
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 700 },
        })
        .setOrigin(0.5)
        .setScrollFactor(0);
      this.overlay.add(feedback);
    }

    this.createOverlayButton(
      GAME_WIDTH / 2,
      660,
      'Back to the bakery',
      () => this.closeOverlay(),
      true,
      250,
      46,
    );
  }

  private openOverlay(): void {
    this.closeOverlay();
    setInteractionModalActive(this, true);
    this.overlay = this.add.container(0, 0).setDepth(20_500).setScrollFactor(0);

    const shade = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x493c50, 0.68)
      .setInteractive()
      .setScrollFactor(0);

    const panel = this.add.graphics().setScrollFactor(0);
    panel.fillStyle(0x24192b, 0.2);
    panel.fillRoundedRect(91, 82, 1110, 618, 30);
    panel.fillStyle(0xfff7e7, 1);
    panel.lineStyle(5, 0xc98eb7, 0.95);
    panel.fillRoundedRect(80, 70, 1110, 618, 30);
    panel.strokeRoundedRect(80, 70, 1110, 618, 30);
    panel.fillStyle(0xead4ee, 0.22);
    panel.fillRoundedRect(98, 88, 1074, 94, 22);

    this.overlay.add([shade, panel]);
  }

  private createOverlayButton(
    x: number,
    y: number,
    labelText: string,
    onPress: () => void,
    enabled = true,
    width = 260,
    height = 58,
  ): void {
    if (!this.overlay) {
      return;
    }

    const fill = enabled ? UI_COLOURS.gold : UI_COLOURS.lavender;
    const stroke = enabled ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong;
    const surface = this.add.graphics().setScrollFactor(0);
    surface.fillStyle(0x4b3045, 0.12);
    surface.fillRoundedRect(x - width / 2 + 4, y - height / 2 + 5, width, height, 16);
    surface.fillStyle(fill, enabled ? 1 : 0.62);
    surface.lineStyle(3, stroke, 0.95);
    surface.fillRoundedRect(x - width / 2, y - height / 2, width, height, 16);
    surface.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 16);

    const hit = this.add
      .rectangle(x, y, width + 8, height + 8, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setScrollFactor(0);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: height <= 42 ? '12px' : '15px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    if (enabled) {
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onPress);
      hit.on('pointerover', () => {
        surface.setAlpha(0.9);
      });
      hit.on('pointerout', () => {
        surface.setAlpha(1);
      });
    }

    this.overlay.add([surface, hit, label]);
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
    if (result.type === 'purchased') {
      this.bakeryShopFeedback = `✨ ${result.item.name} added to your bag. ${result.balance} Shimmer left.`;
      this.cameras.main.flash(90, 255, 236, 178, false);
    } else if (result.type === 'insufficient-funds') {
      this.bakeryShopFeedback = `You need ${result.shortfall} more Shimmer for ${result.item.name}.`;
    } else if (result.type === 'locked') {
      this.bakeryShopFeedback = result.unlockHint;
    } else if (result.type === 'sold-out') {
      this.bakeryShopFeedback = `${result.item.name} is sold out until the next morning.`;
    } else if (result.type === 'persistence-failed') {
      this.bakeryShopFeedback = 'That did not save, so no Shimmer was spent. Please try again.';
    } else {
      this.bakeryShopFeedback = `${result.item.name} is already safely in your collection.`;
    }

    this.refreshBalance();
    this.openBakeryCounter(this.bakerySection);
  }

  private openBakeryBakerConversation(): void {
    const presenter = getWorldConversationPresenter();
    presenter.startChoice(
      this,
      'resident:cinnamon',
      'Cinnamon',
      'Cinnamon smiles from between the counters. “What can I help you with?”',
      [
        { id: 'shop', label: 'Shop' },
        {
          id: 'talk',
          label: 'Talk about something else',
          followUpMessage: this.getBakeryBakerConversationLine(),
        },
      ],
      {
        onChoice: (choiceId) => {
          if (choiceId !== 'shop') {
            return;
          }
          this.time.delayedCall(0, () => this.openBakeryCounter('pastries'));
        },
      },
    );
  }

  private getBakeryBakerConversationLine(): string {
    const progress = getBrowserQuestEngine().getProgress(MAPLE_CAKE_QUEST_ID);
    if (progress.status === 'not-started') {
      return 'Maple has been sketching a celebration cake outside. If she recruits you, I have plenty of bowls and absolutely no fear of sprinkles.';
    }
    if (questIsAt(MAPLE_CAKE_QUEST_ID, 1)) {
      return 'Maple left three colour plans on the cake table. Pick the one you like and I’ll make sure the cake wobbles safely.';
    }
    if (questIsAt(MAPLE_CAKE_QUEST_ID, 4)) {
      return 'That cake is gloriously uneven. Maple is outside and definitely needs to see what you made.';
    }
    if (progress.status === 'completed') {
      return 'Maple’s Wobbly Cake is officially a Bakery favourite now. I keep a few celebration slices on the counter whenever I can.';
    }
    return 'Everything on the counter is fresh today. The Berry Buns disappear fastest, but the Cloud Biscuits make the best crumbs.';
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

  private openThreadShopkeeperConversation(): void {
    getWorldConversationPresenter().startChoice(
      this,
      'resident:velvet',
      'Velvet',
      'Velvet gives the nearest display a tiny adjustment. “Looking for something special?”',
      [
        { id: 'shop', label: 'Shop' },
        {
          id: 'talk',
          label: 'Talk about something else',
          followUpMessage:
            'I change the displays whenever the light changes. A ribbon can look completely different in morning sunshine than it does under evening lanterns.',
        },
      ],
      {
        onChoice: (choiceId) => {
          if (choiceId === 'shop') {
            this.time.delayedCall(0, () => this.openThreadShop());
          }
        },
      },
    );
  }

  private openThreadShop(
    initialSection: 'accessories' | 'decorations' = 'accessories',
  ): void {
    if (this.closing) {
      return;
    }
    this.scene.launch('ShopScene', {
      returnScene: 'VillageInteriorScene',
      initialSection,
    });
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
