import Phaser from 'phaser';
import type { DialogueChoice } from '../../content/contentTypes';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getQuestStepId } from '../quests/QuestEngine';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getPipEggDialogueId } from '../story/PipEggArc';

interface PipEggStorySceneData {
  returnScene?: string;
}

export class PipEggStoryScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private returnScene = 'MoonflowerGladeScene';
  private shouldNotifyTalk = false;
  private closing = false;

  public constructor() {
    super('PipEggStoryScene');
  }

  public create(data: PipEggStorySceneData): void {
    this.returnScene = data.returnScene ?? 'MoonflowerGladeScene';
    this.shouldNotifyTalk = false;
    this.closing = false;

    this.cameras.main.setBackgroundColor('#b9dfbd');
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xb9dfbd, 1);
    this.add.circle(180, 610, 320, 0x91cfa3, 0.42);
    this.add.circle(1100, 590, 330, 0x9ed5ad, 0.38);
    this.add.rectangle(GAME_WIDTH / 2, 600, GAME_WIDTH, 240, 0xe7d59a, 0.55);

    const pipX = GAME_WIDTH / 2;
    const pipY = 275;
    const body = this.add.circle(pipX, pipY, 70, 0xf3a4c8, 1).setDepth(3);
    const belly = this.add.ellipse(pipX, pipY + 22, 88, 68, 0xffd7e8, 0.95).setDepth(4);
    this.add.triangle(pipX - 35, pipY - 75, 0, 48, 25, 0, 48, 52, 0xe683b2, 1).setDepth(2);
    this.add.triangle(pipX + 34, pipY - 75, 0, 52, 24, 0, 49, 48, 0xe683b2, 1).setDepth(2);
    this.add.circle(pipX - 22, pipY - 12, 7, 0x563b66, 1).setDepth(5);
    this.add.circle(pipX + 22, pipY - 12, 7, 0x563b66, 1).setDepth(5);
    this.add
      .text(pipX, pipY + 110, 'Pip', {
        color: '#543965',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        backgroundColor: '#fff9eddd',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5)
      .setDepth(6);
    this.tweens.add({ targets: [body, belly], y: '-=7', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.dialogueCard = new DialogueCard(this, this.pointerInput);

    const questEngine = getBrowserQuestEngine();
    let progress = questEngine.getProgress(PIP_STRANGE_EGG_QUEST_ID);
    const awaitingIntroduction =
      progress.status === 'not-started' ||
      progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 0);
    if (progress.status === 'not-started') {
      progress = questEngine.startQuest(PIP_STRANGE_EGG_QUEST_ID);
    }

    const save = getBrowserSaveService().load();
    const dialogueId = awaitingIntroduction
      ? 'dialogue:pip-strange-egg-intro'
      : getPipEggDialogueId(save, progress);
    this.shouldNotifyTalk = awaitingIntroduction;
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
      getBrowserQuestEngine().notifyCharacterTalked('character:pip');
      this.shouldNotifyTalk = false;
    }
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
    this.scene.start(this.returnScene);
  }
}
