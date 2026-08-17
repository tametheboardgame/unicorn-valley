import {
  CURRENT_SAVE_SCHEMA_VERSION,
  DEFAULT_START_LOCATION_ID,
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
      currentLocationId: DEFAULT_START_LOCATION_ID,
      unlockedAbilityIds: [],
    },
    inventory: {
      itemQuantities: {},
      ownedCosmeticIds: [],
      ownedDecorationIds: [],
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
