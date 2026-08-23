import type { DiscoveryId, ItemId } from '../../content/contentTypes';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import {
  CRYSTAL_CASCADE_FINISHER_RIBBON_ITEM_ID,
  CRYSTAL_CASCADE_PODIUM_ROSETTE_ITEM_ID,
  CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID,
} from '../../content/r5RaceContent';
import type { SaveGame } from '../save/saveSchema';

export const RAINBOW_RUN_SPARKLE_ITEM_ID: ItemId = 'item:rainbow-run-sparkle';
export const RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID: ItemId = 'item:rainbow-run-finisher-ribbon';
export const RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID: ItemId = 'item:rainbow-run-podium-rosette';
export const RAINBOW_RUN_RIBBONS_DISCOVERY_ID: DiscoveryId = 'discovery:rainbow-run-ribbons';

export const RAINBOW_RUN_FINISHER_RIBBON_ID = 'ribbon:rainbow-run-finisher';
export const RAINBOW_RUN_PODIUM_ROSETTE_ID = 'ribbon:rainbow-run-podium';
export const CRYSTAL_CASCADE_FINISHER_RIBBON_ID = 'ribbon:crystal-cascade-finisher';
export const CRYSTAL_CASCADE_PODIUM_ROSETTE_ID = 'ribbon:crystal-cascade-podium';

export const RACE_PARTICIPATION_SPARKLES = 2;
export const RACE_PODIUM_BONUS_SPARKLES = 2;

interface RaceRewardProfile {
  finisherRibbonId: string;
  finisherItemId: ItemId;
  podiumRibbonId: string;
  podiumItemId: ItemId;
  discoveryId: DiscoveryId;
}

const RAINBOW_RUN_REWARD_PROFILE: RaceRewardProfile = {
  finisherRibbonId: RAINBOW_RUN_FINISHER_RIBBON_ID,
  finisherItemId: RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID,
  podiumRibbonId: RAINBOW_RUN_PODIUM_ROSETTE_ID,
  podiumItemId: RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID,
  discoveryId: RAINBOW_RUN_RIBBONS_DISCOVERY_ID,
};

const CRYSTAL_CASCADE_REWARD_PROFILE: RaceRewardProfile = {
  finisherRibbonId: CRYSTAL_CASCADE_FINISHER_RIBBON_ID,
  finisherItemId: CRYSTAL_CASCADE_FINISHER_RIBBON_ITEM_ID,
  podiumRibbonId: CRYSTAL_CASCADE_PODIUM_ROSETTE_ID,
  podiumItemId: CRYSTAL_CASCADE_PODIUM_ROSETTE_ITEM_ID,
  discoveryId: CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID,
};

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

function rewardProfileForRace(raceId: string): RaceRewardProfile {
  return raceId === CRYSTAL_CASCADE_RACE_ID
    ? CRYSTAL_CASCADE_REWARD_PROFILE
    : RAINBOW_RUN_REWARD_PROFILE;
}

function appendUnique(values: readonly string[], value: string): string[] {
  return values.includes(value) ? [...values] : [...values, value];
}

function incrementItem(quantities: Record<string, number>, itemId: ItemId, quantity: number): void {
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
  const rewardProfile = rewardProfileForRace(input.raceId);

  const previousRecord = save.activities.racesById[input.raceId] ?? {
    bestTimeMs: null,
    ribbonIds: [],
  };
  const previousBestTimeMs = previousRecord.bestTimeMs;
  const isPersonalBest = previousBestTimeMs === null || input.finishTimeMs < previousBestTimeMs;
  const bestTimeMs =
    previousBestTimeMs === null
      ? input.finishTimeMs
      : Math.min(previousBestTimeMs, input.finishTimeMs);
  const isPodium = input.place <= Math.min(3, input.participantCount);

  const newRibbonIds: string[] = [];
  const newRewardItemIds: ItemId[] = [];
  let ribbonIds = [...previousRecord.ribbonIds];
  const alreadyOwnsFinisherRibbon =
    (save.inventory.itemQuantities[rewardProfile.finisherItemId] ?? 0) > 0;
  const alreadyOwnsPodiumRosette =
    (save.inventory.itemQuantities[rewardProfile.podiumItemId] ?? 0) > 0;

  if (!ribbonIds.includes(rewardProfile.finisherRibbonId)) {
    ribbonIds = appendUnique(ribbonIds, rewardProfile.finisherRibbonId);
    if (!alreadyOwnsFinisherRibbon) {
      newRibbonIds.push(rewardProfile.finisherRibbonId);
      newRewardItemIds.push(rewardProfile.finisherItemId);
    }
  }

  if (isPodium && !ribbonIds.includes(rewardProfile.podiumRibbonId)) {
    ribbonIds = appendUnique(ribbonIds, rewardProfile.podiumRibbonId);
    if (!alreadyOwnsPodiumRosette) {
      newRibbonIds.push(rewardProfile.podiumRibbonId);
      newRewardItemIds.push(rewardProfile.podiumItemId);
    }
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

  const discoveryIds = appendUnique(save.collections.discoveryIds, rewardProfile.discoveryId);
  const uniqueDiscoveryIds = appendUnique(save.world.uniqueDiscoveryIds, rewardProfile.discoveryId);

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
