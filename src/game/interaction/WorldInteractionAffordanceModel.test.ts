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
  it('shows one persistent affordance for visible explicit targets', () => {
    expect(shouldShowWorldInteractionAffordance(target())).toBe(true);
    expect(shouldShowWorldInteractionAffordance(target({ visible: () => true }))).toBe(true);
    expect(shouldShowWorldInteractionAffordance(target({ enabled: true }))).toBe(true);
  });

  it('does not mark automatic, hidden, disabled or deliberately bespoke interactions', () => {
    expect(shouldShowWorldInteractionAffordance(target({ activationMode: 'automatic' }))).toBe(
      false,
    );
    expect(shouldShowWorldInteractionAffordance(target({ visible: false }))).toBe(false);
    expect(shouldShowWorldInteractionAffordance(target({ enabled: () => false }))).toBe(false);
    expect(shouldShowWorldInteractionAffordance(target({ worldAffordance: false }))).toBe(false);
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
