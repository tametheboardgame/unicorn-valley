export const CURRENT_SAVE_SCHEMA_VERSION = 9;
export const SAVE_STORAGE_KEY = 'unicorn-valley.save';
export const DEFAULT_START_LOCATION_ID = 'moonflower-cottage';
export const NEW_GAME_START_LOCATION_ID = 'location:moonflower-glade';

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

export type CottageWallKey = 'back' | 'left' | 'right' | 'front';
export type CottageFurnitureStyleKey = 'bed' | 'sofa' | 'teaSet' | 'fireplace';

export interface HomeWallStyleState {
  wallColourId: string;
  wallpaperId: string;
}

export interface HomeStyleState {
  walls: Record<CottageWallKey, HomeWallStyleState>;
  floorStyleId: string;
  furnitureVariants: Record<CottageFurnitureStyleKey, string>;
}

export interface HomeState {
  ownedFurnitureIds: string[];
  furnitureBySlot: Record<string, string>;
  gardenFlags: Record<string, boolean>;
  unlockedStyleIds: string[];
  style: HomeStyleState;
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

export interface ShopStockRecord {
  restockSerial: number;
  remainingByItemId: Record<string, number>;
}

export interface ShopState {
  morningSerial: number;
  byShopId: Record<string, ShopStockRecord>;
}

export interface ReaderPreferencesState {
  fontSize: number;
  lineHeight: number;
}

export interface StoryReadingProgress {
  chapterId: string;
  blockId: string;
  blockProgress: number;
  chapterPercentComplete: number;
  percentComplete: number;
  completed: boolean;
  lastReadAt: string;
}

export interface StoryReadingState {
  preferences: ReaderPreferencesState;
  byStoryId: Record<string, StoryReadingProgress>;
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
  shops: ShopState;
  storyReading: StoryReadingState;
}
