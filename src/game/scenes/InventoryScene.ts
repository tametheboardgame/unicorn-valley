import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { InventoryService } from '../inventory/InventoryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { ItemCard } from '../ui/ItemCard';

interface InventorySceneData {
  returnScene?: string;
}

export class InventoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private readonly cards: ItemCard[] = [];
  private returnScene = 'SunbeamVillageScene';
  private closing = false;

  public constructor() {
    super('InventoryScene');
  }

  public create(data: InventorySceneData): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;
    this.cameras.main.setBackgroundColor('rgba(69, 50, 78, 0.92)');

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 650, 0xfff6e8, 0.99)
      .setStrokeStyle(8, 0xd6a9d5, 1);
    this.add
      .text(GAME_WIDTH / 2, 82, 'My Bag', {
        color: '#5a4265',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '46px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 127, 'Treasures and useful things you have collected', {
        color: '#8b718d',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
      })
      .setOrigin(0.5);

    const saveService = getBrowserSaveService();
    const economy = new ShimmerEconomyService(saveService);
    this.add
      .text(GAME_WIDTH / 2, 161, `✨ ${economy.getBalance()} Shimmer`, {
        color: '#76518a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#f1e2f4',
        padding: { x: 12, y: 5 },
      })
      .setOrigin(0.5);

    const inventory = new InventoryService(saveService);
    const items = inventory.listOwnedItems();
    if (items.length === 0) {
      this.add
        .text(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 - 10,
          'Your bag is empty for now.\nLittle treasures you collect will appear here.',
          {
            color: '#806985',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '24px',
            align: 'center',
            lineSpacing: 8,
          },
        )
        .setOrigin(0.5);
    } else {
      items.slice(0, 6).forEach(({ definition, quantity }, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        this.cards.push(
          new ItemCard(this, 365 + column * 550, 220 + row * 152, 500, definition, quantity),
        );
      });
    }

    const closeX = GAME_WIDTH / 2 - 150;
    const shopX = GAME_WIDTH / 2 + 150;
    const buttonY = GAME_HEIGHT - 62;
    const closeButton = this.add
      .rectangle(closeX, buttonY, 260, 60, 0xefd6ec, 1)
      .setStrokeStyle(4, 0xb985bc, 1)
      .setInteractive({ useHandCursor: true });
    this.add
      .text(closeX, buttonY, 'Close Bag', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const shopButton = this.add
      .rectangle(shopX, buttonY, 260, 60, 0xffe6a6, 1)
      .setStrokeStyle(4, 0xd6b35f, 1)
      .setInteractive({ useHandCursor: true });
    const shopLabel = this.add
      .text(shopX, buttonY, '✨ Visit the Shop', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    closeButton.on('pointerdown', () => this.pointerInput?.setButton('INTERACT', true));
    closeButton.on('pointerup', () => this.pointerInput?.setButton('INTERACT', false));
    closeButton.on('pointerout', () => this.pointerInput?.setButton('INTERACT', false));
    shopButton.on('pointerdown', () => this.openShop());
    shopLabel.on('pointerdown', () => this.openShop());

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      for (const card of this.cards) {
        card.destroy();
      }
      this.cards.length = 0;
    });
  }

  public update(): void {
    this.inputController?.update();
    if (
      this.inputController?.justPressed('INTERACT') ||
      this.inputController?.justPressed('BACK') ||
      this.inputController?.justPressed('OPEN_INVENTORY')
    ) {
      this.closeBag();
    }
  }

  private openShop(): void {
    if (this.closing) {
      return;
    }
    this.closing = true;
    this.scene.start('ShopScene', { returnScene: this.returnScene });
  }

  private closeBag(): void {
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
