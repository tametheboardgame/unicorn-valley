import Phaser from 'phaser';
import {
  CONCEPT_UI,
  createFixedGraphics,
  drawConceptIcon,
  drawPanelShadow,
  drawRoundedPanel,
  type ConceptIcon,
} from './ConceptUi';
import { supportsExplorationShell } from './ExplorationShellConfig';
import { UI_FONT } from './uiTheme';

const SCENE_KEY = 'ExplorationHudOverlayScene';
const SYNC_MS = 90;
const MODAL_SCENE_KEYS = new Set([
  'InventoryScene',
  'WonderbookScene',
  'SettingsScene',
  'ShopScene',
  'CottageDecorateScene',
  'UnicornCreatorScene',
]);

const SOURCE_TOP_HUD_NAMES = new Set([
  'exploration-shell-nav-shadow',
  'exploration-shell-nav-group',
  'exploration-shell-map-hover',
  'exploration-shell-map-button',
  'exploration-shell-map-icon',
  'exploration-shell-map-label',
  'exploration-shell-bag-hover',
  'exploration-shell-bag-button',
  'exploration-shell-bag-icon',
  'exploration-shell-bag-label',
  'exploration-shell-book-hover',
  'exploration-shell-book-button',
  'exploration-shell-book-icon',
  'exploration-shell-book-label',
  'exploration-shell-settings-nav-hover',
  'exploration-shell-settings-nav-button',
  'exploration-shell-settings-nav-icon',
  'exploration-shell-settings-nav-label',
  'exploration-shell-shimmer-shadow',
  'exploration-shell-shimmer-surface',
  'exploration-shell-shimmer-panel',
  'exploration-shell-shimmer-icon',
  'exploration-shell-shimmer-label',
  'exploration-location-title-shadow',
  'exploration-location-title-surface',
  'exploration-location-title-panel',
  'exploration-location-icon',
  'exploration-location-title',
]);

interface OverlayButton {
  button: Phaser.GameObjects.Rectangle;
  hover: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
}

function usesPortraitDock(): boolean {
  if (typeof globalThis.document === 'undefined') {
    return false;
  }
  const coarsePointer =
    typeof globalThis.matchMedia === 'function' &&
    globalThis.matchMedia('(pointer: coarse), (any-pointer: coarse)').matches;
  const touchCapable =
    (globalThis.navigator?.maxTouchPoints ?? 0) > 0 ||
    'ontouchstart' in globalThis ||
    coarsePointer;
  return touchCapable && globalThis.innerWidth <= 700 && globalThis.innerHeight > globalThis.innerWidth;
}

function textObject(scene: Phaser.Scene, name: string): Phaser.GameObjects.Text | null {
  const object = scene.children.getByName(name);
  return object instanceof Phaser.GameObjects.Text ? object : null;
}

/**
 * Fixed exploration HUD rendered in its own scene.
 *
 * Phaser recommends separating HUD/UI from a smoothly-following world camera when fixed text shows
 * sub-pixel jitter. The authoritative world-shell buttons and text remain in the exploration scene
 * for behaviour/state, but their top-chrome presentation is hidden and mirrored here. Movement,
 * interaction prompts and gameplay stay in the world scene.
 */
export class ExplorationHudOverlayScene extends Phaser.Scene {
  private readonly hudObjects: Phaser.GameObjects.GameObject[] = [];
  private locationLabel: Phaser.GameObjects.Text | null = null;
  private shimmerLabel: Phaser.GameObjects.Text | null = null;
  private syncTimer: Phaser.Time.TimerEvent | null = null;
  private currentWorld: Phaser.Scene | null = null;
  private hudVisible = false;

  public constructor() {
    super(SCENE_KEY);
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.cameras.main.roundPixels = true;
    this.createNavigation();
    this.createShimmer();
    this.createLocation();
    this.setHudVisible(false);
    this.syncTimer = this.time.addEvent({
      delay: SYNC_MS,
      loop: true,
      callback: this.sync,
      callbackScope: this,
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.syncTimer?.destroy();
      this.syncTimer = null;
    });
    this.sync();
  }

  private createNavigation(): void {
    const navShadow = createFixedGraphics(this, 'exploration-hud-overlay-nav-shadow', 10);
    drawPanelShadow(navShadow, 278, 52, 524, 80, 28, 7, 8, 0.2);
    const navSurface = createFixedGraphics(this, 'exploration-hud-overlay-nav-surface', 11);
    drawRoundedPanel(
      navSurface,
      278,
      52,
      524,
      80,
      28,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    navSurface.lineStyle(2, CONCEPT_UI.lavenderLine, 0.34);
    for (const dividerX of [150, 270, 390]) {
      navSurface.lineBetween(dividerX, 23, dividerX, 81);
    }
    this.hudObjects.push(navShadow, navSurface);

    this.createButton(83, 52, 118, 72, 'Map', 'map', 16, 'map', 'exploration-shell-map-button');
    this.createButton(210, 52, 118, 72, 'Bag', 'bag', 16, 'bag', 'exploration-shell-bag-button');
    this.createButton(330, 52, 118, 72, 'Book', 'book', 16, 'book', 'exploration-shell-book-button');
    this.createButton(
      465,
      52,
      136,
      72,
      'Settings',
      'settings-nav',
      15,
      'settings',
      'exploration-shell-settings-nav-button',
    );
  }

  private createButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    name: string,
    fontSize: number,
    icon: ConceptIcon,
    sourceButtonName: string,
  ): OverlayButton {
    const hover = this.add
      .rectangle(x, y, width - 8, height - 10, CONCEPT_UI.purpleLight, 0)
      .setName(`exploration-hud-overlay-${name}-hover`)
      .setDepth(12);
    const button = this.add
      .rectangle(x, y, width, height, CONCEPT_UI.white, 0.001)
      .setName(`exploration-hud-overlay-${name}-button`)
      .setDepth(13)
      .setInteractive({ useHandCursor: true });
    const iconGraphic = createFixedGraphics(this, `exploration-hud-overlay-${name}-icon`, 14);
    drawConceptIcon(
      iconGraphic,
      icon,
      x,
      y - 14,
      icon === 'settings' ? 0.76 : 0.9,
      CONCEPT_UI.purpleDeep,
    );
    const label = this.add
      .text(x, y + 22, text, {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: `${fontSize}px`,
        fontStyle: 'bold',
      })
      .setName(`exploration-hud-overlay-${name}-label`)
      .setOrigin(0.5)
      .setDepth(15);

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
    });
    button.on('pointerup', () => {
      hover.setFillStyle(CONCEPT_UI.purpleLight, 0.17);
      this.activateSourceButton(sourceButtonName);
    });

    this.hudObjects.push(hover, button, iconGraphic, label);
    return { button, hover, label };
  }

  private createShimmer(): void {
    const x = 700;
    const y = 52;
    const width = 210;
    const height = 62;
    const shadow = createFixedGraphics(this, 'exploration-hud-overlay-shimmer-shadow', 10);
    drawPanelShadow(shadow, x, y, width, height, 28, 5, 6, 0.18);
    const surface = createFixedGraphics(this, 'exploration-hud-overlay-shimmer-surface', 11);
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
    const icon = createFixedGraphics(this, 'exploration-hud-overlay-shimmer-icon', 14);
    drawConceptIcon(icon, 'shimmer', x - 72, y, 0.82, CONCEPT_UI.goldStrong);
    const panel = this.add
      .rectangle(x, y, width, height, CONCEPT_UI.white, 0.001)
      .setName('exploration-hud-overlay-shimmer-panel')
      .setDepth(13);
    this.shimmerLabel = this.add
      .text(x + 12, y, '', {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName('exploration-hud-overlay-shimmer-label')
      .setOrigin(0.5)
      .setDepth(15);
    this.hudObjects.push(shadow, surface, icon, panel, this.shimmerLabel);
  }

  private createLocation(): void {
    const x = 1044;
    const y = 52;
    const width = 370;
    const height = 62;
    const shadow = createFixedGraphics(this, 'exploration-hud-overlay-location-shadow', 10);
    drawPanelShadow(shadow, x, y, width, height, 28, 5, 6, 0.18);
    const surface = createFixedGraphics(this, 'exploration-hud-overlay-location-surface', 11);
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
    const panel = this.add
      .rectangle(x, y, width, height, CONCEPT_UI.white, 0.001)
      .setName('exploration-hud-overlay-location-panel')
      .setDepth(13);
    const icon = createFixedGraphics(this, 'exploration-hud-overlay-location-icon', 14);
    drawConceptIcon(icon, 'location', x - 140, y, 0.9, CONCEPT_UI.purpleDeep);
    this.locationLabel = this.add
      .text(x + 22, y, '', {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 270 },
      })
      .setName('exploration-hud-overlay-location-label')
      .setOrigin(0.5)
      .setDepth(15);
    this.hudObjects.push(shadow, surface, panel, icon, this.locationLabel);
  }

  private sync(): void {
    if (usesPortraitDock() || this.modalSceneIsOpen()) {
      this.currentWorld = null;
      this.setHudVisible(false);
      return;
    }

    const world = this.findActiveWorldScene();
    if (!world) {
      this.currentWorld = null;
      this.setHudVisible(false);
      return;
    }

    this.suppressSourceTopHud(world);
    const sourceLocation = textObject(world, 'exploration-location-title');
    const sourceShimmer = textObject(world, 'exploration-shell-shimmer-label');
    if (!sourceLocation || !sourceShimmer) {
      this.setHudVisible(false);
      return;
    }

    this.currentWorld = world;
    if (this.locationLabel?.text !== sourceLocation.text) {
      this.locationLabel?.setText(sourceLocation.text);
    }
    if (this.shimmerLabel?.text !== sourceShimmer.text) {
      this.shimmerLabel?.setText(sourceShimmer.text);
    }
    this.setHudVisible(true);
  }

  private findActiveWorldScene(): Phaser.Scene | null {
    for (const scene of Object.values(this.game.scene.keys)) {
      if (supportsExplorationShell(scene.scene.key) && scene.scene.isActive()) {
        return scene;
      }
    }
    return null;
  }

  private modalSceneIsOpen(): boolean {
    for (const sceneKey of MODAL_SCENE_KEYS) {
      if (this.game.scene.isActive(sceneKey)) {
        return true;
      }
    }
    return false;
  }

  private suppressSourceTopHud(world: Phaser.Scene): void {
    for (const object of world.children.list) {
      if (!SOURCE_TOP_HUD_NAMES.has(object.name)) {
        continue;
      }
      const suppressible = object as Phaser.GameObjects.GameObject & { setAlpha?: (alpha: number) => unknown };
      suppressible.setAlpha?.(0.001);
    }
  }

  private setHudVisible(visible: boolean): void {
    if (this.hudVisible === visible) {
      return;
    }
    this.hudVisible = visible;
    for (const object of this.hudObjects) {
      object.setVisible(visible);
    }
  }

  private activateSourceButton(sourceButtonName: string): void {
    const world = this.currentWorld ?? this.findActiveWorldScene();
    if (!world || !world.scene.isActive()) {
      return;
    }
    const source = world.children.getByName(sourceButtonName);
    if (!(source instanceof Phaser.GameObjects.Rectangle)) {
      return;
    }
    this.setHudVisible(false);
    source.emit('pointerdown');
  }
}

export function ensureExplorationHudOverlayScene(game: Phaser.Game): void {
  if (!game.scene.keys[SCENE_KEY]) {
    game.scene.add(SCENE_KEY, ExplorationHudOverlayScene, true);
    return;
  }
  if (!game.scene.isActive(SCENE_KEY)) {
    game.scene.start(SCENE_KEY);
  }
}
