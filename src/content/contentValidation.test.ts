import { describe, expect, it } from 'vitest';
import { ContentRegistry } from './ContentRegistry';
import { PLACEHOLDER_CONTENT } from './placeholderContent';
import {
  characterRegistry,
  dialogueRegistry,
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

  it('rejects IDs that do not follow the namespace convention', () => {
    const invalidItem = { id: 'wrong-id' as ItemId, name: 'Wrong' };
    const invalid: ContentBundle = {
      ...PLACEHOLDER_CONTENT,
      items: [invalidItem],
    };

    expect(validateContent(invalid)).toContain('item ID "wrong-id" must start with "item:".');
  });
});
