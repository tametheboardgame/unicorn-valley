import {
  migrateCrystalariumChamber,
  isCrystalariumChamberState,
  type CrystalariumChamberState,
} from './CrystalariumChamberRules';
import type { CrystalariumFullState, FullActionResult } from './CrystalariumFullRules';

export const CRYSTALARIUM_POTION_VERSION = 4 as const;
export const POTION_CAPACITY = 100;
export const POTION_BASIC_COST = 1;
export const POTION_REFINED_COST = 2;
export const POTION_MERGE_REWARD = 1;
export const POTION_SPRING_REFILL = 25;

/** Gate D approved: numeric potion and chamber are one atomic save record. */
export interface CrystalariumPotionState extends Omit<CrystalariumChamberState, 'version'> {
  readonly version: typeof CRYSTALARIUM_POTION_VERSION;
  readonly potion: number;
}

export function isCrystalariumPotionState(value: unknown): value is CrystalariumPotionState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const state = value as Partial<CrystalariumPotionState>;
  return (
    state.version === CRYSTALARIUM_POTION_VERSION &&
    Number.isSafeInteger(state.potion) &&
    Number(state.potion) >= 0 &&
    Number(state.potion) <= POTION_CAPACITY &&
    isCrystalariumChamberState({ ...state, version: 3 })
  );
}

/** Only valid older states migrate. Never overwrite unknown/future/corrupt saves. */
export function readCrystalariumPotion(value: unknown): CrystalariumPotionState | null {
  if (isCrystalariumPotionState(value)) return value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const version = (value as { version?: unknown }).version;
  if (version === CRYSTALARIUM_POTION_VERSION) return null;
  const chamber = migrateCrystalariumChamber(value as CrystalariumFullState);
  if (!chamber) return null;
  return { ...chamber, version: CRYSTALARIUM_POTION_VERSION, potion: POTION_CAPACITY };
}

/** For existing C19 pure transfer functions, which must retain strict v3 validation. */
export function potionChamber(state: CrystalariumPotionState): CrystalariumChamberState {
  return { ...state, version: 3 };
}

export type PotionGrowthKind = 'basic' | 'refined' | 'refill' | undefined;
export type PotionActionResult =
  | { readonly accepted: true; readonly state: CrystalariumPotionState; readonly message: string }
  | { readonly accepted: false; readonly state: CrystalariumPotionState; readonly reason: string };

/**
 * Transform an accepted canonical gameplay action and its potion effects as
 * one immutable candidate. The controller persists once, then publishes state.
 * Rejections never spend; merge rewards follow the canonical merge counter,
 * not clicks, render cycles or an attempted but rejected merge.
 */
export function applyCrystalariumPotion(
  prior: CrystalariumPotionState,
  result: FullActionResult,
  growth: PotionGrowthKind,
): PotionActionResult {
  if (!result.accepted) return { accepted: false, state: prior, reason: result.reason };
  const cost =
    growth === 'basic' ? POTION_BASIC_COST : growth === 'refined' ? POTION_REFINED_COST : 0;
  if (prior.potion < cost) {
    return {
      accepted: false,
      state: prior,
      reason: 'Not enough Growth Potion. Tap Brook Spring to refill for free.',
    };
  }
  const earned = result.state.merges > prior.merges ? POTION_MERGE_REWARD : 0;
  const refill = growth === 'refill' ? POTION_SPRING_REFILL : 0;
  const potion = Math.min(POTION_CAPACITY, prior.potion - cost + earned + refill);
  return {
    accepted: true,
    state: { ...result.state, version: CRYSTALARIUM_POTION_VERSION, potion },
    message: result.message,
  };
}

/** Free, immediate and repeatable, without a timer or second save store. */
export function refillCrystalariumPotion(prior: CrystalariumPotionState): FullActionResult {
  if (prior.potion === POTION_CAPACITY) {
    return { accepted: false, state: prior, reason: 'Growth Potion is already full.' };
  }
  return {
    accepted: true,
    state: {
      ...prior,
      potion: Math.min(POTION_CAPACITY, prior.potion + POTION_SPRING_REFILL),
    },
    message: 'Brook Spring refilled 25 drops of Growth Potion for free.',
  };
}
