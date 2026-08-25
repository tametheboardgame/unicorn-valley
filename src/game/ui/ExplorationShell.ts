import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConstants';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { TouchMovementPad } from '../input/TouchMovementPad';
import { ActivitySuggestionCard } from './ActivitySuggestionCard';
import { AudioSettingsPanel } from './AudioSettingsPanel';
import { ExplorationChrome } from './ExplorationChrome';
import { shellManagesSceneAudio, supportsExplorationShell } from './ExplorationShellConfig';
import { RewardFeedback } from './RewardFeedback';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

const shellsByScene = new WeakMap<Phaser.Scene, ExplorationShell>();

export class ExplorationShell {
  private readonly bagShadow: Phaser.GameObjects.Rectangle;
  private readonly bagButton: Phaser.GameObjects.Rectangle;
  private readonly bagLabel: Phaser.GameObjects.Text;
  private readonly bookShadow: Phaser.GameObjects.Rectangle;
  private readonly bookButton: Phaser.GameObjects.Rectangle;
  private readonly bookLabel: Phaser.GameObjects.Text;
  private readonly suggestionCard: ActivitySuggestionCard;
  private readonly audioSettingsPanel: AudioSettingsPanel;
  private readonly touchMovementPad: TouchMovementPad;
  private readonly explorationChrome: ExplorationChrome;
  private readonly rewardFeedback: RewardFeedback;
  private readonly refreshTimer: Phaser.Time.TimerEvent;
  private destroyed = false;

  public static ensure(
    scene: Phaser.Scene,
    pointerInput: PointerTouchInputAdapter,
  ): ExplorationShell {
    const existing = shellsByScene.get(scene);
    if (existing) {
      return existing;
    }

    const shell = new ExplorationShell(scene, pointerInput);
    shellsByScene.set(scene, shell);
    return shell;
  }

  private constructor(
    private readonly scene: Phaser.Scene,
    pointerInput: PointerTouchInputAdapter,
  ) {
    if (!supportsExplorationShell(scene.scene.key)) {
      throw new Error(`Exploration shell is not supported in ${scene.scene.key}.`);
    }

    this.bagShadow = createUiShadow(scene, GAME_WIDTH - 92, 58, 142, 64, 119, 0.16);
    this.bagButton = scene.add
      .rectangle(GAME_WIDTH - 92, 58, 142, 64, UI_COLOURS.cream, 0.98)
      .setName('exploration-shell-bag-button')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    this.bagLabel = scene.add
      .text(GAME_WIDTH - 92, 58, 'Bag 🎒', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setName('exploration-shell-bag-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    applyButtonHover(this.bagButton, UI_COLOURS.cream, UI_COLOURS.gold);

    this.bookShadow = createUiShadow(scene, GAME_WIDTH - 410, 58, 128, 64, 119, 0.16);
    this.bookButton = scene.add
      .rectangle(GAME_WIDTH - 410, 58, 128, 64, UI_COLOURS.cream, 0.98)
      .setName('exploration-shell-book-button')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    this.bookLabel = scene.add
      .text(GAME_WIDTH - 410, 58, 'Book 📖', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName('exploration-shell-book-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    applyButtonHover(this.bookButton, UI_COLOURS.cream, UI_COLOURS.gold);

    this.suggestionCard = new ActivitySuggestionCard(scene);
    this.audioSettingsPanel = new AudioSettingsPanel(
      scene,
      shellManagesSceneAudio(scene.scene.key),
    );
    this.touchMovementPad = TouchMovementPad.ensure(scene, pointerInput);
    this.explorationChrome = new ExplorationChrome(scene, this.touchMovementPad);
    this.rewardFeedback = new RewardFeedback(scene);

    this.bagButton.on('pointerdown', this.openBag, this);
    this.bookButton.on('pointerdown', this.openWonderbook, this);
    scene.input.keyboard?.on('keydown-I', this.openBag, this);
    scene.input.keyboard?.on('keydown-B', this.openWonderbook, this);
    this.refreshTimer = scene.time.addEvent({
      delay: 300,
      loop: true,
      callback: this.refresh,
      callbackScope: this,
    });
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);

    this.refresh();
  }

  public refresh(): void {
    if (this.destroyed) {
      return;
    }
    this.suggestionCard.refresh();
    this.explorationChrome.refresh();
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }
    this.destroyed = true;
    this.refreshTimer.destroy();
    this.scene.input.keyboard?.off('keydown-I', this.openBag, this);
    this.scene.input.keyboard?.off('keydown-B', this.openWonderbook, this);
    this.bagButton.off('pointerdown', this.openBag, this);
    this.bookButton.off('pointerdown', this.openWonderbook, this);
    this.bagShadow.destroy();
    this.bagButton.destroy();
    this.bagLabel.destroy();
    this.bookShadow.destroy();
    this.bookButton.destroy();
    this.bookLabel.destroy();
    this.suggestionCard.destroy();
    this.audioSettingsPanel.destroy();
    this.explorationChrome.destroy();
    this.rewardFeedback.destroy();
    this.touchMovementPad.destroy();
    if (shellsByScene.get(this.scene) === this) {
      shellsByScene.delete(this.scene);
    }
  }

  private openBag(): void {
    if (this.destroyed || !this.scene.scene.isActive()) {
      return;
    }
    const returnScene = this.scene.scene.key;
    if (!this.scene.scene.isActive('InventoryScene')) {
      this.scene.scene.launch('InventoryScene', { returnScene });
      this.scene.scene.pause();
    }
  }

  private openWonderbook(): void {
    if (this.destroyed || !this.scene.scene.isActive()) {
      return;
    }
    const returnScene = this.scene.scene.key;
    if (!this.scene.scene.isActive('WonderbookScene')) {
      this.scene.scene.launch('WonderbookScene', { returnScene });
      this.scene.scene.pause();
    }
  }
}
