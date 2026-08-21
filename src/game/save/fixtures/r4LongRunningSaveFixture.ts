import { createDefaultSave } from '../createDefaultSave';
import type { SaveGame } from '../saveSchema';

export function createR4LongRunningSaveFixture(): SaveGame {
  const timestamp = '2026-08-21T08:00:00.000Z';
  const save = createDefaultSave(timestamp);

  return {
    ...save,
    profile: {
      ...save.profile,
      name: 'Starlight',
      currentLocationId: 'moonflower-cottage',
      unlockedAbilityIds: ['ability:rainbow-jump'],
    },
    inventory: {
      itemQuantities: {
        'item:moonflower': 3,
        'currency:shimmer': 18,
      },
      ownedCosmeticIds: ['item:star-hairclip'],
      ownedDecorationIds: ['item:moonflower-lantern', 'item:rainbow-run-finisher-ribbon'],
      specialItemIds: ['item:pip-egg-keepsake'],
    },
    relationships: {
      byCharacterId: {
        'character:willow': { friendshipPoints: 7, flags: ['r4:cottage-visit:willow-seen'] },
        'character:nova': { friendshipPoints: 6, flags: ['r4:cottage-visit:nova-seen'] },
        'character:pip': { friendshipPoints: 6, flags: ['r4:pip-egg-hatched'] },
      },
    },
    quests: {
      byQuestId: {
        'quest:willow-moonflowers': {
          status: 'completed',
          currentStepId: null,
          completedAt: timestamp,
        },
        'quest:pip-strange-egg': {
          status: 'completed',
          currentStepId: null,
          completedAt: timestamp,
        },
        'quest:marigold-picnic': {
          status: 'completed',
          currentStepId: null,
          completedAt: timestamp,
        },
      },
    },
    world: {
      flags: {
        'world:willow-garden-planted': true,
        'world:pip-egg-hatched': true,
        'world:picnic-complete': true,
      },
      discoveredZoneIds: ['moonflower-glade', 'sunbeam-village', 'rainbow-meadow'],
      changedObjectIds: ['willow-garden', 'pebble-repaired-object'],
      uniqueDiscoveryIds: ['discovery:first-sparkle', 'discovery:picnic-memory'],
    },
    home: {
      ownedFurnitureIds: ['item:starter-rug', 'item:moonflower-lantern'],
      furnitureBySlot: {
        'cottage-slot:window-nook': 'item:moonflower-lantern',
        'cottage-slot:left-wall': 'item:rainbow-run-finisher-ribbon',
      },
      gardenFlags: {
        moonflowers: true,
      },
    },
    activities: {
      racesById: {
        'race:rainbow-run': {
          bestTimeMs: 48200,
          ribbonIds: ['item:rainbow-run-finisher-ribbon'],
        },
      },
      miniGameRecords: {},
    },
    collections: {
      discoveryIds: ['discovery:first-sparkle', 'discovery:picnic-memory'],
      memoryIds: ['memory:willow-moonflowers', 'memory:marigold-picnic'],
    },
  };
}
