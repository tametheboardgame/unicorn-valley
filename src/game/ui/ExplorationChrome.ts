import Phaser from 'phaser';
import { getBrowserAccessibilitySettingsStore } from '../accessibility/AccessibilitySettings';
import type { TouchMovementPad } from '../input/TouchMovementPad';
import { rememberRainbowMeadowPlayerPosition } from '../world/RainbowMeadowReturnPoint';
import {
  CONCEPT_UI,
  createFixedGraphics,
  drawConceptIcon,
  drawPanelShadow,
  drawRoundedPanel,
} from './ConceptUi';
import { UI_FONT } from './uiTheme';

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

/**
 * Canonical exploration chrome.
 *
 * The retired centred title / Controls panel presentation is intentionally absent. Every canvas
 * exploration layout now owns the same concept location pill; portrait phone suppresses the canvas
 * chrome and replaces it with its responsive DOM dock.
 */
export class ExplorationChrome {
  private readonly accessibility = getBrowserAccessibilitySettingsStore();
  private readonly objects: Phaser.GameObjects.GameObject[] = [];
  private readonly titleText: Phaser.GameObjects.Text | null;
  private unsubscribeAccessibility: (() => void) | null = null;

  public constructor(
    private readonly scene: Phaser.Scene,
    touchMovementPad: TouchMovementPad,
  ) {
    void touchMovementPad;
    const locationTitle = LOCATION_TITLES[scene.scene.key];
    if (!locationTitle) {
      this.titleText = null;
      return;
    }

    const titleX = 1044;
    const titleY = 52;
    const titleWidth = 370;
    const titleHeight = 62;
    const titleShadow = createFixedGraphics(scene, 'exploration-location-title-shadow', 123);
    drawPanelShadow(titleShadow, titleX, titleY, titleWidth, titleHeight, 28, 5, 6, 0.18);
    const titleSurface = createFixedGraphics(scene, 'exploration-location-title-surface', 124);
    drawRoundedPanel(
      titleSurface,
      titleX,
      titleY,
      titleWidth,
      titleHeight,
      28,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    const titlePanel = scene.add
      .rectangle(titleX, titleY, titleWidth, titleHeight, CONCEPT_UI.white, 0.001)
      .setName('exploration-location-title-panel')
      .setScrollFactor(0)
      .setDepth(124);
    const locationIcon = createFixedGraphics(scene, 'exploration-location-icon', 126);
    drawConceptIcon(locationIcon, 'location', titleX - 140, titleY, 0.9, CONCEPT_UI.purpleDeep);
    this.titleText = scene.add
      .text(titleX + 22, titleY, locationTitle, {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 270 },
      })
      .setName('exploration-location-title')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(126);

    this.objects.push(titleShadow, titleSurface, titlePanel, locationIcon, this.titleText);
    this.unsubscribeAccessibility = this.accessibility.subscribe(() => {
      this.applyReducedMotionPreference();
    });
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

    this.applyReducedMotionPreference();

    for (const object of this.scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text) || object === this.titleText) {
        continue;
      }

      const text = object.text.trim();
      const isLegacyTitle =
        text === locationTitle && object.scrollFactorX === 0 && object.depth >= 100;
      const isLegacyControls =
        text.startsWith('Move: WASD / arrows') || text.startsWith('Move: arrows / WASD');
      const isLegacyStatus = LEGACY_STATUS_PREFIXES.some((prefix) => text.startsWith(prefix));
      if (isLegacyTitle || isLegacyControls || isLegacyStatus) {
        object.setVisible(false).disableInteractive();
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
}
