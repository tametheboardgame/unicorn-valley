import Phaser from 'phaser';
import type { ItemDefinition } from '../../content/contentTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  getCottageDecorationProfile,
  getCottageDecorationThemeLabel,
} from '../home/CottageDecorationCatalogue';
import { HomeDecorationService } from '../home/HomeDecorationService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from '../ui/uiTheme';
import type { CottageDecorationSlot } from '../world/CottageInteriorMap';

interface CottageDecorateSceneData {
  slotId?: string;
}

export class CottageDecorateScene extends Phaser.Scene {
  private decorating: HomeDecorationService | null = null;
  private slot: CottageDecorationSlot | null = null;
  private options: readonly (ItemDefinition | null)[] = [];
  private selectedIndex = 0;
  private previewObjects: Phaser.GameObjects.GameObject[] = [];
  private nameText: Phaser.GameObjects.Text | null = null;
  private descriptionText: Phaser.GameObjects.Text | null = null;
  private themeText: Phaser.GameObjects.Text | null = null;
  private countText: Phaser.GameObjects.Text | null = null;
  private placeLabel: Phaser.GameObjects.Text | null = null;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
  private enterKey: Phaser.Input.Keyboard.Key | null = null;
  private spaceKey: Phaser.Input.Keyboard.Key | null = null;
  private escapeKey: Phaser.Input.Keyboard.Key | null = null;

  public constructor() {
    super('CottageDecorateScene');
  }

  public create(data: CottageDecorateSceneData): void {
    this.cameras.main.setBackgroundColor('#49376f');
    this.decorating = new HomeDecorationService(getBrowserSaveService());

    try {
      this.slot = this.decorating.getSlot(data.slotId ?? '');
    } catch {
      this.scene.start('CottageInteriorScene');
      return;
    }

    const compatible = this.decorating.listCompatibleDecorations(this.slot.id);
    this.options = [null, ...compatible.map(({ definition }) => definition)];
    const current = this.decorating.getPlacement(this.slot.id);
    const currentIndex = current
      ? this.options.findIndex((option) => option?.id === current.id)
      : 0;
    this.selectedIndex = currentIndex >= 0 ? currentIndex : 0;

    createUiShadow(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 680, 1, 0.3);
    this.add
      .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 1120, 680, UI_COLOURS.cream, 1)
      .setStrokeStyle(7, UI_COLOURS.lavenderStrong, 1)
      .setDepth(2);

    this.add
      .text(GAME_WIDTH / 2, 54, `Decorate · ${this.slot.label}`, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '35px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(
        GAME_WIDTH / 2,
        96,
        `${this.categoryLabel(this.slot)} spot · choose what you want to see here`,
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
        },
      )
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .text(GAME_WIDTH / 2, 126, 'Preview first. Nothing changes until you choose Place.', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.add
      .rectangle(GAME_WIDTH / 2, 310, 610, 300, 0xffffff, 0.92)
      .setStrokeStyle(4, UI_COLOURS.lavender, 1)
      .setDepth(3);

    this.nameText = this.add
      .text(GAME_WIDTH / 2, 474, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.themeText = this.add
      .text(GAME_WIDTH / 2, 510, '', {
        color: '#76518a',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
        backgroundColor: '#f3e7f8',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.descriptionText = this.add
      .text(GAME_WIDTH / 2, 548, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        align: 'center',
        wordWrap: { width: 670 },
      })
      .setOrigin(0.5, 0)
      .setDepth(6);
    this.countText = this.add
      .text(GAME_WIDTH / 2, 618, '', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.createButton(260, 664, 210, '◀ Previous', UI_COLOURS.lavender, () => this.selectPrevious());
    this.createButton(1020, 664, 210, 'Next ▶', UI_COLOURS.lavender, () => this.selectNext());
    this.placeLabel = this.createButton(
      GAME_WIDTH / 2,
      664,
      270,
      'Place this',
      UI_COLOURS.gold,
      () => this.placeSelection(),
    );
    this.createButton(1120, 80, 130, 'Back', UI_COLOURS.blush, () => this.backToRoom());

    const keyboard = this.input.keyboard;
    if (keyboard) {
      this.cursors = keyboard.createCursorKeys();
      this.enterKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
      this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    this.renderSelection();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearPreview();
      this.decorating = null;
      this.slot = null;
      this.options = [];
      this.nameText = null;
      this.descriptionText = null;
      this.themeText = null;
      this.countText = null;
      this.placeLabel = null;
      this.cursors = null;
      this.enterKey = null;
      this.spaceKey = null;
      this.escapeKey = null;
    });
  }

  public update(): void {
    if (this.cursors?.left && Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      this.selectPrevious();
    }
    if (this.cursors?.right && Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      this.selectNext();
    }
    if (
      (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) ||
      (this.spaceKey && Phaser.Input.Keyboard.JustDown(this.spaceKey))
    ) {
      this.placeSelection();
    }
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.backToRoom();
    }
  }

  private selectPrevious(): void {
    if (this.options.length === 0) {
      return;
    }
    this.selectedIndex = (this.selectedIndex - 1 + this.options.length) % this.options.length;
    this.renderSelection();
  }

  private selectNext(): void {
    if (this.options.length === 0) {
      return;
    }
    this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
    this.renderSelection();
  }

  private renderSelection(): void {
    if (!this.slot) {
      return;
    }

    this.clearPreview();
    const selected = this.options[this.selectedIndex] ?? null;
    this.countText?.setText(`${this.selectedIndex + 1} of ${this.options.length}`);

    if (!selected) {
      this.nameText?.setText('Leave this spot empty');
      this.themeText?.setText('EMPTY SPACE');
      this.descriptionText?.setText(
        this.options.length === 1
          ? `You do not own a ${this.categoryLabel(this.slot).toLowerCase()} decoration yet. Explore, race or visit Twinkle & Thread to find one.`
          : 'Keep this part of the cottage clear. You can change it again whenever you like.',
      );
      this.placeLabel?.setText('Clear this spot');
      this.previewObjects.push(
        this.add
          .circle(GAME_WIDTH / 2, 300, 75, UI_COLOURS.lavender, 0.18)
          .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.45)
          .setDepth(4),
        this.add
          .text(GAME_WIDTH / 2, 300, '✦', {
            color: '#b98ac9',
            fontFamily: UI_FONT,
            fontSize: '58px',
          })
          .setOrigin(0.5)
          .setAlpha(0.55)
          .setDepth(5),
      );
      return;
    }

    const profile = getCottageDecorationProfile(selected.id);
    this.nameText?.setText(`${selected.icon ?? '✦'} ${selected.name}`);
    this.themeText?.setText(
      profile ? `${getCottageDecorationThemeLabel(profile.theme).toUpperCase()} STYLE` : 'COTTAGE STYLE',
    );
    this.descriptionText?.setText(selected.description ?? 'A lovely cottage decoration.');
    this.placeLabel?.setText('Place this');
    this.renderPlacementPreview(selected, profile?.previewColour ?? UI_COLOURS.lavenderStrong);
  }

  private renderPlacementPreview(item: ItemDefinition, colour: number): void {
    if (!this.slot) {
      return;
    }

    const centreX = GAME_WIDTH / 2;
    const centreY = 300;
    const icon = item.icon ?? '✦';

    if (this.slot.category === 'wall') {
      this.previewObjects.push(
        this.add
          .rectangle(centreX, centreY, 250, 180, 0xf7e8d6, 1)
          .setStrokeStyle(8, 0xb98b72, 0.9)
          .setDepth(4),
        this.add
          .rectangle(centreX, centreY, 132, 112, colour, 0.28)
          .setStrokeStyle(5, colour, 0.8)
          .setDepth(5),
      );
    } else if (this.slot.category === 'floor') {
      this.previewObjects.push(
        this.add.ellipse(centreX, centreY + 35, 300, 135, colour, 0.35).setDepth(4),
        this.add.ellipse(centreX, centreY + 35, 260, 105, 0xffffff, 0.24).setDepth(5),
      );
    } else if (this.slot.category === 'table') {
      this.previewObjects.push(
        this.add.ellipse(centreX, centreY + 58, 270, 95, 0xc4936f, 1).setDepth(4),
        this.add.rectangle(centreX, centreY + 100, 28, 95, 0x9c7055, 1).setDepth(4),
        this.add.circle(centreX, centreY - 4, 68, colour, 0.24).setDepth(5),
      );
    } else if (this.slot.category === 'shelf') {
      this.previewObjects.push(
        this.add.rectangle(centreX, centreY + 65, 300, 30, 0x9c7055, 1).setDepth(4),
        this.add.rectangle(centreX, centreY - 5, 190, 135, colour, 0.18).setDepth(4),
      );
    } else {
      this.previewObjects.push(
        this.add
          .rectangle(centreX, centreY + 45, 330, 125, 0xb17c5f, 1)
          .setStrokeStyle(5, 0x805848, 0.95)
          .setDepth(4),
        this.add.circle(centreX, centreY - 20, 76, colour, 0.28).setDepth(5),
        this.add
          .text(centreX, centreY + 92, 'Adventure Display', {
            color: UI_COLOURS.ink,
            fontFamily: UI_FONT,
            fontSize: '14px',
            fontStyle: 'bold',
          })
          .setOrigin(0.5)
          .setDepth(5),
      );
    }

    this.previewObjects.push(
      this.add
        .text(centreX, centreY - 15, icon, {
          fontFamily: UI_FONT,
          fontSize: '76px',
        })
        .setOrigin(0.5)
        .setDepth(6),
    );
  }

  private placeSelection(): void {
    if (!this.decorating || !this.slot) {
      return;
    }

    const selected = this.options[this.selectedIndex] ?? null;
    if (selected) {
      this.decorating.placeDecoration(this.slot.id, selected.id);
    } else {
      this.decorating.removeDecoration(this.slot.id);
    }
    this.scene.start('CottageInteriorScene');
  }

  private backToRoom(): void {
    this.scene.start('CottageInteriorScene');
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    label: string,
    fill: number,
    action: () => void,
  ): Phaser.GameObjects.Text {
    const button = this.add
      .rectangle(x, y, width, 52, fill, 1)
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
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(8);

    applyButtonHover(button, fill, UI_COLOURS.blush);
    button.on('pointerdown', action);
    text.on('pointerdown', action);
    return text;
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
        return 'Ribbon & treasure display';
    }
  }

  private clearPreview(): void {
    for (const object of this.previewObjects) {
      object.destroy();
    }
    this.previewObjects = [];
  }
}
