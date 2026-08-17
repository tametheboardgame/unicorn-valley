import type {
  ContentBundle,
  DialogueDefinition,
  DialogueNode,
  QuestStep,
} from './contentTypes';

interface IdentifiedEntry {
  id: string;
}

function validateIds(
  entries: readonly IdentifiedEntry[],
  label: string,
  prefix: string,
  errors: string[],
): Set<string> {
  const ids = new Set<string>();

  for (const entry of entries) {
    if (!entry.id.startsWith(prefix)) {
      errors.push(`${label} ID "${entry.id}" must start with "${prefix}".`);
    }

    if (ids.has(entry.id)) {
      errors.push(`Duplicate ${label} ID: ${entry.id}`);
    }

    ids.add(entry.id);
  }

  return ids;
}

function validateQuestStep(
  questId: string,
  step: QuestStep,
  itemIds: ReadonlySet<string>,
  characterIds: ReadonlySet<string>,
  discoveryIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (step.type === 'talk-to-character' && !characterIds.has(step.characterId)) {
    errors.push(`Quest ${questId} references missing character ${step.characterId}.`);
  }

  if (step.type === 'collect-item') {
    if (!itemIds.has(step.itemId)) {
      errors.push(`Quest ${questId} references missing item ${step.itemId}.`);
    }

    if (!Number.isInteger(step.quantity) || step.quantity <= 0) {
      errors.push(`Quest ${questId} has invalid quantity ${step.quantity} for ${step.itemId}.`);
    }
  }

  if (step.type === 'unlock-discovery' && !discoveryIds.has(step.discoveryId)) {
    errors.push(`Quest ${questId} references missing discovery ${step.discoveryId}.`);
  }
}

function validateDialogueNode(
  dialogue: DialogueDefinition,
  node: DialogueNode,
  nodeIds: ReadonlySet<string>,
  characterIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (!characterIds.has(node.speakerId)) {
    errors.push(`Dialogue ${dialogue.id} references missing character ${node.speakerId}.`);
  }

  if (node.type === 'line') {
    if (node.nextNodeId && !nodeIds.has(node.nextNodeId)) {
      errors.push(`Dialogue ${dialogue.id} references missing node ${node.nextNodeId}.`);
    }
    return;
  }

  if (node.choices.length === 0) {
    errors.push(`Dialogue ${dialogue.id} choice node ${node.id} has no choices.`);
  }

  const choiceIds = new Set<string>();
  for (const choice of node.choices) {
    if (choiceIds.has(choice.id)) {
      errors.push(`Dialogue ${dialogue.id} has duplicate choice ID ${choice.id} in ${node.id}.`);
    }
    choiceIds.add(choice.id);

    if (choice.nextNodeId && !nodeIds.has(choice.nextNodeId)) {
      errors.push(`Dialogue ${dialogue.id} references missing node ${choice.nextNodeId}.`);
    }

    for (const effect of choice.effects ?? []) {
      if (!effect.flagId.startsWith('flag:')) {
        errors.push(`Dialogue ${dialogue.id} has invalid flag ID ${effect.flagId}.`);
      }
    }
  }
}

function validateDialogue(
  dialogue: DialogueDefinition,
  characterIds: ReadonlySet<string>,
  errors: string[],
): void {
  const nodeIds = validateIds(dialogue.nodes, 'dialogue node', 'dialogue-node:', errors);
  if (!nodeIds.has(dialogue.startNodeId)) {
    errors.push(`Dialogue ${dialogue.id} references missing start node ${dialogue.startNodeId}.`);
  }

  for (const node of dialogue.nodes) {
    validateDialogueNode(dialogue, node, nodeIds, characterIds, errors);
  }
}

export function validateContent(content: ContentBundle): string[] {
  const errors: string[] = [];
  const itemIds = validateIds(content.items, 'item', 'item:', errors);
  const characterIds = validateIds(content.characters, 'character', 'character:', errors);
  const questIds = validateIds(content.quests, 'quest', 'quest:', errors);
  const discoveryIds = validateIds(content.discoveries, 'discovery', 'discovery:', errors);
  validateIds(content.dialogues, 'dialogue', 'dialogue:', errors);

  for (const item of content.items) {
    if (item.discoveryId && !discoveryIds.has(item.discoveryId)) {
      errors.push(`Item ${item.id} references missing discovery ${item.discoveryId}.`);
    }
  }

  for (const quest of content.quests) {
    if (!questIds.has(quest.id)) {
      continue;
    }

    for (const step of quest.steps) {
      validateQuestStep(quest.id, step, itemIds, characterIds, discoveryIds, errors);
    }
  }

  for (const dialogue of content.dialogues) {
    validateDialogue(dialogue, characterIds, errors);
  }

  return errors;
}

export function assertValidContent(content: ContentBundle): void {
  const errors = validateContent(content);
  if (errors.length > 0) {
    throw new Error(`Invalid content:\n- ${errors.join('\n- ')}`);
  }
}
