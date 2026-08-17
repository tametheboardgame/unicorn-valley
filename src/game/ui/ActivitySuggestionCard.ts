import type Phaser from 'phaser';
import { getBrowserSaveService } from '../save/browserSaveService';
import { ActivitySuggestionSession } from '../suggestions/ActivitySuggestionModel';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

const CARD_X = 235;
const CARD_Y = 270;
const CARD_WIDTH = 420;
const CARD_HEIGHT = 190;
const REFRESH_INTERVAL_MS = 300;

const sharedSuggestionSession = new ActivitySuggestionSession();
let suggestionsHiddenForSession = false;

export class ActivitySuggestionCard {
  private readonly shadow: Phaser.GameObjects.Rectangle;
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly eyebrow: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  private readonly nextButton: Phaser.GameObjects.Rectangle;
  private readonly nextLabel: Phaser.GameObjects.Text;
  private readonly gotItButton: Phaser.GameObjects.Rectangle;
  private readonly gotItLabel: Phaser.GameObjects.Text;
  private readonly hideHintsLabel: Phaser.GameObjects.Text;
  private readonly closeButton: Phaser.GameObjects.Arc;
  private readonly closeLabel: Phaser.GameObjects.Text;
  private lastRefreshAt = Number.NEGATIVE_INFINITY;
  private currentSignature = '';

  public constructor(private readonly scene: Phaser.Scene) {
    this.shadow = createUiShadow(scene, CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT, 115, 0.18);
    this.panel = scene.add
      .rectangle(CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT, UI_COLOURS.cream, 0.99)
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(116);

    this.eyebrow = scene.add
      .text(CARD_X - CARD_WIDTH / 2 + 18, CARD_Y - CARD_HEIGHT / 2 + 13, 'Maybe try… ✨', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(117);

    this.title = scene.add
      .text(CARD_X - CARD_WIDTH / 2 + 18, CARD_Y - CARD_HEIGHT / 2 + 40, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(117);

    this.message = scene.add
      .text(CARD_X - CARD_WIDTH / 2 + 18, CARD_Y - CARD_HEIGHT / 2 + 70, '', {
        color: UI_COLOURS.softInk,
        fontFamily: UI_FONT,
        fontSize: '15px',
        lineSpacing: 3,
        wordWrap: { width: CARD_WIDTH - 48 },
      })
      .setScrollFactor(0)
      .setDepth(117);

    this.closeButton = scene.add
      .circle(CARD_X + CARD_WIDTH / 2 - 22, CARD_Y - CARD_HEIGHT / 2 + 22, 14, 0xf2e3f5, 1)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 0.75)
      .setScrollFactor(0)
      .setDepth(118)
      .setInteractive({ useHandCursor: true });
    this.closeLabel = scene.add
      .text(this.closeButton.x, this.closeButton.y - 1, '×', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(119);

    this.nextButton = scene.add
      .rectangle(CARD_X - 82, CARD_Y + CARD_HEIGHT / 2 - 36, 160, 40, UI_COLOURS.lavender, 1)
      .setStrokeStyle(2, UI_COLOURS.lavenderStrong, 0.95)
      .setScrollFactor(0)
      .setDepth(118)
      .setInteractive({ useHandCursor: true });
    this.nextLabel = scene.add
      .text(CARD_X - 82, CARD_Y + CARD_HEIGHT / 2 - 36, 'Another idea', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(119);

    this.gotItButton = scene.add
      .rectangle(CARD_X + 98, CARD_Y + CARD_HEIGHT / 2 - 36, 150, 40, UI_COLOURS.gold, 1)
      .setStrokeStyle(2, UI_COLOURS.goldStrong, 0.95)
      .setScrollFactor(0)
      .setDepth(118)
      .setInteractive({ useHandCursor: true });
    this.gotItLabel = scene.add
      .text(CARD_X + 98, CARD_Y + CARD_HEIGHT / 2 - 36, 'Got it! ✨', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(119);

    this.hideHintsLabel = scene.add
      .text(CARD_X, CARD_Y + CARD_HEIGHT / 2 - 10, 'Hide ideas for now', {
        color: UI_COLOURS.mutedInk,
        fontFamily: UI_FONT,
        fontSize: '12px',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(119)
      .setInteractive({ useHandCursor: true });

    applyButtonHover(this.nextButton, UI_COLOURS.lavender, UI_COLOURS.blush);
    applyButtonHover(this.gotItButton, UI_COLOURS.gold, 0xfff4bf);

    this.nextButton.on('pointerdown', () => {
      sharedSuggestionSession.rotate(this.getSave());
      this.refresh(true);
    });
    this.gotItButton.on('pointerdown', () => this.acknowledgeAndHide());
    this.closeButton.on('pointerdown', () => this.hideForSession());
    this.hideHintsLabel.on('pointerdown', () => this.hideForSession());

    this.refresh(true);
  }

  public refresh(force = false): void {
    if (suggestionsHiddenForSession) {
      this.setVisible(false);
      return;
    }

    if (!force && this.scene.time.now - this.lastRefreshAt < REFRESH_INTERVAL_MS) {
      return;
    }
    this.lastRefreshAt = this.scene.time.now;

    const suggestion = sharedSuggestionSession.getVisible(this.getSave())[0];
    if (!suggestion) {
      this.setVisible(false);
      this.currentSignature = '';
      return;
    }

    this.setVisible(true);
    const signature = `${suggestion.id}|${suggestion.title}|${suggestion.message}`;
    if (signature === this.currentSignature) {
      return;
    }

    this.currentSignature = signature;
    this.title.setText(suggestion.title);
    this.message.setText(suggestion.message);
  }

  public destroy(): void {
    this.shadow.destroy();
    this.panel.destroy();
    this.eyebrow.destroy();
    this.title.destroy();
    this.message.destroy();
    this.nextButton.destroy();
    this.nextLabel.destroy();
    this.gotItButton.destroy();
    this.gotItLabel.destroy();
    this.hideHintsLabel.destroy();
    this.closeButton.destroy();
    this.closeLabel.destroy();
  }

  private acknowledgeAndHide(): void {
    sharedSuggestionSession.dismissCurrent(this.getSave());
    this.hideForSession();
  }

  private hideForSession(): void {
    suggestionsHiddenForSession = true;
    this.setVisible(false);
  }

  private getSave() {
    const saveService = getBrowserSaveService();
    return saveService.load() ?? saveService.createNewGame();
  }

  private setVisible(visible: boolean): void {
    this.shadow.setVisible(visible);
    this.panel.setVisible(visible);
    this.eyebrow.setVisible(visible);
    this.title.setVisible(visible);
    this.message.setVisible(visible);
    this.nextButton.setVisible(visible);
    this.nextLabel.setVisible(visible);
    this.gotItButton.setVisible(visible);
    this.gotItLabel.setVisible(visible);
    this.hideHintsLabel.setVisible(visible);
    this.closeButton.setVisible(visible);
    this.closeLabel.setVisible(visible);
  }
}
