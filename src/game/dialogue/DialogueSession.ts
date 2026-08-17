import type {
  DialogueChoice,
  DialogueDefinition,
  DialogueEffect,
  DialogueNode,
  DialogueNodeId,
} from '../../content/contentTypes';

export class DialogueSession {
  private readonly nodes = new Map<DialogueNodeId, DialogueNode>();
  private currentNodeId: DialogueNodeId | null;

  public constructor(private readonly definition: DialogueDefinition) {
    for (const node of definition.nodes) {
      this.nodes.set(node.id, node);
    }
    this.currentNodeId = definition.startNodeId;
  }

  public getDialogueId(): string {
    return this.definition.id;
  }

  public getCurrentNode(): DialogueNode | null {
    if (!this.currentNodeId) {
      return null;
    }
    return this.nodes.get(this.currentNodeId) ?? null;
  }

  public isComplete(): boolean {
    return this.currentNodeId === null;
  }

  public advanceLine(): void {
    const node = this.getCurrentNode();
    if (!node || node.type !== 'line') {
      throw new Error('Dialogue can only advance while a line node is active.');
    }
    this.moveTo(node.nextNodeId);
  }

  public choose(choiceId: string): readonly DialogueEffect[] {
    const node = this.getCurrentNode();
    if (!node || node.type !== 'choice') {
      throw new Error('Dialogue choice requires an active choice node.');
    }

    const choice = node.choices.find((candidate) => candidate.id === choiceId);
    if (!choice) {
      throw new Error(`Unknown dialogue choice: ${choiceId}`);
    }

    this.moveTo(choice.nextNodeId);
    return choice.effects ?? [];
  }

  public getDefaultChoice(): DialogueChoice | null {
    const node = this.getCurrentNode();
    return node?.type === 'choice' ? (node.choices[0] ?? null) : null;
  }

  public close(): void {
    this.currentNodeId = null;
  }

  private moveTo(nextNodeId?: DialogueNodeId): void {
    this.currentNodeId = nextNodeId ?? null;
  }
}
