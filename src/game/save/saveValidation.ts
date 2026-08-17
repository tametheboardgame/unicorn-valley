import { CURRENT_SAVE_SCHEMA_VERSION, type SaveGame } from './saveSchema';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string');
}

function isRecordOf(value: unknown, predicate: (entry: unknown) => boolean): boolean {
  return isRecord(value) && Object.values(value).every(predicate);
}

function isPlayerProfile(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.name === null || typeof value.name === 'string') &&
    isRecordOf(value.appearance, (entry) => typeof entry === 'string') &&
    typeof value.currentLocationId === 'string' &&
    isStringArray(value.unlockedAbilityIds)
  );
}

function isInventoryState(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecordOf(value.itemQuantities, (entry) => typeof entry === 'number' && entry >= 0) &&
    isStringArray(value.ownedCosmeticIds) &&
    isStringArray(value.ownedDecorationIds) &&
    isStringArray(value.specialItemIds)
  );
}

function isRelationshipState(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.byCharacterId)) {
    return false;
  }

  return Object.values(value.byCharacterId).every(
    (entry) =>
      isRecord(entry) &&
      typeof entry.friendshipPoints === 'number' &&
      entry.friendshipPoints >= 0 &&
      isStringArray(entry.flags),
  );
}

function isQuestState(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.byQuestId)) {
    return false;
  }

  return Object.values(value.byQuestId).every((entry) => {
    if (!isRecord(entry)) {
      return false;
    }

    return (
      ['not-started', 'active', 'completed'].includes(String(entry.status)) &&
      (entry.currentStepId === null || typeof entry.currentStepId === 'string') &&
      (entry.completedAt === null || typeof entry.completedAt === 'string')
    );
  });
}

function isWorldState(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isRecordOf(value.flags, (entry) => typeof entry === 'boolean') &&
    isStringArray(value.discoveredZoneIds) &&
    isStringArray(value.changedObjectIds) &&
    isStringArray(value.uniqueDiscoveryIds)
  );
}

function isHomeState(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringArray(value.ownedFurnitureIds) &&
    isRecordOf(value.furnitureBySlot, (entry) => typeof entry === 'string') &&
    isRecordOf(value.gardenFlags, (entry) => typeof entry === 'boolean')
  );
}

function isActivityState(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.racesById)) {
    return false;
  }

  const validRaces = Object.values(value.racesById).every(
    (entry) =>
      isRecord(entry) &&
      (entry.bestTimeMs === null ||
        (typeof entry.bestTimeMs === 'number' && entry.bestTimeMs >= 0)) &&
      isStringArray(entry.ribbonIds),
  );

  return (
    validRaces &&
    isRecordOf(value.miniGameRecords, (entry) => typeof entry === 'number' && entry >= 0)
  );
}

function isCollectionState(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return isStringArray(value.discoveryIds) && isStringArray(value.memoryIds);
}

export function isSaveGame(value: unknown): value is SaveGame {
  if (!isRecord(value)) {
    return false;
  }

  return (
    value.schemaVersion === CURRENT_SAVE_SCHEMA_VERSION &&
    typeof value.createdAt === 'string' &&
    typeof value.lastSavedAt === 'string' &&
    isPlayerProfile(value.profile) &&
    isInventoryState(value.inventory) &&
    isRelationshipState(value.relationships) &&
    isQuestState(value.quests) &&
    isWorldState(value.world) &&
    isHomeState(value.home) &&
    isActivityState(value.activities) &&
    isCollectionState(value.collections)
  );
}
