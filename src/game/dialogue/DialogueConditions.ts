import { dialogueRegistry } from '../../content/registries';
import type {
  DialogueCondition,
  DialogueDefinition,
  DialogueVariant,
  DialogueVariantSet,
} from '../../content/contentTypes';
import type { RelationshipService } from '../relationships/RelationshipService';
import type { SaveService } from '../save/SaveService';

export interface DialogueConditionContext {
  relationships: RelationshipService;
  saveService?: SaveService;
}

type DialogueContextInput = DialogueConditionContext | RelationshipService;

function normaliseContext(input: DialogueContextInput): DialogueConditionContext {
  if ('relationships' in input) {
    return input;
  }

  return { relationships: input };
}

export function isDialogueConditionMet(
  condition: DialogueCondition,
  input: DialogueContextInput,
): boolean {
  const context = normaliseContext(input);

  if (condition.type === 'minimum-friendship-tier') {
    return context.relationships.meetsTier(condition.characterId, condition.tier);
  }

  if (condition.type === 'relationship-flag') {
    const expected = condition.value ?? true;
    return context.relationships.hasFlag(condition.characterId, condition.flag) === expected;
  }

  if (condition.type === 'quest-status') {
    const status =
      context.saveService?.load()?.quests.byQuestId[condition.questId]?.status ?? 'not-started';
    return status === condition.status;
  }

  if (condition.type === 'world-flag') {
    const value = context.saveService?.load()?.world.flags[condition.flagId] ?? false;
    return value === condition.value;
  }

  return false;
}

export function selectDialogueVariant(
  variants: readonly DialogueVariant[],
  input: DialogueContextInput,
): DialogueDefinition | null {
  const ordered = variants
    .map((variant, index) => ({ variant, index }))
    .sort(
      (left, right) =>
        (right.variant.priority ?? 0) - (left.variant.priority ?? 0) || left.index - right.index,
    );

  for (const { variant } of ordered) {
    if ((variant.conditions ?? []).every((condition) => isDialogueConditionMet(condition, input))) {
      return dialogueRegistry.get(variant.dialogueId);
    }
  }

  return null;
}

export function selectDialogueVariantSet(
  variantSet: DialogueVariantSet,
  input: DialogueContextInput,
): DialogueDefinition | null {
  return selectDialogueVariant(variantSet.variants, input);
}
