import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { InventoryService } from '../inventory/InventoryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { ItemCard } from '../ui/ItemCard';
import {
  VALLEY_HOME_NODE_ID,
  VALLEY_MAP_CONNECTIONS,
  VALLEY_MAP_NODES,
  getHomewardNextNode,
  getValleyMapNode,
  getValleyMapNodeForLocation,
  type ValleyMapNode,
} from '../world/ValleyMapTopology';

interface InventorySceneData {
  returnScene?: string;
}

type BagTab = 'items' | 'map';

export class InventoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private readonly cards: ItemCard[] = [];
  private returnScene = 'SunbeamVillageScene';
  private closing = false;
  private activeTab: BagTab = 'items';
  private tabContent: Phaser.GameObjects.Container | null = null;
  private itemsTab: Phaser.GameObjects.Text | null = null;
  private mapTab: Phaser.GameObjects.Text | null = null;
  private shopButton: Phaser.GameObjects.Rectangle | null = null;
  private shopLabel: Phaser.GameObjects.Text | null = null;

  public constructor() {
    super('InventoryScene');
  }

  public create(data: InventorySceneData): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;
    this.activeTab = 'items';
    this.cameras.main.setBackgroundColor('rgba(69, 50, 78, 0.92)');

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 650, 0xfff6e8, 0.99)
      .setStrokeStyle(8, 0xd6a9d5, 1);
    this.add
      .text(GAME_WIDTH / 2, 70, 'My Bag', {
        color: '#5a4265',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '42px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.createTabs();

    const closeX = GAME_WIDTH / 2 - 150;
    const shopX = GAME_WIDTH / 2 + 150;
    const buttonY = GAME_HEIGHT - 52;
    const closeButton = this.add
      .rectangle(closeX, buttonY, 260, 56, 0xefd6ec, 1)
      .setStrokeStyle(4, 0xb985bc, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-close-button');
    this.add
      .text(closeX, buttonY, 'Close Bag', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.shopButton = this.add
      .rectangle(shopX, buttonY, 260, 56, 0xffe6a6, 1)
      .setStrokeStyle(4, 0xd6b35f, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-shop-button');
    this.shopLabel = this.add
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
    this.shopButton.on('pointerdown', () => this.openShop());
    this.shopLabel.on('pointerdown', () => this.openShop());

    this.renderTab();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.clearCards();
      this.tabContent = null;
      this.itemsTab = null;
      this.mapTab = null;
      this.shopButton = null;
      this.shopLabel = null;
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

  private createTabs(): void {
    this.itemsTab = this.add
      .text(GAME_WIDTH / 2 - 120, 126, '🎒 Items', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#f1e2f4',
        padding: { x: 22, y: 9 },
      })
      .setOrigin(0.5)
      .setName('bag-items-tab')
      .setInteractive({ useHandCursor: true });
    this.mapTab = this.add
      .text(GAME_WIDTH / 2 + 120, 126, '🗺️ Map', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#f1e2f4',
        padding: { x: 22, y: 9 },
      })
      .setOrigin(0.5)
      .setName('bag-map-tab')
      .setInteractive({ useHandCursor: true });

    this.itemsTab.on('pointerdown', () => this.setTab('items'));
    this.mapTab.on('pointerdown', () => this.setTab('map'));
  }

  private setTab(tab: BagTab): void {
    if (this.activeTab === tab) {
      return;
    }
    this.activeTab = tab;
    this.renderTab();
  }

  private renderTab(): void {
    this.tabContent?.destroy(true);
    this.tabContent = null;
    this.clearCards();

    this.itemsTab?.setBackgroundColor(this.activeTab === 'items' ? '#e7c9e5' : '#f1e2f4');
    this.mapTab?.setBackgroundColor(this.activeTab === 'map' ? '#e7c9e5' : '#f1e2f4');
    this.shopButton?.setVisible(this.activeTab === 'items');
    this.shopLabel?.setVisible(this.activeTab === 'items');

    if (this.activeTab === 'map') {
      this.renderMap();
    } else {
      this.renderItems();
    }
  }

  private renderItems(): void {
    const saveService = getBrowserSaveService();
    const economy = new ShimmerEconomyService(saveService);
    const objects: Phaser.GameObjects.GameObject[] = [];
    objects.push(
      this.add
        .text(GAME_WIDTH / 2, 166, `✨ ${economy.getBalance()} Shimmer`, {
          color: '#76518a',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          backgroundColor: '#f1e2f4',
          padding: { x: 12, y: 5 },
        })
        .setOrigin(0.5),
    );

    const inventory = new InventoryService(saveService);
    const items = inventory.listOwnedItems();
    if (items.length === 0) {
      objects.push(
        this.add
          .text(
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            'Your bag is empty for now.\nLittle treasures you collect will appear here.',
            {
              color: '#806985',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '24px',
              align: 'center',
              lineSpacing: 8,
            },
          )
          .setOrigin(0.5),
      );
    } else {
      items.slice(0, 6).forEach(({ definition, quantity }, index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        this.cards.push(
          new ItemCard(this, 365 + column * 550, 210 + row * 145, 500, definition, quantity),
        );
      });
    }

    this.tabContent = this.add.container(0, 0, objects).setName('bag-items-content');
  }

  private renderMap(): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const currentNode = getValleyMapNodeForLocation(save.profile.currentLocationId);
    const homewardNode = currentNode ? getHomewardNextNode(currentNode.id) : null;
    const objects: Phaser.GameObjects.GameObject[] = [];
    const mapLeft = 150;
    const mapTop = 185;
    const mapWidth = 980;
    const mapHeight = 390;

    objects.push(
      this.add
        .rectangle(
          GAME_WIDTH / 2,
          mapTop + mapHeight / 2,
          mapWidth + 70,
          mapHeight + 54,
          0xe7f4dc,
          0.9,
        )
        .setStrokeStyle(5, 0xb89fbc, 0.95),
      this.add
        .text(GAME_WIDTH / 2, 166, 'Unicorn Valley • paths you can walk', {
          color: '#725b78',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
    );

    const pointForNode = (node: ValleyMapNode): { x: number; y: number } => ({
      x: mapLeft + node.x * mapWidth,
      y: mapTop + node.y * mapHeight,
    });

    for (const connection of VALLEY_MAP_CONNECTIONS) {
      const from = getValleyMapNode(connection.from);
      const to = getValleyMapNode(connection.to);
      if (!from || !to) {
        continue;
      }
      const start = pointForNode(from);
      const end = pointForNode(to);
      if (connection.kind === 'physical') {
        objects.push(
          this.add
            .line(0, 0, start.x, start.y, end.x, end.y, 0x8a7290, 0.78)
            .setOrigin(0, 0)
            .setLineWidth(7),
        );
      } else {
        for (let step = 1; step < 7; step += 2) {
          const ratio = step / 7;
          objects.push(
            this.add.circle(
              Phaser.Math.Linear(start.x, end.x, ratio),
              Phaser.Math.Linear(start.y, end.y, ratio),
              4,
              0xa998ab,
              0.42,
            ),
          );
        }
      }
    }

    for (const node of VALLEY_MAP_NODES) {
      const point = pointForNode(node);
      const isCurrent = currentNode?.id === node.id;
      const isFuture = node.kind === 'future';
      const isSide = node.kind === 'side';
      const radius = node.kind === 'home' ? 35 : isFuture ? 25 : isSide ? 20 : 31;
      const fill =
        node.kind === 'home' ? 0xffe7a8 : isFuture ? 0xd6d2d8 : isSide ? 0xeadcf1 : 0xfff8e8;
      const alpha = isFuture ? 0.58 : 1;
      const ring = this.add
        .circle(point.x, point.y, radius, fill, alpha)
        .setStrokeStyle(
          isCurrent ? 7 : isSide ? 3 : 4,
          isCurrent ? 0xca70b9 : isSide ? 0x9b78a6 : 0x9e819f,
          isFuture ? 0.5 : 0.95,
        )
        .setName(isCurrent ? 'bag-map-current-location' : `bag-map-node:${node.id}`);
      const icon = this.add
        .text(point.x, point.y - 3, node.icon, {
          color: isFuture ? '#8d858f' : '#5b4961',
          fontFamily: 'system-ui, sans-serif',
          fontSize: node.kind === 'home' ? '29px' : isSide ? '17px' : '24px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(alpha);
      const label = this.add
        .text(point.x, point.y + radius + (isSide ? 7 : 11), node.label, {
          color: isFuture ? '#988f99' : '#5d4b63',
          fontFamily: 'system-ui, sans-serif',
          fontSize: isSide ? '11px' : '13px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: isSide ? 112 : 145 },
        })
        .setOrigin(0.5, 0)
        .setAlpha(alpha);
      objects.push(ring, icon, label);

      if (isCurrent) {
        objects.push(
          this.add
            .text(point.x, point.y - radius - 15, 'YOU ARE HERE', {
              color: '#784d75',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '11px',
              fontStyle: 'bold',
              backgroundColor: '#fff4f9e8',
              padding: { x: 5, y: 3 },
            })
            .setOrigin(0.5),
        );
      }
    }

    objects.push(
      this.add
        .text(
          GAME_WIDTH / 2,
          580,
          'Solid paths are open • small circles are places inside a region • dotted paths are hidden',
          {
            color: '#827286',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5),
    );

    const homewardText =
      currentNode?.id === VALLEY_HOME_NODE_ID
        ? '🏡 Home is here.'
        : homewardNode
          ? `🏡 Way home: ${homewardNode.label}`
          : '🏡 Follow the solid paths home.';
    const nearbyText = currentNode?.revisitHint ? `Nearby: ${currentNode.revisitHint}` : '';
    objects.push(
      this.add
        .text(GAME_WIDTH / 2, 607, [homewardText, nearbyText].filter(Boolean).join('   •   '), {
          color: '#66536d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 940 },
        })
        .setOrigin(0.5, 0)
        .setName('bag-map-guidance'),
    );

    this.tabContent = this.add.container(0, 0, objects).setName('bag-map-content');
  }

  private clearCards(): void {
    for (const card of this.cards) {
      card.destroy();
    }
    this.cards.length = 0;
  }

  private openShop(): void {
    if (this.closing || this.activeTab !== 'items') {
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
    if (this.scene.isPaused(this.returnScene)) {
      this.scene.resume(this.returnScene);
    }
    this.scene.stop();
  }
}
