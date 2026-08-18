import Phaser from 'phaser';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getNovaFirstRacePhase } from '../story/NovaFirstRaceStory';

export class RainbowRunEntryScene extends Phaser.Scene {
  public constructor() {
    super('RainbowRunEntryScene');
  }

  public create(): void {
    const progress = getBrowserQuestEngine().getProgress(NOVA_FIRST_RACE_QUEST_ID);
    const phase = getNovaFirstRacePhase(progress);

    if (phase === 'ready-to-race') {
      this.scene.start('NovaTutorialRaceScene');
      return;
    }

    if (phase === 'complete') {
      this.scene.start('RaceScene');
      return;
    }

    this.scene.start('NovaStoryScene', { returnScene: 'RainbowMeadowScene' });
  }
}
