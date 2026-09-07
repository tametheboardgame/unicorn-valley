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

const LEGACY_ACTION_PROMPT =
  /^(talk(?:\s+to)?|speak(?:\s+to)?|sit|enter|inspect|interact|start|play|buy|shop|use|read|look|visit|open|pick|choose|place)\b/i;

function usesDesktopConceptPresentation(): boolean {
  return (
    !browserUsesLandscapeTabletPresentation() &&
    globalThis.innerWidth >= 800 &&
    globalThis.innerHeight >= 500 &&
    globalThis.innerWidth > globalThis.innerHeight
  );
}

function approximately(value: number, target: number, tolerance = 18): boolean {
  return Math.abs(value - target) <= tolerance;
}

function hideRectangle(object: Phaser.GameObjects.Rectangle): void {
  object.setAlpha(0.001);
  object.setFillStyle(object.fillColor, 0.001);
  object.disableInteractive();
}

export class DesktopConceptCleanupManager {
  private readonly locationLabels = new WeakMap<Phaser.Scene, Phaser.GameObjects.Text>();

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

      this.ensureConceptLocationLabel(scene, locationTitle);
      this.hideLegacyLocationCopy(scene, locationTitle);
      this.hideLegacyShadows(scene);
      this.hideLegacyInteractionCopy(scene);
    }
  };

  private ensureConceptLocationLabel(scene: Phaser.Scene, locationTitle: string): void {
    let label = this.locationLabels.get(scene);
    if (!label) {
      label = scene.add
        .text(1066, 52, locationTitle, {
          color: '#4b2b66',
          fontFamily: UI_FONT,
          fontSize: '19px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 270 },
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
    label.setText(locationTitle).setVisible(true).setAlpha(1);
  }

  private hideLegacyLocationCopy(scene: Phaser.Scene, locationTitle: string): void {
    for (const object of scene.children.list) {
      if (
        object instanceof Phaser.GameObjects.Text &&
        object.name !== 'desktop-concept-location-overlay-label' &&
        !object.name.startsWith('desktop-concept-') &&
        object.scrollFactorX === 0 &&
        object.y < 180 &&
        object.text.trim() === locationTitle
      ) {
        object.setAlpha(0.001).disableInteractive();
      }
    }
  }

  private hideLegacyShadows(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Rectangle)) {
        continue;
      }
      if (
        object.name.startsWith('desktop-concept-') ||
        object.scrollFactorX !== 0 ||
        object.scrollFactorY !== 0
      ) {
        continue;
      }

      const oldTopButtonShadow =
        object.depth === 119 &&
        approximately(object.y, 60, 20) &&
        object.displayHeight >= 50 &&
        object.displayHeight <= 100;
      const oldTitleShadow =
        object.depth === 123 &&
        approximately(object.x, GAME_WIDTH / 2) &&
        approximately(object.y, 43) &&
        object.displayWidth >= 300;
      const oldControlsShadow =
        object.depth === 123 &&
        object.x >= GAME_WIDTH - 260 &&
        object.y >= GAME_HEIGHT - 110;
      const oldInteractionShadow =
        object.depth === 119 &&
        approximately(object.x, GAME_WIDTH / 2, 28) &&
        object.y >= GAME_HEIGHT - 170 &&
        object.displayWidth >= 420;

      if (oldTopButtonShadow || oldTitleShadow || oldControlsShadow || oldInteractionShadow) {
        hideRectangle(object);
      }
    }
  }

  private hideLegacyInteractionCopy(scene: Phaser.Scene): void {
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text)) {
        continue;
      }
      if (
        object.name.startsWith('desktop-concept-') ||
        object.depth >= 190 ||
        object.scrollFactorX !== 0 ||
        object.scrollFactorY !== 0
      ) {
        continue;
      }

      const text = object.text.trim();
      const isOldActionPrompt = LEGACY_ACTION_PROMPT.test(text);
      const carriesOldInputInstruction =
        /\b(?:e\s*\/\s*enter|enter\s*\/|\/\s*tap\b|tap\s*:)\b/i.test(text);

      if (isOldActionPrompt && (carriesOldInputInstruction || object.y >= GAME_HEIGHT - 190)) {
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
