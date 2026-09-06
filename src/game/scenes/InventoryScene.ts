import Phaser from 'phaser';
import type { ItemId } from '../../content/contentTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import {
  BAG_POCKETS,
  getFirstPopulatedBagPocket,
  groupBagItems,
  isUsableFood,
  type BagPocketId,
} from '../inventory/BagInventoryModel';
import { FoodUseService } from '../inventory/FoodUseService';
import {
  InventoryService,
  getItemPresentation,
  type OwnedInventoryItem,
} from '../inventory/InventoryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  VALLEY_HOME_NODE_ID,
  VALLEY_MAP_CONNECTIONS,
  VALLEY_MAP_NODES,
  getHomewardNextNode,
  getValleyMapNode,
  getValleyMapNodeForLocation,
  type ValleyMapNode,
} from '../world/ValleyMapTopology';

type InventoryView = 'items' | 'map';

interface InventorySceneData {
  returnScene?: string;
  initialTab?: InventoryView;
}

const BAG_VISIBLE_ITEMS = 6;
const BAG_SCROLL_STEP = 2;
const BAG_LIST_BOUNDS = { left: 145, right: 850, top: 185, bottom: 588 } as const;

export class InventoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private readonly viewObjects: Phaser.GameObjects.GameObject[] = [];
  private returnScene = 'SunbeamVillageScene';
  private closing = false;
  private activeView: InventoryView = 'items';
  private activePocket: BagPocketId = 'food';
  private selectedItemId: ItemId | null = null;
  private bagScrollOffset = 0;
  private bagInitialised = false;
  private bagFeedback = '';
  private titleText: Phaser.GameObjects.Text | null = null;
  private viewBadge: Phaser.GameObjects.Text | null = null;

  public constructor() {
    super('InventoryScene');
  }

  public create(data: InventorySceneData = {}): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.closing = false;
    this.activeView = data.initialTab ?? 'items';
    this.activePocket = 'food';
    this.selectedItemId = null;
    this.bagScrollOffset = 0;
    this.bagInitialised = false;
    this.bagFeedback = '';
    this.cameras.main.setBackgroundColor('rgba(69, 50, 78, 0.92)');

    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1200, 660, 0xfff6e8, 0.99)
      .setStrokeStyle(8, 0xd6a9d5, 1)
      .setName('inventory-modal-panel');

    this.viewBadge = this.add
      .text(112, 68, this.activeView === 'map' ? '🗺️ MAP' : '🎒 BAG', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        fontStyle: 'bold',
        backgroundColor: '#ead4ee',
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setName('inventory-view-badge');

    this.titleText = this.add
      .text(GAME_WIDTH / 2, 68, this.activeView === 'map' ? 'Valley Map' : 'My Bag', {
        color: '#5a4265',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '40px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('inventory-modal-title');

    const closeButton = this.add
      .rectangle(1140, 68, 160, 52, 0xefd6ec, 1)
      .setStrokeStyle(4, 0xb985bc, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-close-button');
    this.add
      .text(1140, 68, '✕ Close', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    closeButton.on('pointerdown', () => this.closeBag());

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.input.on('wheel', this.handleBagWheel, this);
    this.input.on('pointerup', this.handleBagSwipe, this);

    this.renderView();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.off('wheel', this.handleBagWheel, this);
      this.input.off('pointerup', this.handleBagSwipe, this);
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.clearViewObjects();
      this.titleText = null;
      this.viewBadge = null;
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

  private renderView(): void {
    this.clearViewObjects();
    this.titleText?.setText(this.activeView === 'map' ? 'Valley Map' : 'My Bag');
    this.viewBadge?.setText(this.activeView === 'map' ? '🗺️ MAP' : '🎒 BAG');
    if (this.activeView === 'map') {
      this.renderMap();
      return;
    }
    this.renderBag();
  }

  private renderBag(): void {
    const saveService = getBrowserSaveService();
    const economy = new ShimmerEconomyService(saveService);
    const inventory = new InventoryService(saveService);
    const ownedItems = inventory.listOwnedItems();
    const grouped = groupBagItems(ownedItems);

    if (!this.bagInitialised) {
      this.activePocket = getFirstPopulatedBagPocket(grouped);
      this.bagInitialised = true;
    }

    const pocketItems = grouped[this.activePocket];
    const maxOffset = Math.max(0, pocketItems.length - BAG_VISIBLE_ITEMS);
    this.bagScrollOffset = Phaser.Math.Clamp(this.bagScrollOffset, 0, maxOffset);

    const selectedInPocket = pocketItems.find(
      ({ definition }) => definition.id === this.selectedItemId,
    );
    if (!selectedInPocket) {
      this.selectedItemId = pocketItems[0]?.definition.id ?? null;
    }

    this.track(
      this.add
        .text(1050, 126, `✨ ${economy.getBalance()} Shimmer`, {
          color: '#76518a',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '17px',
          fontStyle: 'bold',
          backgroundColor: '#f1e2f4',
          padding: { x: 13, y: 7 },
        })
        .setOrigin(0.5)
        .setName('bag-shimmer-balance'),
    );

    BAG_POCKETS.forEach((pocket, index) => {
      const x = 235 + index * 185;
      const selected = pocket.id === this.activePocket;
      const tab = this.add
        .rectangle(x, 132, 170, 54, selected ? 0xe1c1e3 : 0xf2e4f3, 1)
        .setStrokeStyle(4, selected ? 0xa56ba6 : 0xc8a9c8, 1)
        .setInteractive({ useHandCursor: true })
        .setName(`bag-pocket:${pocket.id}`);
      const label = this.add
        .text(x, 132, `${pocket.icon} ${pocket.label} ${grouped[pocket.id].length}`, {
          color: '#5d4369',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      tab.on('pointerdown', () => this.selectPocket(pocket.id));
      this.track(tab, label);
    });

    this.track(
      this.add
        .rectangle(495, 388, 710, 420, 0xfffbf2, 1)
        .setStrokeStyle(4, 0xd6c2d3, 1)
        .setName('bag-list-panel'),
      this.add
        .rectangle(1020, 388, 330, 420, 0xf8edf8, 1)
        .setStrokeStyle(4, 0xc8a3ca, 1)
        .setName('bag-detail-panel'),
    );

    if (pocketItems.length === 0) {
      this.track(
        this.add
          .text(
            495,
            385,
            `Nothing in ${this.pocketLabel(this.activePocket)} yet.\nNew treasures will appear here.`,
            {
              color: '#806985',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '23px',
              align: 'center',
              lineSpacing: 8,
            },
          )
          .setOrigin(0.5)
          .setName('bag-pocket-empty'),
      );
    } else {
      const visibleItems = pocketItems.slice(
        this.bagScrollOffset,
        this.bagScrollOffset + BAG_VISIBLE_ITEMS,
      );
      visibleItems.forEach((item, index) => {
        this.renderBagItemTile(item, index);
      });
      this.renderBagScrollAffordance(pocketItems.length);
    }

    const selected = ownedItems.find(({ definition }) => definition.id === this.selectedItemId);
    this.renderBagDetail(selected ?? null, inventory);

    const shopButton = this.add
      .rectangle(1020, 642, 300, 58, 0xffe6a6, 1)
      .setStrokeStyle(4, 0xd6b35f, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-shop-button');
    const shopLabel = this.add
      .text(1020, 642, '✨ Visit the Shop', {
        color: '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    shopButton.on('pointerdown', () => this.openShop());
    this.track(shopButton, shopLabel);

    this.track(this.add.container(0, 0).setName('bag-items-content'));
  }

  private renderBagItemTile(item: OwnedInventoryItem, index: number): void {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 315 + column * 350;
    const y = 245 + row * 112;
    const selected = item.definition.id === this.selectedItemId;
    const presentation = getItemPresentation(item.definition);
    const tile = this.add
      .rectangle(x, y, 320, 92, selected ? 0xead0e9 : 0xfff7e9, 1)
      .setStrokeStyle(4, selected ? 0xa45f9f : 0xd8bdd2, 1)
      .setInteractive({ useHandCursor: true })
      .setName(`bag-item-tile:${item.definition.id}`);
    const icon = this.add
      .text(x - 125, y, presentation.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '36px',
      })
      .setOrigin(0.5);
    const name = this.add
      .text(x - 88, y - 18, item.definition.name, {
        color: '#5b4662',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        wordWrap: { width: 182 },
      })
      .setOrigin(0, 0.5);
    const quantity = this.add
      .text(x + 118, y + 23, `×${item.quantity}`, {
        color: '#76518a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        backgroundColor: '#f0dff2',
        padding: { x: 7, y: 3 },
      })
      .setOrigin(0.5);

    tile.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (Math.abs(pointer.y - pointer.downY) <= 14) {
        this.selectItem(item.definition.id);
      }
    });
    this.track(tile, icon, name, quantity);
  }

  private renderBagScrollAffordance(itemCount: number): void {
    if (itemCount <= BAG_VISIBLE_ITEMS) {
      this.track(
        this.add
          .text(495, 565, `${itemCount} item${itemCount === 1 ? '' : 's'} in this pocket`, {
            color: '#8a758b',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
      return;
    }

    const maxOffset = Math.max(1, itemCount - BAG_VISIBLE_ITEMS);
    const progress = this.bagScrollOffset / maxOffset;
    const trackTop = 235;
    const trackHeight = 260;
    const thumbHeight = Math.max(62, trackHeight * (BAG_VISIBLE_ITEMS / itemCount));
    const thumbY = trackTop + thumbHeight / 2 + progress * (trackHeight - thumbHeight);

    const up = this.add
      .rectangle(810, 210, 58, 48, 0xead9ed, 1)
      .setStrokeStyle(3, 0xb58ab6, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-scroll-up');
    const upLabel = this.add
      .text(810, 210, '▲', {
        color: '#674c70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const down = this.add
      .rectangle(810, 535, 58, 48, 0xead9ed, 1)
      .setStrokeStyle(3, 0xb58ab6, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-scroll-down');
    const downLabel = this.add
      .text(810, 535, '▼', {
        color: '#674c70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const scrollTrack = this.add.rectangle(
      810,
      trackTop + trackHeight / 2,
      12,
      trackHeight,
      0xddcddd,
      1,
    );
    const scrollThumb = this.add
      .rectangle(810, thumbY, 22, thumbHeight, 0xa979aa, 1)
      .setName('bag-scroll-thumb');
    const hint = this.add
      .text(495, 565, `↕ Drag or scroll to see all ${itemCount} items`, {
        color: '#7b687f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    up.on('pointerdown', () => this.scrollBagBy(-BAG_SCROLL_STEP));
    down.on('pointerdown', () => this.scrollBagBy(BAG_SCROLL_STEP));
    this.track(scrollTrack, scrollThumb, up, upLabel, down, downLabel, hint);
  }

  private renderBagDetail(selected: OwnedInventoryItem | null, inventory: InventoryService): void {
    if (!selected) {
      this.track(
        this.add
          .text(1020, 385, 'Choose an item\nto see it here.', {
            color: '#806985',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '22px',
            fontStyle: 'bold',
            align: 'center',
            lineSpacing: 8,
          })
          .setOrigin(0.5),
      );
      return;
    }

    const presentation = getItemPresentation(selected.definition);
    this.track(
      this.add
        .text(1020, 245, presentation.icon, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '58px',
        })
        .setOrigin(0.5),
      this.add
        .text(1020, 305, selected.definition.name, {
          color: '#59445f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '23px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 270 },
        })
        .setOrigin(0.5),
      this.add
        .text(1020, 346, `You have ×${selected.quantity}`, {
          color: '#76518a',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
      this.add
        .text(1020, 405, presentation.description, {
          color: '#6f5b74',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          align: 'center',
          lineSpacing: 5,
          wordWrap: { width: 275 },
        })
        .setOrigin(0.5),
    );

    if (isUsableFood(selected.definition)) {
      const eatButton = this.add
        .rectangle(1020, 505, 238, 62, 0xffd98f, 1)
        .setStrokeStyle(4, 0xd2a95c, 1)
        .setInteractive({ useHandCursor: true })
        .setName(`bag-eat-button:${selected.definition.id}`);
      const eatLabel = this.add
        .text(1020, 505, `Eat ${presentation.icon}`, {
          color: '#5d4369',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '20px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      eatButton.on('pointerdown', () => this.useFood(selected.definition.id, inventory));
      this.track(eatButton, eatLabel);
    } else {
      this.track(
        this.add
          .text(
            1020,
            505,
            selected.definition.questCritical
              ? 'Kept safe for your adventure'
              : 'A treasure to keep',
            {
              color: '#7d6880',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '15px',
              fontStyle: 'bold',
              backgroundColor: '#eaddec',
              padding: { x: 10, y: 7 },
            },
          )
          .setOrigin(0.5),
      );
    }

    if (this.bagFeedback) {
      this.track(
        this.add
          .text(1020, 562, this.bagFeedback, {
            color: '#6f4f72',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '14px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 280 },
          })
          .setOrigin(0.5)
          .setName('bag-action-feedback'),
      );
    }
  }

  private renderMap(): void {
    const saveService = getBrowserSaveService();
    const save = saveService.load() ?? saveService.createNewGame();
    const currentNode = getValleyMapNodeForLocation(save.profile.currentLocationId);
    const homewardNode = currentNode ? getHomewardNextNode(currentNode.id) : null;
    const mapLeft = 140;
    const mapTop = 155;
    const mapWidth = 1000;
    const mapHeight = 430;

    this.track(
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
        .text(GAME_WIDTH / 2, 126, 'Paths and places you have reached', {
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
        this.track(
          this.add
            .line(0, 0, start.x, start.y, end.x, end.y, 0x8a7290, 0.78)
            .setOrigin(0, 0)
            .setLineWidth(7),
        );
      } else {
        for (let step = 1; step < 7; step += 2) {
          const ratio = step / 7;
          this.track(
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
      this.track(ring, icon, label);

      if (isCurrent) {
        this.track(
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

    const homewardText =
      currentNode?.id === VALLEY_HOME_NODE_ID
        ? '🏡 Home is here.'
        : homewardNode
          ? `🏡 Way home: ${homewardNode.label}`
          : '🏡 Follow the solid paths home.';
    const nearbyText = currentNode?.revisitHint ? `Nearby: ${currentNode.revisitHint}` : '';
    this.track(
      this.add
        .text(
          GAME_WIDTH / 2,
          608,
          'Solid paths are open • small circles are places inside a region • dotted paths stay mysterious',
          {
            color: '#827286',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5),
      this.add
        .text(GAME_WIDTH / 2, 640, [homewardText, nearbyText].filter(Boolean).join('   •   '), {
          color: '#66536d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 980 },
        })
        .setOrigin(0.5)
        .setName('bag-map-guidance'),
      this.add.container(0, 0).setName('bag-map-content'),
    );
  }

  private selectPocket(pocket: BagPocketId): void {
    if (this.activeView !== 'items' || this.activePocket === pocket) {
      return;
    }
    this.activePocket = pocket;
    this.selectedItemId = null;
    this.bagScrollOffset = 0;
    this.bagFeedback = '';
    this.renderView();
  }

  private selectItem(itemId: ItemId): void {
    if (this.activeView !== 'items' || this.selectedItemId === itemId) {
      return;
    }
    this.selectedItemId = itemId;
    this.bagFeedback = '';
    this.renderView();
  }

  private useFood(itemId: ItemId, inventory: InventoryService): void {
    const result = new FoodUseService(inventory).use(itemId);
    if (result.status === 'used') {
      this.bagFeedback = `${result.itemName} eaten! ⚡ Quick hooves for ${result.boostSecondsRemaining}s.`;
      if (result.remainingQuantity === 0) {
        this.selectedItemId = null;
      }
    } else if (result.status === 'boost-active') {
      this.bagFeedback = `You already feel quick! ⚡ ${result.boostSecondsRemaining}s left.`;
    } else if (result.status === 'not-owned') {
      this.bagFeedback = 'That snack is no longer in your bag.';
      this.selectedItemId = null;
    } else {
      this.bagFeedback = 'This item stays safely in your bag.';
    }
    this.renderView();
  }

  private scrollBagBy(delta: number): void {
    if (this.activeView !== 'items') {
      return;
    }
    const inventory = new InventoryService(getBrowserSaveService());
    const grouped = groupBagItems(inventory.listOwnedItems());
    const maxOffset = Math.max(0, grouped[this.activePocket].length - BAG_VISIBLE_ITEMS);
    const nextOffset = Phaser.Math.Clamp(this.bagScrollOffset + delta, 0, maxOffset);
    if (nextOffset === this.bagScrollOffset) {
      return;
    }
    this.bagScrollOffset = nextOffset;
    this.renderView();
  }

  private handleBagWheel(
    pointer: Phaser.Input.Pointer,
    _gameObjects: Phaser.GameObjects.GameObject[],
    _deltaX: number,
    deltaY: number,
  ): void {
    if (this.activeView !== 'items' || !this.pointerInsideBagList(pointer)) {
      return;
    }
    this.scrollBagBy(deltaY > 0 ? BAG_SCROLL_STEP : -BAG_SCROLL_STEP);
  }

  private handleBagSwipe(pointer: Phaser.Input.Pointer): void {
    if (this.activeView !== 'items' || !this.pointerInsideBagList(pointer)) {
      return;
    }
    const movement = pointer.y - pointer.downY;
    if (Math.abs(movement) < 34) {
      return;
    }
    this.scrollBagBy(movement < 0 ? BAG_SCROLL_STEP : -BAG_SCROLL_STEP);
  }

  private pointerInsideBagList(pointer: Phaser.Input.Pointer): boolean {
    return (
      pointer.x >= BAG_LIST_BOUNDS.left &&
      pointer.x <= BAG_LIST_BOUNDS.right &&
      pointer.y >= BAG_LIST_BOUNDS.top &&
      pointer.y <= BAG_LIST_BOUNDS.bottom
    );
  }

  private pocketLabel(pocket: BagPocketId): string {
    return BAG_POCKETS.find((definition) => definition.id === pocket)?.label ?? 'this pocket';
  }

  private track(...objects: Phaser.GameObjects.GameObject[]): void {
    this.viewObjects.push(...objects);
  }

  private clearViewObjects(): void {
    for (const object of this.viewObjects) {
      object.destroy();
    }
    this.viewObjects.length = 0;
  }

  private openShop(): void {
    if (this.closing || this.activeView !== 'items') {
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
