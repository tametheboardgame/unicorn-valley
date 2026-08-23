import Phaser from 'phaser';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { selectRaceCourse } from '../racing/RaceCourse';
import { getNovaFirstRacePhase } from '../story/NovaFirstRaceStory';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';

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
      selectRaceCourse(SUNRISE_SPRINT_RACE_ID);
      this.scene.start('RaceScene');
      return;
    }

    this.scene.start('NovaStoryScene', { returnScene: 'RainbowMeadowScene' });
  }
}
