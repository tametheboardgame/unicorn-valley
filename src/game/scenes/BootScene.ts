import Phaser from 'phaser';
import { getSecretDiscoveryWorldManager } from '../discovery/SecretDiscoveryWorldManager';
import { getClickToMoveManager } from '../input/ClickToMoveManager';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getRacePlaytestRecoveryManager } from '../racing/RacePlaytestRecoveryManager';
import { getRacePlayerControlManager } from '../racing/RacePlayerControlManager';
import { getBrowserPipEggArcService } from '../story/browserPipEggArc';
import { getPebbleCollectionWorldManager } from '../story/PebbleCollectionWorldManager';
import { getPipEggWorldManager } from '../story/PipEggWorldManager';
import { getVisualTighteningManager } from '../visual/VisualTighteningManager';
import { getR5RegionGatewayManager } from '../world/R5RegionGatewayManager';
import { getWorldCharacterPresentationManager } from '../world/WorldCharacterPresentationManager';
import { getWorldOcclusionManager } from '../world/WorldOcclusionManager';
import { getWorldTraversalPolishManager } from '../world/WorldTraversalPolishManager';

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
    getPebbleCollectionWorldManager(this.sys.game);
    getClickToMoveManager(this.sys.game);
    getWorldOcclusionManager(this.sys.game);
    getWorldCharacterPresentationManager(this.sys.game);
    getVisualTighteningManager(this.sys.game);
    getWorldTraversalPolishManager(this.sys.game);
    getR5RegionGatewayManager(this.sys.game);
    getRacePlayerControlManager(this.sys.game);
    getRacePlaytestRecoveryManager(this.sys.game);
    const requestedScene = new URLSearchParams(globalThis.location.search).get('scene');
    this.registry.set(
      'postPreloadScene',
      (requestedScene && DIAGNOSTIC_SCENES[requestedScene]) || 'TitleScene',
    );
    this.scene.start('PreloadScene');
  }
}
