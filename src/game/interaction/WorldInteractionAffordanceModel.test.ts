import { describe, expect, it } from 'vitest';
import type { InteractionTarget } from './InteractionTarget';
import {
  getWorldInteractionAffordanceOffsetY,
  shouldShowWorldInteractionAffordance,
  WORLD_INTERACTION_AFFORDANCE_NAME_PREFIX,
} from './WorldInteractionAffordanceModel';

const target = (overrides: Partial<InteractionTarget> = {}): InteractionTarget => ({
  id: 'interaction:test',
  label: 'Test',
  actionLabel: 'Interact',
  actionKind: 'interact',
  position: { x: 100, y: 100 },
  interactionRadius: 120,
  result: { type: 'message', title: 'Test', message: 'Hello' },
  ...overrides,
});

describe('WorldInteractionAffordanceModel', () => {
  it('shows a blue affordance only when a quiet interaction explicitly opts in', () => {
    expect(shouldShowWorldInteractionAffordance(target())).toBe(false);
    expect(shouldShowWorldInteractionAffordance(target({ worldAffordance: false }))).toBe(false);
    expect(shouldShowWorldInteractionAffordance(target({ worldAffordance: true }))).toBe(true);
    expect(
      shouldShowWorldInteractionAffordance(
        target({ worldAffordance: true, visible: () => true, enabled: true }),
      ),
    ).toBe(true);
  });

  it('does not mark automatic, hidden or disabled interactions even when opted in', () => {
    expect(
      shouldShowWorldInteractionAffordance(
        target({ worldAffordance: true, activationMode: 'automatic' }),
      ),
    ).toBe(false);
    expect(
      shouldShowWorldInteractionAffordance(target({ worldAffordance: true, visible: false })),
    ).toBe(false);
    expect(
      shouldShowWorldInteractionAffordance(
        target({ worldAffordance: true, enabled: () => false }),
      ),
    ).toBe(false);
  });

  it('places talk affordances higher than ordinary object affordances', () => {
    expect(getWorldInteractionAffordanceOffsetY('talk')).toBeLessThan(
      getWorldInteractionAffordanceOffsetY('interact'),
    );
    expect(getWorldInteractionAffordanceOffsetY('enter')).toBeLessThan(0);
  });

  it('uses a stable shared object-name prefix', () => {
    expect(WORLD_INTERACTION_AFFORDANCE_NAME_PREFIX).toBe('world-interaction-affordance:');
  });
});
