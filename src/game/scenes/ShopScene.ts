import Phaser from 'phaser';
import type { ItemId } from '../../content/contentTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShopPurchaseTapGuard } from '../economy/ShopPurchaseTapGuard';
import { ShopService } from '../economy/ShopService';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

interface ShopSceneData {
  returnScene?: string;
}

interface StockControls {
  ownedLabel: Phaser.GameObjects.Text;
  buyButton: Phaser.GameObjects.Rectangle;
  buyLabel: Phaser.GameObjects.Text;
}

export class ShopScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private shopService: ShopService | null = null;
  private economyService: ShimmerEconomyService | null = null;
  private readonly purchaseTapGuard = new ShopPurchaseTapGuard();
  private balanceText: Phaser.GameObjects.Text | null = null;
  private feedbackText: Phaser.GameObjects.Text | null = null;
  private readonly stockControls = new Map<ItemId, StockControls>();
  private returnScene = 'SunbeamVillageScene';
  private closing = false;

  public constructor() {
    super('ShopScene');
  }

  public create(data: ShopSceneData): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;
    this.purchaseTapGuard.reset();
    this.stockControls.clear();
    this.cameras.main.setBackgroundColor('rgba(69, 50, 78, 0.96)');

    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 1160, 660, 1, 0.24);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1160, 660, UI_COLOURS.cream, 1)
      .setStrokeStyle(7, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);

    this.add
      .text(GAME_WIDTH / 2, 52, 'Twinkle & Thread', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);
    this.add
      .text(
        GAME_WIDTH / 2,
        88,
        'Choose something you love. Story progress never needs a purchase.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '16px',
        },
      )
      .setOrigin(0.5)
      .setDepth(3);

    const saveService = getBrowserSaveService();
    this.shopService = new ShopService(saveService);
    this.economyService = new ShimmerEconomyService(saveService);
    this.balanceText = this.add
      .text(GAME_WIDTH / 2, 122, '', {
        color: '#76518a',
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
        backgroundColor: '#f3e7f8',
        padding: { x: 16, y: 7 },
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.feedbackText = this.add
      .text(
        GAME_WIDTH / 2,
        164,
        'Quests, discoveries, activities and races can earn Shimmer. You never need to grind.',
        {
          color: UI_COLOURS.mutedInk,
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(4);

    const stock = this.shopService.listStock();
    stock.forEach((entry, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      this.createStockCard(365 + column * 550, 245 + row * 150, entry.definition.id);
    });

    const bagButton = this.add
      .rectangle(GAME_WIDTH / 2 - 145, GAME_HEIGHT - 36, 245, 48, UI_COLOURS.lavender, 1)
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    const bagLabel = this.add
      .text(GAME_WIDTH / 2 - 145, GAME_HEIGHT - 36, 'Back to My Bag', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    const valleyButton = this.add
      .rectangle(GAME_WIDTH / 2 + 145, GAME_HEIGHT - 36, 245, 48, UI_COLOURS.gold, 1)
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(5);
    const valleyLabel = this.add
      .text(GAME_WIDTH / 2 + 145, GAME_HEIGHT - 36, 'Back to the Valley', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    applyButtonHover(bagButton, UI_COLOURS.lavender, UI_COLOURS.blush);
    applyButtonHover(valleyButton, UI_COLOURS.gold, UI_COLOURS.blush);
    bagButton.on('pointerdown', () => this.backToBag());
    bagLabel.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.backToBag());
    valleyButton.on('pointerdown', () => this.closeShop());
    valleyLabel.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.closeShop());

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.refreshStock();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.shopService = null;
      this.economyService = null;
      this.balanceText = null;
      this.feedbackText = null;
      this.purchaseTapGuard.reset();
      this.stockControls.clear();
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

  private createStockCard(x: number, y: number, itemId: ItemId): void {
    if (!this.shopService) {
      return;
    }
    const entry = this.shopService.listStock().find(({ definition }) => definition.id === itemId);
    if (!entry) {
      return;
    }

    createUiShadow(this, x, y, 510, 132, 2, 0.13);
    this.add
      .rectangle(x, y, 510, 132, 0xffffff, 0.96)
      .setStrokeStyle(3, UI_COLOURS.lavender, 1)
      .setDepth(3);
    this.add
      .text(x - 220, y - 8, entry.definition.icon ?? '✨', {
        fontFamily: UI_FONT,
        fontSize: '38px',
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.add
      .text(x - 172, y - 39, entry.definition.name, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setDepth(4);
    this.add
      .text(x - 172, y - 11, entry.definition.description ?? '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        wordWrap: { width: 285 },
      })
      .setDepth(4);

    const ownedLabel = this.add
      .text(x - 172, y + 42, '', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setDepth(4);
    const buyButton = this.add
      .rectangle(x + 180, y + 25, 126, 52, UI_COLOURS.gold, 1)
      .setStrokeStyle(3, UI_COLOURS.goldStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(4);
    const buyLabel = this.add
      .text(x + 180, y + 25, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(5);
    applyButtonHover(buyButton, UI_COLOURS.gold, UI_COLOURS.blush);
    buyButton.on('pointerdown', () => this.purchase(itemId));
    buyLabel.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.purchase(itemId));

    this.stockControls.set(itemId, { ownedLabel, buyButton, buyLabel });
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
      this.feedbackText?.setText(
        `✨ ${result.item.name} is yours! You have ${result.balance} Shimmer left.`,
      );
      this.cameras.main.flash(120, 255, 235, 164, false);
    } else if (result.type === 'insufficient-funds') {
      this.feedbackText?.setText(
        `Almost! You need ${result.shortfall} more Shimmer for ${result.item.name}.`,
      );
    } else if (result.type === 'locked') {
      this.feedbackText?.setText(`🔒 ${result.item.name}: ${result.unlockHint}`);
    } else {
      this.feedbackText?.setText(`${result.item.name} is already yours. Pick another treasure!`);
    }
    this.refreshStock();
  }

  private refreshStock(): void {
    if (!this.shopService || !this.economyService) {
      return;
    }

    this.balanceText?.setText(`✨ ${this.economyService.getBalance()} Shimmer`);
    for (const entry of this.shopService.listStock()) {
      const controls = this.stockControls.get(entry.definition.id);
      if (!controls) {
        continue;
      }

      if (!entry.isUnlocked) {
        controls.ownedLabel.setText(entry.unlockHint ?? 'Keep exploring to unlock this.');
        controls.buyLabel.setText('Locked');
        controls.buyButton.setFillStyle(UI_COLOURS.lavender, 0.72).disableInteractive();
        controls.buyLabel.disableInteractive();
      } else if (entry.isUniqueOwned) {
        controls.ownedLabel.setText('Owned ✓');
        controls.buyLabel.setText('Yours!');
        controls.buyButton.setFillStyle(UI_COLOURS.mint, 1).disableInteractive();
        controls.buyLabel.disableInteractive();
      } else {
        controls.ownedLabel.setText(
          entry.definition.category === 'decoration' && entry.ownedQuantity > 0
            ? `Owned: ${entry.ownedQuantity}`
            : entry.definition.category === 'accessory'
              ? 'Accessory'
              : 'Cottage decoration',
        );
        controls.buyLabel.setText(`Buy • ${entry.price} ✨`);
        controls.buyButton.setFillStyle(UI_COLOURS.gold, 1).setInteractive({ useHandCursor: true });
        controls.buyLabel.setInteractive({ useHandCursor: true });
      }
    }
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
    this.scene.stop();
    if (this.scene.isPaused(this.returnScene)) {
      this.scene.resume(this.returnScene);
    }
  }
}
