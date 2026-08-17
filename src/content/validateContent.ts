import type { ContentBundle, QuestStep } from './contentTypes';

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

export function validateContent(content: ContentBundle): string[] {
  const errors: string[] = [];
  const itemIds = validateIds(content.items, 'item', 'item:', errors);
  const characterIds = validateIds(content.characters, 'character', 'character:', errors);
  const questIds = validateIds(content.quests, 'quest', 'quest:', errors);
  const discoveryIds = validateIds(content.discoveries, 'discovery', 'discovery:', errors);

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

  return errors;
}

export function assertValidContent(content: ContentBundle): void {
  const errors = validateContent(content);
  if (errors.length > 0) {
    throw new Error(`Invalid content:\n- ${errors.join('\n- ')}`);
  }
}
