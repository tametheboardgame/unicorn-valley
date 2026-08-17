import { describe, expect, it } from 'vitest';
import {
  RACE_COURSE_LENGTH,
  RACE_FORWARD_SPEED,
  RACE_JUMP_SPEED,
  createRaceMovementState,
  stepRaceMovement,
} from './RaceMovement';

describe('RaceMovement', () => {
  it('moves forward automatically and clamps progress at the finish', () => {
    let state = createRaceMovementState();

    state = stepRaceMovement(state, 1 / 60, false);
    expect(state.progress).toBeCloseTo(RACE_FORWARD_SPEED / 60, 5);
    expect(state.grounded).toBe(true);

    for (let frame = 0; frame < 1000 && !state.finished; frame += 1) {
      state = stepRaceMovement(state, 1 / 60, false);
    }

    expect(state.finished).toBe(true);
    expect(state.progress).toBe(RACE_COURSE_LENGTH);
    expect(stepRaceMovement(state, 1, false)).toBe(state);
  });

  it('jumps responsively, applies gravity and lands safely', () => {
    let state = createRaceMovementState();

    state = stepRaceMovement(state, 1 / 60, true);
    expect(state.grounded).toBe(false);
    expect(state.jumpOffset).toBeLessThan(0);
    expect(state.verticalVelocity).toBeGreaterThan(-RACE_JUMP_SPEED);

    for (let frame = 0; frame < 180 && !state.grounded; frame += 1) {
      state = stepRaceMovement(state, 1 / 60, false);
    }

    expect(state.grounded).toBe(true);
    expect(state.jumpOffset).toBe(0);
    expect(state.verticalVelocity).toBe(0);
  });

  it('does not allow an airborne jump to reset vertical velocity', () => {
    let state = stepRaceMovement(createRaceMovementState(), 1 / 60, true);
    const airborneVelocity = state.verticalVelocity;

    state = stepRaceMovement(state, 1 / 60, true);

    expect(state.verticalVelocity).toBeGreaterThan(airborneVelocity);
    expect(state.verticalVelocity).toBeGreaterThan(-RACE_JUMP_SPEED);
  });

  it('limits oversized frame deltas so a stalled frame cannot skip the course', () => {
    const state = stepRaceMovement(createRaceMovementState(), 10, false);

    expect(state.finished).toBe(false);
    expect(state.progress).toBeLessThan(25);
  });
});
