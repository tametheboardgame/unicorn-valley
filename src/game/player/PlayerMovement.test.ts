import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PLAYER_SPEED,
  frameRateAdjustedMovementResponse,
  MOVEMENT_RESPONSE_REFERENCE_FRAME_MS,
  resolvePlayerMovement,
} from './PlayerMovement';

describe('resolvePlayerMovement', () => {
  it('moves at the configured speed on a cardinal axis', () => {
    const command = resolvePlayerMovement(1, 0);

    expect(command.velocityX).toBe(DEFAULT_PLAYER_SPEED);
    expect(command.velocityY).toBe(0);
    expect(command.facing).toBe('right');
    expect(command.motionState).toBe('moving');
  });

  it('normalises diagonal input so it is not faster than cardinal movement', () => {
    const command = resolvePlayerMovement(1, 1);
    const speed = Math.hypot(command.velocityX, command.velocityY);

    expect(speed).toBeCloseTo(DEFAULT_PLAYER_SPEED, 6);
    expect(command.facing).toBe('down');
  });

  it('preserves analogue input magnitude below one', () => {
    const command = resolvePlayerMovement(0.5, 0);

    expect(command.velocityX).toBe(DEFAULT_PLAYER_SPEED / 2);
    expect(command.velocityY).toBe(0);
  });

  it('keeps the previous facing while idle', () => {
    const command = resolvePlayerMovement(0, 0, DEFAULT_PLAYER_SPEED, 'left');

    expect(command).toEqual({
      velocityX: 0,
      velocityY: 0,
      facing: 'left',
      motionState: 'idle',
    });
  });

  it('uses the dominant movement axis to choose facing', () => {
    expect(resolvePlayerMovement(-1, 0.25).facing).toBe('left');
    expect(resolvePlayerMovement(0.2, -1).facing).toBe('up');
  });

  it('clamps out-of-range input before calculating velocity', () => {
    const command = resolvePlayerMovement(4, 0);

    expect(command.velocityX).toBe(DEFAULT_PLAYER_SPEED);
  });
});

describe('frameRateAdjustedMovementResponse', () => {
  it('preserves the authored response at the 60 FPS reference frame', () => {
    expect(
      frameRateAdjustedMovementResponse(0.34, MOVEMENT_RESPONSE_REFERENCE_FRAME_MS),
    ).toBeCloseTo(0.34, 8);
    expect(
      frameRateAdjustedMovementResponse(0.56, MOVEMENT_RESPONSE_REFERENCE_FRAME_MS),
    ).toBeCloseTo(0.56, 8);
  });

  it('matches two 60 FPS response steps when one frame takes twice as long', () => {
    const baseResponse = 0.34;
    const twoReferenceSteps = 1 - (1 - baseResponse) ** 2;

    expect(
      frameRateAdjustedMovementResponse(baseResponse, MOVEMENT_RESPONSE_REFERENCE_FRAME_MS * 2),
    ).toBeCloseTo(twoReferenceSteps, 8);
  });

  it('bounds pathological frame stalls instead of snapping movement instantly', () => {
    const response = frameRateAdjustedMovementResponse(0.34, 5_000);

    expect(response).toBeGreaterThan(0.34);
    expect(response).toBeLessThan(1);
  });
});
