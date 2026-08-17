import Phaser from 'phaser';
import type { DialogueChoice, DialogueId } from '../../content/contentTypes';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { DialogueCard } from '../dialogue/DialogueCard';
import { selectDialogueVariant } from '../dialogue/DialogueConditions';
import { DialogueSession } from '../dialogue/DialogueSession';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';
import {
  WILLOW_CHARACTER_ID,
  getWillowStoryPhase,
} from '../story/WillowMoonflowersStory';

interface WillowStorySceneData {
  returnScene?: string;
}

export class WillowStoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private returnScene = 'SunbeamVillageScene';
  private shouldNotifyTalk = false;
  private closing = false;

  public constructor() {
    super('WillowStoryScene');
  }

  public create(data: WillowStorySceneData): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.shouldNotifyTalk = false;
    this.closing = false;
    this.cameras.main.setBackgroundColor('#91c989');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xa8dc95, 1);
    this.add.circle(220, 570, 260, 0x72b47d, 0.45);
    this.add.circle(1070, 610, 310, 0x79b983, 0.42);
    this.add.rectangle(GAME_WIDTH / 2, 580, GAME_WIDTH, 280, 0xd7b77c, 0.55);

    this.add.circle(GAME_WIDTH / 2, 260, 88, 0xfff0c7, 0.95).setStrokeStyle(6, 0x72a970, 1);
    this.add
      .text(GAME_WIDTH / 2, 250, '🌿', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '70px',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 362, 'Willow', {
        color: '#49614c',
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

    const relationships = new RelationshipService(getBrowserSaveService());
    relationships.markMet(WILLOW_CHARACTER_ID);

    const questEngine = getBrowserQuestEngine();
    let progress = questEngine.getProgress(WILLOW_MOONFLOWERS_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = questEngine.startQuest(WILLOW_MOONFLOWERS_QUEST_ID);
    }

    const phase = getWillowStoryPhase(progress);
    let dialogueId: DialogueId;
    if (phase === 'introduction') {
      dialogueId = 'dialogue:willow-moonflowers-intro';
      this.shouldNotifyTalk = true;
    } else if (phase === 'collecting') {
      dialogueId = 'dialogue:willow-moonflowers-reminder';
    } else if (phase === 'return-to-willow' || phase === 'resolving') {
      dialogueId = 'dialogue:willow-moonflowers-return';
      this.shouldNotifyTalk = phase === 'return-to-willow';
    } else {
      dialogueId =
        selectDialogueVariant(
          [
            {
              dialogueId: 'dialogue:willow-moonflowers-friend-followup',
              conditions: [
                {
                  type: 'minimum-friendship-tier',
                  characterId: WILLOW_CHARACTER_ID,
                  tier: 'friend',
                },
              ],
            },
            { dialogueId: 'dialogue:willow-moonflowers-followup' },
          ],
          relationships,
        )?.id ?? 'dialogue:willow-moonflowers-followup';
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
      getBrowserQuestEngine().notifyCharacterTalked(WILLOW_CHARACTER_ID);
    }
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
    this.scene.start(this.returnScene);
  }
}
