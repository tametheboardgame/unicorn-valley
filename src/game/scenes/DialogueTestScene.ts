import Phaser from 'phaser';
import type { DialogueChoice, DialogueEffect } from '../../content/contentTypes';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { selectInteractionTarget } from '../interaction/InteractionTargeting';
import { InputController } from '../input/InputController';
import { KeyboardInputAdapter } from '../input/KeyboardInputAdapter';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { PlayerEntity } from '../player/PlayerEntity';
import { DEFAULT_PLAYER_SPEED, resolvePlayerMovement } from '../player/PlayerMovement';
import {
  ensurePlayerPlaceholderTexture,
  PLAYER_PLACEHOLDER_TEXTURE_KEY,
} from '../player/PlayerPlaceholderTexture';
import { InteractionPrompt } from '../ui/InteractionPrompt';

const SAMPLE_TARGET: InteractionTarget = {
  id: 'interaction:dialogue-sample-note',
  label: "Pip's test note",
  actionLabel: 'Read',
  position: { x: 820, y: 360 },
  interactionRadius: 175,
  result: {
    type: 'message',
    title: 'Dialogue Sample',
    message: 'This target is handled by the dialogue diagnostic.',
  },
};

export class DialogueTestScene extends Phaser.Scene {
  private inputController: InputController | null = null;
  private pointerInput: PointerTouchInputAdapter | null = null;
  private player: PlayerEntity | null = null;
  private prompt: InteractionPrompt | null = null;
  private card: DialogueCard | null = null;
  private activeTarget: InteractionTarget | null = null;
  private session: DialogueSession | null = null;
  private statusText: Phaser.GameObjects.Text | null = null;

  public constructor() {
    super('DialogueTestScene');
  }

  public create(): void {
    this.cameras.main.setBackgroundColor('#9edab4');
    this.physics.world.setBounds(70, 90, 1140, 540);
    ensurePlayerPlaceholderTexture(this);

    this.add.rectangle(640, 360, 1280, 720, 0xa9dfba).setDepth(0);
    this.add.rectangle(640, 365, 1040, 120, 0xead9ad, 0.8).setDepth(1);
    this.add.circle(820, 330, 72, 0xc99bea, 0.8).setDepth(2);
    this.add.circle(820, 330, 24, 0xfff0b0, 0.9).setDepth(3);
    this.add
      .text(820, 440, "Pip's test note", {
        color: '#554060',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        backgroundColor: '#fff9edcc',
        padding: { x: 10, y: 6 },
      })
      .setOrigin(0.5);

    this.player = new PlayerEntity(this, 330, 360, PLAYER_PLACEHOLDER_TEXTURE_KEY);
    this.pointerInput = new PointerTouchInputAdapter();
    this.inputController = new InputController([new KeyboardInputAdapter(this), this.pointerInput]);
    this.prompt = new InteractionPrompt(this, this.pointerInput);
    this.card = new DialogueCard(this, this.pointerInput);

    this.add
      .text(28, 28, 'Dialogue diagnostic', {
        color: '#49355e',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '25px',
        fontStyle: 'bold',
        backgroundColor: '#fff9e8dd',
        padding: { x: 14, y: 9 },
      })
      .setDepth(100);

    this.statusText = this.add
      .text(28, 82, 'Walk to the glowing note, then interact. Movement must stop while dialogue is open.', {
        color: '#5a4869',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        backgroundColor: '#fff9e8c8',
        padding: { x: 11, y: 7 },
      })
      .setDepth(100);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.inputController?.destroy();
      this.inputController = null;
      this.pointerInput = null;
      this.prompt?.destroy();
      this.prompt = null;
      this.card?.destroy();
      this.card = null;
      this.player?.destroy();
      this.player = null;
      this.session = null;
      this.activeTarget = null;
      this.statusText = null;
    });
  }

  public update(time: number): void {
    if (!this.inputController || !this.player) {
      return;
    }

    this.inputController.update();

    if (this.session) {
      this.prompt?.setTarget(null);

      if (this.inputController.justPressed('BACK')) {
        this.closeDialogue('Dialogue closed with Back. Movement is unlocked again.');
        return;
      }

      if (this.inputController.justPressed('INTERACT')) {
        const node = this.session.getCurrentNode();
        if (node?.type === 'line') {
          this.session.advanceLine();
          this.refreshDialogue();
        } else if (node?.type === 'choice') {
          const defaultChoice = this.session.getDefaultChoice();
          if (defaultChoice) {
            this.selectChoice(defaultChoice);
          }
        }
      }

      this.player.applyMovement({
        velocityX: 0,
        velocityY: 0,
        facing: this.player.getFacing(),
        motionState: 'idle',
      });
      this.player.updatePresentation(time);
      return;
    }

    if (this.inputController.justPressed('BACK')) {
      this.scene.start('TitleScene');
      return;
    }

    const movement = resolvePlayerMovement(
      this.inputController.getAxis('MOVE_X'),
      this.inputController.getAxis('MOVE_Y'),
      DEFAULT_PLAYER_SPEED,
      this.player.getFacing(),
    );
    this.player.applyMovement(movement);
    this.player.updatePresentation(time);

    this.activeTarget = selectInteractionTarget(
      { x: this.player.sprite.x, y: this.player.sprite.y },
      [SAMPLE_TARGET],
    );
    this.prompt?.setTarget(this.activeTarget);

    if (this.inputController.justPressed('INTERACT') && this.activeTarget) {
      this.startDialogue();
    }
  }

  private startDialogue(): void {
    this.session = new DialogueSession(dialogueRegistry.get('dialogue:interaction-sample'));
    this.statusText?.setText('Dialogue is modal now: movement input is deliberately ignored.');
    this.refreshDialogue();
  }

  private refreshDialogue(): void {
    if (!this.session || this.session.isComplete()) {
      this.closeDialogue('Dialogue complete. The selected test flag is stored in the scene registry.');
      return;
    }

    const node = this.session.getCurrentNode();
    if (!node) {
      this.closeDialogue('Dialogue ended safely.');
      return;
    }

    const speaker = characterRegistry.get(node.speakerId);
    this.card?.show(node, speaker.name, (choice) => this.selectChoice(choice));
  }

  private selectChoice(choice: DialogueChoice): void {
    if (!this.session) {
      return;
    }

    const effects = this.session.choose(choice.id);
    this.applyEffects(effects);
    this.refreshDialogue();
  }

  private applyEffects(effects: readonly DialogueEffect[]): void {
    for (const effect of effects) {
      if (effect.type === 'set-flag') {
        this.registry.set(effect.flagId, effect.value);
        this.statusText?.setText(`Choice recorded: ${effect.flagId} = ${String(effect.value)}`);
      }
    }
  }

  private closeDialogue(status: string): void {
    this.session?.close();
    this.session = null;
    this.card?.hide();
    this.statusText?.setText(status);
  }
}
