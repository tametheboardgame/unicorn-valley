import type {
  RaceBoostZoneDefinition,
  RaceCollectableDefinition,
  RaceCourseDefinition,
  RaceObstacleDefinition,
} from './RaceCourse';
import {
  RACE_MAX_FRAME_SECONDS,
  createRaceMovementState,
  stepRaceMovement,
  type RaceMovementState,
} from './RaceMovement';

export const RACE_SLOWDOWN_SECONDS = 0.85;
export const RACE_STUMBLE_SECONDS = 0.32;
export const RACE_SLOWDOWN_MULTIPLIER = 0.58;

export interface RaceRunState {
  movement: RaceMovementState;
  hitObstacleIds: readonly string[];
  collectedIds: readonly string[];
  activeBoostZoneId: string | null;
  slowdownRemaining: number;
  stumbleRemaining: number;
}

export type RaceRunEvent =
  | { type: 'obstacle-hit'; obstacle: RaceObstacleDefinition }
  | { type: 'boost-entered'; boost: RaceBoostZoneDefinition }
  | { type: 'collectable-collected'; collectable: RaceCollectableDefinition }
  | { type: 'finished' };

export interface RaceRunStepResult {
  state: RaceRunState;
  events: readonly RaceRunEvent[];
}

export function createRaceRunState(): RaceRunState {
  return {
    movement: createRaceMovementState(),
    hitObstacleIds: [],
    collectedIds: [],
    activeBoostZoneId: null,
    slowdownRemaining: 0,
    stumbleRemaining: 0,
  };
}

export function getBoostZoneAtProgress(
  course: RaceCourseDefinition,
  progress: number,
): RaceBoostZoneDefinition | null {
  return (
    course.boostZones.find(
      (boost) => progress >= boost.startProgress && progress <= boost.endProgress,
    ) ?? null
  );
}

function crossesProgressSpan(
  previousProgress: number,
  nextProgress: number,
  centreProgress: number,
  halfWidth: number,
): boolean {
  const minProgress = Math.min(previousProgress, nextProgress);
  const maxProgress = Math.max(previousProgress, nextProgress);
  return maxProgress >= centreProgress - halfWidth && minProgress <= centreProgress + halfWidth;
}

function countdown(value: number, deltaSeconds: number): number {
  return Math.max(0, value - deltaSeconds);
}

export function stepRaceRun(
  state: RaceRunState,
  course: RaceCourseDefinition,
  deltaSeconds: number,
  jumpRequested: boolean,
): RaceRunStepResult {
  if (state.movement.finished) {
    return { state, events: [] };
  }

  const frameSeconds = Math.max(0, Math.min(deltaSeconds, RACE_MAX_FRAME_SECONDS));
  let slowdownRemaining = countdown(state.slowdownRemaining, frameSeconds);
  let stumbleRemaining = countdown(state.stumbleRemaining, frameSeconds);
  const boostAtStart = getBoostZoneAtProgress(course, state.movement.progress);
  const forwardSpeedMultiplier = boostAtStart
    ? boostAtStart.speedMultiplier
    : slowdownRemaining > 0
      ? RACE_SLOWDOWN_MULTIPLIER
      : 1;

  const previousMovement = state.movement;
  const movement = stepRaceMovement(
    previousMovement,
    frameSeconds,
    jumpRequested,
    forwardSpeedMultiplier,
    course.length,
  );
  const events: RaceRunEvent[] = [];
  const hitObstacleIds = new Set(state.hitObstacleIds);
  const collectedIds = new Set(state.collectedIds);
  const playerHeight = Math.max(0, -movement.jumpOffset);

  for (const obstacle of course.obstacles) {
    if (hitObstacleIds.has(obstacle.id)) {
      continue;
    }
    if (
      !crossesProgressSpan(
        previousMovement.progress,
        movement.progress,
        obstacle.progress,
        obstacle.width / 2,
      )
    ) {
      continue;
    }

    if (playerHeight < obstacle.clearanceHeight) {
      hitObstacleIds.add(obstacle.id);
      slowdownRemaining = RACE_SLOWDOWN_SECONDS;
      stumbleRemaining = RACE_STUMBLE_SECONDS;
      events.push({ type: 'obstacle-hit', obstacle });
    }
  }

  for (const collectable of course.collectables) {
    if (collectedIds.has(collectable.id)) {
      continue;
    }
    if (
      !crossesProgressSpan(
        previousMovement.progress,
        movement.progress,
        collectable.progress,
        collectable.pickupRadius,
      )
    ) {
      continue;
    }

    if (Math.abs(playerHeight - collectable.heightAboveGround) <= collectable.pickupRadius) {
      collectedIds.add(collectable.id);
      events.push({ type: 'collectable-collected', collectable });
    }
  }

  const boostAtEnd = getBoostZoneAtProgress(course, movement.progress);
  if (boostAtEnd && boostAtEnd.id !== state.activeBoostZoneId) {
    events.push({ type: 'boost-entered', boost: boostAtEnd });
  }

  if (!previousMovement.finished && movement.finished) {
    events.push({ type: 'finished' });
  }

  return {
    state: {
      movement,
      hitObstacleIds: [...hitObstacleIds],
      collectedIds: [...collectedIds],
      activeBoostZoneId: boostAtEnd?.id ?? null,
      slowdownRemaining,
      stumbleRemaining,
    },
    events,
  };
}
