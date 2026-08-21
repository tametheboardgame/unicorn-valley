import Phaser from 'phaser';
import type { DialogueChoice, DialogueId } from '../../content/contentTypes';
import { PEBBLE_CHARACTER_ID, PEBBLE_COLLECTION_QUEST_ID } from '../../content/r4PebbleStory';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getPebbleStoryPhase } from '../story/PebbleCollectionStory';

interface PebbleStorySceneData {
  returnScene?: string;
}

export class PebbleStoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private relationships: RelationshipService | null = null;
  private returnScene = 'SunbeamVillageScene';
  private shouldStartQuest = false;
  private shouldNotifyTalk = false;
  private closing = false;

  public constructor() {
    super('PebbleStoryScene');
  }

  public create(data: PebbleStorySceneData): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.shouldStartQuest = false;
    this.shouldNotifyTalk = false;
    this.closing = false;
    this.cameras.main.setBackgroundColor('#b9c1ae');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xc9d0ba, 1);
    this.add.circle(190, 590, 260, 0x8ca087, 0.34);
    this.add.circle(1090, 600, 310, 0x9da58c, 0.3);
    this.add.rectangle(GAME_WIDTH / 2, 585, GAME_WIDTH, 275, 0xc9aa78, 0.5);

    this.add.circle(GAME_WIDTH / 2, 260, 88, 0xfff2cf, 0.96).setStrokeStyle(6, 0x77806d, 1);
    this.add
      .text(GAME_WIDTH / 2, 250, '🪨', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '70px',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 362, 'Pebble', {
        color: '#4f594b',
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
    this.relationships = new RelationshipService(saveService);
    this.relationships.markMet(PEBBLE_CHARACTER_ID);

    const questEngine = getBrowserQuestEngine();
    let progress = questEngine.getProgress(PEBBLE_COLLECTION_QUEST_ID);
    if (progress.status === 'active') {
      progress = questEngine.startQuest(PEBBLE_COLLECTION_QUEST_ID);
    }

    const phase = getPebbleStoryPhase(progress);
    let dialogueId: DialogueId;
    if (phase === 'introduction') {
      dialogueId = 'dialogue:pebble-odd-things-intro';
      this.shouldStartQuest = true;
    } else if (phase === 'collecting') {
      dialogueId = 'dialogue:pebble-odd-things-reminder';
    } else if (phase === 'return-to-pebble') {
      dialogueId = 'dialogue:pebble-odd-things-return';
      this.shouldNotifyTalk = true;
    } else if (phase === 'completed') {
      dialogueId = 'dialogue:pebble-odd-things-followup';
    } else {
      dialogueId = 'dialogue:pebble-odd-things-return';
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
      this.relationships = null;
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
    if (completedDialogue && this.shouldStartQuest) {
      getBrowserQuestEngine().startQuest(PEBBLE_COLLECTION_QUEST_ID);
    }
    if (completedDialogue && this.shouldNotifyTalk) {
      getBrowserQuestEngine().notifyCharacterTalked(PEBBLE_CHARACTER_ID);
    }
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
    this.scene.start(this.returnScene);
  }
}
