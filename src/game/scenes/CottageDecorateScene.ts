import Phaser from 'phaser';
import type { ItemId } from '../../content/contentTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  getCottageDecorationGroup,
  getCottageDecorationGroupLabel,
  getCottageDecorationThemeLabel,
  getCottageDecorationProfile,
  type CottageDecorationGroup,
} from '../home/CottageDecorationCatalogue';
import { HomeDecorationService, type OwnedDecoration } from '../home/HomeDecorationService';
import { renderCottageDecoration } from '../home/CottageDecorationPresentation';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import type { CottageDecorationSlot } from '../world/CottageInteriorMap';
import type { MapPoint } from '../world/MapTraversal';

interface CottageDecorateSceneData {
  slotId?: string;
  returnToDecorateMode?: boolean;
  returnPosition?: MapPoint;
}

type DecorationFilter = 'all' | CottageDecorationGroup;

const LEFT_X = 315;
const RIGHT_X = 925;
const PANEL_Y = 390;
const LEFT_WIDTH = 500;
const RIGHT_WIDTH = 620;
const PANEL_HEIGHT = 530;
const GRID_COLUMNS = 3;
const GRID_ROWS = 2;
const PAGE_SIZE = GRID_COLUMNS * GRID_ROWS;

const GROUP_ORDER: readonly CottageDecorationGroup[] = [
  'lighting',
  'flowers-plants',
  'rugs-cushions',
  'trophies-ribbons',
  'keepsakes',
  'ornaments',
  'hangings',
];

export class CottageDecorateScene extends Phaser.Scene {
  private decorating: HomeDecorationService | null = null;
  private slot: CottageDecorationSlot | null = null;
  private options: readonly OwnedDecoration[] = [];
  private filteredOptions: readonly OwnedDecoration[] = [];
  private activeFilter: DecorationFilter = 'all';
  private selectedItemId: ItemId | null = null;
  private page = 0;
  private dynamicObjects: Phaser.GameObjects.GameObject[] = [];
  private previewObjects: Phaser.GameObjects.GameObject[] = [];
  private returnToDecorateMode = false;
  private returnPosition: MapPoint | null = null;
  private escapeKey: Phaser.Input.Keyboard.Key | null = null;

  public constructor() {
    super('CottageDecorateScene');
  }

  public create(data: CottageDecorateSceneData): void {
    this.cameras.main.setBackgroundColor('#7558a0');
    this.decorating = new HomeDecorationService(getBrowserSaveService());
    this.returnToDecorateMode = data.returnToDecorateMode === true;

    try {
      this.slot = this.decorating.getSlot(data.slotId ?? '');
    } catch {
      this.backToRoom();
      return;
    }

    this.returnPosition =
      data.returnPosition ?? this.slot.interactionPosition ?? this.slot.position;
    this.options = this.decorating.listCompatibleDecorations(this.slot.id);
    const current = this.decorating.getPlacement(this.slot.id);
    this.selectedItemId = current?.id ?? this.options[0]?.definition.id ?? null;

    this.drawShell();
    this.applyFilter('all');

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearDynamicObjects();
      this.clearPreview();
      this.decorating = null;
      this.slot = null;
      this.options = [];
      this.filteredOptions = [];
      this.selectedItemId = null;
      this.page = 0;
      this.activeFilter = 'all';
      this.returnToDecorateMode = false;
      this.returnPosition = null;
      this.escapeKey = null;
    });
  }

  public update(): void {
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.backToRoom();
    }
  }

  private drawShell(): void {
    if (!this.slot) return;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7558a0, 1);
    this.add.circle(160, 110, 185, 0xf2c9ed, 0.1);
    this.add.circle(1120, 610, 245, 0xffecb6, 0.07);

    this.add
      .text(62, 32, `Decorate · ${this.slot.label}`, {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '36px',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0)
      .setDepth(20);

    this.add
      .text(
        64,
        82,
        `${this.categoryLabel(this.slot)} spot · choose something you own for this space`,
        {
          color: '#efe6fa',
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0, 0)
      .setDepth(20);

    this.createRoundedPanel(
      LEFT_X,
      PANEL_Y,
      LEFT_WIDTH,
      PANEL_HEIGHT,
      UI_COLOURS.cream,
      UI_COLOURS.lavenderStrong,
      2,
      30,
    ).setName('cottage-decorate-preview-panel');

    this.createRoundedPanel(
      RIGHT_X,
      PANEL_Y,
      RIGHT_WIDTH,
      PANEL_HEIGHT,
      UI_COLOURS.cream,
      UI_COLOURS.lavenderStrong,
      2,
      30,
    ).setName('cottage-decorate-main-panel');

    this.add
      .text(RIGHT_X, 148, 'Your decorations', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '25px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.createButton(
      1165,
      64,
      142,
      'Back',
      UI_COLOURS.blush,
      'cottage-decorate-back',
      () => this.backToRoom(),
    );
  }

  private applyFilter(filter: DecorationFilter): void {
    this.activeFilter = filter;
    this.page = 0;
    this.filteredOptions =
      filter === 'all'
        ? this.options
        : this.options.filter(
            ({ definition }) => getCottageDecorationGroup(definition.id) === filter,
          );

    if (
      this.selectedItemId &&
      !this.filteredOptions.some(({ definition }) => definition.id === this.selectedItemId)
    ) {
      this.selectedItemId = this.filteredOptions[0]?.definition.id ?? null;
    }
    if (!this.selectedItemId) {
      this.selectedItemId = this.filteredOptions[0]?.definition.id ?? null;
    }

    this.renderDynamicUi();
  }

  private renderDynamicUi(): void {
    this.clearDynamicObjects();
    this.renderFilterTabs();
    this.renderGrid();
    this.renderSelection();
  }

  private renderFilterTabs(): void {
    const groups = GROUP_ORDER.filter((group) =>
      this.options.some(({ definition }) => getCottageDecorationGroup(definition.id) === group),
    );
    const filters: DecorationFilter[] = groups.length > 1 ? ['all', ...groups] : groups;

    if (filters.length <= 1) {
      return;
    }

    const availableWidth = RIGHT_WIDTH - 64;
    const gap = 8;
    const width = Math.min(132, (availableWidth - gap * (filters.length - 1)) / filters.length);
    const totalWidth = width * filters.length + gap * (filters.length - 1);
    const startX = RIGHT_X - totalWidth / 2 + width / 2;

    filters.forEach((filter, index) => {
      const x = startX + index * (width + gap);
      const selected = filter === this.activeFilter;
      const surface = this.createRoundedPanel(
        x,
        192,
        width,
        38,
        selected ? UI_COLOURS.gold : 0xf5ebfa,
        selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavender,
        5,
        16,
        1,
        false,
      );
      const hit = this.add
        .zone(x, 192, width, 42)
        .setName(`cottage-decoration-filter:${filter}`)
        .setInteractive({ useHandCursor: true })
        .setDepth(8)
        .on('pointerdown', () => this.applyFilter(filter));
      const label = this.add
        .text(x, 192, filter === 'all' ? 'All' : getCottageDecorationGroupLabel(filter), {
          color: selected ? '#694c2c' : UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: filters.length > 4 ? '12px' : '13px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: width - 12 },
        })
        .setOrigin(0.5)
        .setDepth(7);
      this.dynamicObjects.push(surface, hit, label);
    });
  }

  private renderGrid(): void {
    const pageStart = this.page * PAGE_SIZE;
    const pageOptions = this.filteredOptions.slice(pageStart, pageStart + PAGE_SIZE);
    const startX = RIGHT_X - 192;
    const startY = 300;
    const columnGap = 192;
    const rowGap = 172;

    if (pageOptions.length === 0) {
      const empty = this.add
        .text(
          RIGHT_X,
          380,
          'Nothing from this category can go here yet.\nTry another category or find more decorations.',
          {
            color: UI_COLOURS.softInk,
            fontFamily: UI_FONT,
            fontSize: '17px',
            align: 'center',
            wordWrap: { width: 430 },
          },
        )
        .setOrigin(0.5)
        .setDepth(6);
      this.dynamicObjects.push(empty);
      return;
    }

    pageOptions.forEach((owned, pageIndex) => {
      const row = Math.floor(pageIndex / GRID_COLUMNS);
      const column = pageIndex % GRID_COLUMNS;
      const x = startX + column * columnGap;
      const y = startY + row * rowGap;
      const selected = owned.definition.id === this.selectedItemId;

      const surface = this.createRoundedPanel(
        x,
        y,
        166,
        142,
        selected ? 0xfff7dc : 0xffffff,
        selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavender,
        6,
        18,
        1,
        false,
      );
      const hit = this.add
        .zone(x, y, 170, 146)
        .setName(`cottage-decoration-choice:${owned.definition.id}`)
        .setInteractive({ useHandCursor: true })
        .setDepth(10)
        .on('pointerdown', () => this.selectItem(owned.definition.id));

      const art = renderCottageDecoration(this, owned.definition.id, x, y - 24, 0.53);
      for (const object of art) {
        object.setDepth(8);
      }

      const label = this.add
        .text(x, y + 37, owned.definition.name, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '12px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 140 },
        })
        .setOrigin(0.5)
        .setDepth(9);
      const count = this.add
        .text(x, y + 59, `${owned.quantity} owned · ${owned.placedQuantity} placed`, {
          color: UI_COLOURS.mutedInk,
          fontFamily: UI_FONT,
          fontSize: '10px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(9);

      this.dynamicObjects.push(surface, hit, ...art, label, count);
    });

    const pageCount = Math.ceil(this.filteredOptions.length / PAGE_SIZE);
    if (pageCount > 1) {
      const pageText = this.add
        .text(RIGHT_X, 582, `${this.page + 1} / ${pageCount}`, {
          color: UI_COLOURS.mutedInk,
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(7);
      this.dynamicObjects.push(pageText);

      if (this.page > 0) {
        this.dynamicObjects.push(
          ...this.createSmallButton(RIGHT_X - 82, 582, '‹', () => {
            this.page -= 1;
            this.renderDynamicUi();
          }),
        );
      }
      if (this.page + 1 < pageCount) {
        this.dynamicObjects.push(
          ...this.createSmallButton(RIGHT_X + 82, 582, '›', () => {
            this.page += 1;
            this.renderDynamicUi();
          }),
        );
      }
    }
  }

  private renderSelection(): void {
    this.clearPreview();
    if (!this.slot || !this.decorating) return;

    const selected = this.options.find(({ definition }) => definition.id === this.selectedItemId);
    const current = this.decorating.getPlacement(this.slot.id);

    if (!selected) {
      const message = this.add
        .text(
          LEFT_X,
          365,
          'No compatible decorations yet\n\nExplore the valley, race and visit shops to find more.',
          {
            color: UI_COLOURS.softInk,
            fontFamily: UI_FONT,
            fontSize: '19px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 370 },
          },
        )
        .setOrigin(0.5)
        .setDepth(6);
      this.previewObjects.push(message);
      if (current) {
        this.previewObjects.push(...this.createPreviewActionButtons(null, current.id));
      }
      return;
    }

    const item = selected.definition;
    const profile = getCottageDecorationProfile(item.id);
    const art = renderCottageDecoration(this, item.id, LEFT_X, 325, 1.28);
    for (const object of art) object.setDepth(6);

    const name = this.add
      .text(LEFT_X, 448, item.name, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '27px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 410 },
      })
      .setOrigin(0.5)
      .setDepth(6);

    const group = getCottageDecorationGroup(item.id);
    const pill = this.createRoundedPanel(
      LEFT_X,
      492,
      260,
      34,
      0xf3e7f8,
      UI_COLOURS.lavender,
      5,
      16,
      1,
      false,
    );
    const meta = this.add
      .text(
        LEFT_X,
        492,
        `${getCottageDecorationGroupLabel(group)} · ${profile ? getCottageDecorationThemeLabel(profile.theme) : 'Cottage'}`,
        {
          color: '#76518a',
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(6);

    const description = this.add
      .text(LEFT_X, 535, item.description ?? 'A lovely cottage decoration.', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        align: 'center',
        wordWrap: { width: 390 },
      })
      .setOrigin(0.5, 0)
      .setDepth(6);

    const available = Math.max(0, selected.quantity - selected.placedQuantity);
    const moving = current?.id !== item.id && available === 0;
    const ownership = this.add
      .text(
        LEFT_X,
        574,
        moving
          ? `${selected.quantity} owned · all placed · this will move the existing one`
          : `${selected.quantity} owned · ${selected.placedQuantity} placed · ${available} available`,
        {
          color: moving ? '#8a5a2d' : UI_COLOURS.mutedInk,
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 390 },
        },
      )
      .setOrigin(0.5)
      .setDepth(6);

    this.previewObjects.push(
      ...art,
      name,
      pill,
      meta,
      description,
      ownership,
      ...this.createPreviewActionButtons(item.id, current?.id ?? null),
    );
  }

  private createPreviewActionButtons(
    selectedItemId: ItemId | null,
    currentItemId: ItemId | null,
  ): Phaser.GameObjects.GameObject[] {
    const objects: Phaser.GameObjects.GameObject[] = [];

    if (currentItemId) {
      objects.push(
        ...this.createActionButton(
          LEFT_X - 118,
          620,
          190,
          'Remove',
          UI_COLOURS.blush,
          'cottage-decorate-action-remove',
          () => this.removePlacement(),
        ),
      );
    }

    if (selectedItemId && this.slot && this.decorating) {
      const owned = this.options.find(({ definition }) => definition.id === selectedItemId);
      const available = Math.max(0, (owned?.quantity ?? 0) - (owned?.placedQuantity ?? 0));
      const moving = currentItemId !== selectedItemId && available === 0;
      const label =
        currentItemId === selectedItemId
          ? 'Keep this'
          : moving
            ? 'Move here'
            : currentItemId
              ? 'Replace'
              : 'Place';
      objects.push(
        ...this.createActionButton(
          currentItemId ? LEFT_X + 118 : LEFT_X,
          620,
          currentItemId ? 190 : 250,
          label,
          UI_COLOURS.gold,
          'cottage-decorate-action-primary',
          () => this.placeSelection(),
        ),
      );
    }

    return objects;
  }

  private selectItem(itemId: ItemId): void {
    this.selectedItemId = itemId;
    this.renderDynamicUi();
  }

  private placeSelection(): void {
    if (!this.decorating || !this.slot || !this.selectedItemId) return;
    this.decorating.placeDecoration(this.slot.id, this.selectedItemId);
    this.backToRoom();
  }

  private removePlacement(): void {
    if (!this.decorating || !this.slot) return;
    this.decorating.removeDecoration(this.slot.id);
    this.backToRoom();
  }

  private backToRoom(): void {
    this.scene.start('CottageInteriorScene', {
      decorateMode: this.returnToDecorateMode,
      playerPosition: this.returnPosition ?? undefined,
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    label: string,
    fill: number,
    actionName: string,
    action: () => void,
  ): Phaser.GameObjects.Text {
    this.createRoundedPanel(
      x,
      y,
      width,
      50,
      fill,
      fill === UI_COLOURS.gold ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
      20,
      16,
    );
    this.add
      .zone(x, y, width, 54)
      .setName(actionName)
      .setInteractive({ useHandCursor: true })
      .setDepth(22)
      .on('pointerdown', action);
    return this.add
      .text(x, y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(21);
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    label: string,
    fill: number,
    actionName: string,
    action: () => void,
  ): Phaser.GameObjects.GameObject[] {
    const surface = this.createRoundedPanel(
      x,
      y,
      width,
      54,
      fill,
      fill === UI_COLOURS.gold ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
      8,
      17,
    );
    const hit = this.add
      .zone(x, y, width, 58)
      .setName(actionName)
      .setInteractive({ useHandCursor: true })
      .setDepth(11)
      .on('pointerdown', action);
    const text = this.add
      .text(x, y, label, {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(10);
    return [surface, hit, text];
  }

  private createSmallButton(
    x: number,
    y: number,
    label: string,
    action: () => void,
  ): Phaser.GameObjects.GameObject[] {
    const surface = this.createRoundedPanel(
      x,
      y,
      52,
      42,
      0xf3e7f8,
      UI_COLOURS.lavenderStrong,
      7,
      16,
      1,
      false,
    );
    const hit = this.add
      .zone(x, y, 58, 48)
      .setInteractive({ useHandCursor: true })
      .setDepth(10)
      .on('pointerdown', action);
    const text = this.add
      .text(x, y - 1, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '26px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(9);
    return [surface, hit, text];
  }

  private createRoundedPanel(
    x: number,
    y: number,
    width: number,
    height: number,
    fill: number,
    stroke: number,
    depth: number,
    radius: number,
    alpha = 1,
    shadow = true,
  ): Phaser.GameObjects.Graphics {
    const graphics = this.add.graphics().setDepth(depth);
    const left = x - width / 2;
    const top = y - height / 2;

    if (shadow) {
      graphics.fillStyle(0x4b3658, 0.2);
      graphics.fillRoundedRect(left + 6, top + 7, width, height, radius);
    }
    graphics.fillStyle(fill, alpha);
    graphics.fillRoundedRect(left, top, width, height, radius);
    graphics.lineStyle(4, stroke, 1);
    graphics.strokeRoundedRect(left, top, width, height, radius);
    return graphics;
  }

  private categoryLabel(slot: CottageDecorationSlot): string {
    switch (slot.category) {
      case 'wall':
        return 'Wall';
      case 'floor':
        return 'Floor';
      case 'table':
        return 'Table';
      case 'shelf':
        return 'Shelf';
      case 'display':
        return 'Display';
    }
  }

  private clearDynamicObjects(): void {
    for (const object of this.dynamicObjects) object.destroy();
    this.dynamicObjects = [];
  }

  private clearPreview(): void {
    for (const object of this.previewObjects) object.destroy();
    this.previewObjects = [];
  }
}
