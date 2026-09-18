import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  COTTAGE_FLOOR_STYLES,
  COTTAGE_WALLPAPERS,
  COTTAGE_WALL_COLOURS,
  getCottageFloorStyle,
  getCottageWallpaper,
  getCottageWallColour,
} from '../home/CottageStyleCatalogue';
import { CottageStyleService } from '../home/CottageStyleService';
import { drawCottageStylePreview } from '../home/CottageSurfaceRenderer';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { HomeStyleState } from '../save/saveSchema';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';

type CottageStyleCategory = 'wall' | 'wallpaper' | 'floor';

interface CottageStyleSceneData {
  returnToDecorateMode?: boolean;
  category?: CottageStyleCategory;
}

export class CottageStyleScene extends Phaser.Scene {
  private styles: CottageStyleService | null = null;
  private persistedStyle: HomeStyleState | null = null;
  private previewStyle: HomeStyleState | null = null;
  private category: CottageStyleCategory = 'wall';
  private returnToDecorateMode = true;
  private previewGraphics: Phaser.GameObjects.Graphics | null = null;
  private selectionName: Phaser.GameObjects.Text | null = null;
  private selectionDescription: Phaser.GameObjects.Text | null = null;
  private categorySummary: Phaser.GameObjects.Text | null = null;
  private wallCategoryLabel: Phaser.GameObjects.Text | null = null;
  private wallpaperCategoryLabel: Phaser.GameObjects.Text | null = null;
  private floorCategoryLabel: Phaser.GameObjects.Text | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private enterKey: Phaser.Input.Keyboard.Key | null = null;
  private escapeKey: Phaser.Input.Keyboard.Key | null = null;

  public constructor() {
    super('CottageStyleScene');
  }

  public create(data: CottageStyleSceneData = {}): void {
    this.cameras.main.setBackgroundColor('#49376f');
    this.returnToDecorateMode = data.returnToDecorateMode !== false;
    this.category = data.category ?? 'wall';
    this.styles = new CottageStyleService(getBrowserSaveService());
    this.persistedStyle = this.styles.getResolvedStyle();
    this.previewStyle = { ...this.persistedStyle };

    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 680, 1, 0.32);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 680, UI_COLOURS.cream, 1)
      .setName('cottage-style-main-panel')
      .setStrokeStyle(7, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);

    this.add
      .text(GAME_WIDTH / 2, 54, 'Room Style', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '35px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.add
      .text(
        GAME_WIDTH / 2,
        94,
        'Preview your walls, wallpaper and floor together. Nothing changes until you apply the style.',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '16px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 850 },
        },
      )
      .setOrigin(0.5)
      .setDepth(6);

    this.add
      .rectangle(GAME_WIDTH / 2, 300, 780, 330, 0xffffff, 0.96)
      .setName('cottage-style-preview-panel')
      .setStrokeStyle(4, UI_COLOURS.lavender, 1)
      .setDepth(3);

    this.previewGraphics = this.add.graphics().setName('cottage-style-preview').setDepth(5);

    this.wallCategoryLabel = this.createButton(
      360,
      500,
      220,
      'Wall colour',
      'cottage-style-wall-button',
      () => this.setCategory('wall'),
    );
    this.wallpaperCategoryLabel = this.createButton(
      640,
      500,
      220,
      'Wallpaper',
      'cottage-style-wallpaper-button',
      () => this.setCategory('wallpaper'),
    );
    this.floorCategoryLabel = this.createButton(
      920,
      500,
      220,
      'Floor',
      'cottage-style-floor-button',
      () => this.setCategory('floor'),
    );

    this.selectionName = this.add
      .text(GAME_WIDTH / 2, 550, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '23px',
        fontStyle: 'bold',
      })
      .setName('cottage-style-selection-name')
      .setOrigin(0.5)
      .setDepth(6);

    this.selectionDescription = this.add
      .text(GAME_WIDTH / 2, 582, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        align: 'center',
        wordWrap: { width: 720 },
      })
      .setName('cottage-style-selection-description')
      .setOrigin(0.5, 0)
      .setDepth(6);

    this.categorySummary = this.add
      .text(GAME_WIDTH / 2, 626, '', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setName('cottage-style-summary')
      .setOrigin(0.5)
      .setDepth(6);

    this.createButton(300, 668, 210, '◀ Previous', 'cottage-style-previous-button', () =>
      this.selectOffset(-1),
    );
    this.createButton(980, 668, 210, 'Next ▶', 'cottage-style-next-button', () =>
      this.selectOffset(1),
    );
    this.createButton(
      GAME_WIDTH / 2,
      668,
      260,
      'Apply style',
      'cottage-style-apply-button',
      () => this.applyStyle(),
      UI_COLOURS.gold,
    );
    this.createButton(
      1120,
      76,
      140,
      'Back',
      'cottage-style-back-button',
      () => this.backToRoom(),
      UI_COLOURS.blush,
    );

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    this.renderPreview();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.styles = null;
      this.persistedStyle = null;
      this.previewStyle = null;
      this.previewGraphics = null;
      this.selectionName = null;
      this.selectionDescription = null;
      this.categorySummary = null;
      this.wallCategoryLabel = null;
      this.wallpaperCategoryLabel = null;
      this.floorCategoryLabel = null;
      this.cursors = null;
      this.enterKey = null;
      this.escapeKey = null;
    });
  }

  public update(): void {
    if (this.cursors?.left && Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectOffset(-1);
    }
    if (this.cursors?.right && Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectOffset(1);
    }
    if (this.cursors?.up && Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      this.selectCategoryOffset(-1);
    }
    if (this.cursors?.down && Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
      this.selectCategoryOffset(1);
    }
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.applyStyle();
    }
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.backToRoom();
    }
  }

  private setCategory(category: CottageStyleCategory): void {
    this.category = category;
    this.renderPreview();
  }

  private selectCategoryOffset(offset: number): void {
    const categories: readonly CottageStyleCategory[] = ['wall', 'wallpaper', 'floor'];
    const current = categories.indexOf(this.category);
    this.category = categories[(current + offset + categories.length) % categories.length]!;
    this.renderPreview();
  }

  private selectOffset(offset: number): void {
    if (!this.previewStyle) {
      return;
    }

    if (this.category === 'wall') {
      const current = COTTAGE_WALL_COLOURS.findIndex(
        ({ id }) => id === this.previewStyle?.wallColourId,
      );
      const next =
        COTTAGE_WALL_COLOURS[
          (Math.max(0, current) + offset + COTTAGE_WALL_COLOURS.length) %
            COTTAGE_WALL_COLOURS.length
        ]!;
      this.previewStyle = { ...this.previewStyle, wallColourId: next.id };
    } else if (this.category === 'wallpaper') {
      const current = COTTAGE_WALLPAPERS.findIndex(
        ({ id }) => id === this.previewStyle?.wallpaperId,
      );
      const next =
        COTTAGE_WALLPAPERS[
          (Math.max(0, current) + offset + COTTAGE_WALLPAPERS.length) % COTTAGE_WALLPAPERS.length
        ]!;
      this.previewStyle = { ...this.previewStyle, wallpaperId: next.id };
    } else {
      const current = COTTAGE_FLOOR_STYLES.findIndex(
        ({ id }) => id === this.previewStyle?.floorStyleId,
      );
      const next =
        COTTAGE_FLOOR_STYLES[
          (Math.max(0, current) + offset + COTTAGE_FLOOR_STYLES.length) %
            COTTAGE_FLOOR_STYLES.length
        ]!;
      this.previewStyle = { ...this.previewStyle, floorStyleId: next.id };
    }

    this.renderPreview();
  }

  private renderPreview(): void {
    if (!this.previewStyle || !this.previewGraphics) {
      return;
    }

    drawCottageStylePreview(this.previewGraphics, this.previewStyle, {
      x: GAME_WIDTH / 2,
      y: 300,
      width: 730,
      height: 280,
    });
    this.previewGraphics.setName(
      `cottage-style-preview:${this.previewStyle.wallColourId}|${this.previewStyle.wallpaperId}|${this.previewStyle.floorStyleId}`,
    );

    const wall = getCottageWallColour(this.previewStyle.wallColourId);
    const wallpaper = getCottageWallpaper(this.previewStyle.wallpaperId);
    const floor = getCottageFloorStyle(this.previewStyle.floorStyleId);
    const selected =
      this.category === 'wall' ? wall : this.category === 'wallpaper' ? wallpaper : floor;

    this.selectionName?.setText(selected.name);
    this.selectionDescription?.setText(selected.description);
    this.categorySummary?.setText(
      `WALL  ${wall.name}    •    WALLPAPER  ${wallpaper.name}    •    FLOOR  ${floor.name}`,
    );

    this.wallCategoryLabel?.setColor(this.category === 'wall' ? '#5c2d82' : UI_COLOURS.ink);
    this.wallpaperCategoryLabel?.setColor(
      this.category === 'wallpaper' ? '#5c2d82' : UI_COLOURS.ink,
    );
    this.floorCategoryLabel?.setColor(this.category === 'floor' ? '#5c2d82' : UI_COLOURS.ink);
  }

  private applyStyle(): void {
    if (!this.styles || !this.previewStyle) {
      return;
    }

    this.styles.applyStyle(this.previewStyle);
    this.persistedStyle = { ...this.previewStyle };
    this.backToRoom();
  }

  private backToRoom(): void {
    this.scene.start('CottageInteriorScene', { decorateMode: this.returnToDecorateMode });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    label: string,
    name: string,
    action: () => void,
    fill: number = UI_COLOURS.lavender,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .rectangle(x, y, width, 52, fill, 1)
      .setName(name)
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 1)
      .setInteractive({ useHandCursor: true })
      .setDepth(7);
    const text = this.add
      .text(x, y, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setName(`${name}-label`)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(8);

    applyButtonHover(button, fill, UI_COLOURS.blush);
    button.on('pointerdown', action);
    text.on('pointerdown', action);
    return text;
  }
}
