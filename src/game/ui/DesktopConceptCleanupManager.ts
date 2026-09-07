import Phaser from 'phaser';
import { getBrowserAtmosphericTimeService } from '../atmosphere/AtmosphericTimeService';
import { getBrowserMagicalWeatherService } from '../atmosphere/MagicalWeatherService';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { getBrowserSaveService } from '../save/browserSaveService';
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

const LEGACY_ACTION_PROMPT =
  /^(talk(?:\s+to)?|speak(?:\s+to)?|sit|enter|inspect|interact|start|play|buy|shop|use|read|look|visit|open|pick|choose|place)\b/i;
const LEGACY_INPUT_INSTRUCTION = /(?:\be\s*\/\s*enter\b|\benter\s*\/|\/\s*tap\b|\btap\s*:)/i;
const ATMOSPHERE_HUD_NAMES = [
  'atmospheric-time-control',
  'atmospheric-time-hint',
  'magical-weather-control',
  'magical-weather-hint',
] as const;

interface AtmosphereSettingsPresentation {
  objects: Phaser.GameObjects.GameObject[];
  timeButton: Phaser.GameObjects.Rectangle;
  timeLabel: Phaser.GameObjects.Text;
  weatherButton: Phaser.GameObjects.Rectangle;
  weatherLabel: Phaser.GameObjects.Text;
}

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
  private readonly atmosphereSettings = new WeakMap<Phaser.Scene, AtmosphereSettingsPresentation>();
  private readonly saveService = getBrowserSaveService();
  private readonly atmosphericTime = getBrowserAtmosphericTimeService(this.saveService);
  private readonly magicalWeather = getBrowserMagicalWeatherService(this.saveService);

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
      if (scene.scene.key === 'SettingsScene') {
        this.ensureAtmosphereSettings(scene);
      }
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
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text)) {
        continue;
      }
      if (
        object.name.startsWith('desktop-concept-') ||
        object.name.startsWith('exploration-tablet-')
      ) {
        continue;
      }
      const text = object.text.trim();
      if (LEGACY_ACTION_PROMPT.test(text) && LEGACY_INPUT_INSTRUCTION.test(text)) {
        object.setVisible(false).setAlpha(0.001).disableInteractive();
      }
    }
  }

  private ensureAtmosphereSettings(scene: Phaser.Scene): void {
    let presentation = this.atmosphereSettings.get(scene);
    if (!presentation?.timeButton.active) {
      const status = scene.children.getByName('settings-status');
      if (status instanceof Phaser.GameObjects.Text) {
        status.setVisible(false);
      }

      const objects: Phaser.GameObjects.GameObject[] = [];
      const timeX = GAME_WIDTH / 2 - 150;
      const weatherX = GAME_WIDTH / 2 + 150;
      const y = 610;
      const width = 280;
      const height = 48;

      const timeShadow = createUiShadow(scene, timeX, y, width, height, 4, 0.13);
      const timeButton = scene.add
        .rectangle(timeX, y, width, height, UI_COLOURS.lavender, 1)
        .setName('settings-atmosphere-time')
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 1)
        .setDepth(5)
        .setInteractive({ useHandCursor: true });
      const timeLabel = scene.add
        .text(timeX, y, '', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
        })
        .setName('settings-atmosphere-time-label')
        .setOrigin(0.5)
        .setDepth(6);

      const weatherShadow = createUiShadow(scene, weatherX, y, width, height, 4, 0.13);
      const weatherButton = scene.add
        .rectangle(weatherX, y, width, height, UI_COLOURS.lavender, 1)
        .setName('settings-atmosphere-weather')
        .setStrokeStyle(3, UI_COLOURS.lavenderStrong, 1)
        .setDepth(5)
        .setInteractive({ useHandCursor: true });
      const weatherLabel = scene.add
        .text(weatherX, y, '', {
          color: UI_COLOURS.ink,
          fontFamily: UI_FONT,
          fontSize: '15px',
          fontStyle: 'bold',
        })
        .setName('settings-atmosphere-weather-label')
        .setOrigin(0.5)
        .setDepth(6);

      applyButtonHover(timeButton, UI_COLOURS.lavender, UI_COLOURS.gold);
      applyButtonHover(weatherButton, UI_COLOURS.lavender, UI_COLOURS.gold);
      timeButton.on('pointerdown', () => this.atmosphericTime.cycleMode());
      weatherButton.on('pointerdown', () => this.magicalWeather.cycleMode());

      objects.push(timeShadow, timeButton, timeLabel, weatherShadow, weatherButton, weatherLabel);
      presentation = { objects, timeButton, timeLabel, weatherButton, weatherLabel };
      this.atmosphereSettings.set(scene, presentation);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        for (const object of objects) {
          object.destroy();
        }
        this.atmosphereSettings.delete(scene);
      });
    }

    const status = scene.children.getByName('settings-status');
    if (status instanceof Phaser.GameObjects.Text) {
      status.setVisible(false);
    }
    const timeDefinition = this.atmosphericTime.getDefinition();
    const timeMode = this.atmosphericTime.getMode() === 'auto' ? 'Auto' : 'Manual';
    presentation.timeLabel.setText(
      `Time: ${timeDefinition.icon} ${timeDefinition.label} · ${timeMode}`,
    );

    const weatherDefinition = this.magicalWeather.getDefinition();
    const weatherMode = this.magicalWeather.getMode() === 'auto' ? 'Auto' : 'Manual';
    presentation.weatherLabel.setText(
      `Weather: ${weatherDefinition.icon} ${weatherDefinition.label} · ${weatherMode}`,
    );
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
    for (const object of scene.children.list) {
      if (!(object instanceof Phaser.GameObjects.Text)) {
        continue;
      }
      if (object.name.startsWith('desktop-concept-') || object.depth >= 190) {
        continue;
      }

      const text = object.text.trim();
      const isOldActionPrompt = LEGACY_ACTION_PROMPT.test(text);
      const carriesOldInputInstruction = LEGACY_INPUT_INSTRUCTION.test(text);
      const isOldBottomAction =
        object.scrollFactorX === 0 && object.scrollFactorY === 0 && object.y >= GAME_HEIGHT - 190;

      if (isOldActionPrompt && (carriesOldInputInstruction || isOldBottomAction)) {
        object.setVisible(false).setAlpha(0.001).disableInteractive();
      }
    }
  }
}

let manager: DesktopConceptCleanupManager | null = null;

export function getDesktopConceptCleanupManager(game: Phaser.Game): DesktopConceptCleanupManager {
  manager ??= new DesktopConceptCleanupManager(game);
  return manager;
}
