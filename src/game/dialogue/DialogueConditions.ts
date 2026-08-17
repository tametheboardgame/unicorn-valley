import { dialogueRegistry } from '../../content/registries';
import type {
  DialogueCondition,
  DialogueDefinition,
  DialogueVariant,
} from '../../content/contentTypes';
import type { RelationshipService } from '../relationships/RelationshipService';

export function isDialogueConditionMet(
  condition: DialogueCondition,
  relationships: RelationshipService,
): boolean {
  if (condition.type === 'minimum-friendship-tier') {
    return relationships.meetsTier(condition.characterId, condition.tier);
  }

  return false;
}

export function selectDialogueVariant(
  variants: readonly DialogueVariant[],
  relationships: RelationshipService,
): DialogueDefinition | null {
  for (const variant of variants) {
    if (
      (variant.conditions ?? []).every((condition) =>
        isDialogueConditionMet(condition, relationships),
      )
    ) {
      return dialogueRegistry.get(variant.dialogueId);
    }
  }

  return null;
}
