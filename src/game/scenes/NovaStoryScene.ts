import Phaser from 'phaser';
import type { DialogueChoice, DialogueId } from '../../content/contentTypes';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  NOVA_CHARACTER_ID,
  didWinNovaFirstRace,
  getNovaFirstRacePhase,
} from '../story/NovaFirstRaceStory';

interface NovaStorySceneData {
  returnScene?: string;
}

export class NovaStoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private returnScene = 'RainbowMeadowScene';
  private shouldNotifyTalk = false;
  private closing = false;

  public constructor() {
    super('NovaStoryScene');
  }

  public create(data: NovaStorySceneData): void {
    this.returnScene = data.returnScene ?? 'RainbowMeadowScene';
    this.shouldNotifyTalk = false;
    this.closing = false;
    this.cameras.main.setBackgroundColor('#9edfb3');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xa6dfa0, 1);
    this.add.circle(180, 610, 310, 0x79c58d, 0.42);
    this.add.circle(1090, 590, 330, 0x84ce92, 0.4);
    this.add.rectangle(GAME_WIDTH / 2, 592, GAME_WIDTH, 250, 0xead290, 0.64);

    const colours = [0xf18dad, 0xf5c968, 0x7cc6d8, 0xa6d77a, 0xc69be0];
    for (let index = 0; index < colours.length; index += 1) {
      this.add
        .triangle(430 + index * 105, 115, 0, 0, 72, 18, 0, 36, colours[index], 0.95)
        .setAngle(index % 2 === 0 ? 3 : -3);
    }

    this.add.circle(GAME_WIDTH / 2, 252, 91, 0xfff0c7, 0.98).setStrokeStyle(6, 0xb97fb6, 1);
    this.add
      .text(GAME_WIDTH / 2, 246, '🌟', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '72px',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 366, 'Nova', {
        color: '#654d70',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        backgroundColor: '#fff8e9dd',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.dialogueCard = new DialogueCard(this, this.pointerInput);

    const saveService = getBrowserSaveService();
    const relationships = new RelationshipService(saveService);
    relationships.markMet(NOVA_CHARACTER_ID);

    const questEngine = getBrowserQuestEngine();
    let progress = questEngine.getProgress(NOVA_FIRST_RACE_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = questEngine.startQuest(NOVA_FIRST_RACE_QUEST_ID);
    }

    const phase = getNovaFirstRacePhase(progress);
    let dialogueId: DialogueId;
    if (phase === 'invitation') {
      dialogueId = 'dialogue:nova-first-race-intro';
      this.shouldNotifyTalk = true;
    } else if (phase === 'ready-to-race') {
      dialogueId = 'dialogue:nova-first-race-reminder';
    } else if (phase === 'result-ready') {
      const save = saveService.load() ?? saveService.createNewGame();
      dialogueId = didWinNovaFirstRace(save)
        ? 'dialogue:nova-first-race-result-win'
        : 'dialogue:nova-first-race-result-finish';
      this.shouldNotifyTalk = true;
    } else {
      dialogueId = 'dialogue:nova-first-race-followup';
    }

    this.dialogueSession = new DialogueSession(dialogueRegistry.get(dialogueId));
    this.refreshDialogue();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.dialogueCard?.destroy();
      this.dialogueCard = null;
      this.dialogueSession = null;
    });
  }

  public update(): void {
    this.inputController?.update();
    if (!this.inputController || !this.dialogueSession) {
      return;
    }

    if (this.inputController.justPressed('BACK')) {
      this.closeStory(false);
      return;
    }

    if (!this.inputController.justPressed('INTERACT')) {
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (node?.type === 'line') {
      this.dialogueSession.advanceLine();
      this.refreshDialogue();
      return;
    }

    const choice = this.dialogueSession.getDefaultChoice();
    if (choice) {
      this.selectChoice(choice);
    }
  }

  private selectChoice(choice: DialogueChoice): void {
    if (!this.dialogueSession) {
      return;
    }

    this.dialogueSession.choose(choice.id);
    this.refreshDialogue();
  }

  private refreshDialogue(): void {
    if (!this.dialogueSession || this.dialogueSession.isComplete()) {
      this.closeStory(true);
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (!node) {
      this.closeStory(false);
      return;
    }

    const speaker = characterRegistry.get(node.speakerId);
    this.dialogueCard?.show(node, speaker.name, (choice) => this.selectChoice(choice));
  }

  private closeStory(completedDialogue: boolean): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    if (completedDialogue && this.shouldNotifyTalk) {
      getBrowserQuestEngine().notifyCharacterTalked(NOVA_CHARACTER_ID);
    }
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
    this.scene.start(this.returnScene);
  }
}
