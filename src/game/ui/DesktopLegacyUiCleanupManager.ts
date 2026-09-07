import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
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

function usesDesktopConceptPresentation(): boolean {
  return (
    !browserUsesLandscapeTabletPresentation() &&
    globalThis.innerWidth >= 800 &&
    globalThis.innerHeight >= 500 &&
    globalThis.innerWidth > globalThis.innerHeight
  );
}

function approximately(value: number, target: number, tolerance = 10): boolean {
  return Math.abs(value - target) <= tolerance;
}

function isLegacyShadow(object: Phaser.GameObjects.GameObject): boolean {
  if (!(object instanceof Phaser.GameObjects.Rectangle) || object.scrollFactorX !== 0) {
    return false;
  }
  if (object.name.startsWith('desktop-concept-')) {
    return false;
  }

  const topShellShadow =
    object.depth === 119 &&
    approximately(object.y, 60, 16) &&
    object.displayHeight >= 55 &&
    object.displayHeight <= 90;
  const oldLocationShadow =
    object.depth === 123 &&
    approximately(object.x, GAME_WIDTH / 2, 16) &&
    approximately(object.y, 43, 16) &&
    object.displayWidth >= 300;
  const oldControlsShadow =
    object.depth === 123 &&
    object.x >= GAME_WIDTH - 240 &&
    object.y >= GAME_HEIGHT - 90;
  const oldInteractionShadow =
    object.depth === 119 &&
    approximately(object.x, GAME_WIDTH / 2, 20) &&
    object.y >= GAME_HEIGHT - 150 &&
    object.displayWidth >= 420;

  return topShellShadow || oldLocationShadow || oldControlsShadow || oldInteractionShadow;
}

export class DesktopLegacyUiCleanupManager {
  private readonly locationLabels = new WeakMap<Phaser.Scene, Phaser.GameObjects.Text>();

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (!usesDesktopConceptPresentation()) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      const locationTitle = LOCATION_TITLES[scene.scene.key];
      if (!locationTitle || !scene.children.getByName('desktop-concept-location-surface')) {
        continue;
      }

      for (const object of scene.children.list) {
        if (isLegacyShadow(object)) {
          object.setAlpha(0.001);
        }
        if (
          object instanceof Phaser.GameObjects.Text &&
          object.name !== 'desktop-concept-location-overlay-label' &&
          object.scrollFactorX === 0 &&
          object.y < 180 &&
          object.text.trim() === locationTitle
        ) {
          object.setAlpha(0.001);
        }
      }

      let label = this.locationLabels.get(scene);
      if (!label) {
        label = scene.add
          .text(1066, 52, locationTitle, {
            color: '#4b2b66',
            fontFamily: UI_FONT,
            fontSize: '19px',
            fontStyle: 'bold',
            align: 'center',
          })
          .setName('desktop-concept-location-overlay-label')
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(212);
        this.locationLabels.set(scene, label);
        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
          label?.destroy();
          this.locationLabels.delete(scene);
        });
      }
      label.setText(locationTitle).setAlpha(1).setVisible(true);
    }
  }
}

let manager: DesktopLegacyUiCleanupManager | null = null;

export function getDesktopLegacyUiCleanupManager(game: Phaser.Game): DesktopLegacyUiCleanupManager {
  manager ??= new DesktopLegacyUiCleanupManager(game);
  return manager;
}
