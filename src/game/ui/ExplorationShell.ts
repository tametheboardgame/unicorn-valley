import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConstants';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { TouchMovementPad } from '../input/TouchMovementPad';
import { getBrowserSaveService } from '../save/browserSaveService';
import { ActivitySuggestionCard } from './ActivitySuggestionCard';
import { AudioSettingsPanel } from './AudioSettingsPanel';
import { ExplorationChrome } from './ExplorationChrome';
import { shellManagesSceneAudio, supportsExplorationShell } from './ExplorationShellConfig';
import { browserUsesLandscapeTabletPresentation } from './LandscapeTabletPresentation';
import { RewardFeedback } from './RewardFeedback';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

interface ShellButton {
  shadow: Phaser.GameObjects.Rectangle;
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

const shellsByScene = new WeakMap<Phaser.Scene, ExplorationShell>();

export class ExplorationShell {
  private readonly tabletMode = browserUsesLandscapeTabletPresentation();
  private readonly bagShadow: Phaser.GameObjects.Rectangle;
  private readonly bagButton: Phaser.GameObjects.Rectangle;
  private readonly bagLabel: Phaser.GameObjects.Text;
  private readonly bookShadow: Phaser.GameObjects.Rectangle;
  private readonly bookButton: Phaser.GameObjects.Rectangle;
  private readonly bookLabel: Phaser.GameObjects.Text;
  private readonly mapButtonSet: ShellButton | null;
  private readonly settingsButtonSet: ShellButton | null;
  private readonly shimmerPanel: Phaser.GameObjects.Rectangle | null;
  private readonly shimmerLabel: Phaser.GameObjects.Text | null;
  private readonly economy: ShimmerEconomyService | null;
  private readonly suggestionCard: ActivitySuggestionCard | null;
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

    const bag = this.createShellButton(
      this.tabletMode ? 210 : GAME_WIDTH - 92,
      this.tabletMode ? 46 : 58,
      this.tabletMode ? 116 : 142,
      this.tabletMode ? 58 : 64,
      'Bag 🎒',
      'bag',
      this.tabletMode ? 17 : 19,
    );
    this.bagShadow = bag.shadow;
    this.bagButton = bag.button;
    this.bagLabel = bag.label;

    const book = this.createShellButton(
      this.tabletMode ? 340 : GAME_WIDTH - 410,
      this.tabletMode ? 46 : 58,
      this.tabletMode ? 116 : 128,
      this.tabletMode ? 58 : 64,
      'Book 📖',
      'book',
      this.tabletMode ? 17 : 18,
    );
    this.bookShadow = book.shadow;
    this.bookButton = book.button;
    this.bookLabel = book.label;

    if (this.tabletMode) {
      this.mapButtonSet = this.createShellButton(80, 46, 116, 58, 'Map 🗺️', 'map', 17);
      this.settingsButtonSet = this.createShellButton(
        486,
        46,
        150,
        58,
        'Settings ⚙️',
        'settings-nav',
        16,
      );
      this.shimmerPanel = scene.add
        .rectangle(698, 46, 180, 54, UI_COLOURS.cream, 0.92)
        .setName('exploration-shell-shimmer-panel')
        .setStrokeStyle(3, UI_COLOURS.goldStrong, 0.88)
        .setScrollFactor(0)
        .setDepth(119);
      this.shimmerLabel = scene.add
        .text(698, 46, '', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '17px',
          fontStyle: 'bold',
        })
        .setName('exploration-shell-shimmer-label')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(120);
      this.economy = new ShimmerEconomyService(getBrowserSaveService());
      this.suggestionCard = null;
    } else {
      this.mapButtonSet = null;
      this.settingsButtonSet = null;
      this.shimmerPanel = null;
      this.shimmerLabel = null;
      this.economy = null;
      this.suggestionCard = new ActivitySuggestionCard(scene);
    }

    this.audioSettingsPanel = new AudioSettingsPanel(
      scene,
      shellManagesSceneAudio(scene.scene.key),
    );
    if (this.tabletMode) {
      this.audioSettingsPanel.setLauncherVisible(false);
    }
    this.touchMovementPad = TouchMovementPad.ensure(scene, pointerInput);
    this.explorationChrome = new ExplorationChrome(scene, this.touchMovementPad);
    this.rewardFeedback = new RewardFeedback(scene);

    this.bagButton.on('pointerdown', this.openBag, this);
    this.bookButton.on('pointerdown', this.openWonderbook, this);
    this.mapButtonSet?.button.on('pointerdown', this.openMap, this);
    this.settingsButtonSet?.button.on('pointerdown', this.openSettings, this);
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
    this.suggestionCard?.refresh();
    this.explorationChrome.refresh();
    if (this.shimmerLabel && this.economy) {
      this.shimmerLabel.setText(`✨ ${this.economy.getBalance()} Shimmer`);
    }
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
    this.mapButtonSet?.button.off('pointerdown', this.openMap, this);
    this.settingsButtonSet?.button.off('pointerdown', this.openSettings, this);
    this.bagShadow.destroy();
    this.bagButton.destroy();
    this.bagLabel.destroy();
    this.bookShadow.destroy();
    this.bookButton.destroy();
    this.bookLabel.destroy();
    this.destroyShellButton(this.mapButtonSet);
    this.destroyShellButton(this.settingsButtonSet);
    this.shimmerPanel?.destroy();
    this.shimmerLabel?.destroy();
    this.suggestionCard?.destroy();
    this.audioSettingsPanel.destroy();
    this.explorationChrome.destroy();
    this.rewardFeedback.destroy();
    this.touchMovementPad.destroy();
    if (shellsByScene.get(this.scene) === this) {
      shellsByScene.delete(this.scene);
    }
  }

  private createShellButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    name: string,
    fontSize: number,
  ): ShellButton {
    const shadow = createUiShadow(this.scene, x, y + 2, width, height, 119, 0.16);
    const button = this.scene.add
      .rectangle(x, y, width, height, UI_COLOURS.cream, 0.96)
      .setName(`exploration-shell-${name}-button`)
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.96)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    const label = this.scene.add
      .text(x, y, text, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
      })
      .setName(`exploration-shell-${name}-label`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);
    applyButtonHover(button, UI_COLOURS.cream, UI_COLOURS.gold);
    return { shadow, button, label };
  }

  private destroyShellButton(buttonSet: ShellButton | null): void {
    buttonSet?.shadow.destroy();
    buttonSet?.button.destroy();
    buttonSet?.label.destroy();
  }

  private openBag(): void {
    this.openInventory('items');
  }

  private openMap(): void {
    this.openInventory('map');
  }

  private openInventory(initialTab: 'items' | 'map'): void {
    if (this.destroyed || !this.scene.scene.isActive()) {
      return;
    }
    const returnScene = this.scene.scene.key;
    if (!this.scene.scene.isActive('InventoryScene')) {
      this.scene.scene.launch('InventoryScene', { returnScene, initialTab });
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

  private openSettings(): void {
    if (this.destroyed || !this.scene.scene.isActive()) {
      return;
    }
    void this.audioSettingsPanel.openSettings();
  }
}
