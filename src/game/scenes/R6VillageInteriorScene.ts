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

    this.createBakeryCafeChair(1118, 875, -8);
    this.createBakeryCafeChair(1302, 870, 8);

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
    boards.fillEllipse(x - 122, y - 14, 108, 24);
    boards.fillEllipse(x + 64, y - 14, 126, 24);
    boards.lineStyle(3, 0x9e6d51, 0.72);
    boards.strokeEllipse(x - 122, y - 14, 108, 24);
    boards.strokeEllipse(x + 64, y - 14, 126, 24);
    boards.setDepth(worldDepthForY(y + 70, 0.455));

    this.createBakeryBreadLoaf(x - 139, y - 62, 'seeded');
    this.createBakeryBreadLoaf(x - 70, y - 61, 'plait');
    this.createBakeryBreadLoaf(x + 38, y - 63, 'round');
    this.createBakeryBreadLoaf(x + 131, y - 83, 'baguette');
    this.createBakeryBreadLoaf(x - 122, y - 17, 'rolls');
    this.createBakeryBreadLoaf(x + 64, y - 16, 'plait');

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
      tower.fillRoundedRect(
        x + cupcake.dx - 10,
        y + cupcake.dy - 2,
        20,
        18,
        4,
      );
      tower.fillStyle(cupcake.icing, 1);
      tower.fillCircle(x + cupcake.dx, y + cupcake.dy - 7, 13);
      tower.fillStyle(0xfff4d5, 0.9);
      tower.fillCircle(x + cupcake.dx - 4, y + cupcake.dy - 12, 3);
    }
    tower.setDepth(worldDepthForY(y + 101, 0.32));

    this.add
      .text(x, y + 71, 'CUPCAKES', {
        color: '#76566d',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
        letterSpacing: 0.8,
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 102, 0.4));
  }

  private createBakeryCafeChair(x: number, y: number, angle: number): void {
    const chair = this.add.graphics().setName('village-interior:bakery:cafe-chair');
    chair.fillStyle(0x9f748c, 1);
    chair.lineStyle(3, 0x7c586d, 0.82);
    chair.fillRoundedRect(x - 27, y - 23, 54, 46, 14);
    chair.strokeRoundedRect(x - 27, y - 23, 54, 46, 14);
    chair.fillStyle(0xc49bb1, 1);
    chair.fillRoundedRect(x - 22, y - 18, 44, 30, 10);
    chair.lineStyle(3, 0x7c586d, 0.8);
    chair.lineBetween(x - 22, y + 22, x - 17, y + 46);
    chair.lineBetween(x + 22, y + 22, x + 17, y + 46);
    chair.lineBetween(x - 23, y - 20, x - 23, y - 48);
    chair.lineBetween(x + 23, y - 20, x + 23, y - 48);
    chair.lineBetween(x - 23, y - 48, x + 23, y - 48);
    chair.setAngle(angle);
    chair.setDepth(worldDepthForY(y + 48, 0.18));
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

    this.add
      .text(x, y + 71, 'DOUGHNUTS', {
        color: '#76566d',
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
        letterSpacing: 0.8,
      })
      .setOrigin(0.5)
      .setDepth(worldDepthForY(y + 102, 0.4));
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
        id: 'interaction:village-interior:bakery:bread-counter',
        label: 'Fresh bread counter',
        actionLabel: 'Browse',
        actionKind: 'buy',
        position: { x: 1090, y: 565 },
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
