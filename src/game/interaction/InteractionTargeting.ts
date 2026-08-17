import type { InteractionTarget } from './InteractionTarget';
import type { MapPoint } from '../world/MapTraversal';

interface ScoredTarget {
  target: InteractionTarget;
  distanceSquared: number;
}

function distanceSquared(left: MapPoint, right: MapPoint): number {
  const deltaX = left.x - right.x;
  const deltaY = left.y - right.y;
  return deltaX * deltaX + deltaY * deltaY;
}

export function selectInteractionTarget(
  playerPosition: MapPoint,
  targets: readonly InteractionTarget[],
): InteractionTarget | null {
  const candidates: ScoredTarget[] = [];

  for (const target of targets) {
    if (target.enabled === false) {
      continue;
    }

    const targetDistanceSquared = distanceSquared(playerPosition, target.position);
    if (targetDistanceSquared > target.interactionRadius * target.interactionRadius) {
      continue;
    }

    candidates.push({ target, distanceSquared: targetDistanceSquared });
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

  return candidates[0]?.target ?? null;
}
