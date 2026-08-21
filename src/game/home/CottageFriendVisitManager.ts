import Phaser from 'phaser';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { DialogueCard } from '../dialogue/DialogueCard';
import { DialogueSession } from '../dialogue/DialogueSession';
import type { InputController } from '../input/InputController';
import type { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import type { SaveService } from '../save/SaveService';
import type { CottageHomeView } from './CottageHomeView';
import { FriendVisitService, type ResolvedFriendVisit } from './FriendVisitService';

export const COTTAGE_FRIEND_VISIT_INTERACTION_ID = 'interaction:cottage-friend-visit';

export class CottageFriendVisitManager {
  private readonly service: FriendVisitService;
  private visit: ResolvedFriendVisit | null;
  private dialogueCard: DialogueCard | null = null;
  private dialogueSession: DialogueSession | null = null;
  private visitorObjects: Phaser.GameObjects.GameObject[] = [];

  public constructor(
    private readonly scene: Phaser.Scene,
    saveService: SaveService,
    homeView: CottageHomeView,
    private readonly pointerInput: PointerTouchInputAdapter,
  ) {
    this.service = new FriendVisitService(saveService);
    this.visit = this.service.resolveNextVisit(homeView);
    if (this.visit) {
      this.renderVisitor(this.visit);
    }
  }

  public getInteraction(): InteractionTarget | null {
    if (!this.visit || this.dialogueSession) {
      return null;
    }

    const character = characterRegistry.get(this.visit.definition.characterId);
    return {
      id: COTTAGE_FRIEND_VISIT_INTERACTION_ID,
      label: `${character.name} is visiting`,
      actionLabel: 'Say hello',
      position: this.visit.definition.position,
      interactionRadius: 155,
      priority: 45,
      result: {
        type: 'dialogue',
        dialogueId: this.visit.dialogueId,
      },
    };
  }

  public activate(): void {
    if (!this.visit || this.dialogueSession) {
      return;
    }

    this.dialogueCard ??= new DialogueCard(this.scene, this.pointerInput);
    this.dialogueSession = new DialogueSession(dialogueRegistry.get(this.visit.dialogueId));
    this.refreshDialogue();
  }

  public update(input: InputController): boolean {
    if (!this.dialogueSession) {
      return false;
    }

    if (input.justPressed('BACK')) {
      this.dialogueSession.close();
      this.dialogueSession = null;
      this.dialogueCard?.hide();
      return true;
    }

    if (!input.justPressed('INTERACT')) {
      return true;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (node?.type === 'line') {
      this.dialogueSession.advanceLine();
      this.refreshDialogue();
      return true;
    }

    const choice = this.dialogueSession.getDefaultChoice();
    if (choice) {
      this.dialogueSession.choose(choice.id);
      this.refreshDialogue();
    }
    return true;
  }

  public destroy(): void {
    this.dialogueSession?.close();
    this.dialogueSession = null;
    this.dialogueCard?.destroy();
    this.dialogueCard = null;
    this.clearVisitor();
    this.visit = null;
  }

  private refreshDialogue(): void {
    if (!this.dialogueSession || !this.visit) {
      return;
    }

    if (this.dialogueSession.isComplete()) {
      this.service.completeVisit(this.visit);
      this.dialogueSession.close();
      this.dialogueSession = null;
      this.dialogueCard?.hide();
      this.clearVisitor();
      this.visit = null;
      return;
    }

    const node = this.dialogueSession.getCurrentNode();
    if (!node) {
      return;
    }

    const speaker = characterRegistry.get(node.speakerId);
    this.dialogueCard?.show(node, speaker.name, (choice) => {
      this.dialogueSession?.choose(choice.id);
      this.refreshDialogue();
    });
  }

  private renderVisitor(visit: ResolvedFriendVisit): void {
    const { x, y } = visit.definition.position;
    const character = characterRegistry.get(visit.definition.characterId);

    const glow = this.scene.add.circle(x, y, 72, 0xffe8a3, 0.18).setDepth(12);
    const body = this.scene.add
      .circle(x, y, 54, 0xfff4df, 0.98)
      .setStrokeStyle(6, 0xb78bc4, 0.9)
      .setDepth(13);
    const icon = this.scene.add
      .text(x, y - 3, visit.definition.icon, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
      })
      .setOrigin(0.5)
      .setDepth(14);
    const label = this.scene.add
      .text(x, y + 78, `${character.name} is visiting`, {
        color: '#654f63',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#fff7e6dd',
        padding: { x: 9, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(14);

    this.visitorObjects = [glow, body, icon, label];
    this.scene.tweens.add({
      targets: glow,
      scale: 1.12,
      alpha: 0.3,
      duration: 1050,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
  }

  private clearVisitor(): void {
    for (const object of this.visitorObjects) {
      this.scene.tweens.killTweensOf(object);
      object.destroy();
    }
    this.visitorObjects = [];
  }
}
