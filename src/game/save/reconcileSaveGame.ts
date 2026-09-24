import type { SaveGame } from './saveSchema';

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

export function reconcileSaveGame(save: SaveGame): SaveGame {
  return {
    ...save,
    profile: {
      ...save.profile,
      unlockedAbilityIds: uniqueStrings(save.profile.unlockedAbilityIds),
    },
    inventory: {
      ...save.inventory,
      ownedCosmeticIds: uniqueStrings(save.inventory.ownedCosmeticIds),
      ownedDecorationIds: uniqueStrings(save.inventory.ownedDecorationIds),
      specialItemIds: uniqueStrings(save.inventory.specialItemIds),
    },
    relationships: {
      byCharacterId: Object.fromEntries(
        Object.entries(save.relationships.byCharacterId).map(([characterId, progress]) => [
          characterId,
          {
            ...progress,
            flags: uniqueStrings(progress.flags),
          },
        ]),
      ),
    },
    quests: {
      byQuestId: Object.fromEntries(
        Object.entries(save.quests.byQuestId).map(([questId, progress]) => [
          questId,
          {
            ...progress,
            currentStepId: progress.status === 'active' ? progress.currentStepId : null,
          },
        ]),
      ),
    },
    world: {
      ...save.world,
      discoveredZoneIds: uniqueStrings(save.world.discoveredZoneIds),
      changedObjectIds: uniqueStrings(save.world.changedObjectIds),
      uniqueDiscoveryIds: uniqueStrings(save.world.uniqueDiscoveryIds),
    },
    home: {
      ...save.home,
      ownedFurnitureIds: uniqueStrings(save.home.ownedFurnitureIds),
    },
    activities: {
      ...save.activities,
      racesById: Object.fromEntries(
        Object.entries(save.activities.racesById).map(([raceId, record]) => [
          raceId,
          {
            ...record,
            ribbonIds: uniqueStrings(record.ribbonIds),
          },
        ]),
      ),
    },
    collections: {
      discoveryIds: uniqueStrings(save.collections.discoveryIds),
      memoryIds: uniqueStrings(save.collections.memoryIds),
    },
    shops: {
      morningSerial: Math.max(0, Math.floor(save.shops.morningSerial)),
      byShopId: Object.fromEntries(
        Object.entries(save.shops.byShopId).map(([shopId, stock]) => [
          shopId,
          {
            restockSerial: Math.max(0, Math.floor(stock.restockSerial)),
            remainingByItemId: Object.fromEntries(
              Object.entries(stock.remainingByItemId).map(([itemId, remaining]) => [
                itemId,
                Math.max(0, Math.floor(remaining)),
              ]),
            ),
          },
        ]),
      ),
    },
    storyReading: {
      preferences: {
        fontSize: Math.max(16, Math.min(28, Math.round(save.storyReading.preferences.fontSize))),
        lineHeight: Math.max(
          1.4,
          Math.min(2, Math.round(save.storyReading.preferences.lineHeight * 10) / 10),
        ),
      },
      byStoryId: Object.fromEntries(
        Object.entries(save.storyReading.byStoryId).map(([storyId, progress]) => [
          storyId,
          {
            ...progress,
            blockProgress: Math.max(0, Math.min(1, progress.blockProgress)),
            chapterPercentComplete: Math.max(
              0,
              Math.min(100, progress.chapterPercentComplete),
            ),
            percentComplete: progress.completed
              ? 100
              : Math.max(0, Math.min(99.9, progress.percentComplete)),
          },
        ]),
      ),
    },
  };
}
