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
  TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
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
import { R6_SUPPORTING_RESIDENTS } from '../population/R6SupportingResidentContent';
import { createSupportingResidentSprite } from '../population/SupportingResidentArt';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getQuestStepId } from '../quests/QuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

export type VillageInteriorId = 'bakery' | 'accessory-shop' | 'library';

interface VillageInteriorSceneData {
  interiorId?: VillageInteriorId;
  returnScene?: string;
}

interface InteriorDefinition {
  id: VillageInteriorId;
  title: string;
  subtitle: string;
  icon: string;
  wallColour: number;
  floorColour: number;
  accentColour: number;
}

interface ActionButtonOptions {
  x: number;
  y: number;
  width?: number;
  label: string;
  fill?: number;
  onPress: () => void;
  enabled?: boolean;
}

const INTERIORS: Readonly<Record<VillageInteriorId, InteriorDefinition>> = {
  bakery: {
    id: 'bakery',
    title: 'Sunbeam Bakery',
    subtitle: 'Warm buns, picnic treasures and Maple’s extremely wobbly cake ideas.',
    icon: '🥐',
    wallColour: 0xffd6a3,
    floorColour: 0xd99d6b,
    accentColour: 0xf28b62,
  },
  'accessory-shop': {
    id: 'accessory-shop',
    title: 'Twinkle & Thread',
    subtitle: 'Wearable treasures that grow with your adventures, never your chores.',
    icon: '🎀',
    wallColour: 0xf6d5ef,
    floorColour: 0xc894bd,
    accentColour: 0xc56fb6,
  },
  library: {
    id: 'library',
    title: 'Story House',
    subtitle:
      'Tansy keeps maps, clue cards and little stories from places you have really found.',
    icon: '📚',
    wallColour: 0xd9edff,
    floorColour: 0x8eb5c8,
    accentColour: 0x648fac,
  },
};

function isInteriorId(value: unknown): value is VillageInteriorId {
  return value === 'bakery' || value === 'accessory-shop' || value === 'library';
}

function supportingResident(id: 'resident:maple' | 'resident:tansy') {
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
  private body: Phaser.GameObjects.Container | null = null;
  private feedback: Phaser.GameObjects.Text | null = null;
  private balanceText: Phaser.GameObjects.Text | null = null;
  private readonly purchaseGuard = new ShopPurchaseTapGuard();
  private storyCardCursor = 0;

  public constructor() {
    super('VillageInteriorScene');
  }

  public create(data: VillageInteriorSceneData): void {
    this.interiorId = isInteriorId(data.interiorId) ? data.interiorId : 'accessory-shop';
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;
    this.storyCardCursor = 0;
    this.purchaseGuard.reset();

    const definition = INTERIORS[this.interiorId];
    this.cameras.main.setBackgroundColor('#5d4964');
    this.createRoom(definition);
    this.createPersistentControls();
    this.refreshBody();

    this.input.keyboard?.on('keydown-ESC', this.leaveInterior, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', this.leaveInterior, this);
      this.body?.destroy(true);
      this.body = null;
      this.feedback = null;
      this.balanceText = null;
      this.purchaseGuard.reset();
    });
  }

  private createRoom(definition: InteriorDefinition): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x5b4662, 1);
    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1160, 660, 1, 0.28);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, 1160, 660, definition.wallColour, 1)
      .setStrokeStyle(8, definition.accentColour, 0.95)
      .setDepth(2);
    this.add.rectangle(GAME_WIDTH / 2, 560, 1140, 250, definition.floorColour, 1).setDepth(3);
    this.add.rectangle(GAME_WIDTH / 2, 438, 1140, 16, 0xffffff, 0.35).setDepth(4);

    this.add
      .text(GAME_WIDTH / 2, 58, `${definition.icon}  ${definition.title}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(8);
    this.add
      .text(GAME_WIDTH / 2, 98, definition.subtitle, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5)
      .setDepth(8);

    this.createWindow(250, 238, definition.accentColour);
    this.createWindow(1030, 238, definition.accentColour);

    if (definition.id === 'bakery') {
      this.createBakerySet();
    } else if (definition.id === 'library') {
      this.createStoryHouseSet();
    } else {
      this.createThreadSet();
    }

    this.feedback = this.add
      .text(GAME_WIDTH / 2, 625, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 820 },
        backgroundColor: '#fff8e8ee',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);
  }

  private createWindow(x: number, y: number, accent: number): void {
    this.add.rectangle(x, y, 190, 126, 0xbce9f4, 1).setStrokeStyle(8, accent, 0.82).setDepth(5);
    this.add.rectangle(x, y, 9, 116, 0xffffff, 0.62).setDepth(6);
    this.add.rectangle(x, y, 180, 9, 0xffffff, 0.62).setDepth(6);
    this.add.circle(x - 48, y - 34, 20, 0xffef9d, 0.82).setDepth(5.5);
  }

  private createBakerySet(): void {
    this.add
      .rectangle(640, 372, 450, 122, 0xb77456, 1)
      .setStrokeStyle(5, 0x8d553f, 0.9)
      .setDepth(6);
    for (const [x, icon] of [
      [520, '🥐'],
      [600, '🍓'],
      [680, '🧁'],
      [760, '🥖'],
    ] as const) {
      this.add
        .text(x, 330, icon, { fontFamily: UI_FONT, fontSize: '38px' })
        .setOrigin(0.5)
        .setDepth(7);
    }
    this.add
      .rectangle(400, 320, 110, 160, 0x875743, 1)
      .setStrokeStyle(5, 0x684232, 0.9)
      .setDepth(5);
    this.add
      .text(400, 315, '🔥', { fontFamily: UI_FONT, fontSize: '42px' })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .rectangle(870, 314, 150, 180, 0xe8b984, 1)
      .setStrokeStyle(5, 0xb97a58, 0.8)
      .setDepth(5);
    this.add
      .text(870, 288, 'RECIPES', {
        color: '#704637',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.add
      .text(870, 335, '📜  📖\n📄  🥄', {
        fontFamily: UI_FONT,
        fontSize: '28px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  private createStoryHouseSet(): void {
    for (const x of [430, 640, 850]) {
      this.add
        .rectangle(x, 335, 150, 220, 0x6f8aa0, 1)
        .setStrokeStyle(5, 0x526f86, 0.9)
        .setDepth(5);
      for (let row = 0; row < 3; row += 1) {
        this.add.rectangle(x, 282 + row * 62, 126, 8, 0x435d72, 0.9).setDepth(6);
        this.add
          .text(x, 258 + row * 62, '📕 📗 📘 📙', { fontFamily: UI_FONT, fontSize: '18px' })
          .setOrigin(0.5)
          .setDepth(6);
      }
    }
    this.add
      .ellipse(640, 515, 380, 118, 0xf2d7a7, 1)
      .setStrokeStyle(4, 0xb58c60, 0.75)
      .setDepth(5);
    this.add
      .text(640, 505, '🗺️   📖   ✨', { fontFamily: UI_FONT, fontSize: '34px' })
      .setOrigin(0.5)
      .setDepth(6);
  }

  private createThreadSet(): void {
    this.add
      .rectangle(640, 350, 430, 120, 0xb77baa, 1)
      .setStrokeStyle(5, 0x8e5d86, 0.9)
      .setDepth(6);
    for (const [x, icon] of [
      [515, '🎀'],
      [600, '🌸'],
      [685, '✨'],
      [770, '🌈'],
    ] as const) {
      this.add.circle(x, 300, 38, 0xfff6fb, 0.86).setStrokeStyle(3, 0xd8a4cf, 0.9).setDepth(6);
      this.add
        .text(x, 300, icon, { fontFamily: UI_FONT, fontSize: '30px' })
        .setOrigin(0.5)
        .setDepth(7);
    }
    this.add
      .text(640, 405, 'Adventure stock changes as the valley grows', {
        color: '#684c67',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(7);
  }

  private createPersistentControls(): void {
    this.createActionButton(
      {
        x: 170,
        y: GAME_HEIGHT - 46,
        width: 240,
        label: '← Back to village',
        fill: UI_COLOURS.lavender,
        onPress: () => this.leaveInterior(),
      },
      null,
    );
    this.balanceText = this.add
      .text(GAME_WIDTH - 155, GAME_HEIGHT - 46, '', {
        color: '#76518a',
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#f3e7f8e8',
        padding: { x: 12, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(18);
    this.refreshBalance();
  }

  private refreshBody(): void {
    this.body?.destroy(true);
    this.body = this.add.container(0, 0).setDepth(10);
    if (this.interiorId === 'bakery') {
      this.renderBakery();
    } else if (this.interiorId === 'library') {
      this.renderStoryHouse();
    } else {
      this.renderThreadShop();
    }
    this.refreshBalance();
  }

  private renderBakery(): void {
    const maple = supportingResident('resident:maple');
    const sprite = createSupportingResidentSprite(this, maple)
      .setPosition(1010, 430)
      .setDisplaySize(142, 123);
    const name = this.add
      .text(1010, 500, 'Maple', {
        color: '#704637',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#fff3d7e8',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    this.body?.add([sprite, name]);

    const bakery = new BakeryService(getBrowserSaveService());
    bakery.listStock().forEach((stock, index) => {
      const x = 300 + index * 330;
      const card = this.add
        .rectangle(x, 250, 285, 150, 0xfffbf3, 0.97)
        .setStrokeStyle(3, 0xd88b62, 0.9);
      const icon = this.add
        .text(x - 105, 220, stock.definition.icon ?? '🥐', {
          fontFamily: UI_FONT,
          fontSize: '34px',
        })
        .setOrigin(0.5);
      const title = this.add.text(x - 70, 205, stock.definition.name, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      });
      const detail = this.add.text(
        x - 70,
        232,
        stock.isUnlocked
          ? stock.isOwned
            ? 'Owned ✓'
            : `${stock.price} Shimmer`
          : (stock.unlockHint ?? 'Locked'),
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '12px',
          wordWrap: { width: 170 },
        },
      );
      this.body?.add([card, icon, title, detail]);
      this.createActionButton(
        {
          x,
          y: 294,
          width: 190,
          label: stock.isOwned
            ? 'Yours!'
            : stock.isUnlocked
              ? `Buy • ${stock.price} ✨`
              : 'Locked',
          enabled: stock.isUnlocked && !stock.isOwned,
          onPress: () => this.buyBakeryItem(stock.definition.id),
        },
        this.body,
      );
    });

    this.createActionButton(
      {
        x: 310,
        y: 485,
        width: 230,
        label: '💬 Talk to Maple',
        onPress: () => this.talkToMaple(),
      },
      this.body,
    );
    this.createActionButton(
      {
        x: 570,
        y: 485,
        width: 230,
        label: '🎂 Wobbly Cake Plan',
        onPress: () => this.openCakePlan(),
      },
      this.body,
    );

    if (this.shouldShowBakeryMapCorner()) {
      this.createActionButton(
        {
          x: 830,
          y: 485,
          width: 230,
          label: '🔎 Check recipe shelf',
          fill: UI_COLOURS.mint,
          onPress: () => this.findBakeryMapCorner(),
        },
        this.body,
      );
    } else {
      this.createActionButton(
        {
          x: 830,
          y: 485,
          width: 230,
          label: '📜 Browse recipes',
          fill: UI_COLOURS.mint,
          onPress: () =>
            this.showFeedback(
              'Maple’s recipe shelf contains berry buns, cloud biscuits and one page simply labelled “TRY MORE SPRINKLES”.',
            ),
        },
        this.body,
      );
    }
  }

  private renderStoryHouse(): void {
    const tansy = supportingResident('resident:tansy');
    const sprite = createSupportingResidentSprite(this, tansy)
      .setPosition(1015, 430)
      .setDisplaySize(142, 123);
    const name = this.add
      .text(1015, 500, 'Tansy', {
        color: '#4f6171',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#eff8ffe8',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    this.body?.add([sprite, name]);

    const storyHouse = new StoryHouseService(getBrowserSaveService());
    const summary = this.add.text(165, 185, storyHouse.getWonderbookSummary(), {
      color: UI_COLOURS.ink,
      fontFamily: UI_FONT,
      fontSize: '15px',
      fontStyle: 'bold',
      wordWrap: { width: 520 },
      backgroundColor: '#f8fcffee',
      padding: { x: 14, y: 10 },
    });
    const clue = this.add.text(165, 282, `🗺️ ${storyHouse.getCurrentClue()}`, {
      color: UI_COLOURS.softInk,
      fontFamily: UI_FONT,
      fontSize: '14px',
      wordWrap: { width: 520 },
      backgroundColor: '#fff7dfee',
      padding: { x: 14, y: 10 },
    });
    this.body?.add([summary, clue]);

    this.createActionButton(
      {
        x: 300,
        y: 465,
        width: 230,
        label: '💬 Talk to Tansy',
        onPress: () => this.talkToTansy(),
      },
      this.body,
    );
    this.createActionButton(
      {
        x: 560,
        y: 465,
        width: 230,
        label: '📖 Read story card',
        onPress: () => this.readStoryCard(),
      },
      this.body,
    );
    this.createActionButton(
      {
        x: 820,
        y: 465,
        width: 230,
        label: '🗺️ Check valley clues',
        fill: UI_COLOURS.mint,
        onPress: () => this.showFeedback(storyHouse.getCurrentClue()),
      },
      this.body,
    );
  }

  private renderThreadShop(): void {
    const shop = new ShopService(getBrowserSaveService());
    const stock = shop.listStock();
    const unlocked = stock.filter(({ isUnlocked }) => isUnlocked).length;
    const owned = stock.filter(({ isUniqueOwned }) => isUniqueOwned).length;
    const panel = this.add
      .text(
        GAME_WIDTH / 2,
        235,
        `${unlocked}/${stock.length} stock lines unlocked  •  ${owned} wearable${owned === 1 ? '' : 's'} owned\nStarter treasures are affordable now; new pieces appear through stories, discoveries and racing.`,
        {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 760 },
          backgroundColor: '#fff8fcee',
          padding: { x: 18, y: 14 },
        },
      )
      .setOrigin(0.5);
    this.body?.add(panel);

    this.createActionButton(
      {
        x: 470,
        y: 475,
        width: 300,
        label: '🎀 Browse Twinkle & Thread',
        onPress: () => this.openThreadShop(),
      },
      this.body,
    );
    this.createActionButton(
      {
        x: 810,
        y: 475,
        width: 300,
        label: '✨ What unlocked?',
        fill: UI_COLOURS.mint,
        onPress: () => this.showThreadProgress(stock),
      },
      this.body,
    );
  }

  private createActionButton(
    options: ActionButtonOptions,
    parent: Phaser.GameObjects.Container | null,
  ): void {
    const fill =
      options.enabled === false ? UI_COLOURS.lavender : (options.fill ?? UI_COLOURS.gold);
    const button = this.add
      .rectangle(
        options.x,
        options.y,
        options.width ?? 220,
        54,
        fill,
        options.enabled === false ? 0.6 : 1,
      )
      .setStrokeStyle(
        3,
        options.enabled === false ? UI_COLOURS.lavenderStrong : UI_COLOURS.goldStrong,
        0.95,
      )
      .setDepth(16);
    const label = this.add
      .text(options.x, options.y, options.label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(17);
    if (options.enabled !== false) {
      button.setInteractive({ useHandCursor: true });
      label.setInteractive({ useHandCursor: true });
      applyButtonHover(button, fill, UI_COLOURS.blush);
      button.on('pointerdown', options.onPress);
      label.on('pointerdown', options.onPress);
    }
    parent?.add([button, label]);
  }

  private buyBakeryItem(itemId: ItemId): void {
    if (!this.purchaseGuard.tryBegin(itemId, this.time.now)) {
      return;
    }
    const result = new BakeryService(getBrowserSaveService()).purchase(itemId);
    if (result.type === 'purchased') {
      this.showFeedback(`✨ ${result.item.name} is yours! ${result.balance} Shimmer left.`);
      this.cameras.main.flash(100, 255, 236, 178, false);
    } else if (result.type === 'insufficient-funds') {
      this.showFeedback(`Almost! You need ${result.shortfall} more Shimmer for ${result.item.name}.`);
    } else if (result.type === 'locked') {
      this.showFeedback(result.unlockHint);
    } else {
      this.showFeedback(`${result.item.name} is already tucked safely into your collection.`);
    }
    this.refreshBody();
  }

  private talkToMaple(): void {
    const engine = getBrowserQuestEngine();
    let progress = engine.getProgress(MAPLE_CAKE_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = engine.startQuest(MAPLE_CAKE_QUEST_ID);
    }
    if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(MAPLE_CAKE_QUEST_ID, 0)
    ) {
      engine.notifyCharacterTalked(MAPLE_CHARACTER_ID);
      this.showFeedback(
        'Maple: “I need a celebration cake with personality. Pick a colour plan, then we can wobble it together!”',
      );
    } else if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(MAPLE_CAKE_QUEST_ID, 4)
    ) {
      engine.notifyCharacterTalked(MAPLE_CHARACTER_ID);
      this.showFeedback(
        'Maple: “It is magnificently wobbly. That makes it ours. I saved a picnic-basket pattern for you too!”',
      );
    } else if (progress.status === 'completed') {
      this.showFeedback(
        'Maple: “The Wobbly Cake Plan is officially a success. I am still voting for extra sprinkles next time.”',
      );
    } else {
      this.showFeedback('Maple: “The cake plan is waiting. Choose a design when you are ready.”');
    }
    this.refreshBody();
  }

  private openCakePlan(): void {
    const engine = getBrowserQuestEngine();
    let progress = engine.getProgress(MAPLE_CAKE_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = engine.startQuest(MAPLE_CAKE_QUEST_ID);
    }
    if (!questIsAt(MAPLE_CAKE_QUEST_ID, 1)) {
      if (progress.status === 'completed') {
        this.showFeedback(
          'Maple’s first Wobbly Cake is already part of Village history. The repeatable baking table comes later in R6.5.',
        );
      } else {
        this.showFeedback('Talk to Maple first so she can explain the Wobbly Cake Plan.');
      }
      return;
    }

    const overlay = this.add.container(0, 0).setDepth(40);
    const shade = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x493c50, 0.62)
      .setInteractive();
    const card = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 760, 330, 0xfffbef, 1)
      .setStrokeStyle(6, 0xe29b68, 1);
    const title = this.add
      .text(GAME_WIDTH / 2, 245, 'Pick a Wobbly Cake design', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const note = this.add
      .text(
        GAME_WIDTH / 2,
        285,
        'This is the story-sized decorating hook. WP14 can reuse it for the full repeatable baking activity.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '13px',
          align: 'center',
          wordWrap: { width: 620 },
        },
      )
      .setOrigin(0.5);
    overlay.add([shade, card, title, note]);
    const choices: Array<{ theme: MapleCakeTheme; label: string; x: number }> = [
      { theme: 'sunshine', label: '☀️ Sunshine', x: 400 },
      { theme: 'moonflower', label: '🌙 Moonflower', x: 640 },
      { theme: 'rainbow', label: '🌈 Rainbow', x: 880 },
    ];
    for (const choice of choices) {
      this.createOverlayChoice(overlay, choice.x, 385, choice.label, () => {
        this.finishCakeDesign(choice.theme);
        overlay.destroy(true);
      });
    }
  }

  private createOverlayChoice(
    parent: Phaser.GameObjects.Container,
    x: number,
    y: number,
    labelText: string,
    onPress: () => void,
  ): void {
    const button = this.add
      .rectangle(x, y, 200, 72, UI_COLOURS.gold, 1)
      .setStrokeStyle(4, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true });
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    applyButtonHover(button, UI_COLOURS.gold, UI_COLOURS.blush);
    button.on('pointerdown', onPress);
    label.on('pointerdown', onPress);
    parent.add([button, label]);
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
    this.showFeedback(
      `🎂 ${theme === 'sunshine' ? 'Sunny yellow' : theme === 'moonflower' ? 'Moonflower blue' : 'Rainbow bright'} cake complete! Talk to Maple again so she can see your magnificently wobbly design.`,
    );
    this.cameras.main.flash(120, 255, 232, 172, false);
    this.refreshBody();
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
    if (service.hasDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID)) {
      this.showFeedback('The flour-dusted map corner is already safely with you.');
      return;
    }
    service.unlockDiscovery(TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID);
    this.showFeedback(
      '🗺️ Map corner found! It had been used as a recipe bookmark and now smells faintly of berry buns.',
    );
    this.cameras.main.flash(100, 255, 239, 186, false);
    this.refreshBody();
  }

  private talkToTansy(): void {
    const engine = getBrowserQuestEngine();
    let progress = engine.getProgress(TANSY_MAP_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = engine.startQuest(TANSY_MAP_QUEST_ID);
    }
    if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(TANSY_MAP_QUEST_ID, 0)
    ) {
      engine.notifyCharacterTalked(TANSY_CHARACTER_ID);
      this.showFeedback(
        'Tansy: “Three corners escaped from my favourite map. One likes notices, one smells like baking, and one flew somewhere sunny.”',
      );
    } else if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(TANSY_MAP_QUEST_ID, 5)
    ) {
      engine.notifyCharacterTalked(TANSY_CHARACTER_ID);
      this.showFeedback(
        'Tansy: “They fit! The valley has corners again. I am pinning this map down with four bookmarks this time.”',
      );
    } else if (progress.status === 'completed') {
      this.showFeedback(
        'Tansy: “The repaired map is staying right here. Unless a very determined breeze learns to read.”',
      );
    } else {
      this.showFeedback(new StoryHouseService(getBrowserSaveService()).getCurrentClue());
    }
    this.refreshBody();
  }

  private readStoryCard(): void {
    const service = new StoryHouseService(getBrowserSaveService());
    const cards = service.listCards().filter(({ unlocked }) => unlocked);
    if (cards.length === 0) {
      this.showFeedback(
        'No story cards have reached the shelves yet. Exploring the valley will change that.',
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
    this.showFeedback(`${card.icon} ${card.title}\n${card.text}`);
    this.refreshBody();
  }

  private openThreadShop(): void {
    if (this.closing) {
      return;
    }
    this.scene.launch('ShopScene', { returnScene: 'VillageInteriorScene' });
    this.scene.pause();
  }

  private showThreadProgress(stock: ReturnType<ShopService['listStock']>): void {
    const nextLocked = stock.find(({ isUnlocked }) => !isUnlocked);
    this.showFeedback(
      nextLocked
        ? `Next locked treasure: ${nextLocked.definition.name}. ${nextLocked.unlockHint ?? 'Keep exploring to reveal it.'}`
        : 'Every current Twinkle & Thread stock line is unlocked. More region-themed stock can join later in R6.5.',
    );
  }

  private refreshBalance(): void {
    const balance = new ShimmerEconomyService(getBrowserSaveService()).getBalance();
    this.balanceText?.setText(`✨ ${balance} Shimmer`);
  }

  private showFeedback(message: string): void {
    this.feedback?.setText(message).setVisible(true);
  }

  private leaveInterior(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.scene.start(this.returnScene);
  }
}
