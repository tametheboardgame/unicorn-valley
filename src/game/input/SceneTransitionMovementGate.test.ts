import { describe, expect, it } from 'vitest';
import { SceneTransitionMovementGate } from './SceneTransitionMovementGate';

describe('SceneTransitionMovementGate', () => {
  it('blocks movement inherited into a new scene until movement is released once', () => {
    const gate = new SceneTransitionMovementGate();

    gate.update(true);
    expect(gate.filter(1)).toBe(0);
    expect(gate.isWaitingForNeutral()).toBe(true);

    gate.update(false);
    expect(gate.isWaitingForNeutral()).toBe(false);
    expect(gate.filter(1)).toBe(1);
    expect(gate.filter(-1)).toBe(-1);
  });

  it('does not re-arm after the scene has observed neutral input', () => {
    const gate = new SceneTransitionMovementGate();

    gate.update(false);
    gate.update(true);

    expect(gate.filter(1)).toBe(1);
  });
});
