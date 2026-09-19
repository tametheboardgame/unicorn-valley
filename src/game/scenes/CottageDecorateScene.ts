import Phaser from 'phaser';
import type { ItemDefinition } from '../../content/contentTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import {
  getCottageDecorationProfile,
  getCottageDecorationThemeLabel,
} from '../home/CottageDecorationCatalogue';
import { HomeDecorationService } from '../home/HomeDecorationService';
import { renderCottageDecoration } from '../home/CottageDecorationPresentation';
import { getBrowserSaveService } from '../save/browserSaveService';
import { createConfirmationButton } from '../ui/ConfirmationModalStyle';
import { UI_DESIGN_TOKENS } from '../ui/UiDesignSystem';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';
import type { CottageDecorationSlot } from '../world/CottageInteriorMap';
import type { MapPoint } from '../world/MapTraversal';

interface CottageDecorateSceneData {
  slotId?: string;
  returnToDecorateMode?: boolean;
  returnPosition?: MapPoint;
}

export class CottageDecorateScene extends Phaser.Scene {
  private decorating: HomeDecorationService | null = null;
  private slot: CottageDecorationSlot | null = null;
  private options: readonly ItemDefinition[] = [];
  private selectedIndex = 0;
  private optionCardObjects: Phaser.GameObjects.GameObject[] = [];
  private returnToDecorateMode = false;
  private returnPosition: MapPoint | null = null;
  private previewObjects: Phaser.GameObjects.GameObject[] = [];
  private nameText: Phaser.GameObjects.Text | null = null;
  private descriptionText: Phaser.GameObjects.Text | null = null;
  private themeText: Phaser.GameObjects.Text | null = null;
  private countText: Phaser.GameObjects.Text | null = null;
  private placeLabel: Phaser.GameObjects.Text | null = null;
  private escapeKey: Phaser.Input.Keyboard.Key | null = null;

  public constructor() {
    super('CottageDecorateScene');
  }

  public create(data: CottageDecorateSceneData): void {
    this.cameras.main.setBackgroundColor('#49376f');
    this.decorating = new HomeDecorationService(getBrowserSaveService());
    this.returnToDecorateMode = data.returnToDecorateMode === true;

    try {
      this.slot = this.decorating.getSlot(data.slotId ?? '');
    } catch {
      this.scene.start('CottageInteriorScene', { decorateMode: this.returnToDecorateMode });
      return;
    }

    this.returnPosition =
      data.returnPosition ?? this.slot.interactionPosition ?? this.slot.position;

    const compatible = this.decorating.listCompatibleDecorations(this.slot.id);
    this.options = compatible.map(({ definition }) => definition);
    const current = this.decorating.getPlacement(this.slot.id);
    const currentIndex = current
      ? this.options.findIndex((option) => option?.id === current.id)
      : -1;
    this.selectedIndex = currentIndex >= 0 ? currentIndex : 0;

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x7558a0, 1);
    this.add.circle(150, 120, 180, 0xf2c9ed, 0.1);
    this.add.circle(1130, 610, 250, 0xffecb6, 0.07);
    this.createRoundedPanel(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      1120,
      680,
      UI_COLOURS.cream,
      UI_COLOURS.lavenderStrong,
      2,
      UI_DESIGN_TOKENS.radius.panelPx,
    );

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
      .text(GAME_WIDTH / 2, 126, 'Tap a choice, then use the clear action you mean.', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
      })
      .setOrigin(0.5)
      .setDepth(3);

    this.createRoundedPanel(
      GAME_WIDTH / 2,
      375,
      610,
      235,
      0xffffff,
      UI_COLOURS.lavender,
      3,
      24,
      0.92,
    );
    this.createRoundedPanel(
      GAME_WIDTH / 2,
      535,
      210,
      32,
      0xf3e7f8,
      UI_COLOURS.lavender,
      5,
      UI_DESIGN_TOKENS.radius.pillPx,
      1,
      false,
    );

    this.nameText = this.add
      .text(GAME_WIDTH / 2, 500, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.themeText = this.add
      .text(GAME_WIDTH / 2, 535, '', {
        color: '#76518a',
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',

      })
      .setOrigin(0.5)
      .setDepth(6);
    this.descriptionText = this.add
      .text(GAME_WIDTH / 2, 570, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        align: 'center',
        wordWrap: { width: 670 },
      })
      .setOrigin(0.5, 0)
      .setDepth(6);
    this.countText = this.add
      .text(GAME_WIDTH / 2, 620, '', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(6);

    this.createButton(260, 664, 210, 'Remove', UI_COLOURS.blush, () => this.removePlacement());
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
      this.escapeKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    }

    this.renderChoiceCards();
    this.renderSelection();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.clearPreview();
      this.decorating = null;
      this.slot = null;
      this.options = [];
      this.clearChoiceCards();
      this.returnToDecorateMode = false;
      this.returnPosition = null;
      this.nameText = null;
      this.descriptionText = null;
      this.themeText = null;
      this.countText = null;
      this.placeLabel = null;
      this.escapeKey = null;
    });
  }

  public update(): void {
    if (this.escapeKey && Phaser.Input.Keyboard.JustDown(this.escapeKey)) {
      this.backToRoom();
    }
  }

  private renderSelection(): void {
    if (!this.slot) {
      return;
    }

    this.clearPreview();
    const selected = this.options[this.selectedIndex] ?? null;

    if (!selected) {
      this.nameText?.setText('No decorations for this spot yet');
      this.themeText?.setText(this.categoryLabel(this.slot).toUpperCase());
      this.descriptionText?.setText(
        `Explore, race or visit Twinkle & Thread to find a ${this.categoryLabel(this.slot).toLowerCase()} decoration.`,
      );
      this.countText?.setText('Remove is still available if this spot is filled.');
      this.placeLabel?.setText('Nothing to place');
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
      profile
        ? `${getCottageDecorationThemeLabel(profile.theme).toUpperCase()} STYLE`
        : 'COTTAGE STYLE',
    );
    this.descriptionText?.setText(selected.description ?? 'A lovely cottage decoration.');
    const ownership = this.decorating
      ?.listCompatibleDecorations(this.slot.id)
      .find(({ definition }) => definition.id === selected.id);
    const current = this.decorating?.getPlacement(this.slot.id);
    const available = Math.max(0, (ownership?.quantity ?? 0) - (ownership?.placedQuantity ?? 0));
    const moving = current?.id !== selected.id && available === 0;
    this.countText?.setText(
      `${ownership?.quantity ?? 0} owned · ${ownership?.placedQuantity ?? 0} placed${moving ? ' · Move the placed copy here' : ''}`,
    );
    this.placeLabel?.setText(
      current ? (moving ? 'Move here' : 'Replace') : moving ? 'Move here' : 'Place',
    );
    this.renderPlacementPreview(selected, profile?.previewColour ?? UI_COLOURS.lavenderStrong);
  }

  private renderPlacementPreview(item: ItemDefinition, _colour: number): void {
    const art = renderCottageDecoration(this, item.id, GAME_WIDTH / 2, 375, 1.15);
    for (const object of art) object.setDepth(6);
    this.previewObjects.push(...art);
  }

  private placeSelection(): void {
    if (!this.decorating || !this.slot) {
      return;
    }

    const selected = this.options[this.selectedIndex];
    if (!selected) return;
    this.decorating.placeDecoration(this.slot.id, selected.id);
    this.backToRoom();
  }

  private removePlacement(): void {
    if (!this.decorating || !this.slot) return;
    this.decorating.removeDecoration(this.slot.id);
    this.backToRoom();
  }

  private renderChoiceCards(): void {
    this.clearChoiceCards();
    const pageSize = 5;
    const page = Math.floor(this.selectedIndex / pageSize);
    const pageOptions = this.options.slice(page * pageSize, page * pageSize + pageSize);
    const count = Math.max(1, pageOptions.length);
    const width = Math.min(172, 860 / count);
    const startX = GAME_WIDTH / 2 - ((count - 1) * width) / 2;
    pageOptions.forEach((item, pageIndex) => {
      const index = page * pageSize + pageIndex;
      const cardX = startX + pageIndex * width;
      const selected = index === this.selectedIndex;
      const cardSurface = this.createRoundedPanel(
        cardX,
        205,
        width - 12,
        112,
        selected ? 0xfff7dc : 0xffffff,
        selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavender,
        7,
        UI_DESIGN_TOKENS.radius.controlPx,
        1,
        false,
      );
      const card = this.add
        .rectangle(cardX, 205, width - 12, 112, 0xffffff, 0.001)
        .setInteractive({ useHandCursor: true })
        .setName(`cottage-decoration-choice:${item.id}`)
        .setDepth(10);
      const art = renderCottageDecoration(this, item.id, cardX, 190, 0.48);
      const label = this.add
        .text(cardX, 246, item.name, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '12px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: width - 24 },
        })
        .setOrigin(0.5)
        .setDepth(9);
      for (const object of art)
        object
          .setDepth(8)
          .setInteractive({ useHandCursor: true })
          .on('pointerdown', () => this.selectChoice(index));
      card.on('pointerdown', () => this.selectChoice(index));
      label
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.selectChoice(index));
      this.optionCardObjects.push(cardSurface, card, ...art, label);
    });
    if (page > 0)
      this.createChoicePageButton(108, '◀', () => this.selectChoice((page - 1) * pageSize));
    if ((page + 1) * pageSize < this.options.length)
      this.createChoicePageButton(1172, '▶', () => this.selectChoice((page + 1) * pageSize));
  }

  private createChoicePageButton(x: number, label: string, action: () => void): void {
    const button = this.add
      .circle(x, 205, 28, UI_COLOURS.lavender)
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong)
      .setInteractive({ useHandCursor: true })
      .setDepth(8);
    const text = this.add
      .text(x, 205, label, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setDepth(9);
    button.on('pointerdown', action);
    text.on('pointerdown', action);
    this.optionCardObjects.push(button, text);
  }

  private selectChoice(index: number): void {
    this.selectedIndex = index;
    this.renderChoiceCards();
    this.renderSelection();
  }

  private clearChoiceCards(): void {
    for (const object of this.optionCardObjects) object.destroy();
    this.optionCardObjects = [];
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
    action: () => void,
  ): Phaser.GameObjects.Text {
    const primary = fill === UI_COLOURS.gold;
    const presentation = createConfirmationButton(this, {
      name: `cottage-decorate-action-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      x,
      y,
      width,
      height: 52,
      depth: 7,
      label,
      variant: primary ? 'primary' : 'secondary',
      onActivate: action,
    });
    return presentation.label;
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
