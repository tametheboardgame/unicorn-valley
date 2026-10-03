import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { launchMiniGame } from '../minigames/MiniGameLauncher';
import {
  getJustGamesDefinitions,
  type MiniGameDefinition,
  type MiniGameGroup,
  type MiniGameVariantDefinition,
} from '../minigames/MiniGameCatalogue';
import { UI_DESIGN_TOKENS } from '../ui/UiDesignSystem';
import { createUiActionHitTarget, drawUiPanel, drawUiPanelShadow } from '../ui/UiPrimitives';
import { UI_COLOURS, UI_FONT } from '../ui/uiTheme';

const LIST_X = 335;
const DETAIL_X = 930;
const DETAIL_WIDTH = 520;
const PANEL_Y = 390;
const PANEL_HEIGHT = 548;
const CARD_LEFT = 88;
const CARD_TOP = 145;
const CARD_WIDTH = 494;
const CARD_HEIGHT = 60;
const CARD_GAP = 9;
const VARIANT_PAGE_SIZE = 6;
const VARIANT_COLUMNS = 2;
const VARIANT_BUTTON_WIDTH = 196;
const VARIANT_BUTTON_HEIGHT = 48;
const VARIANT_COLUMN_GAP = 14;
const VARIANT_ROW_GAP = 10;
const VARIANT_GRID_Y = 402;

interface CatalogueCard {
  definition: MiniGameDefinition;
  surface: Phaser.GameObjects.Graphics;
  hitTarget: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Text;
  title: Phaser.GameObjects.Text;
  group: Phaser.GameObjects.Text;
}

interface VariantButton {
  definition: MiniGameVariantDefinition;
  globalIndex: number;
  x: number;
  y: number;
  width: number;
  surface: Phaser.GameObjects.Graphics;
  hitTarget: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

const GROUP_LABELS: Readonly<Record<MiniGameGroup, string>> = {
  race: 'Race',
  sport: 'Sport',
  puzzle: 'Puzzle',
  making: 'Making',
  exploration: 'Explore',
  other: 'Game',
};

const GROUP_ICONS: Readonly<Record<MiniGameGroup, string>> = {
  race: '🏁',
  sport: '🥏',
  puzzle: '♟️',
  making: '🍰',
  exploration: '🔎',
  other: '✨',
};

export class JustGamesScene extends Phaser.Scene {
  private readonly definitions = getJustGamesDefinitions();
  private selectedGameIndex = 0;
  private hoveredGameIndex: number | null = null;
  private selectedVariantIndex = 0;
  private variantPageIndex = 0;
  private cards: CatalogueCard[] = [];
  private variantButtons: VariantButton[] = [];
  private detailLayer: Phaser.GameObjects.Container | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;
  private launching = false;

  public constructor() {
    super('JustGamesScene');
  }

  public create(): void {
    this.selectedGameIndex = 0;
    this.hoveredGameIndex = null;
    this.selectedVariantIndex = 0;
    this.variantPageIndex = 0;
    this.cards = [];
    this.variantButtons = [];
    this.detailLayer = null;
    this.launching = false;

    this.cameras.main.setBackgroundColor('#5a4578');
    this.createBackdrop();
    this.createCatalogue();
    this.renderSelection();

    this.input.keyboard?.on('keydown-UP', this.selectPreviousGame, this);
    this.input.keyboard?.on('keydown-DOWN', this.selectNextGame, this);
    this.input.keyboard?.on('keydown-LEFT', this.selectPreviousVariant, this);
    this.input.keyboard?.on('keydown-RIGHT', this.selectNextVariant, this);
    this.input.keyboard?.on('keydown-ENTER', this.playSelectedGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.playSelectedGame, this);
    this.input.keyboard?.on('keydown-ESC', this.returnToTitle, this);
    this.events.on(Phaser.Scenes.Events.RESUME, this.handleResume, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-UP', this.selectPreviousGame, this);
      this.input.keyboard?.off('keydown-DOWN', this.selectNextGame, this);
      this.input.keyboard?.off('keydown-LEFT', this.selectPreviousVariant, this);
      this.input.keyboard?.off('keydown-RIGHT', this.selectNextVariant, this);
      this.input.keyboard?.off('keydown-ENTER', this.playSelectedGame, this);
      this.input.keyboard?.off('keydown-SPACE', this.playSelectedGame, this);
      this.input.keyboard?.off('keydown-ESC', this.returnToTitle, this);
      this.events.off(Phaser.Scenes.Events.RESUME, this.handleResume, this);
      this.detailLayer?.destroy(true);
      this.detailLayer = null;
      this.cards = [];
      this.variantButtons = [];
      this.statusText = null;
    });
  }

  private createBackdrop(): void {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x5a4578, 1);

    const shell = this.add.graphics().setDepth(1);
    drawUiPanelShadow(shell, GAME_WIDTH / 2, PANEL_Y, 1200, PANEL_HEIGHT, 32, {
      alpha: 0.25,
      offsetX: 9,
      offsetY: 10,
    });
    drawUiPanel(shell, GAME_WIDTH / 2, PANEL_Y, 1200, PANEL_HEIGHT, {
      fill: UI_COLOURS.cream,
      stroke: UI_COLOURS.ribbonStrong,
      lineWidth: 5,
      radius: 32,
      alpha: 0.99,
    });

    this.add
      .text(GAME_WIDTH / 2, 55, '✨ Just Games ✨', {
        color: '#fff7d6',
        fontFamily: UI_FONT,
        fontSize: '36px',
        fontStyle: 'bold',
        stroke: '#52366b',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(5);

    this.add
      .text(
        GAME_WIDTH / 2,
        96,
        'Pick a game and play. Practice here does not change your adventure.',
        {
          color: '#f8eefa',
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
          align: 'center',
        },
      )
      .setOrigin(0.5)
      .setDepth(5);

    this.createButton(112, 54, 170, '← Home', 'just-games-back', () => this.returnToTitle());
  }

  private createCatalogue(): void {
    const heading = this.add
      .text(LIST_X, 129, 'Choose a game', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '21px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(5);
    heading.setName('just-games-list-heading');

    this.definitions.forEach((definition, index) => {
      const y = CARD_TOP + index * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2;
      const surface = this.add.graphics().setDepth(3);
      const hitTarget = createUiActionHitTarget(
        this,
        LIST_X,
        y,
        CARD_WIDTH,
        CARD_HEIGHT,
        `just-games-card:${definition.id}`,
      ).setDepth(6);
      const icon = this.add
        .text(CARD_LEFT + 34, y, GROUP_ICONS[definition.group], {
          fontFamily: UI_FONT,
          fontSize: '26px',
        })
        .setOrigin(0.5)
        .setDepth(5);
      const title = this.add
        .text(CARD_LEFT + 72, y - 10, definition.title, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '18px',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(5);
      const group = this.add
        .text(CARD_LEFT + 72, y + 13, GROUP_LABELS[definition.group], {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '12px',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5)
        .setDepth(5);

      const card: CatalogueCard = { definition, surface, hitTarget, icon, title, group };
      const select = () => this.selectGame(index);
      hitTarget.on('pointerover', () => {
        if (this.launching) return;
        this.hoveredGameIndex = index;
        this.renderCatalogueCards();
      });
      hitTarget.on('pointerout', () => {
        if (this.hoveredGameIndex !== index) return;
        this.hoveredGameIndex = null;
        this.renderCatalogueCards();
      });
      hitTarget.on('pointerdown', select);
      title.setInteractive({ useHandCursor: true }).on('pointerdown', select);
      icon.setInteractive({ useHandCursor: true }).on('pointerdown', select);
      this.cards.push(card);
    });
  }

  private selectGame(index: number): void {
    if (this.launching || index === this.selectedGameIndex) return;
    this.selectedGameIndex = index;
    this.selectedVariantIndex = 0;
    this.variantPageIndex = 0;
    this.renderSelection();
  }

  private renderSelection(): void {
    this.renderCatalogueCards();
    this.renderDetails();
  }

  private renderCatalogueCards(): void {
    for (const [index, card] of this.cards.entries()) {
      const selected = index === this.selectedGameIndex;
      const hovered = !selected && index === this.hoveredGameIndex;
      card.surface.clear();
      drawUiPanelShadow(
        card.surface,
        LIST_X,
        CARD_TOP + index * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2,
        CARD_WIDTH,
        CARD_HEIGHT,
        UI_DESIGN_TOKENS.radius.controlPx,
        { alpha: selected ? 0.2 : hovered ? 0.15 : 0.1, offsetX: 4, offsetY: 5 },
      );
      drawUiPanel(
        card.surface,
        LIST_X,
        CARD_TOP + index * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2,
        CARD_WIDTH,
        CARD_HEIGHT,
        {
          fill: selected ? UI_COLOURS.gold : hovered ? UI_COLOURS.lavender : UI_COLOURS.parchment,
          stroke: selected
            ? UI_COLOURS.focus
            : hovered
              ? UI_COLOURS.lavenderStrong
              : UI_COLOURS.ribbon,
          lineWidth: selected ? 4 : hovered ? 3 : 2,
          radius: UI_DESIGN_TOKENS.radius.controlPx,
          alpha: 0.98,
        },
      );
      card.title.setColor(selected ? '#4b315f' : UI_COLOURS.ink);
    }
  }

  private renderDetails(): void {
    this.detailLayer?.destroy(true);
    this.variantButtons = [];
    this.detailLayer = this.add.container(0, 0).setDepth(4);

    const definition = this.currentDefinition();
    if (!definition) {
      return;
    }

    const panel = this.add.graphics();
    drawUiPanelShadow(panel, DETAIL_X, 390, DETAIL_WIDTH, 520, 26, {
      alpha: 0.16,
      offsetX: 6,
      offsetY: 7,
    });
    drawUiPanel(panel, DETAIL_X, 390, DETAIL_WIDTH, 520, {
      fill: UI_COLOURS.parchment,
      stroke: UI_COLOURS.lavenderStrong,
      lineWidth: 3,
      radius: 26,
      alpha: 0.97,
    });
    this.detailLayer.add(panel);

    const icon = this.add
      .text(DETAIL_X, 185, GROUP_ICONS[definition.group], {
        fontFamily: UI_FONT,
        fontSize: '54px',
      })
      .setOrigin(0.5);
    const title = this.add
      .text(DETAIL_X, 244, definition.title, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '28px',
        fontStyle: 'bold',
        align: 'center',
      })
      .setName('just-games-selected-title')
      .setOrigin(0.5);
    const description = this.add
      .text(DETAIL_X, 302, definition.description, {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 420 },
      })
      .setOrigin(0.5);
    this.detailLayer.add([icon, title, description]);

    const variants = this.visibleVariants(definition);
    const pageCount = Math.max(1, Math.ceil(variants.length / VARIANT_PAGE_SIZE));
    this.variantPageIndex = Phaser.Math.Clamp(this.variantPageIndex, 0, pageCount - 1);
    const pageStart = this.variantPageIndex * VARIANT_PAGE_SIZE;
    const pageVariants = variants.slice(pageStart, pageStart + VARIANT_PAGE_SIZE);

    if (variants.length > 0) {
      const labelText =
        variants.length > 1
          ? `Choose how to play${pageCount > 1 ? ` • ${this.variantPageIndex + 1}/${pageCount}` : ''}`
          : 'Game mode';
      const label = this.add
        .text(DETAIL_X, 360, labelText, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.detailLayer.add(label);

      if (pageCount > 1) {
        this.createVariantPageButton(DETAIL_X - 205, 360, '‹', 'just-games-variants-prev', () =>
          this.changeVariantPage(-1),
        );
        this.createVariantPageButton(DETAIL_X + 205, 360, '›', 'just-games-variants-next', () =>
          this.changeVariantPage(1),
        );
      }

      pageVariants.forEach((variant, pageIndex) => {
        const row = Math.floor(pageIndex / VARIANT_COLUMNS);
        const column = pageIndex % VARIANT_COLUMNS;
        const xOffset = ((VARIANT_BUTTON_WIDTH + VARIANT_COLUMN_GAP) / 2) * (column === 0 ? -1 : 1);
        const y = VARIANT_GRID_Y + row * (VARIANT_BUTTON_HEIGHT + VARIANT_ROW_GAP);
        this.createVariantButton(
          DETAIL_X + xOffset,
          y,
          VARIANT_BUTTON_WIDTH,
          variant,
          pageStart + pageIndex,
        );
      });
    }

    const playY = variants.length > 0 ? 574 : 485;
    this.createButton(
      DETAIL_X,
      playY,
      300,
      this.launching ? 'Opening…' : '▶ Play',
      'just-games-play',
      () => void this.playSelectedGame(),
      this.detailLayer,
      !this.launching,
    );

    const hint = this.add
      .text(
        DETAIL_X,
        variants.length > 0 ? 614 : 540,
        variants.length > 1
          ? '↑ ↓ choose game   •   ← → choose mode   •   Enter play'
          : '↑ ↓ choose game   •   Enter play',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '13px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 420 },
        },
      )
      .setOrigin(0.5);
    this.detailLayer.add(hint);

    this.statusText = this.add
      .text(
        DETAIL_X,
        variants.length > 0 ? 640 : 590,
        this.launching ? `Opening ${definition.title}…` : 'Ready to play.',
        {
          color: '#6c5676',
          fontFamily: UI_FONT,
          fontSize: '14px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 420 },
        },
      )
      .setOrigin(0.5);
    this.detailLayer.add(this.statusText);
  }

  private createVariantButton(
    x: number,
    y: number,
    width: number,
    definition: MiniGameVariantDefinition,
    index: number,
  ): void {
    const surface = this.add.graphics();
    const hitTarget = createUiActionHitTarget(
      this,
      x,
      y,
      width,
      52,
      `just-games-variant:${definition.id}`,
    );
    const label = this.add
      .text(x, y, definition.title, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width - 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const button: VariantButton = {
      definition,
      globalIndex: index,
      x,
      y,
      width,
      surface,
      hitTarget,
      label,
    };
    const select = () => {
      if (this.launching) return;
      this.selectedVariantIndex = index;
      this.renderVariantButtons();
    };
    hitTarget.on('pointerdown', select);
    label.on('pointerdown', select);
    this.variantButtons.push(button);
    this.detailLayer?.add([surface, hitTarget, label]);
    this.renderVariantButton(button, index === this.selectedVariantIndex, x, y, width);
  }

  private renderVariantButtons(): void {
    this.variantButtons.forEach((button) => {
      this.renderVariantButton(
        button,
        button.globalIndex === this.selectedVariantIndex,
        button.x,
        button.y,
        button.width,
      );
    });
  }

  private createVariantPageButton(
    x: number,
    y: number,
    labelText: string,
    name: string,
    onPress: () => void,
  ): void {
    const surface = this.add.graphics();
    drawUiPanel(surface, x, y, 44, 36, {
      fill: UI_COLOURS.cream,
      stroke: UI_COLOURS.lavenderStrong,
      lineWidth: 2,
      radius: 14,
      alpha: 1,
    });
    const hitTarget = createUiActionHitTarget(this, x, y, 44, 36, name);
    const label = this.add
      .text(x, y - 1, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    hitTarget.on('pointerdown', onPress);
    label.on('pointerdown', onPress);
    this.detailLayer?.add([surface, hitTarget, label]);
  }

  private changeVariantPage(direction: number): void {
    if (this.launching) return;
    const variants = this.visibleVariants(this.currentDefinition());
    const pageCount = Math.ceil(variants.length / VARIANT_PAGE_SIZE);
    if (pageCount <= 1) return;
    this.variantPageIndex = (this.variantPageIndex + direction + pageCount) % pageCount;
    this.selectedVariantIndex = this.variantPageIndex * VARIANT_PAGE_SIZE;
    this.renderDetails();
  }

  private renderVariantButton(
    button: VariantButton,
    selected: boolean,
    x: number,
    y: number,
    width: number,
  ): void {
    button.surface.clear();
    drawUiPanel(button.surface, x, y, width, 52, {
      fill: selected ? UI_COLOURS.mint : UI_COLOURS.cream,
      stroke: selected ? UI_COLOURS.focus : UI_COLOURS.lavenderStrong,
      lineWidth: selected ? 4 : 2,
      radius: UI_DESIGN_TOKENS.radius.controlPx,
      alpha: 1,
    });
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    labelText: string,
    name: string,
    onPress: () => void,
    parent: Phaser.GameObjects.Container | null = null,
    enabled = true,
  ): void {
    const surface = this.add.graphics();
    drawUiPanelShadow(surface, x, y, width, 54, UI_DESIGN_TOKENS.radius.controlPx, {
      alpha: 0.16,
      offsetX: 4,
      offsetY: 5,
    });
    drawUiPanel(surface, x, y, width, 54, {
      fill: enabled ? UI_COLOURS.mint : UI_COLOURS.parchmentStrong,
      stroke: enabled ? UI_COLOURS.mintStrong : UI_COLOURS.ribbon,
      lineWidth: 3,
      radius: UI_DESIGN_TOKENS.radius.controlPx,
      alpha: enabled ? 1 : 0.6,
    });
    const hitTarget = createUiActionHitTarget(this, x, y, width, 54, name);
    const label = this.add
      .text(x, y, labelText, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    if (enabled) {
      label.setInteractive({ useHandCursor: true });
      hitTarget.on('pointerdown', onPress);
      label.on('pointerdown', onPress);
    } else {
      hitTarget.disableInteractive();
      label.setAlpha(0.65);
    }
    parent?.add([surface, hitTarget, label]);
  }

  private currentDefinition(): MiniGameDefinition | undefined {
    return this.definitions[this.selectedGameIndex];
  }

  private visibleVariants(definition: MiniGameDefinition | undefined): MiniGameVariantDefinition[] {
    return definition?.variants.filter((variant) => variant.justGamesVisible) ?? [];
  }

  private selectPreviousGame(): void {
    this.moveGameSelection(-1);
  }

  private selectNextGame(): void {
    this.moveGameSelection(1);
  }

  private moveGameSelection(direction: number): void {
    if (this.launching || this.definitions.length === 0) return;
    this.selectedGameIndex =
      (this.selectedGameIndex + direction + this.definitions.length) % this.definitions.length;
    this.hoveredGameIndex = null;
    this.selectedVariantIndex = 0;
    this.variantPageIndex = 0;
    this.renderSelection();
  }

  private selectPreviousVariant(): void {
    this.moveVariantSelection(-1);
  }

  private selectNextVariant(): void {
    this.moveVariantSelection(1);
  }

  private moveVariantSelection(direction: number): void {
    if (this.launching) return;
    const variants = this.visibleVariants(this.currentDefinition());
    if (variants.length < 2) return;
    this.selectedVariantIndex =
      (this.selectedVariantIndex + direction + variants.length) % variants.length;
    const nextPage = Math.floor(this.selectedVariantIndex / VARIANT_PAGE_SIZE);
    if (nextPage !== this.variantPageIndex) {
      this.variantPageIndex = nextPage;
      this.renderDetails();
      return;
    }
    this.renderVariantButtons();
  }

  private async playSelectedGame(): Promise<void> {
    if (this.launching) return;
    const definition = this.currentDefinition();
    if (!definition) return;

    const variant = this.visibleVariants(definition)[this.selectedVariantIndex];
    this.launching = true;
    this.renderDetails();

    try {
      const result = await launchMiniGame(this, {
        gameId: definition.id,
        source: 'just-games',
        ...(variant ? { variantId: variant.id } : {}),
        returnTarget: { sceneKey: 'JustGamesScene', mode: 'resume' },
      });
      if (result.status !== 'launched') {
        this.launching = false;
        this.renderDetails();
        this.statusText?.setText(
          result.status === 'already-active'
            ? 'That game is already open.'
            : 'The game could not open just now.',
        );
      }
    } catch {
      this.launching = false;
      this.renderDetails();
      this.statusText?.setText('The game could not open just now. Try again.');
    }
  }

  private handleResume(): void {
    this.launching = false;
    this.renderSelection();
    this.statusText?.setText('Welcome back. Pick another game or play again.');
  }

  private returnToTitle(): void {
    if (this.launching) return;
    this.scene.start('TitleScene');
  }
}
