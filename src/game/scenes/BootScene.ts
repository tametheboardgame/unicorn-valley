import Phaser from 'phaser';
import { getFireflyLanternWorldManager } from '../activities/FireflyLanternWorldManager';
import { getAtmosphericTimeWorldManager } from '../atmosphere/AtmosphericTimeWorldManager';
import { getMagicalWeatherWorldManager } from '../atmosphere/MagicalWeatherWorldManager';
import { getSecretDiscoveryWorldManager } from '../discovery/SecretDiscoveryWorldManager';
import { getWhisperingWoodsSecretWorldManager } from '../discovery/WhisperingWoodsSecretWorldManager';
import { getClickToMoveManager } from '../input/ClickToMoveManager';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getRacePlaytestRecoveryManager } from '../racing/RacePlaytestRecoveryManager';
import { getRacePlayerControlManager } from '../racing/RacePlayerControlManager';
import { getBrowserPipEggArcService } from '../story/browserPipEggArc';
import { getCrystalBrookStoryWorldManager } from '../story/CrystalBrookStoryWorldManager';
import { getLumiWoodsWorldManager } from '../story/LumiWoodsWorldManager';
import { getPebbleCollectionWorldManager } from '../story/PebbleCollectionWorldManager';
import { getPipEggWorldManager } from '../story/PipEggWorldManager';
import { getCoreNpcProductionPresentationManager } from '../visual/CoreNpcProductionPresentationManager';
import { getEnvironmentProductionPresentationManager } from '../visual/EnvironmentProductionPresentationManager';
import { getUiProductionPresentationManager } from '../visual/UiProductionPresentationManager';
import { getVisualTighteningManager } from '../visual/VisualTighteningManager';
import { getR5RegionGatewayManager } from '../world/R5RegionGatewayManager';
import { getWorldCharacterPresentationManager } from '../world/WorldCharacterPresentationManager';
import { getWorldOcclusionManager } from '../world/WorldOcclusionManager';
import { getWorldTraversalPolishManager } from '../world/WorldTraversalPolishManager';

export const SETTINGS_SCENE_REGISTERED_KEY = 'wp6.14:settings-scene-registered';

const DIAGNOSTIC_SCENES: Record<string, string> = {
  'resize-test': 'ResizeTestScene',
  'movement-test': 'MovementTestScene',
  'dialogue-test': 'DialogueTestScene',
  creator: 'UnicornCreatorScene',
  glade: 'MoonflowerGladeScene',
  cottage: 'CottageInteriorScene',
  village: 'SunbeamVillageScene',
  meadow: 'RainbowMeadowScene',
  brook: 'CrystalBrookScene',
  woods: 'WhisperingWoodsScene',
  inventory: 'InventoryScene',
  shop: 'ShopScene',
  wonderbook: 'WonderbookScene',
  'firefly-lantern': 'FireflyLanternScene',
  'ripple-story': 'RippleStoryScene',
  'lumi-story': 'LumiStoryScene',
  'nova-story': 'NovaStoryScene',
  'nova-race': 'NovaTutorialRaceScene',
  'pebble-story': 'PebbleStoryScene',
  'pip-egg-story': 'PipEggStoryScene',
  'pip-egg-hatch': 'PipEggHatchScene',
  race: 'RaceScene',
};

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public create(): void {
    getBrowserQuestEngine();
    getBrowserPipEggArcService();
    getPipEggWorldManager(this.sys.game);
    getSecretDiscoveryWorldManager(this.sys.game);
    getWhisperingWoodsSecretWorldManager(this.sys.game);
    getPebbleCollectionWorldManager(this.sys.game);
    getCrystalBrookStoryWorldManager(this.sys.game);
    getLumiWoodsWorldManager(this.sys.game);
    getFireflyLanternWorldManager(this.sys.game);
    getAtmosphericTimeWorldManager(this.sys.game);
    getMagicalWeatherWorldManager(this.sys.game);
    getClickToMoveManager(this.sys.game);
    getWorldOcclusionManager(this.sys.game);
    getWorldCharacterPresentationManager(this.sys.game);
    getCoreNpcProductionPresentationManager(this.sys.game);
    getVisualTighteningManager(this.sys.game);
    getWorldTraversalPolishManager(this.sys.game);
    getEnvironmentProductionPresentationManager(this.sys.game);
    getUiProductionPresentationManager(this.sys.game);
    getR5RegionGatewayManager(this.sys.game);
    getRacePlayerControlManager(this.sys.game);
    getRacePlaytestRecoveryManager(this.sys.game);
    void import('../settings/TitleSettingsEnhancementManager').then(
      ({ getTitleSettingsEnhancementManager }) => {
        getTitleSettingsEnhancementManager(this.sys.game);
      },
    );

    const requestedScene = new URLSearchParams(globalThis.location.search).get('scene');
    if (requestedScene === 'settings') {
      void this.startSettingsDiagnostic();
      return;
    }

    this.registry.set(
      'postPreloadScene',
      (requestedScene && DIAGNOSTIC_SCENES[requestedScene]) || 'TitleScene',
    );
    this.scene.start('PreloadScene');
  }

  private async startSettingsDiagnostic(): Promise<void> {
    const { SettingsScene } = await import('./SettingsScene');
    this.scene.add('SettingsScene', SettingsScene, false);
    this.registry.set(SETTINGS_SCENE_REGISTERED_KEY, true);
    this.registry.set('postPreloadScene', 'SettingsScene');
    this.scene.start('PreloadScene');
  }
}
