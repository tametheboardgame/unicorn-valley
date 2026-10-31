/**
 * C20 Gate D: deliberately non-persistent, unconnected balance experiment.
 *
 * These parameters are NOT approved Crystalarium rules. The live controller,
 * saves, 42 sockets and free generator behaviour must not import this file
 * until the owner explicitly approves the economic design and migration.
 */
export type C20PotionCapacity = 100 | 150 | 200;
export type C20PotionRecovery = 'brook-spring' | 'free-basic-at-zero';

export interface C20PotionCandidate {
  readonly capacity: C20PotionCapacity;
  readonly recovery: C20PotionRecovery;
  readonly basicCost: number;
  readonly refinedCost: number;
  readonly springRefill: number;
  readonly mergeReward: number;
  readonly offerReward: number;
}

export interface C20PotionSnapshot {
  readonly remaining: number;
}

export type C20PotionTrialAction = 'basic' | 'refined' | 'merge' | 'offer' | 'refill';

export interface C20PotionTrialOutcome {
  readonly accepted: boolean;
  /** Only a successfully persisted game action can spend or award potion. */
  readonly saved: boolean;
}

export interface C20PotionTrialResult {
  readonly accepted: boolean;
  readonly state: C20PotionSnapshot;
  readonly spent: number;
  readonly awarded: number;
  readonly reason: string;
}

const validAmount = (amount: number): boolean => Number.isSafeInteger(amount) && amount >= 0;

/** Readable finite parameters so future candidates cannot introduce hidden costs. */
export function validC20PotionCandidate(candidate: C20PotionCandidate): boolean {
  return (
    [100, 150, 200].includes(candidate.capacity) &&
    ['brook-spring', 'free-basic-at-zero'].includes(candidate.recovery) &&
    validAmount(candidate.basicCost) &&
    candidate.basicCost > 0 &&
    validAmount(candidate.refinedCost) &&
    candidate.refinedCost >= candidate.basicCost &&
    validAmount(candidate.springRefill) &&
    candidate.springRefill > 0 &&
    validAmount(candidate.mergeReward) &&
    validAmount(candidate.offerReward)
  );
}

export function createC20PotionTrial(
  capacity: C20PotionCapacity,
  recovery: C20PotionRecovery,
): C20PotionCandidate {
  // Comparative defaults only. All numbers, including rewards, are proposals.
  return {
    capacity,
    recovery,
    basicCost: 1,
    refinedCost: 2,
    springRefill: 25,
    mergeReward: 1,
    offerReward: 3,
  };
}

/**
 * A small deterministic balance probe, never a gameplay/save implementation.
 * Caller supplies whether the equivalent canonical action was accepted and
 * durably saved. Rejected and failed-save actions leave the original object.
 */
export function trialC20Potion(
  candidate: C20PotionCandidate,
  state: C20PotionSnapshot,
  action: C20PotionTrialAction,
  outcome: C20PotionTrialOutcome,
): C20PotionTrialResult {
  if (
    !validC20PotionCandidate(candidate) ||
    !Number.isSafeInteger(state.remaining) ||
    state.remaining < 0 ||
    state.remaining > candidate.capacity
  ) {
    return { accepted: false, state, spent: 0, awarded: 0, reason: 'Invalid trial inputs.' };
  }
  if (!outcome.accepted || !outcome.saved) {
    return { accepted: false, state, spent: 0, awarded: 0, reason: 'No accepted, saved action.' };
  }

  let spent = 0;
  let award = 0;
  switch (action) {
    case 'basic':
      spent =
        // Also cover the stranded remainder if a later approved design makes
        // basicCost > 1 (e.g. 1 drop remaining against a 2-drop basic cost).
        candidate.recovery === 'free-basic-at-zero' && state.remaining < candidate.basicCost
          ? 0
          : candidate.basicCost;
      break;
    case 'refined':
      spent = candidate.refinedCost;
      break;
    case 'refill':
      if (candidate.recovery !== 'brook-spring') {
        return { accepted: false, state, spent: 0, awarded: 0, reason: 'No refill in this model.' };
      }
      award = candidate.springRefill;
      break;
    case 'merge':
      award = candidate.mergeReward;
      break;
    case 'offer':
      award = candidate.offerReward;
      break;
  }

  if (state.remaining < spent) {
    return {
      accepted: false,
      state,
      spent: 0,
      awarded: 0,
      reason: 'Not enough potion; a free continuation must remain available.',
    };
  }
  const remaining = Math.min(candidate.capacity, state.remaining - spent + award);
  return {
    accepted: true,
    state: { remaining },
    spent,
    awarded: remaining - (state.remaining - spent),
    reason: 'Candidate balance applied to a non-saving trial only.',
  };
}
