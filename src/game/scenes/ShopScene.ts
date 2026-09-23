import Phaser from 'phaser';
import type { ItemId } from '../../content/contentTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShopPurchaseTapGuard } from '../economy/ShopPurchaseTapGuard';
import { ShopService, type ShopItemView } from '../economy/ShopService';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';

export type TwinkleShopSection = 'accessories' | 'decorations';

interface ShopSceneData {
  returnScene?: string;
  initialSection?: TwinkleShopSection;
}

const SHOP_SECTIONS = [
  { id: 'accessories', label: 'Wearables', icon: '🎀' },
  { id: 'decorations', label: 'Cottage décor', icon: '✨' },
] as const satisfies readonly {
  id: TwinkleShopSection;
  label: string;
  icon: string;
}[];

function belongsToSection(item: ShopItemView, section: TwinkleShopSection): boolean {
  return section === 'accessories'
    ? item.definition.category === 'accessory'
    : item.definition.category === 'decoration';
}

export class ShopScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private shopService: ShopService | null = null;
  private economyService: ShimmerEconomyService | null = null;
  private readonly purchaseTapGuard = new ShopPurchaseTapGuard();
  private balanceText: Phaser.GameObjects.Text | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private sectionLayer: Phaser.GameObjects.Container | null = null;
  private returnScene = 'SunbeamVillageScene';
  private section: TwinkleShopSection = 'accessories';
  private closing = false;

  public constructor() {
    super('ShopScene');
  }

  public create(data: ShopSceneData): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.section = data.initialSection ?? 'accessories';
    this.closing = false;
    this.purchaseTapGuard.reset();
    this.cameras.main.setBackgroundColor('rgba(0, 0, 0, 0)');

    const shade = this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x37283d, 0.7)
      .setDepth(1);

    const shell = this.add.graphics().setDepth(2);
    shell.fillStyle(0x38253d, 0.22);
    shell.fillRoundedRect(72, 54, GAME_WIDTH - 132, GAME_HEIGHT - 88, 34);
    shell.fillStyle(UI_COLOURS.cream, 1);
    shell.lineStyle(6, UI_COLOURS.lavenderStrong, 0.96);
    shell.fillRoundedRect(58, 40, GAME_WIDTH - 132, GAME_HEIGHT - 88, 34);
    shell.strokeRoundedRect(58, 40, GAME_WIDTH - 132, GAME_HEIGHT - 88, 34);
    shell.fillStyle(0xead4ee, 0.28);
    shell.fillRoundedRect(78, 60, GAME_WIDTH - 172, 112, 24);

    this.add
      .text(98, 83, 'Twinkle & Thread', {
        color: '#563f63',
        fontFamily: UI_FONT,
        fontSize: '30px',
        fontStyle: 'bold',
      })
      .setDepth(3);
    this.add
      .text(98, 123, 'Velvet’s little boutique of wearable treasures and cottage sparkle.', {
        color: '#806985',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setDepth(3);

    const saveService = getBrowserSaveService();
    this.shopService = new ShopService(saveService);
    this.economyService = new ShimmerEconomyService(saveService);

    this.balanceText = this.add
      .text(GAME_WIDTH - 118, 104, '', {
        color: '#684a70',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#f2e5f5',
        padding: { x: 15, y: 8 },
      })
      .setOrigin(1, 0.5)
      .setDepth(4);

    this.feedbackText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 105, '', {
        color: '#704d61',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 760 },
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.createFooterButton(
      GAME_WIDTH / 2 - 145,
      GAME_HEIGHT - 58,
      'Open My Bag',
      UI_COLOURS.lavender,
      UI_COLOURS.lavenderStrong,
      () => this.backToBag(),
    );
    this.createFooterButton(
      GAME_WIDTH / 2 + 145,
      GAME_HEIGHT - 58,
      'Back to boutique',
      UI_COLOURS.gold,
      UI_COLOURS.goldStrong,
      () => this.closeShop(),
    );

    shade.setInteractive();
    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);

    this.refreshBalance();
    this.renderSection();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sectionLayer?.destroy(true);
      this.sectionLayer = null;
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.shopService = null;
      this.economyService = null;
      this.balanceText = null;
      this.feedbackText = null;
      this.purchaseTapGuard.reset();
    });
  }

  public update(): void {
    this.inputController?.update();
    if (this.inputController?.justPressed('BACK')) {
      this.closeShop();
      return;
    }
    if (this.inputController?.justPressed('OPEN_INVENTORY')) {
      this.backToBag();
    }
  }

  private renderSection(): void {
    if (!this.shopService) {
      return;
    }

    this.sectionLayer?.destroy(true);
    this.sectionLayer = this.add.container(0, 0).setDepth(4);

    const stock = this.shopService.listStock();
    SHOP_SECTIONS.forEach((tab, index) => {
      const x = 270 + index * 270;
      const selected = tab.id === this.section;
      const surface = this.add.graphics();
      surface.fillStyle(0x4b3045, 0.12);
      surface.fillRoundedRect(x - 112 + 4, 190 + 5, 224, 54, 18);
      surface.fillStyle(selected ? 0xf3d9a4 : 0xead4ee, 1);
      surface.lineStyle(3, selected ? 0xb7834e : 0xb486a8, 0.95);
      surface.fillRoundedRect(x - 112, 190, 224, 54, 18);
      surface.strokeRoundedRect(x - 112, 190, 224, 54, 18);

      const hit = this.add
        .rectangle(x, 217, 232, 64, 0xffffff, 0.001)
        .setAlpha(0.001)
        .setName(`twinkle-shop-tab:${tab.id}`)
        .setInteractive({ useHandCursor: true });
      const count = stock.filter((item) => belongsToSection(item, tab.id)).length;
      const label = this.add
        .text(x, 217, `${tab.icon} ${tab.label}  ${count}`, {
          color: selected ? '#664631' : '#5d4360',
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      hit.on('pointerdown', () => {
        this.section = tab.id;
        this.feedbackText?.setText('');
        this.renderSection();
      });
      this.sectionLayer?.add([surface, hit, label]);
    });

    const visible = stock.filter((item) => belongsToSection(item, this.section));
    visible.forEach((entry, index) => {
      const column = index % 3;
      const row = Math.floor(index / 3);
      this.createStockCard(278 + column * 332, 342 + row * 158, entry);
    });

    const sectionHint = this.add
      .text(
        835,
        217,
        this.section === 'accessories'
          ? 'Wearables are yours permanently once bought.'
          : 'Cottage décor can be bought more than once.',
        {
          color: '#806985',
          fontFamily: UI_FONT,
          fontSize: '12px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0, 0.5);
    this.sectionLayer.add(sectionHint);
  }

  private createStockCard(x: number, y: number, entry: ShopItemView): void {
    if (!this.sectionLayer) {
      return;
    }

    const card = this.add.graphics();
    card.fillStyle(0x4b3045, 0.1);
    card.fillRoundedRect(x - 145 + 5, y - 68 + 6, 290, 136, 19);
    card.fillStyle(entry.isUnlocked ? 0xfffbef : 0xf1ebf1, 1);
    card.lineStyle(3, entry.isUnlocked ? 0xd3a0ae : 0xbfa8c7, 0.9);
    card.fillRoundedRect(x - 145, y - 68, 290, 136, 19);
    card.strokeRoundedRect(x - 145, y - 68, 290, 136, 19);

    const iconWell = this.add
      .circle(x - 108, y - 21, 29, entry.isUnlocked ? 0xf1d7cf : 0xe0d8e4, 1)
      .setStrokeStyle(2, entry.isUnlocked ? 0xc995a4 : 0xae9ab7, 0.86);
    const icon = this.add
      .text(x - 108, y - 21, entry.definition.icon ?? '✨', {
        fontFamily: UI_FONT,
        fontSize: '30px',
      })
      .setOrigin(0.5);

    const name = this.add
      .text(x - 69, y - 42, entry.definition.name, {
        color: '#5b4662',
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        wordWrap: { width: 188 },
      })
      .setOrigin(0, 0.5);

    const description = this.add
      .text(x - 69, y - 10, entry.definition.description ?? '', {
        color: '#806985',
        fontFamily: UI_FONT,
        fontSize: '10px',
        wordWrap: { width: 188 },
        lineSpacing: 2,
      })
      .setOrigin(0, 0.5);

    const status = !entry.isUnlocked
      ? (entry.unlockHint ?? 'Keep exploring to unlock this.')
      : entry.isUniqueOwned
        ? 'Owned ✓'
        : entry.definition.category === 'decoration' && entry.ownedQuantity > 0
          ? `Owned: ${entry.ownedQuantity}`
          : entry.definition.category === 'accessory'
            ? 'Wearable'
            : 'Cottage décor';
    const statusText = this.add
      .text(x - 112, y + 40, status, {
        color: '#806985',
        fontFamily: UI_FONT,
        fontSize: '10px',
        fontStyle: 'bold',
        wordWrap: { width: 118 },
      })
      .setOrigin(0, 0.5);

    const enabled = entry.isUnlocked && !entry.isUniqueOwned;
    const buttonText = !entry.isUnlocked
      ? 'Locked'
      : entry.isUniqueOwned
        ? 'Yours'
        : `Buy • ${entry.price} ✨`;
    const buttonFill = entry.isUniqueOwned
      ? UI_COLOURS.mint
      : entry.isUnlocked
        ? UI_COLOURS.gold
        : UI_COLOURS.lavender;
    const buttonStroke = entry.isUnlocked ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong;

    const button = this.createCardButton(
      x + 69,
      y + 39,
      122,
      36,
      buttonText,
      buttonFill,
      buttonStroke,
      enabled ? () => this.purchase(entry.definition.id) : null,
    );

    card.setName(`twinkle-shop-card:${entry.definition.id}`);
    this.sectionLayer.add([card, iconWell, icon, name, description, statusText, ...button]);
  }

  private createCardButton(
    x: number,
    y: number,
    width: number,
    height: number,
    labelText: string,
    fill: number,
    stroke: number,
    onPress: (() => void) | null,
  ): Phaser.GameObjects.GameObject[] {
    const surface = this.add.graphics();
    surface.fillStyle(0x4b3045, 0.11);
    surface.fillRoundedRect(x - width / 2 + 3, y - height / 2 + 4, width, height, 13);
    surface.fillStyle(fill, onPress ? 1 : 0.64);
    surface.lineStyle(2, stroke, 0.92);
    surface.fillRoundedRect(x - width / 2, y - height / 2, width, height, 13);
    surface.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 13);

    const hit = this.add
      .rectangle(x, y, width + 8, height + 8, 0xffffff, 0.001)
      .setAlpha(0.001);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '11px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    if (onPress) {
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerdown', onPress);
      hit.on('pointerover', () => surface.setAlpha(0.88));
      hit.on('pointerout', () => surface.setAlpha(1));
    }
    return [surface, hit, label];
  }

  private createFooterButton(
    x: number,
    y: number,
    labelText: string,
    fill: number,
    stroke: number,
    onPress: () => void,
  ): void {
    const surface = this.add.graphics().setDepth(5);
    surface.fillStyle(0x4b3045, 0.13);
    surface.fillRoundedRect(x - 120 + 4, y - 22 + 5, 240, 44, 15);
    surface.fillStyle(fill, 1);
    surface.lineStyle(3, stroke, 0.95);
    surface.fillRoundedRect(x - 120, y - 22, 240, 44, 15);
    surface.strokeRoundedRect(x - 120, y - 22, 240, 44, 15);
    const hit = this.add
      .rectangle(x, y, 250, 52, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setInteractive({ useHandCursor: true })
      .setDepth(6);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(7);
    hit.on('pointerdown', onPress);
    label.setInteractive({ useHandCursor: true }).on('pointerdown', onPress);
  }

  private purchase(itemId: ItemId): void {
    if (
      !this.shopService ||
      this.closing ||
      !this.purchaseTapGuard.tryBegin(itemId, this.time.now)
    ) {
      return;
    }

    const result = this.shopService.purchase(itemId);
    if (result.type === 'purchased') {
      const ownershipMessage =
        result.ownedQuantity === 1
          ? `${result.item.name} added to your collection.`
          : `Another ${result.item.name} added. Owned now: ${result.ownedQuantity}.`;
      this.feedbackText?.setText(
        `✨ ${ownershipMessage} ${result.price} Shimmer spent, ${result.balance} left.`,
      );
      this.cameras.main.flash(100, 255, 235, 190, false);
    } else if (result.type === 'insufficient-funds') {
      this.feedbackText?.setText(
        `You need ${result.shortfall} more Shimmer for ${result.item.name}.`,
      );
    } else if (result.type === 'locked') {
      this.feedbackText?.setText(`🔒 ${result.item.name}: ${result.unlockHint}`);
    } else if (result.type === 'persistence-failed') {
      this.feedbackText?.setText('That did not save, so no Shimmer was spent. Please try again.');
    } else {
      this.feedbackText?.setText(`${result.item.name} is already yours.`);
    }
    this.refreshBalance();
    this.renderSection();
  }

  private refreshBalance(): void {
    this.balanceText?.setText(`✨ ${this.economyService?.getBalance() ?? 0} Shimmer`);
  }

  private backToBag(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.scene.start('InventoryScene', { returnScene: this.returnScene });
  }

  private closeShop(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    if (this.scene.isPaused(this.returnScene)) {
      this.scene.resume(this.returnScene);
    }
    this.scene.stop();
  }
}
