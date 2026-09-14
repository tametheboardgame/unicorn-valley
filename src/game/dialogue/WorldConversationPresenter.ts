import Phaser from 'phaser';
import type {
  CharacterId,
  DialogueChoice,
  DialogueDefinition,
  DialogueEffect,
  DialogueId,
  DialogueNodeId,
} from '../../content/contentTypes';
import { characterRegistry, dialogueRegistry } from '../../content/registries';
import { PointerTouchInputAdapter } from '../input/PointerTouchInputAdapter';
import { setInteractionModalActive } from '../interaction/InteractionModalState';
import type { SupportingResidentDefinition } from '../population/AmbientPopulationTypes';
import { getBrowserSaveService } from '../save/browserSaveService';
import { DialogueCard } from './DialogueCard';
import { DialogueSession } from './DialogueSession';
import { applyDialogueEffects } from './applyDialogueEffects';

export interface WorldConversationOptions {
  onComplete?: () => void;
  onClose?: () => void;
}

interface ActiveConversation {
  scene: Phaser.Scene;
  pointer: PointerTouchInputAdapter;
  card: DialogueCard;
  session: DialogueSession;
  options: WorldConversationOptions;
  keyHandler: (event: KeyboardEvent) => void;
  closing: boolean;
  supportingPortrait: Phaser.GameObjects.Sprite | null;
  supportingPortraitRequestId: number;
}

function latestVisibleNamedObject<T extends Phaser.GameObjects.GameObject>(
  scene: Phaser.Scene,
  name: string,
  matchesType: (object: Phaser.GameObjects.GameObject) => object is T,
): T | null {
  const matches = scene.children.list.filter(
    (object): object is T =>
      object.name === name && object.active && matchesType(object) && object.visible,
  );
  return matches.at(-1) ?? null;
}

/** Canonical, scene-independent owner for ordinary in-world conversations. */
export class WorldConversationPresenter {
  private active: ActiveConversation | null = null;

  public start(
    scene: Phaser.Scene,
    dialogueId: DialogueId,
    options: WorldConversationOptions = {},
  ): void {
    this.close(false);
    this.startDefinition(scene, dialogueRegistry.get(dialogueId), options);
  }

  public startShort(
    scene: Phaser.Scene,
    speakerId: string,
    speakerName: string,
    message: string,
    options: WorldConversationOptions = {},
  ): void {
    const nodeId = 'world-conversation:short-line' as DialogueNodeId;
    this.startDefinition(
      scene,
      {
        id: 'dialogue:world-conversation-short' as DialogueId,
        name: 'In-world short conversation',
        startNodeId: nodeId,
        nodes: [
          {
            id: nodeId,
            type: 'line',
            speakerId: speakerId as CharacterId,
            text: message,
          },
        ],
      },
      options,
      speakerName,
    );
  }

  private startDefinition(
    scene: Phaser.Scene,
    definition: DialogueDefinition,
    options: WorldConversationOptions,
    speakerNameOverride?: string,
  ): void {
    const pointer = new PointerTouchInputAdapter();
    const active: ActiveConversation = {
      scene,
      pointer,
      card: new DialogueCard(scene, pointer, () => this.advance()),
      session: new DialogueSession(definition),
      options,
      keyHandler: () => undefined,
      closing: false,
      supportingPortrait: null,
      supportingPortraitRequestId: 0,
    };
    active.keyHandler = (event) => {
      if (event.repeat || !['Escape', 'Enter', 'Space', 'KeyE'].includes(event.code)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.code === 'Escape' ? this.close(false) : this.advance();
    };
    globalThis.addEventListener?.('keydown', active.keyHandler, true);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.active === active) this.close(false);
    });
    this.active = active;
    setInteractionModalActive(scene, true);
    this.refresh(speakerNameOverride);
  }

  public isActive(scene?: Phaser.Scene): boolean {
    return this.active !== null && (!scene || this.active.scene === scene);
  }

  private advance(): void {
    const active = this.active;
    if (!active || active.closing) return;
    const node = active.session.getCurrentNode();
    if (node?.type === 'line') {
      active.session.advanceLine();
      this.refresh();
      return;
    }
    const choice = active.session.getDefaultChoice();
    if (choice) this.choose(choice);
  }

  private choose(choice: DialogueChoice): void {
    const active = this.active;
    if (!active || active.closing) return;
    const effects: readonly DialogueEffect[] = active.session.choose(choice.id);
    applyDialogueEffects(getBrowserSaveService(), effects);
    this.refresh();
  }

  private refresh(speakerNameOverride?: string): void {
    const active = this.active;
    if (!active) return;
    const node = active.session.getCurrentNode();
    if (!node || active.session.isComplete()) {
      this.close(true);
      return;
    }
    const speakerName = speakerNameOverride ?? characterRegistry.get(node.speakerId).name;
    active.card.show(node, speakerName, (choice) => this.choose(choice));
    this.syncSupportingPortrait(active, node.speakerId);
  }

  private syncSupportingPortrait(active: ActiveConversation, speakerId: string): void {
    active.supportingPortrait?.destroy();
    active.supportingPortrait = null;
    const requestId = ++active.supportingPortraitRequestId;

    void Promise.all([
      import('../population/R6SupportingResidentContent'),
      import('../population/SupportingResidentArt'),
    ])
      .then(([{ R6_SUPPORTING_RESIDENTS }, { createSupportingResidentSprite }]) => {
        if (
          this.active !== active ||
          active.closing ||
          requestId !== active.supportingPortraitRequestId
        ) {
          return;
        }

        const residents: readonly SupportingResidentDefinition[] = R6_SUPPORTING_RESIDENTS;
        const resident = residents.find(
          (candidate) => candidate.id === speakerId || candidate.characterId === speakerId,
        );
        if (!resident) {
          return;
        }

        // MoonflowerGladeScene keeps a dormant scene-owned DialogueCard for its old local
        // conversation route, while WorldConversationPresenter creates the active card. Selecting
        // the first object by name could therefore attach resident art to the hidden card and leave
        // the visible card showing its initial. Always resolve the newest visible frame/fallback.
        const frame = latestVisibleNamedObject(
          active.scene,
          'dialogue-production-portrait-frame',
          (object): object is Phaser.GameObjects.Arc => object instanceof Phaser.GameObjects.Arc,
        );
        const fallback = latestVisibleNamedObject(
          active.scene,
          'dialogue-production-portrait-fallback',
          (object): object is Phaser.GameObjects.Text => object instanceof Phaser.GameObjects.Text,
        );
        if (!frame) {
          return;
        }

        fallback?.setVisible(false);
        const sprite = createSupportingResidentSprite(active.scene, resident)
          .setName(`dialogue-production-portrait-${resident.id}`)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(130);
        const maxWidth = frame.displayWidth * 0.92;
        const maxHeight = frame.displayHeight * 0.82;
        const scale = Math.min(maxWidth / sprite.width, maxHeight / sprite.height);
        sprite
          .setPosition(frame.x, frame.y)
          .setDisplaySize(sprite.width * scale, sprite.height * scale)
          .setVisible(true);
        active.supportingPortrait = sprite;
      })
      .catch(() => {
        // DialogueCard's readable initial fallback remains if optional resident art cannot load.
      });
  }

  private close(completed: boolean): void {
    const active = this.active;
    if (!active || active.closing) return;
    active.closing = true;
    active.supportingPortraitRequestId += 1;
    this.active = null;
    globalThis.removeEventListener?.('keydown', active.keyHandler, true);
    active.supportingPortrait?.destroy();
    active.supportingPortrait = null;
    active.session.close();
    active.card.destroy();
    active.pointer.destroy();
    setInteractionModalActive(active.scene, false);
    (completed ? active.options.onComplete : active.options.onClose)?.();
  }
}

let presenter: WorldConversationPresenter | null = null;

export function getWorldConversationPresenter(): WorldConversationPresenter {
  presenter ??= new WorldConversationPresenter();
  return presenter;
}
