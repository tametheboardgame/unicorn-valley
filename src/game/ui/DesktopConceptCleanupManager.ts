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
const LEGACY_INPUT_INSTRUCTION = /(?:\be\s*\/\s*enter\b|\benter\s*\/|\/\s*tap\b|\btap\s*:)/i;
const ATMOSPHERE_HUD_NAMES = [
  'atmospheric-time-control',
  'atmospheric-time-hint',
  'magical-weather-control',
  'magical-weather-hint',
] as const;

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

function visitSceneObjects(
  objects: readonly Phaser.GameObjects.GameObject[],
  visit: (object: Phaser.GameObjects.GameObject) => void,
): void {
  for (const object of objects) {
    visit(object);
    if (object instanceof Phaser.GameObjects.Container) {
      visitSceneObjects(object.list, visit);
    }
  }
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
    for (const scene of this.game.scene.getScenes(true)) {
      this.hideAtmosphereHud(scene);
      this.hideLegacyInputInstruction(scene);
    }

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

  private hideAtmosphereHud(scene: Phaser.Scene): void {
    for (const name of ATMOSPHERE_HUD_NAMES) {
      const object = scene.children.getByName(name);
      if (object instanceof Phaser.GameObjects.Text) {
        object.setVisible(false).disableInteractive();
      }
    }
  }

  private hideLegacyInputInstruction(scene: Phaser.Scene): void {
    visitSceneObjects(scene.children.list, (object) => {
      if (!(object instanceof Phaser.GameObjects.Text)) {
        return;
      }
      if (
        object.name.startsWith('desktop-concept-') ||
        object.name.startsWith('exploration-tablet-')
      ) {
        return;
      }
      const text = object.text.trim();
      if (LEGACY_ACTION_PROMPT.test(text) && LEGACY_INPUT_INSTRUCTION.test(text)) {
        object.setVisible(false).setAlpha(0.001).disableInteractive();
      }
    });
  }

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
        object.depth === 123 && object.x >= GAME_WIDTH - 260 && object.y >= GAME_HEIGHT - 110;
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
    visitSceneObjects(scene.children.list, (object) => {
      if (!(object instanceof Phaser.GameObjects.Text)) {
        return;
      }
      if (object.name.startsWith('desktop-concept-') || object.depth >= 190) {
        return;
      }

      const text = object.text.trim();
      const isOldActionPrompt = LEGACY_ACTION_PROMPT.test(text);
      const carriesOldInputInstruction = LEGACY_INPUT_INSTRUCTION.test(text);
      const isOldBottomAction =
        object.scrollFactorX === 0 && object.scrollFactorY === 0 && object.y >= GAME_HEIGHT - 190;

      if (isOldActionPrompt && (carriesOldInputInstruction || isOldBottomAction)) {
        object.setVisible(false).setAlpha(0.001).disableInteractive();
      }
    });
  }
}

let manager: DesktopConceptCleanupManager | null = null;

export function getDesktopConceptCleanupManager(game: Phaser.Game): DesktopConceptCleanupManager {
  manager ??= new DesktopConceptCleanupManager(game);
  return manager;
}
