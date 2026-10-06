import type Phaser from 'phaser';
import { getAmbientPopulationWorldManager } from '../population/AmbientPopulationWorldManager';
import { getTitleSettingsEnhancementManager } from '../settings/TitleSettingsEnhancementManager';
import { getCoreNpcProductionPresentationManager } from '../visual/CoreNpcProductionPresentationManager';

export function startBootDeferredManagers(game: Phaser.Game): void {
  getCoreNpcProductionPresentationManager(game);
  getAmbientPopulationWorldManager(game);
  getTitleSettingsEnhancementManager(game);
}
