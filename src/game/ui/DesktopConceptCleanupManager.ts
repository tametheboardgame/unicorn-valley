import Phaser from 'phaser';
import { GAME_HEIGHT } from '../config/gameConstants';
import { browserUsesLandscapeTabletPresentation } from './LandscapeTabletPresentation';

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

function hideRectangle(object: Phaser.GameObjects.Rectangle): void {
  object.setAlpha(0.001);
  object.disableInteractive();
}

export class DesktopConceptCleanupManager {
  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private readonly update = (): void => {
    if (!usesDesktopConceptPresentation()) {
      return;
    }

    for (const scene of this.game.scene.getScenes(true)) {
      const locationTitle = LOCATION_TITLES[scene.scene.key];
      if (!locationTitle || !scene.children.getByName('desktop-concept-map-button')) {
        continue;
      }

      this.restoreConceptLocationLabel(scene, locationTitle);
      this.hideLegacyShadows(scene);
      this.hideLegacyInteractionCopy(scene);
    }
  };

  private restoreConceptLocationLabel(scene: Phaser.Scene, locationTitle: string): void {
    for (const object of scene.children.list) {
      if (
        object instanceof Phaser.GameObjects.Text &&
        object.text.trim() === locationTitle &&
        object.depth >= 190 &&
        object.x > 800
      ) {
        object.setVisible(true).setAlpha(1);
      }
    }
  }

  private hideLegacyShadows(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Rectangle)) {
        continue;
      }
      if (object.name.length > 0 || object.scrollFactorX !== 0 || object.scrollFactorY !== 0) {
        continue;
      }
      if (object.alpha > 0.35 || object.depth < 115 || object.depth > 124) {
        continue;
      }

      const legacyTopShadow = object.y <= 105 && object.x > 500;
      const legacyBottomShadow =
        object.y >= GAME_HEIGHT - 150 && (object.x > 500 || object.displayWidth >= 350);
      if (legacyTopShadow || legacyBottomShadow) {
        hideRectangle(object);
      }
    }
  }

  private hideLegacyInteractionCopy(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text)) {
        continue;
      }
      if (object.depth >= 190 || object.scrollFactorX !== 0 || object.y < GAME_HEIGHT - 170) {
        continue;
      }

      const text = object.text.trim().toLowerCase();
      if (
        text.startsWith('talk to ') ||
        text.startsWith('speak to ') ||
        text.startsWith('interact') ||
        text.startsWith('enter ')
      ) {
        object.setAlpha(0.001).disableInteractive();
      }
    }
  }
}

let manager: DesktopConceptCleanupManager | null = null;

export function getDesktopConceptCleanupManager(game: Phaser.Game): DesktopConceptCleanupManager {
  manager ??= new DesktopConceptCleanupManager(game);
  return manager;
}
