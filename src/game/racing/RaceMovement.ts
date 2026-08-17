export const RACE_FORWARD_SPEED = 370;
export const RACE_GRAVITY = 2200;
export const RACE_JUMP_SPEED = 820;
export const RACE_COURSE_LENGTH = 3600;
export const RACE_MAX_FRAME_SECONDS = 0.05;

export interface RaceMovementState {
  progress: number;
  jumpOffset: number;
  verticalVelocity: number;
  grounded: boolean;
  finished: boolean;
}

export function createRaceMovementState(): RaceMovementState {
  return {
    progress: 0,
    jumpOffset: 0,
    verticalVelocity: 0,
    grounded: true,
    finished: false,
  };
}

export function stepRaceMovement(
  state: RaceMovementState,
  deltaSeconds: number,
  jumpRequested: boolean,
  forwardSpeedMultiplier = 1,
  courseLength = RACE_COURSE_LENGTH,
): RaceMovementState {
  if (state.finished) {
    return state;
  }

  const frameSeconds = Math.max(0, Math.min(deltaSeconds, RACE_MAX_FRAME_SECONDS));
  const speedMultiplier = Number.isFinite(forwardSpeedMultiplier)
    ? Math.max(0, forwardSpeedMultiplier)
    : 1;
  const finishProgress = Number.isFinite(courseLength) && courseLength > 0
    ? courseLength
    : RACE_COURSE_LENGTH;
  let jumpOffset = state.jumpOffset;
  let verticalVelocity = state.verticalVelocity;
  let grounded = state.grounded;

  if (jumpRequested && grounded) {
    verticalVelocity = -RACE_JUMP_SPEED;
    grounded = false;
  }

  if (!grounded) {
    verticalVelocity += RACE_GRAVITY * frameSeconds;
    jumpOffset += verticalVelocity * frameSeconds;

    if (jumpOffset >= 0) {
      jumpOffset = 0;
      verticalVelocity = 0;
      grounded = true;
    }
  }

  const progress = Math.min(
    finishProgress,
    state.progress + RACE_FORWARD_SPEED * speedMultiplier * frameSeconds,
  );

  return {
    progress,
    jumpOffset,
    verticalVelocity,
    grounded,
    finished: progress >= finishProgress,
  };
}
