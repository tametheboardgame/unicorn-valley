import { describe, expect, it } from 'vitest';
import { ContentRegistry } from './ContentRegistry';
import { PLACEHOLDER_CONTENT } from './placeholderContent';
import {
  characterRegistry,
  dialogueRegistry,
  dialogueVariantSetRegistry,
  discoveryRegistry,
  itemRegistry,
  questRegistry,
} from './registries';
import type { ContentBundle, ItemDefinition, ItemId } from './contentTypes';
import { assertValidContent, validateContent } from './validateContent';

describe('content registry and validation', () => {
  it('accepts the checked-in placeholder content and exposes typed registries', () => {
    expect(validateContent(PLACEHOLDER_CONTENT)).toEqual([]);
    expect(characterRegistry.get('character:pip').name).toBe('Pip');
    expect(itemRegistry.has('item:moonflower-petal')).toBe(true);
    expect(questRegistry.has('quest:first-sparkle')).toBe(true);
    expect(discoveryRegistry.has('discovery:moonflower-glade')).toBe(true);
    expect(dialogueRegistry.has('dialogue:interaction-sample')).toBe(true);
    expect(dialogueVariantSetRegistry.has('dialogue-variants:willow-post-moonflowers')).toBe(true);
  });

  it('rejects duplicate IDs', () => {
    const duplicateItems: readonly ItemDefinition[] = [
      { id: 'item:duplicate', name: 'One' },
      { id: 'item:duplicate', name: 'Two' },
    ];

    expect(() => new ContentRegistry<ItemId, ItemDefinition>('item', duplicateItems)).toThrow(
      'Duplicate item ID: item:duplicate',
    );

    const invalid: ContentBundle = { ...PLACEHOLDER_CONTENT, items: duplicateItems };
    expect(validateContent(invalid)).toContain('Duplicate item ID: item:duplicate');
  });

  it('rejects missing cross-content references', () => {
    const invalid: ContentBundle = {
      ...PLACEHOLDER_CONTENT,
      items: [],
    };

    expect(() => assertValidContent(invalid)).toThrow(
      'Quest quest:first-sparkle references missing item item:moonflower-petal.',
    );
  });

  it('rejects broken dialogue node references', () => {
    const invalid: ContentBundle = {
      ...PLACEHOLDER_CONTENT,
      dialogues: [
        {
          id: 'dialogue:broken',
          name: 'Broken',
          startNodeId: 'dialogue-node:missing',
          nodes: [],
        },
      ],
    };

    expect(validateContent(invalid)).toContain(
      'Dialogue dialogue:broken references missing start node dialogue-node:missing.',
    );
  });

  it('rejects broken conditional dialogue references', () => {
    const invalid: ContentBundle = {
      ...PLACEHOLDER_CONTENT,
      dialogueVariantSets: [
        {
          id: 'dialogue-variants:broken',
          variants: [
            {
              dialogueId: 'dialogue:missing',
              priority: 1.5,
              conditions: [
                {
                  type: 'quest-status',
                  questId: 'quest:missing',
                  status: 'completed',
                },
                {
                  type: 'relationship-flag',
                  characterId: 'character:pip',
                  flag: '   ',
                },
              ],
            },
          ],
        },
      ],
    };

    const errors = validateContent(invalid);
    expect(errors).toContain(
      'Dialogue variant set dialogue-variants:broken references missing dialogue dialogue:missing.',
    );
    expect(errors).toContain(
      'Dialogue variant set dialogue-variants:broken references missing quest quest:missing.',
    );
    expect(errors).toContain(
      'Dialogue variant set dialogue-variants:broken has an empty relationship flag.',
    );
    expect(errors).toContain(
      'Dialogue variant set dialogue-variants:broken has invalid priority 1.5 for dialogue:missing.',
    );
  });

  it('rejects IDs that do not follow the namespace convention', () => {
    const invalidItem = { id: 'wrong-id' as ItemId, name: 'Wrong' };
    const invalid: ContentBundle = {
      ...PLACEHOLDER_CONTENT,
      items: [invalidItem],
    };

    expect(validateContent(invalid)).toContain('item ID "wrong-id" must start with "item:".');
  });
});
