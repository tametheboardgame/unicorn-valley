import Phaser from 'phaser';
import { getClickToMoveManager } from '../input/ClickToMoveManager';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';

const DIAGNOSTIC_SCENES: Record<string, string> = {
  'resize-test': 'ResizeTestScene',
  'movement-test': 'MovementTestScene',
  'dialogue-test': 'DialogueTestScene',
  creator: 'UnicornCreatorScene',
  glade: 'MoonflowerGladeScene',
  cottage: 'CottageInteriorScene',
};

export class BootScene extends Phaser.Scene {
  public constructor() {
    super('BootScene');
  }

  public create(): void {
    getBrowserQuestEngine();
    getClickToMoveManager(this.sys.game);
    const requestedScene = new URLSearchParams(globalThis.location.search).get('scene');
    this.registry.set(
      'postPreloadScene',
      (requestedScene && DIAGNOSTIC_SCENES[requestedScene]) || 'TitleScene',
    );
    this.scene.start('PreloadScene');
  }
}
