import Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import type { TouchMovementPad } from '../input/TouchMovementPad';
import { rememberRainbowMeadowPlayerPosition } from '../world/RainbowMeadowReturnPoint';
import { browserUsesLandscapeTabletPresentation } from './LandscapeTabletPresentation';
import { UI_COLOURS, UI_FONT, applyButtonHover, createUiShadow } from './uiTheme';

const LOCATION_TITLES: Readonly<Record<string, string>> = {
  MoonflowerGladeScene: 'Moonflower Glade',
  CottageInteriorScene: 'Moonflower Cottage',
  MoonflowerPatchScene: 'Moonflower Patch',
  HollowTreeNookScene: 'Hollow Tree Nook',
  SunbeamVillageScene: 'Sunbeam Village',
  RainbowMeadowScene: 'Rainbow Meadow',
  WindmillLookoutScene: 'Windmill Lookout',
  CrystalBrookScene: 'Crystal Brook',
  CrystalGrottoScene: 'Crystal Grotto',
  WhisperingWoodsScene: 'Whispering Woods',
  FireflyGroveScene: 'Firefly Grove',
  StarlightBeachScene: 'Starlight Beach',
};

const LEGACY_STATUS_PREFIXES = [
  'Pip is nearby.',
  'Your Moonflower Sparkle is safely remembered.',
  'Pip noticed!',
];

export class ExplorationChrome {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly helpObjects: Array<Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text> = [];
  private readonly tabletMode = browserUsesLandscapeTabletPresentation();
  private readonly titleText: Phaser.GameObjects.Text | null;
  private readonly controlsButton: Phaser.GameObjects.Rectangle | null;
  private readonly controlsLabel: Phaser.GameObjects.Text | null;
  private readonly touchToggleButton: Phaser.GameObjects.Rectangle | null;
  private readonly touchToggleLabel: Phaser.GameObjects.Text | null;
  private readonly reducedMotionButton: Phaser.GameObjects.Rectangle | null;
  private readonly reducedMotionLabel: Phaser.GameObjects.Text | null;
  private readonly highVisibilityButton: Phaser.GameObjects.Rectangle | null;
  private readonly highVisibilityLabel: Phaser.GameObjects.Text | null;
  private helpOpen = false;
  private unsubscribeAccessibility: (() => void) | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    private readonly touchMovementPad: TouchMovementPad,
  ) {
    const locationTitle = LOCATION_TITLES[scene.scene.key];
    if (!locationTitle) {
      this.titleText = null;
      this.controlsButton = null;
      this.controlsLabel = null;
      this.touchToggleButton = null;
      this.touchToggleLabel = null;
      this.reducedMotionButton = null;
      this.reducedMotionLabel = null;
      this.highVisibilityButton = null;
      this.highVisibilityLabel = null;
      return;
    }

    if (this.tabletMode) {
      const titleX = GAME_WIDTH - 145;
      const titleY = 46;
      const titleShadow = createUiShadow(scene, titleX, titleY + 2, 260, 58, 123, 0.14);
      const titlePanel = scene.add
        .rectangle(titleX, titleY, 260, 58, UI_COLOURS.cream, 0.94)
        .setName('exploration-location-title-panel')
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.92)
        .setScrollFactor(0)
        .setDepth(124);
      this.titleText = scene.add
        .text(titleX, titleY, locationTitle, {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '19px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 230 },
        })
        .setName('exploration-location-title')
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(125);
      this.controlsButton = null;
      this.controlsLabel = null;
      this.touchToggleButton = null;
      this.touchToggleLabel = null;
      this.reducedMotionButton = null;
      this.reducedMotionLabel = null;
      this.highVisibilityButton = null;
      this.highVisibilityLabel = null;
      this.objects.push(titleShadow, titlePanel, this.titleText);
      this.unsubscribeAccessibility = this.accessibility.subscribe(() => {
        this.applyReducedMotionPreference();
      });
      this.refresh();
      return;
    }

    const titleShadow = createUiShadow(scene, GAME_WIDTH / 2, 43, 340, 58, 123, 0.15);
    const titlePanel = scene.add
      .rectangle(GAME_WIDTH / 2, 40, 340, 58, UI_COLOURS.cream, 0.96)
      .setName('exploration-location-title-panel')
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.92)
      .setScrollFactor(0)
      .setDepth(124);
    this.titleText = scene.add
      .text(GAME_WIDTH / 2, 40, locationTitle, {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setName('exploration-location-title')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(125);

    const buttonX = GAME_WIDTH - 112;
    const buttonY = GAME_HEIGHT - 38;
    const buttonShadow = createUiShadow(scene, buttonX, buttonY, 188, 52, 123, 0.16);
    this.controlsButton = scene.add
      .rectangle(buttonX, buttonY, 188, 52, UI_COLOURS.cream, 0.98)
      .setName('exploration-controls-button')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.96)
      .setScrollFactor(0)
      .setDepth(124)
      .setInteractive({ useHandCursor: true });
    this.controlsLabel = scene.add
      .text(buttonX, buttonY, 'Controls  ?', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '17px',
        fontStyle: 'bold',
      })
      .setName('exploration-controls-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(125);
    applyButtonHover(this.controlsButton, UI_COLOURS.cream, UI_COLOURS.gold);

    const panelX = GAME_WIDTH - 190;
    const panelY = GAME_HEIGHT - 230;
    const panelShadow = createUiShadow(scene, panelX, panelY, 350, 340, 126, 0.2);
    const panel = scene.add
      .rectangle(panelX, panelY, 350, 340, UI_COLOURS.cream, 0.99)
      .setName('exploration-controls-panel')
      .setStrokeStyle(4, UI_COLOURS.lavenderStrong, 0.98)
      .setScrollFactor(0)
      .setDepth(127);
    const heading = scene.add
      .text(panelX, panelY - 142, 'How to play', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(128);
    const help = scene.add
      .text(
        panelX,
        panelY - 78,
        'Move: arrows / WASD / touch\nClick/tap the ground: walk there\nTap the prompt: interact\nBag and Book: top buttons\nKeyboard shortcuts still work too',
        {
          color: UI_COLOURS.softInk,
          fontFamily: UI_FONT,
          fontSize: '15px',
          align: 'center',
          lineSpacing: 4,
        },
      )
      .setName('exploration-controls-help')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(128);

    this.reducedMotionButton = this.createPreferenceButton(panelX, panelY + 10, 'reduced-motion');
    this.reducedMotionLabel = this.createPreferenceLabel(panelX, panelY + 10, 'reduced-motion');
    this.highVisibilityButton = this.createPreferenceButton(panelX, panelY + 66, 'high-visibility');
    this.highVisibilityLabel = this.createPreferenceLabel(panelX, panelY + 66, 'high-visibility');
    this.touchToggleButton = this.createPreferenceButton(panelX, panelY + 122, 'touch-controls');
    this.touchToggleLabel = this.createPreferenceLabel(panelX, panelY + 122, 'touch-controls');

    this.helpObjects.push(
      panelShadow,
      panel,
      heading,
      help,
      this.reducedMotionButton,
      this.reducedMotionLabel,
      this.highVisibilityButton,
      this.highVisibilityLabel,
      this.touchToggleButton,
      this.touchToggleLabel,
    );
    this.objects.push(
      titleShadow,
      titlePanel,
      this.titleText,
      buttonShadow,
      this.controlsButton,
      this.controlsLabel,
      ...this.helpObjects,
    );

    this.controlsButton.on('pointerdown', () => {
      this.helpOpen = !this.helpOpen;
      this.setHelpVisible(this.helpOpen);
    });
    this.touchToggleButton.on('pointerdown', () => {
      this.touchMovementPad.togglePreferredVisibility();
      this.refreshPreferenceLabels();
    });
    this.reducedMotionButton.on('pointerdown', () => {
      const settings = this.accessibility.load();
      this.accessibility.update({ reducedMotion: !settings.reducedMotion });
    });
    this.highVisibilityButton.on('pointerdown', () => {
      const settings = this.accessibility.load();
      this.accessibility.update({
        highVisibilityInteractions: !settings.highVisibilityInteractions,
      });
    });
    this.unsubscribeAccessibility = this.accessibility.subscribe(() => {
      this.refreshPreferenceLabels();
      this.applyReducedMotionPreference();
    });

    this.refreshPreferenceLabels();
    this.setHelpVisible(false);
    this.refresh();
  }

  public refresh(): void {
    const locationTitle = LOCATION_TITLES[this.scene.scene.key];
    if (!locationTitle) {
      return;
    }

    if (this.scene.scene.key === 'RainbowMeadowScene') {
      const player = this.scene.children.getByName('world-player-unicorn');
      if (player instanceof Phaser.GameObjects.Sprite) {
        rememberRainbowMeadowPlayerPosition({ x: player.x, y: player.y });
      }
    }

    this.refreshPreferenceLabels();
    this.applyReducedMotionPreference();

    for (const object of this.scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text) || object === this.titleText) {
        continue;
      }

      const text = object.text.trim();
      const isLegacyTitle =
        text === locationTitle && object.scrollFactorX === 0 && object.depth >= 100;
      const isLegacyControls =
        object.name !== 'exploration-controls-help' &&
        (text.startsWith('Move: WASD / arrows') || text.startsWith('Move: arrows / WASD'));
      const isLegacyStatus = LEGACY_STATUS_PREFIXES.some((prefix) => text.startsWith(prefix));
      if (isLegacyTitle || isLegacyControls || isLegacyStatus) {
        object.setVisible(false);
      }
    }
  }

  public destroy(): void {
    this.unsubscribeAccessibility?.();
    this.unsubscribeAccessibility = null;
    for (const object of this.objects) {
      object.destroy();
    }
    this.objects.length = 0;
    this.helpObjects.length = 0;
  }

  private createPreferenceButton(x: number, y: number, name: string): Phaser.GameObjects.Rectangle {
    const button = this.scene.add
      .rectangle(x, y, 270, 48, UI_COLOURS.lavender, 1)
      .setName(`exploration-${name}-toggle`)
      .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 0.95)
      .setScrollFactor(0)
      .setDepth(128)
      .setInteractive({ useHandCursor: true });
    applyButtonHover(button, UI_COLOURS.lavender, UI_COLOURS.blush);
    return button;
  }

  private createPreferenceLabel(x: number, y: number, name: string): Phaser.GameObjects.Text {
    return this.scene.add
      .text(x, y, '', {
        color: UI_COLOURS.ink,
        fontFamily: UI_FONT,
        fontSize: '15px',
        fontStyle: 'bold',
      })
      .setName(`exploration-${name}-toggle-label`)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(129);
  }

  private refreshPreferenceLabels(): void {
    this.touchToggleLabel?.setText(
      this.touchMovementPad.isVisible() ? 'Touch buttons: On' : 'Touch buttons: Off',
    );
    const settings = this.accessibility.load();
    this.reducedMotionLabel?.setText(`Reduced motion: ${settings.reducedMotion ? 'On' : 'Off'}`);
    this.highVisibilityLabel?.setText(
      `High visibility: ${settings.highVisibilityInteractions ? 'On' : 'Off'}`,
    );
  }

  private applyReducedMotionPreference(): void {
    const timeScale = this.accessibility.load().reducedMotion ? 0 : 1;
    for (const object of this.scene.children.list) {
      if (
        !object.name.startsWith('environment-production:') &&
        !object.name.startsWith('core-npc:')
      ) {
        continue;
      }

      const targets: Phaser.GameObjects.GameObject[] = [object];
      if (object instanceof Phaser.GameObjects.Container) {
        targets.push(...object.list);
      }
      for (const target of targets) {
        for (const tween of this.scene.tweens.getTweensOf(target)) {
          tween.timeScale = timeScale;
        }
      }
    }
  }

  private setHelpVisible(visible: boolean): void {
    for (const object of this.helpObjects) {
      object.setVisible(visible);
    }
    for (const button of [
      this.touchToggleButton,
      this.reducedMotionButton,
      this.highVisibilityButton,
    ]) {
      if (!button) {
        continue;
      }
      if (visible) {
        button.setInteractive({ useHandCursor: true });
      } else {
        button.disableInteractive();
      }
    }
    this.controlsLabel?.setText(visible ? 'Controls  ×' : 'Controls  ?');
  }
}
