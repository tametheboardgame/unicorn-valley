import Phaser from 'phaser';
import { getBrowserSaveService } from '../save/browserSaveService';
import { ActivitySuggestionSession } from '../suggestions/ActivitySuggestionModel';

const CARD_X = 220;
const CARD_Y = 222;
const CARD_WIDTH = 390;
const CARD_HEIGHT = 170;
const REFRESH_INTERVAL_MS = 300;

export class ActivitySuggestionCard {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly eyebrow: Phaser.GameObjects.Text;
  private readonly title: Phaser.GameObjects.Text;
  private readonly message: Phaser.GameObjects.Text;
  private readonly nextButton: Phaser.GameObjects.Rectangle;
  private readonly nextLabel: Phaser.GameObjects.Text;
  private readonly dismissButton: Phaser.GameObjects.Rectangle;
  private readonly dismissLabel: Phaser.GameObjects.Text;
  private readonly suggestionSession = new ActivitySuggestionSession();
  private lastRefreshAt = Number.NEGATIVE_INFINITY;
  private currentSignature = '';

  public constructor(private readonly scene: Phaser.Scene) {
    this.panel = scene.add
      .rectangle(CARD_X, CARD_Y, CARD_WIDTH, CARD_HEIGHT, 0xfffbf0, 0.96)
      .setStrokeStyle(4, 0xc69ad9, 0.95)
      .setScrollFactor(0)
      .setDepth(116);

    this.eyebrow = scene.add
      .text(CARD_X - CARD_WIDTH / 2 + 18, CARD_Y - CARD_HEIGHT / 2 + 13, 'Maybe try… ✨', {
        color: '#80618f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(117);

    this.title = scene.add
      .text(CARD_X - CARD_WIDTH / 2 + 18, CARD_Y - CARD_HEIGHT / 2 + 39, '', {
        color: '#503a61',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
      })
      .setScrollFactor(0)
      .setDepth(117);

    this.message = scene.add
      .text(CARD_X - CARD_WIDTH / 2 + 18, CARD_Y - CARD_HEIGHT / 2 + 68, '', {
        color: '#5d4c68',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '15px',
        lineSpacing: 3,
        wordWrap: { width: CARD_WIDTH - 36 },
      })
      .setScrollFactor(0)
      .setDepth(117);

    this.nextButton = scene.add
      .rectangle(CARD_X - 75, CARD_Y + CARD_HEIGHT / 2 - 24, 150, 38, 0xead9f2, 1)
      .setStrokeStyle(2, 0xb78acb, 0.9)
      .setScrollFactor(0)
      .setDepth(118)
      .setInteractive({ useHandCursor: true });
    this.nextLabel = scene.add
      .text(CARD_X - 75, CARD_Y + CARD_HEIGHT / 2 - 24, 'Another idea', {
        color: '#5b4169',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(119);

    this.dismissButton = scene.add
      .rectangle(CARD_X + 105, CARD_Y + CARD_HEIGHT / 2 - 24, 130, 38, 0xfff3d9, 1)
      .setStrokeStyle(2, 0xd8bb7f, 0.9)
      .setScrollFactor(0)
      .setDepth(118)
      .setInteractive({ useHandCursor: true });
    this.dismissLabel = scene.add
      .text(CARD_X + 105, CARD_Y + CARD_HEIGHT / 2 - 24, 'Not now', {
        color: '#66523f',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(119);

    this.nextButton.on('pointerdown', () => {
      const save = this.getSave();
      this.suggestionSession.rotate(save);
      this.refresh(true);
    });
    this.dismissButton.on('pointerdown', () => {
      const save = this.getSave();
      this.suggestionSession.dismissCurrent(save);
      this.refresh(true);
    });

    this.refresh(true);
  }

  public refresh(force = false): void {
    if (!force && this.scene.time.now - this.lastRefreshAt < REFRESH_INTERVAL_MS) {
      return;
    }
    this.lastRefreshAt = this.scene.time.now;

    const suggestion = this.suggestionSession.getVisible(this.getSave())[0];
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
    this.panel.destroy();
    this.eyebrow.destroy();
    this.title.destroy();
    this.message.destroy();
    this.nextButton.destroy();
    this.nextLabel.destroy();
    this.dismissButton.destroy();
    this.dismissLabel.destroy();
  }

  private getSave() {
    const saveService = getBrowserSaveService();
    return saveService.load() ?? saveService.createNewGame();
  }

  private setVisible(visible: boolean): void {
    this.panel.setVisible(visible);
    this.eyebrow.setVisible(visible);
    this.title.setVisible(visible);
    this.message.setVisible(visible);
    this.nextButton.setVisible(visible);
    this.nextLabel.setVisible(visible);
    this.dismissButton.setVisible(visible);
    this.dismissLabel.setVisible(visible);
  }
}
