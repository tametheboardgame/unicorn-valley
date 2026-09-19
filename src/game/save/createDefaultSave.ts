import {
  CURRENT_SAVE_SCHEMA_VERSION,
  NEW_GAME_START_LOCATION_ID,
  type SaveGame,
} from './saveSchema';

export function createDefaultSave(timestamp: string = new Date().toISOString()): SaveGame {
  return {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    createdAt: timestamp,
    lastSavedAt: timestamp,
    profile: {
      name: null,
      appearance: {},
      currentLocationId: NEW_GAME_START_LOCATION_ID,
      unlockedAbilityIds: [],
    },
    inventory: {
      itemQuantities: Object.fromEntries(
        COTTAGE_STARTER_DECORATION_IDS.map((itemId) => [itemId, 1]),
      ),
      ownedCosmeticIds: [],
      ownedDecorationIds: [...COTTAGE_STARTER_DECORATION_IDS],
      specialItemIds: [],
    },
    relationships: {
      byCharacterId: {},
    },
    quests: {
      byQuestId: {},
    },
    world: {
      flags: {},
      discoveredZoneIds: [],
      changedObjectIds: [],
      uniqueDiscoveryIds: [],
    },
    home: {
      ownedFurnitureIds: [],
      furnitureBySlot: {},
      gardenFlags: {},
      unlockedStyleIds: [...COTTAGE_STARTER_HOME_STYLE_IDS],
      style: {
        walls: {
          back: {
            wallColourId: 'cottage-wall:moon-cream',
            wallpaperId: 'cottage-wallpaper:plain',
          },
          left: {
            wallColourId: 'cottage-wall:moon-cream',
            wallpaperId: 'cottage-wallpaper:plain',
          },
          right: {
            wallColourId: 'cottage-wall:moon-cream',
            wallpaperId: 'cottage-wallpaper:plain',
          },
          front: {
            wallColourId: 'cottage-wall:moon-cream',
            wallpaperId: 'cottage-wallpaper:plain',
          },
        },
        floorStyleId: 'cottage-floor:honey-oak',
        furnitureVariants: {
          bed: 'cottage-furniture:bed:moonflower',
          sofa: 'cottage-furniture:sofa:sage',
          teaSet: 'cottage-furniture:tea-set:honey-oak',
          fireplace: 'cottage-furniture:fireplace:warm-stone',
        },
      },
    },
    activities: {
      racesById: {},
      miniGameRecords: {},
    },
    collections: {
      discoveryIds: [],
      memoryIds: [],
    },
  };
}
import { COTTAGE_STARTER_DECORATION_IDS } from '../../content/cottageStarterDecorations';
import { COTTAGE_STARTER_HOME_STYLE_IDS } from '../../content/cottageHomeStyleEntitlements';
