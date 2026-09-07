import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  CONCEPT_UI,
  createFixedGraphics,
  drawConceptIcon,
  drawGlossyCircle,
  drawPanelShadow,
  drawRoundedPanel,
  type ConceptIcon,
} from './ConceptUi';
import { browserUsesLandscapeTabletPresentation } from './LandscapeTabletPresentation';
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

const LEGACY_NAMES = [
  'exploration-shell-bag-button',
  'exploration-shell-bag-label',
  'exploration-shell-book-button',
  'exploration-shell-book-label',
  'exploration-shell-sound-button',
  'exploration-shell-sound-label',
  'exploration-location-title-panel',
  'exploration-location-title',
  'exploration-controls-button',
  'exploration-controls-label',
  'activity-suggestion-reopen',
] as const;

interface DesktopConceptPresentation {
  objects: Phaser.GameObjects.GameObject[];
  actionSurface: Phaser.GameObjects.Graphics;
  actionIcon: Phaser.GameObjects.Graphics;
  actionHit: Phaser.GameObjects.Arc;
  actionLabel: Phaser.GameObjects.Text;
  hintSurface: Phaser.GameObjects.Graphics;
  hintIcon: Phaser.GameObjects.Graphics;
  hintText: Phaser.GameObjects.Text;
  shimmerLabel: Phaser.GameObjects.Text;
}

function shouldUseDesktopConceptPresentation(): boolean {
  return (
    !browserUsesLandscapeTabletPresentation() &&
    globalThis.innerWidth >= 800 &&
    globalThis.innerHeight >= 500 &&
    globalThis.innerWidth > globalThis.innerHeight
  );
}

function disableLegacyObject(object: Phaser.GameObjects.GameObject | null): void {
  if (!object) {
    return;
  }
  if (
    object instanceof Phaser.GameObjects.Rectangle ||
    object instanceof Phaser.GameObjects.Arc ||
    object instanceof Phaser.GameObjects.Text
  ) {
    object.setAlpha(0.001);
    object.disableInteractive();
  }
}

function actionFromLegacyLabel(label: string): { label: string; icon: ConceptIcon; hint: string } {
  const normalised = label.trim().toLowerCase();
  if (normalised.startsWith('talk') || normalised.startsWith('speak')) {
    const target = label.replace(/^(talk to|speak to)\s+/i, '').replace(/\s*✨.*$/, '').trim();
    return {
      label: 'Talk',
      icon: 'talk',
      hint: target ? `Tap Talk to chat with ${target}` : 'Tap Talk to chat',
    };
  }
  if (normalised.includes('enter') || normalised.includes('go inside') || normalised.includes('visit')) {
    return { label: 'Enter', icon: 'enter', hint: 'Tap Enter to go inside' };
  }
  if (
    normalised.includes('race') ||
    normalised.includes('start') ||
    normalised.includes('play') ||
    normalised.includes('begin')
  ) {
    return { label: 'Start', icon: 'start', hint: 'Tap Start when you are ready' };
  }
  if (
    normalised.includes('look') ||
    normalised.includes('inspect') ||
    normalised.includes('read') ||
    normalised.includes('check')
  ) {
    return { label: 'Inspect', icon: 'inspect', hint: 'Tap Inspect to take a closer look' };
  }
  if (normalised.includes('buy') || normalised.includes('shop')) {
    return { label: 'Buy', icon: 'buy', hint: 'Tap Buy to shop' };
  }
  if (normalised.includes('use') || normalised.includes('place') || normalised.includes('choose')) {
    return { label: 'Use', icon: 'use', hint: 'Tap Use to continue' };
  }
  return { label: 'Interact', icon: 'interact', hint: 'Tap Interact to continue' };
}

export class DesktopConceptPresentationManager {
  private readonly presentations = new WeakMap<Phaser.Scene, DesktopConceptPresentation>();
  private readonly economy = new ShimmerEconomyService(getBrowserSaveService());

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (!shouldUseDesktopConceptPresentation()) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      if (!LOCATION_TITLES[scene.scene.key]) {
        continue;
      }
      if (!scene.children.getByName('exploration-shell-bag-button')) {
        continue;
      }

      const presentation = this.presentations.get(scene) ?? this.createPresentation(scene);
      this.syncLegacySuppression(scene);
      this.syncAction(scene, presentation);
      presentation.shimmerLabel.setText(`${this.economy.getBalance()} Shimmer`);
    }
  }

  private createPresentation(scene: Phaser.Scene): DesktopConceptPresentation {
    const objects: Phaser.GameObjects.GameObject[] = [];

    const navX = 278;
    const navY = 52;
    const navWidth = 524;
    const navHeight = 80;
    const navShadow = createFixedGraphics(scene, 'desktop-concept-nav-shadow', 197);
    drawPanelShadow(navShadow, navX, navY, navWidth, navHeight, 28, 7, 8, 0.2);
    const navSurface = createFixedGraphics(scene, 'desktop-concept-nav-group', 198);
    drawRoundedPanel(
      navSurface,
      navX,
      navY,
      navWidth,
      navHeight,
      28,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    navSurface.lineStyle(2, CONCEPT_UI.lavenderLine, 0.34);
    for (const dividerX of [150, 270, 390]) {
      navSurface.lineBetween(dividerX, 23, dividerX, 81);
    }
    objects.push(navShadow, navSurface);

    const navItems = [
      { x: 90, label: 'Map', icon: 'map' as const, action: () => void this.openInventory(scene, 'map') },
      { x: 210, label: 'Bag', icon: 'bag' as const, action: () => void this.openInventory(scene, 'items') },
      { x: 330, label: 'Book', icon: 'book' as const, action: () => void this.openWonderbook(scene) },
      { x: 465, label: 'Settings', icon: 'settings' as const, action: () => void this.openSettings(scene) },
    ];

    for (const item of navItems) {
      const hover = scene.add
        .rectangle(item.x, navY, item.label === 'Settings' ? 130 : 112, 66, CONCEPT_UI.purpleLight, 0)
        .setName(`desktop-concept-${item.label.toLowerCase()}-hover`)
        .setScrollFactor(0)
        .setDepth(199);
      const hit = scene.add
        .rectangle(item.x, navY, item.label === 'Settings' ? 136 : 118, 72, CONCEPT_UI.white, 0.001)
        .setName(`desktop-concept-${item.label.toLowerCase()}-button`)
        .setScrollFactor(0)
        .setDepth(200)
        .setInteractive({ useHandCursor: true });
      const icon = createFixedGraphics(scene, `desktop-concept-${item.label.toLowerCase()}-icon`, 201);
      drawConceptIcon(icon, item.icon, item.x, navY - 13, 0.92, CONCEPT_UI.purpleDeep);
      const label = scene.add
        .text(item.x, navY + 21, item.label, {
          color: '#4b2b66',
          fontFamily: UI_FONT,
          fontSize: item.label === 'Settings' ? '15px' : '16px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(202);
      hit.on('pointerover', () => hover.setFillStyle(CONCEPT_UI.purpleLight, 0.17));
      hit.on('pointerout', () => hover.setFillStyle(CONCEPT_UI.purpleLight, 0));
      hit.on('pointerdown', item.action);
      objects.push(hover, hit, icon, label);
    }

    const shimmerX = 700;
    const shimmerY = 52;
    const shimmerWidth = 210;
    const shimmerHeight = 62;
    const shimmerShadow = createFixedGraphics(scene, 'desktop-concept-shimmer-shadow', 197);
    drawPanelShadow(shimmerShadow, shimmerX, shimmerY, shimmerWidth, shimmerHeight, 28, 5, 6, 0.18);
    const shimmerSurface = createFixedGraphics(scene, 'desktop-concept-shimmer-surface', 198);
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
    const shimmerIcon = createFixedGraphics(scene, 'desktop-concept-shimmer-icon', 201);
    drawConceptIcon(shimmerIcon, 'shimmer', shimmerX - 72, shimmerY, 0.85, CONCEPT_UI.goldStrong);
    const shimmerLabel = scene.add
      .text(shimmerX + 12, shimmerY, '', {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: '18px',
        fontStyle: 'bold',
      })
      .setName('desktop-concept-shimmer-label')
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(202);
    objects.push(shimmerShadow, shimmerSurface, shimmerIcon, shimmerLabel);

    const locationX = 1044;
    const locationY = 52;
    const locationWidth = 370;
    const locationHeight = 62;
    const locationShadow = createFixedGraphics(scene, 'desktop-concept-location-shadow', 197);
    drawPanelShadow(locationShadow, locationX, locationY, locationWidth, locationHeight, 28, 5, 6, 0.18);
    const locationSurface = createFixedGraphics(scene, 'desktop-concept-location-surface', 198);
    drawRoundedPanel(
      locationSurface,
      locationX,
      locationY,
      locationWidth,
      locationHeight,
      28,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    const locationIcon = createFixedGraphics(scene, 'desktop-concept-location-icon', 201);
    drawConceptIcon(locationIcon, 'location', locationX - 140, locationY, 0.9, CONCEPT_UI.purpleDeep);
    const locationLabel = scene.add
      .text(locationX + 22, locationY, LOCATION_TITLES[scene.scene.key], {
        color: '#4b2b66',
        fontFamily: UI_FONT,
        fontSize: '19px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 270 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(202);
    objects.push(locationShadow, locationSurface, locationIcon, locationLabel);

    const actionX = 1040;
    const actionY = 578;
    const actionSurface = createFixedGraphics(scene, 'desktop-concept-action-surface', 198);
    const actionIcon = createFixedGraphics(scene, 'desktop-concept-action-icon', 202);
    const actionHit = scene.add
      .circle(actionX, actionY, 88, CONCEPT_UI.white, 0.001)
      .setName('desktop-concept-action-button')
      .setScrollFactor(0)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });
    const actionLabel = scene.add
      .text(actionX, actionY + 31, '', {
        color: '#fffaf1',
        fontFamily: UI_FONT,
        fontSize: '22px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(203);
    actionHit.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const legacy = scene.children.getByName('exploration-interaction-prompt');
      legacy?.emit('pointerdown', pointer);
    });
    actionHit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      const legacy = scene.children.getByName('exploration-interaction-prompt');
      legacy?.emit('pointerup', pointer);
    });
    actionHit.on('pointerout', (pointer: Phaser.Input.Pointer) => {
      const legacy = scene.children.getByName('exploration-interaction-prompt');
      legacy?.emit('pointerout', pointer);
    });
    objects.push(actionSurface, actionIcon, actionHit, actionLabel);

    const hintX = GAME_WIDTH / 2;
    const hintY = GAME_HEIGHT - 35;
    const hintWidth = 520;
    const hintHeight = 50;
    const hintSurface = createFixedGraphics(scene, 'desktop-concept-hint-surface', 198);
    drawPanelShadow(hintSurface, hintX, hintY, hintWidth, hintHeight, 24, 5, 6, 0.17);
    drawRoundedPanel(
      hintSurface,
      hintX,
      hintY,
      hintWidth,
      hintHeight,
      24,
      CONCEPT_UI.cream,
      CONCEPT_UI.lavenderLine,
      4,
    );
    const hintIcon = createFixedGraphics(scene, 'desktop-concept-hint-icon', 201);
    drawConceptIcon(hintIcon, 'hint', hintX - hintWidth / 2 + 31, hintY, 0.72, CONCEPT_UI.goldStrong);
    const hintText = scene.add
      .text(hintX + 10, hintY, '', {
        color: '#60436e',
        fontFamily: UI_FONT,
        fontSize: '16px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: 440 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(202);
    objects.push(hintSurface, hintIcon, hintText);

    const presentation = {
      objects,
      actionSurface,
      actionIcon,
      actionHit,
      actionLabel,
      hintSurface,
      hintIcon,
      hintText,
      shimmerLabel,
    };
    this.presentations.set(scene, presentation);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const object of objects) {
        object.destroy();
      }
      this.presentations.delete(scene);
    });
    return presentation;
  }

  private syncLegacySuppression(scene: Phaser.Scene): void {
    for (const name of LEGACY_NAMES) {
      disableLegacyObject(scene.children.getByName(name));
    }

    const suggestionPanel = scene.children.getByName('activity-suggestion-card');
    if (
      suggestionPanel instanceof Phaser.GameObjects.Rectangle &&
      suggestionPanel.visible
    ) {
      for (const object of scene.children.list) {
        if (object.name.startsWith('desktop-concept-')) {
          continue;
        }
        if (
          (object instanceof Phaser.GameObjects.Rectangle ||
            object instanceof Phaser.GameObjects.Arc ||
            object instanceof Phaser.GameObjects.Text) &&
          object.scrollFactorX === 0 &&
          object.depth >= 115 &&
          object.depth <= 119 &&
          object.x >= 0 &&
          object.x <= 460 &&
          object.y >= 0 &&
          object.y <= 230
        ) {
          object.setAlpha(0.001);
          object.disableInteractive();
        }
      }
    }
  }

  private syncAction(scene: Phaser.Scene, presentation: DesktopConceptPresentation): void {
    const legacyPrompt = scene.children.getByName('exploration-interaction-prompt');
    const legacyLabel = scene.children.getByName('exploration-interaction-prompt-label');
    const visible =
      legacyPrompt instanceof Phaser.GameObjects.Rectangle &&
      legacyLabel instanceof Phaser.GameObjects.Text &&
      legacyPrompt.visible &&
      legacyLabel.visible &&
      legacyLabel.text.trim().length > 0;

    if (legacyPrompt instanceof Phaser.GameObjects.Rectangle) {
      legacyPrompt.setAlpha(0.001).disableInteractive();
    }
    if (legacyLabel instanceof Phaser.GameObjects.Text) {
      legacyLabel.setAlpha(0.001).disableInteractive();
    }

    presentation.actionSurface.setVisible(visible);
    presentation.actionIcon.setVisible(visible);
    presentation.actionHit.setVisible(visible);
    presentation.actionLabel.setVisible(visible);
    presentation.hintSurface.setVisible(visible);
    presentation.hintIcon.setVisible(visible);
    presentation.hintText.setVisible(visible);
    if (!visible || !(legacyLabel instanceof Phaser.GameObjects.Text)) {
      presentation.actionHit.disableInteractive();
      return;
    }

    presentation.actionHit.setInteractive({ useHandCursor: true });
    const action = actionFromLegacyLabel(legacyLabel.text);
    presentation.actionSurface.clear();
    drawGlossyCircle(presentation.actionSurface, 1040, 578, 82, 'purple');
    drawConceptIcon(presentation.actionIcon, action.icon, 1040, 548, 1.05, CONCEPT_UI.white);
    presentation.actionLabel.setText(action.label);
    presentation.hintText.setText(action.hint);
  }

  private async openInventory(scene: Phaser.Scene, initialTab: 'items' | 'map'): Promise<void> {
    if (!scene.scene.isActive()) {
      return;
    }
    if (!scene.game.scene.keys.InventoryScene) {
      const { InventoryScene } = await import('../scenes/InventoryScene');
      scene.scene.add('InventoryScene', InventoryScene, false);
    }
    if (!scene.scene.isActive() || scene.scene.isActive('InventoryScene')) {
      return;
    }
    scene.scene.launch('InventoryScene', { returnScene: scene.scene.key, initialTab });
    scene.scene.pause();
  }

  private async openWonderbook(scene: Phaser.Scene): Promise<void> {
    if (!scene.scene.isActive()) {
      return;
    }
    if (!scene.game.scene.keys.WonderbookScene) {
      const { WonderbookScene } = await import('../scenes/WonderbookScene');
      scene.scene.add('WonderbookScene', WonderbookScene, false);
    }
    if (!scene.scene.isActive() || scene.scene.isActive('WonderbookScene')) {
      return;
    }
    scene.scene.launch('WonderbookScene', { returnScene: scene.scene.key });
    scene.scene.pause();
  }

  private async openSettings(scene: Phaser.Scene): Promise<void> {
    if (!scene.scene.isActive()) {
      return;
    }
    if (!scene.game.scene.keys.SettingsScene) {
      const { SettingsScene } = await import('../scenes/SettingsScene');
      scene.scene.add('SettingsScene', SettingsScene, false);
    }
    if (!scene.scene.isActive() || scene.scene.isActive('SettingsScene')) {
      return;
    }
    scene.scene.launch('SettingsScene', { returnScene: scene.scene.key });
    scene.scene.pause();
  }
}

let manager: DesktopConceptPresentationManager | null = null;

export function getDesktopConceptPresentationManager(
  game: Phaser.Game,
): DesktopConceptPresentationManager {
  manager ??= new DesktopConceptPresentationManager(game);
  return manager;
}
