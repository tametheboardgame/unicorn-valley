import type { InteractionCondition, InteractionTarget } from './InteractionTarget';
import type { MapPoint } from '../world/MapTraversal';

interface ScoredTarget {
  target: InteractionTarget;
  distanceSquared: number;
}

export interface InteractionSelectionOptions {
  preferredTargetId?: string | null;
  retainedTargetId?: string | null;
  retentionMargin?: number;
}

function distanceSquared(left: MapPoint, right: MapPoint): number {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;
  return deltaX * deltaX + deltaY * deltaY;
}

function conditionIsTrue(condition: InteractionCondition | undefined): boolean {
  if (condition === undefined) {
    return true;
  }
  return typeof condition === 'function' ? condition() : condition;
}

export function getInteractionTargetPosition(target: InteractionTarget): MapPoint {
  return typeof target.position === 'function' ? target.position() : target.position;
}

export function getInteractionApproachPosition(target: InteractionTarget): MapPoint | null {
  if (!target.approachPosition) {
    return null;
  }
  return typeof target.approachPosition === 'function'
    ? target.approachPosition()
    : target.approachPosition;
}

export function isInteractionTargetEligible(
  playerPosition: MapPoint,
  target: InteractionTarget,
): boolean {
  if (target.activationMode === 'automatic') {
    return false;
  }
  if (!conditionIsTrue(target.visible) || !conditionIsTrue(target.enabled)) {
    return false;
  }
  if (target.reachable !== undefined) {
    const reachable =
      typeof target.reachable === 'function'
        ? (target.reachable as (position: MapPoint) => boolean)(playerPosition)
        : target.reachable;
    if (!reachable) {
      return false;
    }
  }

  const targetPosition = getInteractionTargetPosition(target);
  return distanceSquared(playerPosition, targetPosition) <= target.interactionRadius ** 2;
}

function scoreEligibleTargets(
  playerPosition: MapPoint,
  targets: readonly InteractionTarget[],
): ScoredTarget[] {
  const candidates: ScoredTarget[] = [];
  for (const target of targets) {
    if (!isInteractionTargetEligible(playerPosition, target)) {
      continue;
    }
    candidates.push({
      target,
      distanceSquared: distanceSquared(playerPosition, getInteractionTargetPosition(target)),
    });
  }

  candidates.sort((left, right) => {
    if (left.distanceSquared !== right.distanceSquared) {
      return left.distanceSquared - right.distanceSquared;
    }
    const priorityDifference = (right.target.priority ?? 0) - (left.target.priority ?? 0);
    if (priorityDifference !== 0) {
      return priorityDifference;
    }
    return left.target.id.localeCompare(right.target.id);
  });
  return candidates;
}

/**
 * Selects exactly one explicit interaction. Distance always wins over priority, explicit direct
 * taps win only while still eligible, and a small retention margin prevents the prompt flickering
 * between two neighbours when the player is standing on their boundary.
 */
export function selectInteractionTarget(
  playerPosition: MapPoint,
  targets: readonly InteractionTarget[],
  options: InteractionSelectionOptions = {},
): InteractionTarget | null {
  const candidates = scoreEligibleTargets(playerPosition, targets);
  if (candidates.length === 0) {
    return null;
  }

  if (options.preferredTargetId) {
    const preferred = candidates.find(({ target }) => target.id === options.preferredTargetId);
    if (preferred) {
      return preferred.target;
    }
  }

  const best = candidates[0];
  if (!options.retainedTargetId || best.target.id === options.retainedTargetId) {
    return best.target;
  }

  const retained = candidates.find(({ target }) => target.id === options.retainedTargetId);
  if (!retained) {
    return best.target;
  }

  const retentionMargin = Math.max(0, options.retentionMargin ?? 18);
  const bestDistance = Math.sqrt(best.distanceSquared);
  const retainedDistance = Math.sqrt(retained.distanceSquared);
  return retainedDistance <= bestDistance + retentionMargin ? retained.target : best.target;
}
