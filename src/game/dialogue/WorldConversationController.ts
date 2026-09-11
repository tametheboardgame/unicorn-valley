import Phaser from 'phaser';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import type { DialogueChoice } from '../../content/contentTypes';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { setInteractionModalActive } from '../interaction/InteractionModalState';
import type { InteractionResult } from '../interaction/InteractionTarget';
import { getBrowserSaveService } from '../save/browserSaveService';
import { DialogueCard } from './DialogueCard';
import { DialogueSession } from './DialogueSession';
import { applyDialogueEffects } from './applyDialogueEffects';

type DialogueInteractionResult = Extract<InteractionResult, { type: 'dialogue' }>;

/**
 * WP19E canonical owner for ordinary in-world conversations.
 *
 * The controller deliberately keeps DialogueSession as the domain owner. It only owns the
 * presentation/input lifetime: lock exploration, display the shared lower-screen family, apply
 * existing choice effects exactly once, and release the scene through the shared modal guard.
 */
export class WorldConversationController {
  private readonly pointerInput: PointerTouchInputAdapter;
  private readonly inputController: InputController;
  private readonly dialogueCard: DialogueCard;
  private dialogueSession: DialogueSession | null = null;
  private activeResult: DialogueInteractionResult | null = null;
  private destroyed = false;
  private closing = false;

  public constructor(private readonly scene: Phaser.Scene) {
    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([
      new KeyboardInputAdapter(scene),
      this.pointerInput,
    ]);
    this.dialogueCard = new DialogueCard(scene, this.pointerInput);

    scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  public isActive(): boolean {
    return this.dialogueSession !== null;
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public start(result: DialogueInteractionResult): boolean {
    if (this.destroyed || this.dialogueSession || this.closing) {
      return false;
    }

    const dialogueId =
      typeof result.dialogueId === 'function' ? result.dialogueId() : result.dialogueId;

    result.onStart?.();
    this.activeResult = result;
    this.dialogueSession = new DialogueSession(dialogueRegistry.get(dialogueId));
    setInteractionModalActive(this.scene, true);
    this.refreshDialogue();
    return true;
  }

  private readonly update = (): void => {
    if (this.destroyed || !this.dialogueSession) {
      return;
    }

    this.inputController.update();

    if (this.inputController.justPressed('BACK')) {
      this.finish(false);
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

    const defaultChoice = this.dialogueSession.getDefaultChoice();
    if (defaultChoice) {
      this.selectChoice(defaultChoice);
    }
  };

  private selectChoice(choice: DialogueChoice): void {
    if (!this.dialogueSession || this.closing) {
      return;
    }

    const effects = this.dialogueSession.choose(choice.id);
    applyDialogueEffects(getBrowserSaveService(), effects);
    this.refreshDialogue();
  }

  private refreshDialogue(): void {
    if (!this.dialogueSession || this.dialogueSession.isComplete()) {
      this.finish(true);
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (!node) {
      this.finish(false);
      return;
    }

    const speaker = characterRegistry.get(node.speakerId);
    this.dialogueCard.show(node, speaker.name, (choice) => this.selectChoice(choice));
  }

  private finish(completed: boolean, notifyLifecycle = true): void {
    if (this.closing) {
      return;
    }

    this.closing = true;
    const result = this.activeResult;
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.activeResult = null;
    this.dialogueCard.hide();

    // Release the gameplay lock before story callbacks run. InteractionModalState keeps a short
    // post-close suppression window so the closing E/Enter/tap cannot immediately re-trigger.
    setInteractionModalActive(this.scene, false);

    if (notifyLifecycle) {
      if (completed) {
        result?.onComplete?.();
      } else {
        result?.onCancel?.();
      }
    }
    this.closing = false;
  }

  private readonly destroy = (): void => {
    if (this.destroyed) {
      return;
    }

    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    if (this.dialogueSession) {
      this.finish(false, false);
    }
    this.inputController.destroy();
    this.dialogueCard.destroy();
    this.destroyed = true;
  };
}

const controllers = new WeakMap<Phaser.Scene, WorldConversationController>();

export function getWorldConversationController(scene: Phaser.Scene): WorldConversationController {
  const existing = controllers.get(scene);
  if (existing && !existing.isDestroyed()) {
    return existing;
  }

  const controller = new WorldConversationController(scene);
  controllers.set(scene, controller);
  return controller;
}
