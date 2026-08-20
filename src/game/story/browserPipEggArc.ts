import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { gameEventBus } from '../events/GameEventBus';
import { getBrowserSaveService } from '../save/browserSaveService';
import { PipEggArcService } from './PipEggArc';

let browserService: PipEggArcService | null = null;
let started = false;

export function getBrowserPipEggArcService(): PipEggArcService {
  browserService ??= new PipEggArcService(getBrowserSaveService());
  if (!started) {
    started = true;
    browserService.beginSession();
    gameEventBus.on('QUEST_COMPLETED', ({ questId }) => {
      if (questId !== PIP_STRANGE_EGG_QUEST_ID) {
        browserService?.recordActivity('quest');
      }
    });
    gameEventBus.on('DISCOVERY_UNLOCKED', ({ discoveryId }) => {
      if (
        !discoveryId.startsWith('discovery:pip-egg-clue-') &&
        discoveryId !== 'discovery:pip-strange-egg'
      ) {
        browserService?.recordActivity('discovery');
      }
    });
    gameEventBus.on('RACE_FINISHED', () => browserService?.recordActivity('race'));
  }
  return browserService;
}
