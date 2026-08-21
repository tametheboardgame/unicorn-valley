export const CURRENT_SAVE_SCHEMA_VERSION = 2;
export const SAVE_STORAGE_KEY = 'unicorn-valley.save';
export const DEFAULT_START_LOCATION_ID = 'moonflower-cottage';

export interface PlayerProfile {
  name: string | null;
  appearance: Record<string, string>;
  currentLocationId: string;
  unlockedAbilityIds: string[];
}

export interface InventoryState {
  itemQuantities: Record<string, number>;
  ownedCosmeticIds: string[];
  ownedDecorationIds: string[];
  specialItemIds: string[];
}

export interface RelationshipProgress {
  friendshipPoints: number;
  flags: string[];
}

export interface RelationshipState {
  byCharacterId: Record<string, RelationshipProgress>;
}

export type QuestStatus = 'not-started' | 'active' | 'completed';

export interface QuestProgress {
  status: QuestStatus;
  currentStepId: string | null;
  completedAt: string | null;
}

export interface QuestState {
  byQuestId: Record<string, QuestProgress>;
}

export interface WorldState {
  flags: Record<string, boolean>;
  discoveredZoneIds: string[];
  changedObjectIds: string[];
  uniqueDiscoveryIds: string[];
}

export interface HomeState {
  ownedFurnitureIds: string[];
  furnitureBySlot: Record<string, string>;
  gardenFlags: Record<string, boolean>;
}

export interface RaceRecord {
  bestTimeMs: number | null;
  ribbonIds: string[];
}

export interface ActivityState {
  racesById: Record<string, RaceRecord>;
  miniGameRecords: Record<string, number>;
}

export interface CollectionState {
  discoveryIds: string[];
  memoryIds: string[];
}

export interface SaveGame {
  schemaVersion: number;
  createdAt: string;
  lastSavedAt: string;
  profile: PlayerProfile;
  inventory: InventoryState;
  relationships: RelationshipState;
  quests: QuestState;
  world: WorldState;
  home: HomeState;
  activities: ActivityState;
  collections: CollectionState;
}
