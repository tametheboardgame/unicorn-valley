import Phaser from 'phaser';
import type { ItemId } from '../../content/contentTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import {
  BAG_POCKETS,
  type BagPocketId,
  getFirstPopulatedBagPocket,
  groupBagItems,
  isUsableFood,
} from '../inventory/BagInventoryModel';
import { FoodUseService } from '../inventory/FoodUseService';
import {
  getItemPresentation,
  InventoryService,
  type OwnedInventoryItem,
} from '../inventory/InventoryService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  getHomewardNextNode,
  getValleyMapNode,
  getValleyMapNodeForLocation,
  VALLEY_HOME_NODE_ID,
  VALLEY_MAP_CONNECTIONS,
  VALLEY_MAP_NODES,
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
const MAP_VIEWPORT = { x: 124, y: 138, width: 1032, height: 436 } as const;
const MAP_CLIP_VIEWPORT = { x: 132, y: 146, width: 1016, height: 420 } as const;

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
    this.cameras.main.setBackgroundColor('rgba(55, 37, 64, 0.94)');

    const shell = this.add.graphics().setName('inventory-modal-panel');
    shell.fillStyle(0x211827, 0.24);
    shell.fillRoundedRect(49, 42, 1200, 660, 34);
    shell.fillStyle(this.activeView === 'map' ? 0x8f7153 : 0x875671, 1);
    shell.fillRoundedRect(40, 30, 1200, 660, 34);
    shell.lineStyle(5, this.activeView === 'map' ? 0xd7b878 : 0xc98eb7, 1);
    shell.strokeRoundedRect(40, 30, 1200, 660, 34);
    shell.fillStyle(0xfff5df, 1);
    shell.fillRoundedRect(54, 44, 1172, 632, 26);
    shell.fillStyle(this.activeView === 'map' ? 0xead5a8 : 0xead4ee, 0.24);
    shell.fillRoundedRect(68, 48, 1144, 58, 18);
    shell.lineStyle(2, this.activeView === 'map' ? 0xc8a66c : 0xddbdcf, 0.48);
    shell.lineBetween(72, 108, 1208, 108);

    this.titleText = this.add
      .text(GAME_WIDTH / 2, 70, this.activeView === 'map' ? 'Valley Map' : 'My Magical Bag', {
        color: this.activeView === 'map' ? '#634a35' : '#5a4265',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setName('inventory-modal-title');

    const closeButton = this.add
      .rectangle(1172, 76, 82, 70, 0xffffff, 0.001)
      .setAlpha(0.001)
      .setInteractive({ useHandCursor: true })
      .setName('bag-close-button');
    this.add
      .text(1172, 76, '×', {
        color: this.activeView === 'map' ? '#5d4936' : '#5d4369',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '38px',
        fontStyle: 'bold',
      })
      .setName('wp18j-inventory-close-icon')
      .setOrigin(0.5)
      .setDepth(11);
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
    this.titleText?.setText(this.activeView === 'map' ? 'Valley Map' : 'My Magical Bag');
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

    const satchel = this.add.graphics().setName('bag-themed-satchel');
    satchel.fillStyle(0x4b3045, 0.13);
    satchel.fillRoundedRect(123, 123, 1033, 472, 26);
    satchel.fillStyle(0xb77b8f, 0.19);
    satchel.fillRoundedRect(116, 116, 1037, 472, 26);
    satchel.lineStyle(2, 0x925971, 0.58);
    satchel.strokeRoundedRect(116, 116, 1037, 472, 26);
    satchel.fillStyle(0xe4bbc6, 0.2);
    satchel.fillRoundedRect(132, 124, 1005, 54, 15);
    this.track(satchel);

    this.track(
      this.add
        .text(1040, 155, `✨ ${economy.getBalance()} Shimmer`, {
          color: '#69435d',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          fontStyle: 'bold',
          backgroundColor: '#f4d9df',
          padding: { x: 12, y: 6 },
        })
        .setOrigin(0.5)
        .setName('bag-shimmer-balance'),
    );

    BAG_POCKETS.forEach((pocket, index) => {
      const x = 230 + index * 185;
      const selected = pocket.id === this.activePocket;
      const tabShadow = this.add
        .rectangle(x + 3, 159, 158, 60, 0x4d3243, 0.13)
        .setName(`bag-pocket-shadow:${pocket.id}`);
      const tab = this.add
        .rectangle(x, 155, 156, 60, selected ? 0xf3d9a4 : 0xd8a8b8, 1)
        .setStrokeStyle(3, selected ? 0xb7834e : 0x9a6479, 1)
        .setInteractive({ useHandCursor: true })
        .setName(`bag-pocket:${pocket.id}`);
      const hole = this.add
        .circle(x - 66, 155, 6, 0x8c5c70, 0.82)
        .setStrokeStyle(2, 0xf4d7df, 0.68);
      const label = this.add
        .text(x + 5, 155, `${pocket.icon} ${pocket.label}  ${grouped[pocket.id].length}`, {
          color: selected ? '#664631' : '#5d4360',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '16px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      tab.on('pointerdown', () => this.selectPocket(pocket.id));
      this.track(tabShadow, tab, hole, label);
    });

    const listPanel = this.add.graphics().setName('bag-list-panel');
    listPanel.fillStyle(0x573d4f, 0.1);
    listPanel.fillRoundedRect(146, 204, 710, 381, 20);
    listPanel.fillStyle(0xfff7e7, 1);
    listPanel.fillRoundedRect(140, 198, 710, 381, 20);
    listPanel.lineStyle(2, 0xc28da0, 0.62);
    listPanel.strokeRoundedRect(140, 198, 710, 381, 20);

    const detailPanel = this.add.graphics().setName('bag-detail-panel');
    detailPanel.fillStyle(0x573d4f, 0.11);
    detailPanel.fillRoundedRect(875, 204, 272, 381, 20);
    detailPanel.fillStyle(0xf7e8e3, 1);
    detailPanel.fillRoundedRect(869, 198, 272, 381, 20);
    detailPanel.lineStyle(2, 0xb87a94, 0.7);
    detailPanel.strokeRoundedRect(869, 198, 272, 381, 20);
    detailPanel.fillStyle(0xe2b6c3, 0.2);
    detailPanel.fillRoundedRect(887, 212, 236, 40, 12);

    this.track(
      this.add
        .text(170, 208, `${this.pocketLabel(this.activePocket)} pocket`, {
          color: '#785266',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5),
      this.add
        .text(1005, 223, 'TREASURE TAG', {
          color: '#7e5669',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold',
          letterSpacing: 1.5,
        })
        .setOrigin(0.5),
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

    this.track(this.add.container(0, 0).setName('bag-items-content'));
  }

  private renderBagItemTile(item: OwnedInventoryItem, index: number): void {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 315 + column * 350;
    const y = 268 + row * 104;
    const selected = item.definition.id === this.selectedItemId;
    const presentation = getItemPresentation(item.definition);

    if (selected) {
      this.track(
        this.add.rectangle(x + 3, y + 4, 324, 88, 0xd09a66, 0.2).setStrokeStyle(6, 0xe4b85f, 0.32),
      );
    }

    const tile = this.add
      .rectangle(x, y, 316, 82, selected ? 0xffe6b7 : 0xfffbef, 1)
      .setStrokeStyle(4, selected ? 0xb67873 : 0xd1a4ad, 1)
      .setInteractive({ useHandCursor: true })
      .setName(`bag-item-tile:${item.definition.id}`);
    const iconWell = this.add
      .circle(x - 124, y, 30, selected ? 0xe7b5a4 : 0xf0d7cf, 1)
      .setStrokeStyle(3, selected ? 0xa86978 : 0xc995a4, 0.9);
    const icon = this.add
      .text(x - 124, y, presentation.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '32px',
      })
      .setOrigin(0.5);
    const name = this.add
      .text(x - 82, y - 14, item.definition.name, {
        color: '#5b4662',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        wordWrap: { width: 174 },
      })
      .setOrigin(0, 0.5);
    const quantity = this.add
      .text(x + 118, y + 20, `×${item.quantity}`, {
        color: '#714d65',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: selected ? '#f4c98a' : '#ead3d8',
        padding: { x: 7, y: 3 },
      })
      .setOrigin(0.5);

    const objects: Phaser.GameObjects.GameObject[] = [tile, iconWell, icon, name, quantity];
    if (selected) {
      objects.push(
        this.add
          .text(x + 102, y - 24, 'SELECTED ✦', {
            color: '#8a5961',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '10px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5),
      );
    }

    tile.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (Math.abs(pointer.y - pointer.downY) <= 14) {
        this.selectItem(item.definition.id);
      }
    });
    this.track(...objects);
  }

  private renderBagScrollAffordance(itemCount: number): void {
    if (itemCount <= BAG_VISIBLE_ITEMS) {
      this.track(
        this.add
          .text(495, 563, `${itemCount} item${itemCount === 1 ? '' : 's'} tucked in this pocket`, {
            color: '#8a6674',
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
    const trackTop = 250;
    const trackHeight = 250;
    const thumbHeight = Math.max(62, trackHeight * (BAG_VISIBLE_ITEMS / itemCount));
    const thumbY = trackTop + thumbHeight / 2 + progress * (trackHeight - thumbHeight);

    const up = this.add
      .rectangle(810, 224, 54, 42, 0xe5bdc8, 1)
      .setStrokeStyle(3, 0x9d6e80, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-scroll-up');
    const upLabel = this.add
      .text(810, 224, '▲', {
        color: '#674c70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const down = this.add
      .rectangle(810, 530, 54, 42, 0xe5bdc8, 1)
      .setStrokeStyle(3, 0x9d6e80, 1)
      .setInteractive({ useHandCursor: true })
      .setName('bag-scroll-down');
    const downLabel = this.add
      .text(810, 530, '▼', {
        color: '#674c70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const scrollTrack = this.add.rectangle(
      810,
      trackTop + trackHeight / 2,
      10,
      trackHeight,
      0xd8b3bd,
      1,
    );
    const scrollThumb = this.add
      .rectangle(810, thumbY, 20, thumbHeight, 0x98667d, 1)
      .setName('bag-scroll-thumb');
    const hint = this.add
      .text(495, 563, `↕ Drag or scroll to see all ${itemCount} items`, {
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
          .text(1005, 390, 'Choose a treasure\nto read its tag.', {
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
      this.add.circle(1005, 286, 52, 0xf1cdbd, 1).setStrokeStyle(4, 0xb8788f, 0.92),
      this.add
        .text(1005, 286, presentation.icon, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '52px',
        })
        .setOrigin(0.5),
      this.add
        .text(1005, 353, selected.definition.name, {
          color: '#59445f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '22px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 235 },
        })
        .setOrigin(0.5),
      this.add
        .text(1005, 386, `In your bag: ×${selected.quantity}`, {
          color: '#76518a',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5),
      this.add
        .text(1005, 438, presentation.description, {
          color: '#6f5b74',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '15px',
          align: 'center',
          lineSpacing: 4,
          wordWrap: { width: 235 },
        })
        .setOrigin(0.5),
    );

    if (isUsableFood(selected.definition)) {
      const eatButton = this.add
        .rectangle(1005, 522, 218, 52, 0xffd98f, 1)
        .setStrokeStyle(4, 0xd2a95c, 1)
        .setInteractive({ useHandCursor: true })
        .setName(`bag-eat-button:${selected.definition.id}`);
      const eatLabel = this.add
        .text(1005, 522, `Eat ${presentation.icon}`, {
          color: '#5d4369',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '19px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      eatButton.on('pointerdown', () => this.useFood(selected.definition.id, inventory));
      this.track(eatButton, eatLabel);
    } else {
      this.track(
        this.add
          .text(
            1005,
            522,
            selected.definition.questCritical
              ? 'Kept safe for your adventure'
              : 'A treasure to keep',
            {
              color: '#7d5668',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '14px',
              fontStyle: 'bold',
              backgroundColor: '#ead0d7',
              padding: { x: 10, y: 7 },
            },
          )
          .setOrigin(0.5),
      );
    }

    if (this.bagFeedback) {
      this.track(
        this.add
          .text(1005, 562, this.bagFeedback, {
            color: '#6f4f72',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 240 },
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
    // Extend the geography beyond the clipped parchment window so dragging reveals
    // meaningful detail in both axes instead of shifting already fully visible content.
    const mapLeft = 70;
    const mapTop = 100;
    const mapWidth = 1140;
    const mapHeight = 520;

    const parchment = this.add.graphics().setName('bag-map-parchment');
    parchment.fillStyle(0x3f3028, 0.14);
    parchment.fillRoundedRect(118, 132, 1056, 456, 22);
    parchment.fillStyle(0xe7c98d, 1);
    parchment.fillRoundedRect(110, 124, 1060, 456, 22);
    parchment.lineStyle(3, 0xa47a4c, 0.72);
    parchment.strokeRoundedRect(110, 124, 1060, 456, 22);
    parchment.fillStyle(0xf8e9bd, 1);
    parchment.fillRoundedRect(124, 138, 1032, 436, 17);
    parchment.fillStyle(0xc9dba3, 0.23);
    parchment.fillEllipse(315, 330, 310, 210);
    parchment.fillStyle(0xb9d3c8, 0.24);
    parchment.fillEllipse(760, 430, 420, 240);
    parchment.fillStyle(0xe8c1a1, 0.22);
    parchment.fillEllipse(955, 265, 280, 170);
    parchment.lineStyle(2, 0x9ab2a5, 0.35);
    parchment.lineBetween(150, 520, 330, 470);
    parchment.lineBetween(330, 470, 520, 510);
    parchment.lineBetween(520, 510, 760, 420);
    parchment.lineBetween(760, 420, 1120, 386);
    this.track(parchment);

    const compass = this.add.circle(1092, 535, 34, 0xf5dfad, 0.42).setStrokeStyle(2, 0x9d7449, 0.6);
    const compassLabel = this.add
      .text(1092, 535, '✦\nN', {
        color: '#7f6247',
        fontFamily: 'Georgia, serif',
        fontSize: '18px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: -5,
      })
      .setOrigin(0.5);
    const mapContent = this.add.container(0, 0).setName('bag-map-content');
    this.track(compass, compassLabel);

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
            .line(0, 0, start.x, start.y, end.x, end.y, 0x816247, 0.8)
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
              0x9a7c62,
              0.5,
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
        node.kind === 'home' ? 0xffe29a : isFuture ? 0xd4c7af : isSide ? 0xe9d8bb : 0xfff4ce;
      const alpha = isFuture ? 0.58 : 1;
      if (isCurrent) {
        this.track(
          this.add
            .circle(point.x, point.y, radius + 10, 0xf2a8cc, 0.2)
            .setStrokeStyle(3, 0xc35e9e, 0.55),
        );
      }
      const ring = this.add
        .circle(point.x, point.y, radius, fill, alpha)
        .setStrokeStyle(
          isCurrent ? 7 : isSide ? 3 : 4,
          isCurrent ? 0xbd5b99 : isSide ? 0x876c62 : 0x8a684d,
          isFuture ? 0.5 : 0.95,
        )
        .setName(isCurrent ? 'bag-map-current-location' : `bag-map-node:${node.id}`);
      const icon = this.add
        .text(point.x, point.y - 3, node.icon, {
          color: isFuture ? '#8d858f' : '#5b493c',
          fontFamily: 'system-ui, sans-serif',
          fontSize: node.kind === 'home' ? '29px' : isSide ? '17px' : '24px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setAlpha(alpha);
      const label = this.add
        .text(point.x, point.y + radius + (isSide ? 7 : 11), node.label, {
          color: isFuture ? '#8f8578' : '#5f4939',
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
              color: '#714255',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '11px',
              fontStyle: 'bold',
              backgroundColor: '#fff0cce8',
              padding: { x: 7, y: 4 },
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
          610,
          'Solid trails are open • small marks are places inside a region • dotted trails stay mysterious',
          {
            color: '#80684f',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
          },
        )
        .setOrigin(0.5),
      this.add
        .text(GAME_WIDTH / 2, 642, [homewardText, nearbyText].filter(Boolean).join('   •   '), {
          color: '#66513f',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '13px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 980 },
        })
        .setOrigin(0.5)
        .setName('bag-map-guidance'),
      mapContent,
    );
    this.installMapPanning(mapContent, compass, compassLabel);
  }

  private installMapPanning(
    mapContent: Phaser.GameObjects.Container,
    compass: Phaser.GameObjects.Arc,
    compassLabel: Phaser.GameObjects.Text,
  ): void {
    const contentIndex = this.children.list.indexOf(mapContent);
    const movingObjects = this.children.list
      .slice(contentIndex + 1)
      .filter(
        (object) =>
          object !== compass &&
          object !== compassLabel &&
          object.name !== 'bag-map-guidance' &&
          !(
            object instanceof Phaser.GameObjects.Text &&
            object.text.startsWith('Solid trails are open')
          ),
      );
    mapContent.add(movingObjects).setDepth(2);
    const clipShape = this.add.graphics().setName('wp18k-map-geometry-clip');
    clipShape.fillStyle(0xffffff, 1);
    clipShape.fillRect(
      MAP_CLIP_VIEWPORT.x,
      MAP_CLIP_VIEWPORT.y,
      MAP_CLIP_VIEWPORT.width,
      MAP_CLIP_VIEWPORT.height,
    );
    mapContent.setMask(clipShape.createGeometryMask());
    clipShape.setVisible(false);

    const frame = this.add.graphics().setName('wp18j-map-pan-frame').setDepth(5);
    frame.lineStyle(4, 0xa47a4c, 0.72);
    frame.strokeRoundedRect(110, 124, 1060, 456, 22);
    frame.lineStyle(2, 0xe7c98d, 0.92);
    frame.strokeRoundedRect(
      MAP_VIEWPORT.x - 1,
      MAP_VIEWPORT.y - 1,
      MAP_VIEWPORT.width + 2,
      MAP_VIEWPORT.height + 2,
      18,
    );

    compass.setPosition(170, 192).setName('wp18j-map-compass').setDepth(6);
    compassLabel.setPosition(170, 192).setName('wp18j-map-compass-label').setDepth(7);

    const zone = this.add
      .zone(
        MAP_VIEWPORT.x + MAP_VIEWPORT.width / 2,
        MAP_VIEWPORT.y + MAP_VIEWPORT.height / 2,
        MAP_VIEWPORT.width,
        MAP_VIEWPORT.height,
      )
      .setName('wp18j-map-pan-zone')
      .setInteractive({ useHandCursor: true })
      .setDepth(8);
    this.input.setDraggable(zone);
    zone.on('dragstart', (pointer: Phaser.Input.Pointer) => {
      zone.setData({
        'content-start-x': mapContent.x,
        'content-start-y': mapContent.y,
        'pointer-start-x': pointer.x,
        'pointer-start-y': pointer.y,
      });
    });
    zone.on('drag', (pointer: Phaser.Input.Pointer) => {
      mapContent.setPosition(
        Phaser.Math.Clamp(
          Number(zone.getData('content-start-x') ?? 0) +
            pointer.x -
            Number(zone.getData('pointer-start-x') ?? pointer.x),
          -100,
          100,
        ),
        Phaser.Math.Clamp(
          Number(zone.getData('content-start-y') ?? 0) +
            pointer.y -
            Number(zone.getData('pointer-start-y') ?? pointer.y),
          -70,
          70,
        ),
      );
    });

    const panHint = this.add
      .text(1046, 164, '↔ Drag map to explore', {
        color: '#725039',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        backgroundColor: '#fff0ccd9',
        padding: { x: 8, y: 4 },
      })
      .setName('wp18j-map-pan-hint')
      .setOrigin(0.5)
      .setDepth(9);

    const clipGuard = this.add
      .zone(
        MAP_CLIP_VIEWPORT.x + MAP_CLIP_VIEWPORT.width / 2,
        MAP_CLIP_VIEWPORT.y + MAP_CLIP_VIEWPORT.height / 2,
        MAP_CLIP_VIEWPORT.width,
        MAP_CLIP_VIEWPORT.height,
      )
      .setName('wp18j-map-camera-clip-guard');
    const mapCamera = this.cameras
      .add(
        MAP_CLIP_VIEWPORT.x,
        MAP_CLIP_VIEWPORT.y,
        MAP_CLIP_VIEWPORT.width,
        MAP_CLIP_VIEWPORT.height,
        false,
        'wp18j-map-content-camera',
      )
      .setScroll(MAP_CLIP_VIEWPORT.x, MAP_CLIP_VIEWPORT.y)
      .setRoundPixels(true);
    // These cameras only compose clipping and fixed chrome. Leaving them input-enabled
    // lets a rendering camera become the pointer owner above the main-camera drag zone.
    mapCamera.inputEnabled = false;
    this.cameras.main.ignore(mapContent);
    mapCamera.ignore(this.children.list.filter((object) => object !== mapContent));

    const overlays: Phaser.GameObjects.GameObject[] = [frame, compass, compassLabel, panHint];
    this.cameras.main.ignore(overlays);
    const overlayCamera = this.cameras
      .add(0, 0, GAME_WIDTH, GAME_HEIGHT, false, 'wp18j-map-overlay-camera')
      .setRoundPixels(true);
    overlayCamera.inputEnabled = false;
    overlayCamera.ignore(this.children.list.filter((object) => !overlays.includes(object)));
    this.cameras.main.ignore(clipGuard);
    mapCamera.ignore(clipGuard);
    overlayCamera.ignore(clipGuard);

    this.track(clipShape, frame, zone, panHint, clipGuard);
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
