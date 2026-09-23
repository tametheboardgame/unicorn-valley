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

function isHomeWallStyleState(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.wallColourId === 'string' &&
    typeof value.wallpaperId === 'string'
  );
}

function isHomeStyleState(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.walls)) {
    return false;
  }

  return (
    isHomeWallStyleState(value.walls.back) &&
    isHomeWallStyleState(value.walls.left) &&
    isHomeWallStyleState(value.walls.right) &&
    isHomeWallStyleState(value.walls.front) &&
    typeof value.floorStyleId === 'string' &&
    isRecord(value.furnitureVariants) &&
    typeof value.furnitureVariants.bed === 'string' &&
    typeof value.furnitureVariants.sofa === 'string' &&
    typeof value.furnitureVariants.teaSet === 'string' &&
    typeof value.furnitureVariants.fireplace === 'string'
  );
}

function isHomeState(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isStringArray(value.ownedFurnitureIds) &&
    isRecordOf(value.furnitureBySlot, (entry) => typeof entry === 'string') &&
    isRecordOf(value.gardenFlags, (entry) => typeof entry === 'boolean') &&
    isStringArray(value.unlockedStyleIds) &&
    isHomeStyleState(value.style)
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

function isShopState(value: unknown): boolean {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.morningSerial) ||
    Number(value.morningSerial) < 0 ||
    !isRecord(value.byShopId)
  ) {
    return false;
  }

  return Object.values(value.byShopId).every(
    (entry) =>
      isRecord(entry) &&
      Number.isInteger(entry.restockSerial) &&
      Number(entry.restockSerial) >= 0 &&
      isRecordOf(
        entry.remainingByItemId,
        (remaining) => Number.isInteger(remaining) && Number(remaining) >= 0,
      ),
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
    isCollectionState(value.collections) &&
    isShopState(value.shops)
  );
}
