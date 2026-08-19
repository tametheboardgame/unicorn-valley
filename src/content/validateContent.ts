import type {
  ContentBundle,
  DialogueCondition,
  DialogueDefinition,
  DialogueNode,
  DialogueVariantSet,
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
  if (
    (step.type === 'talk-to-character' || step.type === 'award-friendship') &&
    !characterIds.has(step.characterId)
  ) {
    errors.push(`Quest ${questId} references missing character ${step.characterId}.`);
  }

  if (step.type === 'collect-item' || step.type === 'award-item' || step.type === 'consume-item') {
    if (!itemIds.has(step.itemId)) {
      errors.push(`Quest ${questId} references missing item ${step.itemId}.`);
    }

    if (!Number.isInteger(step.quantity) || step.quantity <= 0) {
      errors.push(`Quest ${questId} has invalid quantity ${step.quantity} for ${step.itemId}.`);
    }
  }

  if (step.type === 'award-friendship' && (!Number.isInteger(step.amount) || step.amount <= 0)) {
    errors.push(`Quest ${questId} has invalid friendship amount ${step.amount}.`);
  }

  if (step.type === 'unlock-discovery' && !discoveryIds.has(step.discoveryId)) {
    errors.push(`Quest ${questId} references missing discovery ${step.discoveryId}.`);
  }

  if (step.type === 'finish-race') {
    if (!step.raceId.startsWith('race-course:')) {
      errors.push(`Quest ${questId} has invalid race ID ${step.raceId}.`);
    }
    if (!step.label.trim()) {
      errors.push(`Quest ${questId} has an empty finish-race objective label.`);
    }
  }

  if (step.type === 'set-world-flag' && !step.flagId.startsWith('flag:')) {
    errors.push(`Quest ${questId} has invalid world flag ID ${step.flagId}.`);
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

function validateDialogueCondition(
  variantSetId: string,
  condition: DialogueCondition,
  characterIds: ReadonlySet<string>,
  questIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (
    (condition.type === 'minimum-friendship-tier' || condition.type === 'relationship-flag') &&
    !characterIds.has(condition.characterId)
  ) {
    errors.push(
      `Dialogue variant set ${variantSetId} references missing character ${condition.characterId}.`,
    );
  }

  if (condition.type === 'relationship-flag' && !condition.flag.trim()) {
    errors.push(`Dialogue variant set ${variantSetId} has an empty relationship flag.`);
  }

  if (condition.type === 'quest-status' && !questIds.has(condition.questId)) {
    errors.push(`Dialogue variant set ${variantSetId} references missing quest ${condition.questId}.`);
  }

  if (condition.type === 'world-flag' && !condition.flagId.startsWith('flag:')) {
    errors.push(`Dialogue variant set ${variantSetId} has invalid world flag ID ${condition.flagId}.`);
  }
}

function validateDialogueVariantSet(
  variantSet: DialogueVariantSet,
  dialogueIds: ReadonlySet<string>,
  characterIds: ReadonlySet<string>,
  questIds: ReadonlySet<string>,
  errors: string[],
): void {
  if (variantSet.variants.length === 0) {
    errors.push(`Dialogue variant set ${variantSet.id} has no variants.`);
  }

  for (const variant of variantSet.variants) {
    if (!dialogueIds.has(variant.dialogueId)) {
      errors.push(
        `Dialogue variant set ${variantSet.id} references missing dialogue ${variant.dialogueId}.`,
      );
    }

    if (variant.priority !== undefined && !Number.isInteger(variant.priority)) {
      errors.push(
        `Dialogue variant set ${variantSet.id} has invalid priority ${variant.priority} for ${variant.dialogueId}.`,
      );
    }

    for (const condition of variant.conditions ?? []) {
      validateDialogueCondition(variantSet.id, condition, characterIds, questIds, errors);
    }
  }
}

export function validateContent(content: ContentBundle): string[] {
  const errors: string[] = [];
  const itemIds = validateIds(content.items, 'item', 'item:', errors);
  const characterIds = validateIds(content.characters, 'character', 'character:', errors);
  const questIds = validateIds(content.quests, 'quest', 'quest:', errors);
  const discoveryIds = validateIds(content.discoveries, 'discovery', 'discovery:', errors);
  const dialogueIds = validateIds(content.dialogues, 'dialogue', 'dialogue:', errors);
  validateIds(content.dialogueVariantSets, 'dialogue variant set', 'dialogue-variants:', errors);

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

  for (const variantSet of content.dialogueVariantSets) {
    validateDialogueVariantSet(variantSet, dialogueIds, characterIds, questIds, errors);
  }

  return errors;
}

export function assertValidContent(content: ContentBundle): void {
  const errors = validateContent(content);
  if (errors.length > 0) {
    throw new Error(`Invalid content:\n- ${errors.join('\n- ')}`);
  }
}
