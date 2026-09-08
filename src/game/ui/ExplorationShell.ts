import Phaser from 'phaser';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { getExplorationSnackBoostRemainingSeconds } from '../input/ExplorationGallop';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { TouchMovementPad } from '../input/TouchMovementPad';
import { getBrowserSaveService } from '../save/browserSaveService';
import { AudioSettingsPanel } from './AudioSettingsPanel';
import {
  CONCEPT_UI,
  createFixedGraphics,
  drawConceptIcon,
  drawPanelShadow,
  drawRoundedPanel,
  type ConceptIcon,
} from './ConceptUi';
import { ExplorationChrome } from './ExplorationChrome';
import { shellManagesSceneAudio, supportsExplorationShell } from './ExplorationShellConfig';
import { RewardFeedback } from './RewardFeedback';
import { UI_FONT } from './uiTheme';

interface ShellButton {
  shadow: Phaser.GameObjects.Rectangle;
  button: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  decorations: Phaser.GameObjects.GameObject[];
}

const shellsByScene = new WeakMap<Phaser.Scene, ExplorationShell>();

/**
 * Canonical exploration shell.
 *
 * The old pre-concept Bag / Book / Sound / Controls layout has been removed rather than retained
 * as a responsive fallback. Landscape desktop, tablet and phone therefore share this one canvas
 * presentation. Portrait phone replaces it with the dedicated DOM dock via
 * PortraitConceptPresentationManager, but the underlying canvas shell remains this same concept
 * presentation so rotating the device can never restore the retired layout.
 */
export class ExplorationShell {
  private readonly bagShadow: Phaser.GameObjects.Rectangle;
  private readonly bagButton: Phaser.GameObjects.Rectangle;
  private readonly bagLabel: Phaser.GameObjects.Text;
  private readonly bookShadow: Phaser.GameObjects.Rectangle;
  private readonly bookButton: Phaser.GameObjects.Rectangle;
  private readonly bookLabel: Phaser.GameObjects.Text;
  private readonly mapButtonSet: ShellButton;
  private readonly settingsButtonSet: ShellButton;
  private readonly shimmerPanel: Phaser.GameObjects.Rectangle;
  private readonly shimmerLabel: Phaser.GameObjects.Text;
  private readonly economy = new ShimmerEconomyService(getBrowserSaveService());
  private readonly audioSettingsPanel: AudioSettingsPanel;
  private readonly touchMovementPad: TouchMovementPad;
  private readonly explorationChrome: ExplorationChrome;
  private readonly rewardFeedback: RewardFeedback;
  private readonly refreshTimer: Phaser.Time.TimerEvent;
  private readonly decorations: Phaser.GameObjects.GameObject[] = [];
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

    this.createConceptNavigationGroup();

    const bag = this.createShellButton(210, 52, 118, 72, 'Bag', 'bag', 16, 'bag');
    this.bagShadow = bag.shadow;
    this.bagButton = bag.button;
    this.bagLabel = bag.label;
    this.decorations.push(...bag.decorations);

    const book = this.createShellButton(330, 52, 118, 72, 'Book', 'book', 16, 'book');
    this.bookShadow = book.shadow;
    this.bookButton = book.button;
    this.bookLabel = book.label;
    this.decorations.push(...book.decorations);

    this.mapButtonSet = this.createShellButton(83, 52, 118, 72, 'Map', 'map', 16, 'map');
    this.settingsButtonSet = this.createShellButton(
      465,
      52,
      136,
      72,
      'Settings',
      'settings-nav',
      15,
      'settings',
    );
    this.decorations.push(
      ...this.mapButtonSet.decorations,
      ...this.settingsButtonSet.decorations,
    );

    const shimmerX = 700;
    const shimmerY = 52;
    const shimmerWidth = 210;
    const shimmerHeight = 62;
    const shimmerShadow = createFixedGraphics(scene, 'exploration-shell-shimmer-shadow', 118);
    drawPanelShadow(
      shimmerShadow,
      shimmerX,
      shimmerY,
      shimmerWidth,
      shimmerHeight,
      28,
      5,
      6,
      0.18,
    );
    const shimmerSurface = createFixedGraphics(scene, 'exploration-shell-shimmer-surface', 119);
    drawRoundedPanel(
      shimmerSurface,
      shimmerX,
      shimmerY,
      shimmerWidth,
      shimmerHeight,
      28,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    const shimmerIcon = createFixedGraphics(scene, 'exploration-shell-shimmer-icon', 121);
    drawConceptIcon(shimmerIcon, 'shimmer', shimmerX - 72, shimmerY, 0.82, CONCEPT_UI.goldStrong);
    this.decorations.push(shimmerShadow, shimmerSurface, shimmerIcon);

    this.shimmerPanel = scene.add
      .rectangle(shimmerX, shimmerY, shimmerWidth, shimmerHeight, CONCEPT_UI.white, 0.001)
      .setName('exploration-shell-shimmer-panel')
      .setScrollFactor(0)
      .setDepth(120);
    this.shimmerLabel = scene.add
      .text(shimmerX + 12, shimmerY, '', {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName('exploration-shell-shimmer-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(121);

    this.audioSettingsPanel = new AudioSettingsPanel(
      scene,
      shellManagesSceneAudio(scene.scene.key),
    );
    this.audioSettingsPanel.setLauncherVisible(false);

    this.touchMovementPad = TouchMovementPad.ensure(scene, pointerInput);
    this.explorationChrome = new ExplorationChrome(scene, this.touchMovementPad);
    this.rewardFeedback = new RewardFeedback(scene);

    this.bagButton.on('pointerdown', this.openBag, this);
    this.bookButton.on('pointerdown', this.openWonderbook, this);
    this.mapButtonSet.button.on('pointerdown', this.openMap, this);
    this.settingsButtonSet.button.on('pointerdown', this.openSettings, this);
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
    this.touchMovementPad.refresh();
    this.explorationChrome.refresh();
    const snackSeconds = getExplorationSnackBoostRemainingSeconds();
    this.shimmerLabel.setText(
      snackSeconds > 0
        ? `${this.economy.getBalance()}  •  Boost ${snackSeconds}s`
        : `${this.economy.getBalance()} Shimmer`,
    );
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
    this.mapButtonSet.button.off('pointerdown', this.openMap, this);
    this.settingsButtonSet.button.off('pointerdown', this.openSettings, this);
    this.bagShadow.destroy();
    this.bagButton.destroy();
    this.bagLabel.destroy();
    this.bookShadow.destroy();
    this.bookButton.destroy();
    this.bookLabel.destroy();
    this.destroyShellButton(this.mapButtonSet);
    this.destroyShellButton(this.settingsButtonSet);
    this.shimmerPanel.destroy();
    this.shimmerLabel.destroy();
    for (const decoration of this.decorations) {
      decoration.destroy();
    }
    this.decorations.length = 0;
    this.audioSettingsPanel.destroy();
    this.explorationChrome.destroy();
    this.rewardFeedback.destroy();
    this.touchMovementPad.destroy();
    if (shellsByScene.get(this.scene) === this) {
      shellsByScene.delete(this.scene);
    }
  }

  private createConceptNavigationGroup(): void {
    const x = 278;
    const y = 52;
    const width = 524;
    const height = 80;
    const shadow = createFixedGraphics(this.scene, 'exploration-shell-nav-shadow', 117);
    drawPanelShadow(shadow, x, y, width, height, 28, 7, 8, 0.2);
    const surface = createFixedGraphics(this.scene, 'exploration-shell-nav-group', 118);
    drawRoundedPanel(
      surface,
      x,
      y,
      width,
      height,
      28,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    surface.lineStyle(2, CONCEPT_UI.lavenderLine, 0.34);
    for (const dividerX of [150, 270, 390]) {
      surface.lineBetween(dividerX, 23, dividerX, 81);
    }
    this.decorations.push(shadow, surface);
  }

  private createShellButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    name: string,
    fontSize: number,
    icon: ConceptIcon,
  ): ShellButton {
    const shadow = this.scene.add
      .rectangle(x, y, width, height, CONCEPT_UI.shadow, 0)
      .setScrollFactor(0)
      .setDepth(119);
    const hover = this.scene.add
      .rectangle(x, y, width - 8, height - 10, CONCEPT_UI.purpleLight, 0)
      .setName(`exploration-shell-${name}-hover`)
      .setScrollFactor(0)
      .setDepth(119);
    const button = this.scene.add
      .rectangle(x, y, width, height, CONCEPT_UI.white, 0.001)
      .setName(`exploration-shell-${name}-button`)
      .setScrollFactor(0)
      .setDepth(120)
      .setInteractive({ useHandCursor: true });
    const iconGraphic = createFixedGraphics(this.scene, `exploration-shell-${name}-icon`, 121);
    const iconScale = icon === 'settings' ? 0.76 : 0.9;
    drawConceptIcon(iconGraphic, icon, x, y - 14, iconScale, CONCEPT_UI.purpleDeep);
    const label = this.scene.add
      .text(x, y + 22, text, {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
      })
      .setName(`exploration-shell-${name}-label`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(122);

    button.on('pointerover', () => {
      hover.setFillStyle(CONCEPT_UI.purpleLight, 0.17);
      label.setColor('#642d8a');
    });
    button.on('pointerout', () => {
      hover.setFillStyle(CONCEPT_UI.purpleLight, 0);
      label.setColor('#4b2b66');
    });
    button.on('pointerdown', () => {
      hover.setFillStyle(CONCEPT_UI.goldLight, 0.28);
      iconGraphic.setScale(0.94);
      label.setScale(0.96);
    });
    button.on('pointerup', () => {
      iconGraphic.setScale(1);
      label.setScale(1);
    });
    return { shadow, button, label, decorations: [hover, iconGraphic] };
  }

  private destroyShellButton(buttonSet: ShellButton): void {
    buttonSet.shadow.destroy();
    buttonSet.button.destroy();
    buttonSet.label.destroy();
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
