import Phaser from 'phaser';
import type { DialogueChoice, DialogueId } from '../../content/contentTypes';
import {
  characterRegistry,
  dialogueRegistry,
  dialogueVariantSetRegistry,
} from '../../content/registries';
import {
  MARIGOLD_CHARACTER_ID,
  MARIGOLD_PICNIC_QUEST_ID,
  MARIGOLD_PICNIC_VARIANTS_ID,
} from '../../content/r4PicnicEvent';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';
import { DialogueCard } from '../dialogue/DialogueCard';
import { selectDialogueVariantSet } from '../dialogue/DialogueConditions';
import { DialogueSession } from '../dialogue/DialogueSession';
import { applyDialogueEffects } from '../dialogue/applyDialogueEffects';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';

interface MarigoldPicnicSceneData {
  returnScene?: string;
}

export class MarigoldPicnicScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private relationships: RelationshipService | null = null;
  private returnScene = 'SunbeamVillageScene';
  private shouldNotifyTalk = false;
  private closing = false;

  public constructor() {
    super('MarigoldPicnicScene');
  }

  public create(data: MarigoldPicnicSceneData): void {
    this.returnScene = data.returnScene ?? 'SunbeamVillageScene';
    this.shouldNotifyTalk = false;
    this.closing = false;
    this.cameras.main.setBackgroundColor('#f6c779');

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xf7d68b, 1);
    this.add.rectangle(GAME_WIDTH / 2, 620, GAME_WIDTH, 230, 0xb4db8c, 0.8);
    this.add.circle(190, 560, 250, 0xf6b86d, 0.24);
    this.add.circle(1090, 570, 300, 0xffe7a6, 0.34);

    this.add
      .rectangle(GAME_WIDTH / 2, 230, 210, 132, 0xffefd0, 0.98)
      .setStrokeStyle(7, 0xe59b55, 1);
    this.add
      .text(GAME_WIDTH / 2, 222, '🥐', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '72px',
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_WIDTH / 2, 345, 'Marigold', {
        color: '#7b4b3b',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '34px',
        fontStyle: 'bold',
        backgroundColor: '#fff7e5e8',
        padding: { x: 16, y: 8 },
      })
      .setOrigin(0.5);

    for (const [x, icon] of [
      [310, '🧺'],
      [970, '🧁'],
      [390, '🌼'],
      [890, '🍓'],
    ] as const) {
      this.add
        .text(x, 550, icon, { fontFamily: 'system-ui, sans-serif', fontSize: '44px' })
        .setOrigin(0.5);
    }

    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.dialogueCard = new DialogueCard(this, this.pointerInput);

    const saveService = getBrowserSaveService();
    this.relationships = new RelationshipService(saveService);
    this.relationships.markMet(MARIGOLD_CHARACTER_ID);

    const questEngine = getBrowserQuestEngine();
    let progress = questEngine.getProgress(MARIGOLD_PICNIC_QUEST_ID);
    if (progress.status === 'not-started') {
      progress = questEngine.startQuest(MARIGOLD_PICNIC_QUEST_ID);
    }

    let dialogueId: DialogueId;
    if (progress.status === 'completed') {
      const variantSet = dialogueVariantSetRegistry.get(MARIGOLD_PICNIC_VARIANTS_ID);
      dialogueId =
        selectDialogueVariantSet(variantSet, {
          relationships: this.relationships,
          saveService,
        })?.id ?? 'dialogue:marigold-picnic-followup';
    } else {
      dialogueId = 'dialogue:marigold-picnic-intro';
      this.shouldNotifyTalk = true;
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

    const effects = this.dialogueSession.choose(choice.id);
    applyDialogueEffects(getBrowserSaveService(), effects);
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
      getBrowserQuestEngine().notifyCharacterTalked(MARIGOLD_CHARACTER_ID);
    }
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.hide();
    this.scene.start(this.returnScene);
  }
}
