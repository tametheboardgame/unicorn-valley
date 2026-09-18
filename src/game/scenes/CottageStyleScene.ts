import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  COTTAGE_FLOOR_STYLES,
  COTTAGE_WALLPAPERS,
  COTTAGE_WALL_COLOURS,
  getCottageFloorStyle,
  getCottageWallpaper,
  getCottageWallColour,
  type CottageFloorStyleDefinition,
  type CottageWallpaperDefinition,
  type CottageWallColourDefinition,
} from '../home/CottageStyleCatalogue';
import { getCottageStyleDescription } from '../home/CottageStyleCopy';
import { CottageStyleService } from '../home/CottageStyleService';
import { drawCottageStylePreview } from '../home/CottageStylePreviewRenderer';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { HomeStyleState } from '../save/saveSchema';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

type CottageStyleCategory = 'wall' | 'wallpaper' | 'floor';

interface CottageStyleSceneData {
  returnToDecorateMode?: boolean;
  category?: CottageStyleCategory;
}

const LEFT_PANEL_X = 348;
const RIGHT_PANEL_X = 948;
const PANEL_Y = 382;
const PANEL_HEIGHT = 536;
const TAB_Y = 176;

export class CottageStyleScene extends Phaser.Scene {
  private styles: CottageStyleService | null = null;
  private previewStyle: HomeStyleState | null = null;
  private category: CottageStyleCategory = 'wall';
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
    this.styles = new CottageStyleService(getBrowserSaveService());
    this.previewStyle = { ...this.styles.getResolvedStyle() };

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
        'Pick a section, tap a swatch, then apply when the room feels right.',
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
      .text(LEFT_PANEL_X, 568, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        align: 'center',
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

    this.createCategoryTab(760, 'wall', 'Walls');
    this.createCategoryTab(948, 'wallpaper', 'Wallpaper');
    this.createCategoryTab(1136, 'floor', 'Floor');

    this.selectionName = this.add
      .text(RIGHT_PANEL_X, 540, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setName('cottage-style-selection-name')
      .setOrigin(0.5)
      .setDepth(7);

    this.selectionDescription = this.add
      .text(RIGHT_PANEL_X, 575, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
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
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.applyStyle();
    }
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.backToRoom();
    }
  }

  private createCategoryTab(x: number, category: CottageStyleCategory, label: string): void {
    const button = this.add
      .rectangle(x, TAB_Y, 166, 54, UI_COLOURS.lavender, 1)
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
    if (this.category === category) {
      return;
    }
    this.category = category;
    this.renderAll();
  }

  private renderAll(): void {
    this.renderPreview();
    this.renderTabs();
    this.renderChoices();
  }

  private renderPreview(): void {
    if (!this.previewStyle || !this.previewGraphics) {
      return;
    }

    drawCottageStylePreview(this.previewGraphics, this.previewStyle, {
      x: LEFT_PANEL_X,
      y: 345,
      width: 478,
      height: 348,
    });
    this.previewGraphics.setName(
      `cottage-style-preview:${this.previewStyle.wallColourId}|${this.previewStyle.wallpaperId}|${this.previewStyle.floorStyleId}`,
    );

    const wall = getCottageWallColour(this.previewStyle.wallColourId);
    const wallpaper = getCottageWallpaper(this.previewStyle.wallpaperId);
    const floor = getCottageFloorStyle(this.previewStyle.floorStyleId);

    this.categorySummary?.setText(
      `Walls: ${wall.name}   •   Wallpaper: ${wallpaper.name}\nFloor: ${floor.name}`,
    );

    const selected =
      this.category === 'wall' ? wall : this.category === 'wallpaper' ? wallpaper : floor;
    this.selectionName?.setText(selected.name);
    this.selectionDescription?.setText(getCottageStyleDescription(selected.id));
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
    if (!this.previewStyle) {
      return;
    }

    if (this.category === 'wall') {
      this.renderWallChoices();
    } else if (this.category === 'wallpaper') {
      this.renderWallpaperChoices();
    } else {
      this.renderFloorChoices();
    }
  }

  private renderWallChoices(): void {
    if (!this.previewStyle) {
      return;
    }

    const startX = 738;
    const gap = 105;
    const y = 310;
    COTTAGE_WALL_COLOURS.forEach((choice, index) => {
      const x = startX + index * gap;
      const selected = this.previewStyle?.wallColourId === choice.id;
      const outline = this.trackChoice(
        this.add
          .circle(x, y, 35, selected ? UI_COLOURS.gold : UI_COLOURS.lavender, 0.94)
          .setName(`cottage-style-wall-swatch-${choice.id}`)
          .setStrokeStyle(
            selected ? 6 : 4,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      this.trackChoice(this.add.circle(x, y, 25, choice.fill, 1).setDepth(8));
      this.trackChoice(
        this.add
          .text(x, y + 54, choice.name, {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '13px',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 92 },
          })
          .setOrigin(0.5, 0)
          .setDepth(8),
      );
      if (selected) {
        this.trackChoice(
          this.add
            .text(x + 27, y - 28, '✓', {
              color: '#6a421f',
              fontFamily: UI_FONT,
              fontSize: '18px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setDepth(9),
        );
      }
      outline.on('pointerdown', () => this.selectWall(choice));
    });
  }

  private renderWallpaperChoices(): void {
    if (!this.previewStyle) {
      return;
    }

    const positions = [
      { x: 800, y: 292 },
      { x: 1090, y: 292 },
      { x: 800, y: 422 },
      { x: 1090, y: 422 },
    ];
    COTTAGE_WALLPAPERS.forEach((choice, index) => {
      const position = positions[index]!;
      const selected = this.previewStyle?.wallpaperId === choice.id;
      const card = this.trackChoice(
        this.add
          .rectangle(
            position.x,
            position.y,
            238,
            104,
            selected ? UI_COLOURS.gold : UI_COLOURS.parchment,
            1,
          )
          .setName(`cottage-style-wallpaper-swatch-${choice.id}`)
          .setStrokeStyle(
            selected ? 6 : 4,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      this.drawWallpaperCard(choice, position.x, position.y - 11);
      this.trackChoice(
        this.add
          .text(position.x, position.y + 34, choice.name, {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '14px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
      if (selected) {
        this.trackChoice(
          this.add
            .text(position.x + 96, position.y - 37, '✓', {
              color: '#6a421f',
              fontFamily: UI_FONT,
              fontSize: '18px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setDepth(10),
        );
      }
      card.on('pointerdown', () => this.selectWallpaper(choice));
    });
  }

  private renderFloorChoices(): void {
    if (!this.previewStyle) {
      return;
    }

    const positions = [
      { x: 800, y: 292 },
      { x: 1090, y: 292 },
      { x: 800, y: 422 },
      { x: 1090, y: 422 },
    ];
    COTTAGE_FLOOR_STYLES.forEach((choice, index) => {
      const position = positions[index]!;
      const selected = this.previewStyle?.floorStyleId === choice.id;
      const card = this.trackChoice(
        this.add
          .rectangle(
            position.x,
            position.y,
            238,
            104,
            selected ? UI_COLOURS.gold : UI_COLOURS.parchment,
            1,
          )
          .setName(`cottage-style-floor-swatch-${choice.id}`)
          .setStrokeStyle(
            selected ? 6 : 4,
            selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
            1,
          )
          .setInteractive({ useHandCursor: true })
          .setDepth(7),
      );
      this.drawFloorCard(choice, position.x, position.y - 11);
      this.trackChoice(
        this.add
          .text(position.x, position.y + 34, choice.name, {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '14px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(9),
      );
      if (selected) {
        this.trackChoice(
          this.add
            .text(position.x + 96, position.y - 37, '✓', {
              color: '#6a421f',
              fontFamily: UI_FONT,
              fontSize: '18px',
              fontStyle: 'bold',
            })
            .setOrigin(0.5)
            .setDepth(10),
        );
      }
      card.on('pointerdown', () => this.selectFloor(choice));
    });
  }

  private drawWallpaperCard(choice: CottageWallpaperDefinition, x: number, y: number): void {
    const graphics = this.trackChoice(this.add.graphics().setDepth(8));
    graphics.fillStyle(0xf2e6d8, 1);
    graphics.fillRoundedRect(x - 94, y - 27, 188, 54, 10);

    if (choice.pattern === 'none') {
      return;
    }

    graphics.lineStyle(2, choice.ink, 0.55);
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const px = x - 72 + col * 36 + (row % 2) * 10;
        const py = y - 12 + row * 25;
        if (choice.pattern === 'star-scatter') {
          graphics.lineBetween(px - 5, py, px + 5, py);
          graphics.lineBetween(px, py - 5, px, py + 5);
        } else if (choice.pattern === 'moon-sprigs') {
          graphics.strokeCircle(px, py, 5);
          graphics.lineStyle(2, choice.accent, 0.5);
          graphics.lineBetween(px + 7, py + 4, px + 16, py + 10);
          graphics.lineStyle(2, choice.ink, 0.55);
        } else {
          graphics.lineBetween(px - 7, py + 7, px, py);
          graphics.lineBetween(px, py, px + 7, py - 7);
        }
      }
    }
  }

  private drawFloorCard(choice: CottageFloorStyleDefinition, x: number, y: number): void {
    const graphics = this.trackChoice(this.add.graphics().setDepth(8));
    graphics.fillStyle(choice.fill, 1);
    graphics.fillRoundedRect(x - 94, y - 27, 188, 54, 10);
    graphics.lineStyle(2, choice.seam, 0.7);
    graphics.lineBetween(x - 94, y - 9, x + 94, y - 9);
    graphics.lineBetween(x - 94, y + 9, x + 94, y + 9);
    graphics.lineBetween(x - 32, y - 27, x - 32, y - 9);
    graphics.lineBetween(x + 48, y - 9, x + 48, y + 9);
    graphics.lineBetween(x - 58, y + 9, x - 58, y + 27);
  }

  private selectWall(choice: CottageWallColourDefinition): void {
    if (!this.previewStyle) {
      return;
    }
    this.previewStyle = { ...this.previewStyle, wallColourId: choice.id };
    this.renderAll();
  }

  private selectWallpaper(choice: CottageWallpaperDefinition): void {
    if (!this.previewStyle) {
      return;
    }
    this.previewStyle = { ...this.previewStyle, wallpaperId: choice.id };
    this.renderAll();
  }

  private selectFloor(choice: CottageFloorStyleDefinition): void {
    if (!this.previewStyle) {
      return;
    }
    this.previewStyle = { ...this.previewStyle, floorStyleId: choice.id };
    this.renderAll();
  }

  private applyStyle(): void {
    if (!this.styles || !this.previewStyle) {
      return;
    }
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

  private trackChoice<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.choiceObjects.push(object);
    return object;
  }

  private clearChoiceObjects(): void {
    for (const object of this.choiceObjects) {
      object.destroy();
    }
    this.choiceObjects = [];
  }
}
