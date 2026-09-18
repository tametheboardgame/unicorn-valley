import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  COTTAGE_FURNITURE_VARIANT_IDS,
  getCottageFurniturePalette,
} from '../home/CottageFurnitureVariantCatalogue';
import {
  COTTAGE_FLOOR_STYLES,
  COTTAGE_WALLPAPERS,
  COTTAGE_WALL_COLOURS,
  COTTAGE_WALL_KEYS,
  getCottageFloorStyle,
  getCottageWallpaper,
  getCottageWallColour,
  type CottageFloorStyleDefinition,
  type CottageWallpaperDefinition,
  type CottageWallColourDefinition,
} from '../home/CottageStyleCatalogue';
import {
  COTTAGE_FURNITURE_LABELS,
  COTTAGE_WALL_LABELS,
  getCottageStyleDescription,
  getCottageStyleName,
} from '../home/CottageStyleCopy';
import { CottageStyleService } from '../home/CottageStyleService';
import { drawCottageStylePreview } from '../home/CottageStylePreviewRenderer';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { CottageFurnitureStyleKey, CottageWallKey, HomeStyleState } from '../save/saveSchema';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

type CottageStyleCategory = 'wall' | 'wallpaper' | 'floor' | 'furniture';

interface CottageStyleSceneData {
  returnToDecorateMode?: boolean;
  category?: CottageStyleCategory;
}

const LEFT_PANEL_X = 348;
const RIGHT_PANEL_X = 948;
const PANEL_Y = 382;
const PANEL_HEIGHT = 536;
const TAB_Y = 176;
const CHOICES_PER_PAGE = 8;
const CHOICE_COLUMNS = 4;

export class CottageStyleScene extends Phaser.Scene {
  private styles: CottageStyleService | null = null;
  private previewStyle: HomeStyleState | null = null;
  private category: CottageStyleCategory = 'wall';
  private selectedWall: CottageWallKey = 'back';
  private selectedFurniture: CottageFurnitureStyleKey = 'bed';
  private choicePage = 0;
  private returnToDecorateMode = true;
  private previewGraphics: Phaser.GameObjects.Graphics | null = null;
  private selectionName: Phaser.GameObjects.Text | null = null;
  private selectionDescription: Phaser.GameObjects.Text | null = null;
  private categorySummary: Phaser.GameObjects.Text | null = null;
  private choiceObjects: Phaser.GameObjects.GameObject[] = [];
  private readonly tabButtons = new Map<CottageStyleCategory, Phaser.GameObjects.Rectangle>();
  private enterKey: Phaser.Input.Keyboard.Key | null = null;
  private escapeKey: Phaser.Input.Keyboard.Key | null = null;

  public constructor() {
    super('CottageStyleScene');
  }

  public create(data: CottageStyleSceneData = {}): void {
    this.cameras.main.setBackgroundColor('#7558a0');
    this.returnToDecorateMode = data.returnToDecorateMode !== false;
    this.category = data.category ?? 'wall';
    this.selectedWall = 'back';
    this.selectedFurniture = 'bed';
    this.choicePage = 0;
    this.styles = new CottageStyleService(getBrowserSaveService());
    this.previewStyle = this.styles.getResolvedStyle();

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7558a0, 1);
    this.add.circle(170, 130, 170, 0xf2c9ed, 0.1);
    this.add.circle(1110, 590, 250, 0xffecb6, 0.07);

    this.add
      .text(GAME_WIDTH / 2, 28, 'Style Your Cottage', {
        color: '#fff8ff',
        fontFamily: UI_FONT,
        fontSize: '40px',
        fontStyle: 'bold',
      })
      .setName('cottage-style-heading')
      .setOrigin(0.5, 0)
      .setDepth(20);

    this.add
      .text(
        GAME_WIDTH / 2,
        82,
        'Choose a surface or furnishing, tap a swatch, and make the cottage your own.',
        {
          color: '#efe6fa',
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(20);

    createUiShadow(this, LEFT_PANEL_X, PANEL_Y, 548, PANEL_HEIGHT, 1, 0.22);
    this.add
      .rectangle(LEFT_PANEL_X, PANEL_Y, 548, PANEL_HEIGHT, UI_COLOURS.cream, 0.99)
      .setName('cottage-style-preview-panel')
      .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);

    this.add
      .text(LEFT_PANEL_X, 142, 'LIVE PREVIEW', {
        color: '#8c6a9d',
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.previewGraphics = this.add.graphics().setName('cottage-style-preview').setDepth(5);

    this.categorySummary = this.add
      .text(LEFT_PANEL_X, 555, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 3,
        wordWrap: { width: 470 },
      })
      .setName('cottage-style-summary')
      .setOrigin(0.5)
      .setDepth(6);

    createUiShadow(this, RIGHT_PANEL_X, PANEL_Y, 590, PANEL_HEIGHT, 1, 0.22);
    this.add
      .rectangle(RIGHT_PANEL_X, PANEL_Y, 590, PANEL_HEIGHT, UI_COLOURS.cream, 0.99)
      .setName('cottage-style-options-panel')
      .setStrokeStyle(6, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);

    this.createCategoryTab(735, 'wall', 'Walls');
    this.createCategoryTab(878, 'wallpaper', 'Wallpaper');
    this.createCategoryTab(1021, 'floor', 'Floor');
    this.createCategoryTab(1164, 'furniture', 'Furniture');

    this.selectionName = this.add
      .text(RIGHT_PANEL_X, 536, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setName('cottage-style-selection-name')
      .setOrigin(0.5)
      .setDepth(7);

    this.selectionDescription = this.add
      .text(RIGHT_PANEL_X, 566, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        align: 'center',
        wordWrap: { width: 500 },
      })
      .setName('cottage-style-selection-description')
      .setOrigin(0.5, 0)
      .setDepth(7);

    this.createActionButton(
      800,
      652,
      220,
      '← Back',
      'cottage-style-back-button',
      () => this.backToRoom(),
      false,
    );
    this.createActionButton(
      1080,
      652,
      270,
      'Apply Style ✨',
      'cottage-style-apply-button',
      () => this.applyStyle(),
      true,
    );

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    this.renderAll();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearChoiceObjects();
      this.styles = null;
      this.previewStyle = null;
      this.previewGraphics = null;
      this.selectionName = null;
      this.selectionDescription = null;
      this.categorySummary = null;
      this.tabButtons.clear();
      this.enterKey = null;
      this.escapeKey = null;
    });
  }

  public update(): void {
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) this.applyStyle();
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) this.backToRoom();
  }

  private createCategoryTab(x: number, category: CottageStyleCategory, label: string): void {
    const button = this.add
      .rectangle(x, TAB_Y, 128, 54, UI_COLOURS.lavender, 1)
      .setName(`cottage-style-tab-${category}`)
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(7);
    const text = this.add
      .text(x, TAB_Y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName(`cottage-style-tab-${category}-label`)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(8);

    const activate = (): void => this.setCategory(category);
    button.on('pointerdown', activate);
    text.on('pointerdown', activate);
    this.tabButtons.set(category, button);
  }

  private setCategory(category: CottageStyleCategory): void {
    if (this.category === category) return;
    this.category = category;
    this.choicePage = 0;
    this.renderAll();
  }

  private setSelectedWall(wallKey: CottageWallKey): void {
    if (this.selectedWall === wallKey) return;
    this.selectedWall = wallKey;
    this.choicePage = 0;
    this.renderAll();
  }

  private setSelectedFurniture(furnitureKey: CottageFurnitureStyleKey): void {
    if (this.selectedFurniture === furnitureKey) return;
    this.selectedFurniture = furnitureKey;
    this.choicePage = 0;
    this.renderAll();
  }

  private renderAll(): void {
    this.renderPreview();
    this.renderTabs();
    this.renderChoices();
  }

  private renderPreview(): void {
    if (!this.previewStyle || !this.previewGraphics) return;

    const selectedWall =
      this.category === 'wall' || this.category === 'wallpaper' ? this.selectedWall : null;
    drawCottageStylePreview(
      this.previewGraphics,
      this.previewStyle,
      { x: LEFT_PANEL_X, y: 345, width: 478, height: 348 },
      selectedWall,
      this.category === 'furniture' ? this.selectedFurniture : null,
    );

    const activeWall = this.previewStyle.walls[this.selectedWall];
    this.previewGraphics.setName(
      `cottage-style-preview:${this.selectedWall}:${activeWall.wallColourId}|${activeWall.wallpaperId}|${this.previewStyle.floorStyleId}|${this.previewStyle.furnitureVariants[this.selectedFurniture]}`,
    );

    const floor = getCottageFloorStyle(this.previewStyle.floorStyleId);
    const lines = COTTAGE_WALL_KEYS.map((wallKey) => {
      const wallStyle = this.previewStyle!.walls[wallKey];
      return `${COTTAGE_WALL_LABELS[wallKey]}: ${getCottageStyleName(wallStyle.wallColourId)} / ${getCottageStyleName(wallStyle.wallpaperId)}`;
    });
    this.categorySummary?.setText(
      `${lines.join('\n')}\nFloor: ${getCottageStyleName(floor.id)} · Furniture: ${getCottageStyleName(this.previewStyle.furnitureVariants[this.selectedFurniture])}`,
    );

    const selectedId =
      this.category === 'wall'
        ? activeWall.wallColourId
        : this.category === 'wallpaper'
          ? activeWall.wallpaperId
          : this.category === 'floor'
            ? floor.id
            : this.previewStyle.furnitureVariants[this.selectedFurniture];
    this.selectionName?.setText(
      this.category === 'wall' || this.category === 'wallpaper'
        ? `${COTTAGE_WALL_LABELS[this.selectedWall]} wall · ${getCottageStyleName(selectedId)}`
        : this.category === 'furniture'
          ? `${COTTAGE_FURNITURE_LABELS[this.selectedFurniture]} · ${getCottageStyleName(selectedId)}`
          : getCottageStyleName(selectedId),
    );
    this.selectionDescription?.setText(getCottageStyleDescription(selectedId));
  }

  private renderTabs(): void {
    for (const [category, button] of this.tabButtons) {
      const selected = category === this.category;
      button
        .setFillStyle(selected ? UI_COLOURS.gold : UI_COLOURS.lavender, 1)
        .setStrokeStyle(4, selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong, 1);
    }
  }

  private renderChoices(): void {
    this.clearChoiceObjects();
    if (!this.previewStyle) return;

    if (this.category === 'wall' || this.category === 'wallpaper') this.renderWallSelector();
    if (this.category === 'furniture') this.renderFurnitureSelector();

    if (this.category === 'wall') {
      this.renderWallChoices();
    } else if (this.category === 'wallpaper') {
      this.renderWallpaperChoices();
    } else if (this.category === 'furniture') {
      this.renderFurnitureChoices();
    } else {
      this.renderFloorChoices();
    }
  }

  private renderWallSelector(): void {
    const y = 238;
    const startX = 760;
    const gap = 126;

    COTTAGE_WALL_KEYS.forEach((wallKey, index) => {
      const x = startX + index * gap;
      const selected = wallKey === this.selectedWall;
      const button = this.trackChoice(
        this.add
          .rectangle(x, y, 112, 42, selected ? UI_COLOURS.gold : UI_COLOURS.parchment, 1)
          .setName(`cottage-style-wall-selector-${wallKey}`)
          .setStrokeStyle(
            selected ? 4 : 3,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      const text = this.trackChoice(
        this.add
          .text(x, y, COTTAGE_WALL_LABELS[wallKey], {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '13px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .setDepth(8),
      );
      const select = (): void => this.setSelectedWall(wallKey);
      button.on('pointerdown', select);
      text.on('pointerdown', select);
    });
  }

  private renderFurnitureSelector(): void {
    const keys: readonly CottageFurnitureStyleKey[] = ['bed', 'sofa', 'teaSet', 'fireplace'];
    const y = 238;
    const startX = 760;
    const gap = 126;

    keys.forEach((furnitureKey, index) => {
      const x = startX + index * gap;
      const selected = furnitureKey === this.selectedFurniture;
      const button = this.trackChoice(
        this.add
          .rectangle(x, y, 112, 42, selected ? UI_COLOURS.gold : UI_COLOURS.parchment, 1)
          .setName(`cottage-style-furniture-selector-${furnitureKey}`)
          .setStrokeStyle(
            selected ? 4 : 3,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      const label = this.trackChoice(
        this.add
          .text(x, y, COTTAGE_FURNITURE_LABELS[furnitureKey], {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '13px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true })
          .setDepth(8),
      );
      const select = (): void => this.setSelectedFurniture(furnitureKey);
      button.on('pointerdown', select);
      label.on('pointerdown', select);
    });
  }

  private currentPage<T>(choices: readonly T[]): readonly T[] {
    const pageCount = Math.max(1, Math.ceil(choices.length / CHOICES_PER_PAGE));
    this.choicePage = Math.min(this.choicePage, pageCount - 1);
    const start = this.choicePage * CHOICES_PER_PAGE;
    return choices.slice(start, start + CHOICES_PER_PAGE);
  }

  private renderPageControls(totalChoices: number): void {
    const pageCount = Math.ceil(totalChoices / CHOICES_PER_PAGE);
    if (pageCount <= 1) return;

    const y = 492;
    this.createTransientButton(800, y, 92, '‹', 'cottage-style-page-previous', () => {
      this.choicePage = (this.choicePage - 1 + pageCount) % pageCount;
      this.renderChoices();
    });
    this.trackChoice(
      this.add
        .text(RIGHT_PANEL_X, y, `${this.choicePage + 1} / ${pageCount}`, {
          color: UI_COLOURS.mutedInk,
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(8),
    );
    this.createTransientButton(1096, y, 92, '›', 'cottage-style-page-next', () => {
      this.choicePage = (this.choicePage + 1) % pageCount;
      this.renderChoices();
    });
  }

  private choicePosition(index: number, hasWallSelector: boolean): { x: number; y: number } {
    const column = index % CHOICE_COLUMNS;
    const row = Math.floor(index / CHOICE_COLUMNS);
    return {
      x: 748 + column * 134,
      y: (hasWallSelector ? 326 : 292) + row * 126,
    };
  }

  private renderWallChoices(): void {
    if (!this.previewStyle) return;
    const activeWall = this.previewStyle.walls[this.selectedWall];
    const choices = this.currentPage(COTTAGE_WALL_COLOURS);

    choices.forEach((choice, index) => {
      const { x, y } = this.choicePosition(index, true);
      const selected = activeWall.wallColourId === choice.id;
      const outline = this.trackChoice(
        this.add
          .circle(x, y, 34, selected ? UI_COLOURS.gold : UI_COLOURS.lavender, 0.94)
          .setName(`cottage-style-wall-swatch-${choice.id}`)
          .setStrokeStyle(
            selected ? 6 : 4,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      this.trackChoice(this.add.circle(x, y, 24, choice.fill, 1).setDepth(8));
      this.trackChoice(
        this.add
          .text(x, y + 48, getCottageStyleName(choice.id), {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '12px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 110 },
          })
          .setOrigin(0.5, 0)
          .setDepth(8),
      );
      if (selected) this.renderCheck(x + 26, y - 26);
      outline.on('pointerdown', () => this.selectWallColour(choice));
    });
    this.renderPageControls(COTTAGE_WALL_COLOURS.length);
  }

  private renderWallpaperChoices(): void {
    if (!this.previewStyle) return;
    const activeWall = this.previewStyle.walls[this.selectedWall];
    const choices = this.currentPage(COTTAGE_WALLPAPERS);

    choices.forEach((choice, index) => {
      const { x, y } = this.choicePosition(index, true);
      const selected = activeWall.wallpaperId === choice.id;
      const card = this.trackChoice(
        this.add
          .rectangle(x, y, 120, 94, selected ? UI_COLOURS.gold : UI_COLOURS.parchment, 1)
          .setName(`cottage-style-wallpaper-swatch-${choice.id}`)
          .setStrokeStyle(
            selected ? 5 : 3,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      this.drawWallpaperCard(choice, x, y - 11);
      this.trackChoice(
        this.add
          .text(x, y + 34, getCottageStyleName(choice.id), {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '12px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 108 },
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
      if (selected) this.renderCheck(x + 45, y - 34);
      card.on('pointerdown', () => this.selectWallpaper(choice));
    });
    this.renderPageControls(COTTAGE_WALLPAPERS.length);
  }

  private renderFloorChoices(): void {
    if (!this.previewStyle) return;
    const choices = this.currentPage(COTTAGE_FLOOR_STYLES);

    choices.forEach((choice, index) => {
      const { x, y } = this.choicePosition(index, false);
      const selected = this.previewStyle?.floorStyleId === choice.id;
      const card = this.trackChoice(
        this.add
          .rectangle(x, y, 120, 94, selected ? UI_COLOURS.gold : UI_COLOURS.parchment, 1)
          .setName(`cottage-style-floor-swatch-${choice.id}`)
          .setStrokeStyle(
            selected ? 5 : 3,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      this.drawFloorCard(choice, x, y - 11);
      this.trackChoice(
        this.add
          .text(x, y + 34, getCottageStyleName(choice.id), {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '12px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 108 },
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
      if (selected) this.renderCheck(x + 45, y - 34);
      card.on('pointerdown', () => this.selectFloor(choice));
    });
    this.renderPageControls(COTTAGE_FLOOR_STYLES.length);
  }

  private renderFurnitureChoices(): void {
    if (!this.previewStyle) return;
    const ids = this.currentPage(COTTAGE_FURNITURE_VARIANT_IDS[this.selectedFurniture]);

    ids.forEach((variantId, index) => {
      const { x, y } = this.choicePosition(index, true);
      const selected = this.previewStyle?.furnitureVariants[this.selectedFurniture] === variantId;
      const palette = getCottageFurniturePalette(this.selectedFurniture, variantId);
      const card = this.trackChoice(
        this.add
          .rectangle(x, y, 120, 94, selected ? UI_COLOURS.gold : UI_COLOURS.parchment, 1)
          .setName(`cottage-style-furniture-swatch-${variantId}`)
          .setStrokeStyle(
            selected ? 5 : 3,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      const swatch = this.trackChoice(this.add.graphics().setDepth(8));
      swatch.fillStyle(palette[0], 1);
      swatch.fillRoundedRect(x - 46, y - 25, 92, 50, 9);
      swatch.fillStyle(palette[2], 1);
      swatch.fillRoundedRect(x - 37, y - 16, 34, 32, 7);
      swatch.fillStyle(palette[3], 1);
      swatch.fillRoundedRect(x + 4, y - 16, 33, 32, 7);
      this.trackChoice(
        this.add
          .text(x, y + 34, getCottageStyleName(variantId), {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '12px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 108 },
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
      if (selected) this.renderCheck(x + 45, y - 34);
      card.on('pointerdown', () => this.selectFurnitureVariant(variantId));
    });
    this.renderPageControls(COTTAGE_FURNITURE_VARIANT_IDS[this.selectedFurniture].length);
  }

  private drawWallpaperCard(choice: CottageWallpaperDefinition, x: number, y: number): void {
    const graphics = this.trackChoice(this.add.graphics().setDepth(8));
    graphics.fillStyle(0xf2e6d8, 1);
    graphics.fillRoundedRect(x - 48, y - 24, 96, 48, 8);
    if (choice.pattern === 'none') return;

    graphics.lineStyle(1.5, choice.ink, 0.58);
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const px = x - 35 + col * 24 + (row % 2) * 7;
        const py = y - 10 + row * 20;
        if (choice.pattern === 'star-scatter') {
          graphics.lineBetween(px - 4, py, px + 4, py);
          graphics.lineBetween(px, py - 4, px, py + 4);
        } else if (choice.pattern === 'moon-sprigs') {
          graphics.strokeCircle(px, py, 4);
          graphics.lineStyle(1.5, choice.accent, 0.5);
          graphics.lineBetween(px + 5, py + 3, px + 11, py + 7);
          graphics.lineStyle(1.5, choice.ink, 0.58);
        } else {
          graphics.lineBetween(px - 5, py + 5, px, py);
          graphics.lineBetween(px, py, px + 5, py - 5);
        }
      }
    }
  }

  private drawFloorCard(choice: CottageFloorStyleDefinition, x: number, y: number): void {
    const graphics = this.trackChoice(this.add.graphics().setDepth(8));
    graphics.fillStyle(choice.fill, 1);
    graphics.fillRoundedRect(x - 48, y - 24, 96, 48, 8);
    graphics.lineStyle(1.5, choice.seam, 0.72);
    graphics.lineBetween(x - 48, y - 8, x + 48, y - 8);
    graphics.lineBetween(x - 48, y + 8, x + 48, y + 8);
    graphics.lineBetween(x - 16, y - 24, x - 16, y - 8);
    graphics.lineBetween(x + 22, y - 8, x + 22, y + 8);
    graphics.lineBetween(x - 28, y + 8, x - 28, y + 24);
  }

  private renderCheck(x: number, y: number): void {
    this.trackChoice(
      this.add
        .text(x, y, '✓', {
          color: '#6a421f',
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(10),
    );
  }

  private selectWallColour(choice: CottageWallColourDefinition): void {
    if (!this.previewStyle) return;
    this.previewStyle = {
      ...this.previewStyle,
      walls: {
        ...this.previewStyle.walls,
        [this.selectedWall]: {
          ...this.previewStyle.walls[this.selectedWall],
          wallColourId: choice.id,
        },
      },
    };
    this.renderAll();
  }

  private selectWallpaper(choice: CottageWallpaperDefinition): void {
    if (!this.previewStyle) return;
    this.previewStyle = {
      ...this.previewStyle,
      walls: {
        ...this.previewStyle.walls,
        [this.selectedWall]: {
          ...this.previewStyle.walls[this.selectedWall],
          wallpaperId: choice.id,
        },
      },
    };
    this.renderAll();
  }

  private selectFloor(choice: CottageFloorStyleDefinition): void {
    if (!this.previewStyle) return;
    this.previewStyle = { ...this.previewStyle, floorStyleId: choice.id };
    this.renderAll();
  }

  private selectFurnitureVariant(variantId: string): void {
    if (!this.previewStyle) return;
    this.previewStyle = {
      ...this.previewStyle,
      furnitureVariants: {
        ...this.previewStyle.furnitureVariants,
        [this.selectedFurniture]: variantId,
      },
    };
    this.renderAll();
  }

  private applyStyle(): void {
    if (!this.styles || !this.previewStyle) return;
    this.styles.applyStyle(this.previewStyle);
    this.backToRoom();
  }

  private backToRoom(): void {
    this.scene.start('CottageInteriorScene', { decorateMode: this.returnToDecorateMode });
  }

  private createActionButton(
    x: number,
    y: number,
    width: number,
    label: string,
    name: string,
    action: () => void,
    primary: boolean,
  ): void {
    const fill = primary ? UI_COLOURS.gold : UI_COLOURS.cream;
    const hover = primary ? 0xfff4bf : UI_COLOURS.lavender;
    const button = this.add
      .rectangle(x, y, width, 58, fill, 1)
      .setName(name)
      .setStrokeStyle(5, primary ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);
    const text = this.add
      .text(x, y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: primary ? '20px' : '18px',
        fontStyle: 'bold',
      })
      .setName(`${name}-label`)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(21);
    applyButtonHover(button, fill, hover);
    button.on('pointerdown', action);
    text.on('pointerdown', action);
  }

  private createTransientButton(
    x: number,
    y: number,
    width: number,
    label: string,
    name: string,
    action: () => void,
  ): void {
    const button = this.trackChoice(
      this.add
        .rectangle(x, y, width, 38, UI_COLOURS.parchment, 1)
        .setName(name)
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 1)
        .setInteractive({ useHandCursor: true })
        .setDepth(7),
    );
    const text = this.trackChoice(
      this.add
        .text(x, y, label, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '19px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })
        .setDepth(8),
    );
    button.on('pointerdown', action);
    text.on('pointerdown', action);
  }

  private trackChoice<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.choiceObjects.push(object);
    return object;
  }

  private clearChoiceObjects(): void {
    for (const object of this.choiceObjects) object.destroy();
    this.choiceObjects = [];
  }
}
