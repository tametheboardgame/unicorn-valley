import Phaser from 'phaser';
import type { DialogueChoice, DialogueId } from '../../content/contentTypes';
import {
  LUMI_CHARACTER_ID,
  LUMI_INTRO_RELATIONSHIP_FLAG,
} from '../../content/r5LumiWoodsStory';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';

interface LumiStorySceneData {
  returnScene?: string;
}

export class LumiStoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private relationships: RelationshipService | null = null;
  private returnScene = 'WhisperingWoodsScene';
  private isFirstConversation = false;
  private closing = false;

  public constructor() {
    super('LumiStoryScene');
  }

  public create(data: LumiStorySceneData): void {
    this.returnScene = data.returnScene ?? 'WhisperingWoodsScene';
    this.closing = false;
    this.cameras.main.setBackgroundColor('#263f46');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x2d4f4c, 1);
    this.add.circle(210, 250, 220, 0x476d5b, 0.44);
    this.add.circle(1080, 230, 230, 0x3b5c65, 0.42);
    this.add.ellipse(GAME_WIDTH / 2, 620, 1050, 230, 0x1f3942, 0.72);
    for (const [x, y, size] of [
      [390, 175, 8],
      [510, 230, 6],
      [760, 165, 7],
      [900, 250, 6],
    ] as const) {
      this.add.circle(x, y, size, 0xd9f7ad, 0.8);
    }

    this.add.circle(GAME_WIDTH / 2, 255, 88, 0xe7f4df, 0.98).setStrokeStyle(6, 0x8eb18d, 1);
    this.add
      .text(GAME_WIDTH / 2, 250, '✨', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '66px',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 365, 'Lumi', {
        color: '#dcefd6',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        backgroundColor: '#284940e8',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5);

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.dialogueCard = new DialogueCard(this, this.pointerInput);

    this.relationships = new RelationshipService(getBrowserSaveService());
    this.relationships.markMet(LUMI_CHARACTER_ID);
    this.isFirstConversation = !this.relationships.hasFlag(
      LUMI_CHARACTER_ID,
      LUMI_INTRO_RELATIONSHIP_FLAG,
    );
    const dialogueId: DialogueId = this.isFirstConversation
      ? 'dialogue:lumi-starwell-intro'
      : 'dialogue:lumi-starwell-followup';
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

    if (completedDialogue && this.isFirstConversation && this.relationships) {
      this.relationships.addFriendship(LUMI_CHARACTER_ID, 8);
      this.relationships.addFlag(LUMI_CHARACTER_ID, LUMI_INTRO_RELATIONSHIP_FLAG);
    }

    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
    this.scene.start(this.returnScene);
  }
}
