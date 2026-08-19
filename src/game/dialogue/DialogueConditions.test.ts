import { describe, expect, it } from 'vitest';
import { dialogueVariantSetRegistry } from '../../content/registries';
import { WILLOW_GARDEN_PLANTED_FLAG, WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import {
  WILLOW_POST_MOONFLOWERS_SEEN_FLAG,
  WILLOW_POST_MOONFLOWERS_VARIANTS_ID,
} from '../../content/r4DialogueVariants';
import { RelationshipService } from '../relationships/RelationshipService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { selectDialogueVariant, selectDialogueVariantSet } from './DialogueConditions';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

describe('conditional dialogue selection', () => {
  it('uses explicit priority rather than array position', () => {
    const relationships = new RelationshipService(new SaveService(new MemorySaveRepository()));

    const selected = selectDialogueVariant(
      [
        { dialogueId: 'dialogue:pip-welcome', priority: 10 },
        { dialogueId: 'dialogue:pip-first-discovery', priority: 20 },
      ],
      relationships,
    );

    expect(selected?.id).toBe('dialogue:pip-first-discovery');
  });

  it('changes Willow dialogue across quest completion, return visits and friendship tiers', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    saveService.save(saveService.createNewGame());
    const relationships = new RelationshipService(saveService);
    relationships.markMet('character:willow');
    relationships.addFriendship('character:willow', 5);

    const save = saveService.load();
    if (!save) {
      throw new Error('Expected test save to exist.');
    }

    saveService.save({
      ...save,
      quests: {
        ...save.quests,
        byQuestId: {
          ...save.quests.byQuestId,
          [WILLOW_MOONFLOWERS_QUEST_ID]: {
            status: 'completed',
            currentStepId: null,
            completedAt: '2026-08-19T10:00:00.000Z',
          },
        },
      },
      world: {
        ...save.world,
        flags: {
          ...save.world.flags,
          [WILLOW_GARDEN_PLANTED_FLAG]: true,
        },
      },
    });

    const variantSet = dialogueVariantSetRegistry.get(WILLOW_POST_MOONFLOWERS_VARIANTS_ID);
    const context = { relationships, saveService };

    expect(selectDialogueVariantSet(variantSet, context)?.id).toBe(
      'dialogue:willow-moonflowers-friend-followup',
    );

    relationships.addFlag('character:willow', WILLOW_POST_MOONFLOWERS_SEEN_FLAG);
    expect(selectDialogueVariantSet(variantSet, context)?.id).toBe(
      'dialogue:willow-moonflowers-returning-followup',
    );

    relationships.addFriendship('character:willow', 10);
    expect(selectDialogueVariantSet(variantSet, context)?.id).toBe(
      'dialogue:willow-moonflowers-good-friend-followup',
    );
  });

  it('does not use quest or world-state variants when no save context is supplied', () => {
    const relationships = new RelationshipService(new SaveService(new MemorySaveRepository()));
    relationships.addFriendship('character:willow', 15);
    relationships.addFlag('character:willow', WILLOW_POST_MOONFLOWERS_SEEN_FLAG);

    const variantSet = dialogueVariantSetRegistry.get(WILLOW_POST_MOONFLOWERS_VARIANTS_ID);

    expect(selectDialogueVariantSet(variantSet, relationships)).toBeNull();
  });
});
