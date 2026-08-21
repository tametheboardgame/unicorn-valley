import Phaser from 'phaser';
import type { DialogueChoice, DialogueId } from '../../content/contentTypes';
import {
  RIPPLE_BROOK_QUEST_ID,
  RIPPLE_CHARACTER_ID,
} from '../../content/r5CrystalBrookStory';
import { SINGING_SHELL_ITEM_ID } from '../../content/r5CrystalBrook';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import { gameEventBus } from '../events/GameEventBus';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { InventoryService } from '../inventory/InventoryService';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getQuestStepId } from '../quests/QuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getRippleStoryPhase } from '../story/CrystalBrookStory';

interface RippleStorySceneData {
  returnScene?: string;
}

export class RippleStoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private returnScene = 'CrystalBrookScene';
  private shouldStartQuest = false;
  private shouldNotifyTalk = false;
  private closing = false;

  public constructor() {
    super('RippleStoryScene');
  }

  public create(data: RippleStorySceneData): void {
    this.returnScene = data.returnScene ?? 'CrystalBrookScene';
    this.shouldStartQuest = false;
    this.shouldNotifyTalk = false;
    this.closing = false;
    this.cameras.main.setBackgroundColor('#9adbd2');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xbfe8d7, 1);
    this.add.ellipse(GAME_WIDTH / 2, 620, 1180, 250, 0x63c7d4, 0.52);
    this.add.circle(210, 230, 190, 0xd5efc7, 0.42);
    this.add.circle(1090, 255, 220, 0x9dddbf, 0.34);

    this.add.circle(GAME_WIDTH / 2, 255, 88, 0xf3fff1, 0.98).setStrokeStyle(6, 0x63aebd, 1);
    this.add
      .text(GAME_WIDTH / 2, 250, '💧', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '68px',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 365, 'Ripple', {
        color: '#3f6671',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        backgroundColor: '#f5fff0e8',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.dialogueCard = new DialogueCard(this, this.pointerInput);

    const saveService = getBrowserSaveService();
    new RelationshipService(saveService).markMet(RIPPLE_CHARACTER_ID);
    const questEngine = getBrowserQuestEngine();
    const inventory = new InventoryService(saveService);
    let progress = questEngine.getProgress(RIPPLE_BROOK_QUEST_ID);

    if (
      progress.status === 'active' &&
      progress.currentStepId === getQuestStepId(RIPPLE_BROOK_QUEST_ID, 1) &&
      inventory.hasItem(SINGING_SHELL_ITEM_ID, 2)
    ) {
      gameEventBus.emit('ITEM_COLLECTED', { itemId: SINGING_SHELL_ITEM_ID, quantity: 2 });
      progress = questEngine.getProgress(RIPPLE_BROOK_QUEST_ID);
    }

    const phase = getRippleStoryPhase(progress);
    let dialogueId: DialogueId;
    if (phase === 'introduction') {
      dialogueId = 'dialogue:ripple-brook-song-intro';
      this.shouldStartQuest = progress.status === 'not-started';
      this.shouldNotifyTalk = true;
    } else if (phase === 'collecting') {
      dialogueId = 'dialogue:ripple-brook-song-reminder';
    } else if (phase === 'return-to-ripple') {
      dialogueId = 'dialogue:ripple-brook-song-return';
      this.shouldNotifyTalk = true;
    } else {
      dialogueId = 'dialogue:ripple-brook-song-followup';
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

    if (completedDialogue) {
      const questEngine = getBrowserQuestEngine();
      if (this.shouldStartQuest) {
        questEngine.startQuest(RIPPLE_BROOK_QUEST_ID);
      }
      if (this.shouldNotifyTalk) {
        questEngine.notifyCharacterTalked(RIPPLE_CHARACTER_ID);
      }

      const inventory = new InventoryService(getBrowserSaveService());
      if (
        questEngine.getProgress(RIPPLE_BROOK_QUEST_ID).currentStepId ===
          getQuestStepId(RIPPLE_BROOK_QUEST_ID, 1) &&
        inventory.hasItem(SINGING_SHELL_ITEM_ID, 2)
      ) {
        gameEventBus.emit('ITEM_COLLECTED', { itemId: SINGING_SHELL_ITEM_ID, quantity: 2 });
      }
    }

    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
    this.scene.start(this.returnScene);
  }
}
