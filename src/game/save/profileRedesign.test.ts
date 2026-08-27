import { describe, expect, it } from 'vitest';
import { DEFAULT_UNICORN_APPEARANCE } from '../player/UnicornAppearance';
import { createDefaultSave } from './createDefaultSave';
import { applyProfileRedesign, hasNamedUnicorn } from './profileRedesign';

describe('profile redesign', () => {
  it('changes only name and appearance while preserving the adventure', () => {
    const save = createDefaultSave('2026-08-27T08:00:00.000Z');
    save.profile.name = 'Starlight';
    save.profile.currentLocationId = 'location:moonflower-cottage-interior';
    save.profile.unlockedAbilityIds = ['ability:rainbow-jump'];
    save.inventory.itemQuantities['currency:shimmer'] = 42;
    save.inventory.ownedCosmeticIds.push('item:star-hairclip');
    save.relationships.byCharacterId.willow = { level: 3, points: 18 };
    save.quests.byQuestId['quest:test'] = { state: 'active', stepId: 'step:2' };
    save.world.discoveredZoneIds.push('crystal-brook');
    save.home.ownedFurnitureIds.push('furniture:moon-lamp');
    save.activities.miniGameRecords['activity:test'] = { bestScore: 12 };
    save.collections.discoveryIds.push('discovery:test');

    const beforeAdventure = {
      inventory: structuredClone(save.inventory),
      relationships: structuredClone(save.relationships),
      quests: structuredClone(save.quests),
      world: structuredClone(save.world),
      home: structuredClone(save.home),
      activities: structuredClone(save.activities),
      collections: structuredClone(save.collections),
      currentLocationId: save.profile.currentLocationId,
      unlockedAbilityIds: [...save.profile.unlockedAbilityIds],
      createdAt: save.createdAt,
    };

    const redesigned = applyProfileRedesign(save, ' Moonlight  Star ', {
      ...DEFAULT_UNICORN_APPEARANCE,
      bodyColour: 'mint',
      maneColour: 'aqua',
      accessory: 'bow',
    });

    expect(redesigned.profile.name).toBe('Moonlight Star');
    expect(redesigned.profile.appearance).toMatchObject({
      bodyColour: 'mint',
      maneColour: 'aqua',
      accessory: 'bow',
    });
    expect({
      inventory: redesigned.inventory,
      relationships: redesigned.relationships,
      quests: redesigned.quests,
      world: redesigned.world,
      home: redesigned.home,
      activities: redesigned.activities,
      collections: redesigned.collections,
      currentLocationId: redesigned.profile.currentLocationId,
      unlockedAbilityIds: redesigned.profile.unlockedAbilityIds,
      createdAt: redesigned.createdAt,
    }).toEqual(beforeAdventure);
  });

  it('distinguishes a named existing unicorn from a fresh New Game profile', () => {
    const fresh = createDefaultSave('2026-08-27T08:00:00.000Z');
    expect(hasNamedUnicorn(fresh)).toBe(false);

    fresh.profile.name = 'Starlight';
    expect(hasNamedUnicorn(fresh)).toBe(true);
  });
});
