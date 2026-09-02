import type {
  AmbientPopulationContext,
  ResidentCondition,
  ResidentPlacementDefinition,
  ResidentRouteMode,
  ResidentStoryAnchorDefinition,
  SupportingResidentId,
} from './AmbientPopulationTypes';

export interface ResidentRouteCursor {
  index: number;
  direction: 1 | -1;
}

export interface ResolvedResidentLocation {
  residentId: SupportingResidentId;
  kind: 'placement' | 'story-anchor';
  id: string;
  sceneKey: string;
  priority: number;
  placement?: ResidentPlacementDefinition;
  storyAnchor?: ResidentStoryAnchorDefinition;
}

export function conditionMatches(
  condition: ResidentCondition | undefined,
  context: AmbientPopulationContext,
): boolean {
  if (!condition) {
    return true;
  }
  if (condition.timeStates && !condition.timeStates.includes(context.timeState)) {
    return false;
  }
  if (condition.worldFlags?.some(({ id, value }) => Boolean(context.worldFlags[id]) !== value)) {
    return false;
  }
  return true;
}

export function nextRouteCursor(
  cursor: ResidentRouteCursor,
  count: number,
  mode: ResidentRouteMode,
  random: () => number = Math.random,
): ResidentRouteCursor {
  if (count <= 1) {
    return { index: 0, direction: 1 };
  }

  if (mode === 'loop') {
    return { index: (cursor.index + 1) % count, direction: 1 };
  }

  if (mode === 'random-neighbour') {
    const direction: 1 | -1 = random() < 0.5 ? -1 : 1;
    let index = cursor.index + direction;
    if (index < 0) {
      index = 1;
    } else if (index >= count) {
      index = count - 2;
    }
    return { index, direction };
  }

  let direction = cursor.direction;
  let index = cursor.index + direction;
  if (index >= count) {
    direction = -1;
    index = count - 2;
  } else if (index < 0) {
    direction = 1;
    index = 1;
  }
  return { index, direction };
}

export function movementDurationMs(
  from: { x: number; y: number },
  to: { x: number; y: number },
  speedPxPerSecond: number,
): number {
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const safeSpeed = Math.max(20, speedPxPerSecond);
  return Math.max(180, Math.round((distance / safeSpeed) * 1000));
}

export function resolveResidentLocation(
  residentId: SupportingResidentId,
  sceneKey: string,
  placements: readonly ResidentPlacementDefinition[],
  anchors: readonly ResidentStoryAnchorDefinition[],
  context: AmbientPopulationContext,
): ResolvedResidentLocation | null {
  const candidates: ResolvedResidentLocation[] = [];

  for (const anchor of anchors) {
    if (
      anchor.residentId === residentId &&
      anchor.sceneKey === sceneKey &&
      conditionMatches(anchor.activeWhen, context)
    ) {
      candidates.push({
        residentId,
        kind: 'story-anchor',
        id: anchor.id,
        sceneKey,
        priority: anchor.priority ?? 1000,
        storyAnchor: anchor,
      });
    }
  }

  for (const placement of placements) {
    if (
      placement.residentId === residentId &&
      placement.sceneKey === sceneKey &&
      conditionMatches(placement.activeWhen, context)
    ) {
      candidates.push({
        residentId,
        kind: 'placement',
        id: placement.id,
        sceneKey,
        priority: placement.priority ?? 0,
        placement,
      });
    }
  }

  return candidates.sort((left, right) => right.priority - left.priority)[0] ?? null;
}

export function chooseTalkLine(lines: readonly string[], interactionCount: number): string {
  if (lines.length === 0) {
    return 'Hello!';
  }
  return lines[Math.abs(interactionCount) % lines.length] ?? lines[0] ?? 'Hello!';
}
