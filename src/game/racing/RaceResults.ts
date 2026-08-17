import type { DiscoveryId, ItemId } from '../../content/contentTypes';
import type { SaveGame } from '../save/saveSchema';

export const RAINBOW_RUN_SPARKLE_ITEM_ID: ItemId = 'item:rainbow-run-sparkle';
export const RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID: ItemId = 'item:rainbow-run-finisher-ribbon';
export const RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID: ItemId = 'item:rainbow-run-podium-rosette';
export const RAINBOW_RUN_RIBBONS_DISCOVERY_ID: DiscoveryId = 'discovery:rainbow-run-ribbons';

export const RAINBOW_RUN_FINISHER_RIBBON_ID = 'ribbon:rainbow-run-finisher';
export const RAINBOW_RUN_PODIUM_ROSETTE_ID = 'ribbon:rainbow-run-podium';

export const RACE_PARTICIPATION_SPARKLES = 2;
export const RACE_PODIUM_BONUS_SPARKLES = 2;

export interface RaceResultInput {
  raceId: string;
  finishTimeMs: number;
  place: number;
  participantCount: number;
}

export interface RaceRewardSummary {
  previousBestTimeMs: number | null;
  bestTimeMs: number;
  isPersonalBest: boolean;
  participationSparkles: number;
  podiumBonusSparkles: number;
  newRibbonIds: readonly string[];
  newRewardItemIds: readonly ItemId[];
}

export interface AppliedRaceResult {
  save: SaveGame;
  summary: RaceRewardSummary;
}

function appendUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function incrementItem(
  quantities: Record<string, number>,
  itemId: ItemId,
  quantity: number,
): void {
  quantities[itemId] = (quantities[itemId] ?? 0) + quantity;
}

function assertValidResult(input: RaceResultInput): void {
  if (!input.raceId.trim()) {
    throw new Error('Race result requires a race ID.');
  }
  if (!Number.isFinite(input.finishTimeMs) || input.finishTimeMs <= 0) {
    throw new Error('Race finish time must be a positive finite number.');
  }
  if (!Number.isInteger(input.participantCount) || input.participantCount <= 0) {
    throw new Error('Race participant count must be a positive integer.');
  }
  if (!Number.isInteger(input.place) || input.place < 1 || input.place > input.participantCount) {
    throw new Error('Race finishing place must be within the participant count.');
  }
}

export function applyRaceResultToSave(save: SaveGame, input: RaceResultInput): AppliedRaceResult {
  assertValidResult(input);

  const previousRecord = save.activities.racesById[input.raceId] ?? {
    bestTimeMs: null,
    ribbonIds: [],
  };
  const previousBestTimeMs = previousRecord.bestTimeMs;
  const isPersonalBest = previousBestTimeMs === null || input.finishTimeMs < previousBestTimeMs;
  const bestTimeMs = isPersonalBest ? input.finishTimeMs : previousBestTimeMs;
  const isPodium = input.place <= Math.min(3, input.participantCount);

  const newRibbonIds: string[] = [];
  const newRewardItemIds: ItemId[] = [];
  let ribbonIds = [...previousRecord.ribbonIds];

  if (!ribbonIds.includes(RAINBOW_RUN_FINISHER_RIBBON_ID)) {
    ribbonIds = appendUnique(ribbonIds, RAINBOW_RUN_FINISHER_RIBBON_ID);
    newRibbonIds.push(RAINBOW_RUN_FINISHER_RIBBON_ID);
    newRewardItemIds.push(RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID);
  }

  if (isPodium && !ribbonIds.includes(RAINBOW_RUN_PODIUM_ROSETTE_ID)) {
    ribbonIds = appendUnique(ribbonIds, RAINBOW_RUN_PODIUM_ROSETTE_ID);
    newRibbonIds.push(RAINBOW_RUN_PODIUM_ROSETTE_ID);
    newRewardItemIds.push(RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID);
  }

  const podiumBonusSparkles = isPodium ? RACE_PODIUM_BONUS_SPARKLES : 0;
  const itemQuantities = { ...save.inventory.itemQuantities };
  incrementItem(
    itemQuantities,
    RAINBOW_RUN_SPARKLE_ITEM_ID,
    RACE_PARTICIPATION_SPARKLES + podiumBonusSparkles,
  );

  for (const itemId of newRewardItemIds) {
    if ((itemQuantities[itemId] ?? 0) < 1) {
      itemQuantities[itemId] = 1;
    }
  }

  const discoveryIds = appendUnique(save.collections.discoveryIds, RAINBOW_RUN_RIBBONS_DISCOVERY_ID);
  const uniqueDiscoveryIds = appendUnique(
    save.world.uniqueDiscoveryIds,
    RAINBOW_RUN_RIBBONS_DISCOVERY_ID,
  );

  const nextSave: SaveGame = {
    ...save,
    inventory: {
      ...save.inventory,
      itemQuantities,
    },
    activities: {
      ...save.activities,
      racesById: {
        ...save.activities.racesById,
        [input.raceId]: {
          bestTimeMs,
          ribbonIds,
        },
      },
    },
    collections: {
      ...save.collections,
      discoveryIds,
    },
    world: {
      ...save.world,
      uniqueDiscoveryIds,
    },
  };

  return {
    save: nextSave,
    summary: {
      previousBestTimeMs,
      bestTimeMs,
      isPersonalBest,
      participationSparkles: RACE_PARTICIPATION_SPARKLES,
      podiumBonusSparkles,
      newRibbonIds,
      newRewardItemIds,
    },
  };
}
