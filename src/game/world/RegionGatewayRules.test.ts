import { describe, expect, it } from 'vitest';
import {
  INTERACTIVE_GATEWAY_RADIUS,
  shouldActivateWalkThroughGateway,
  WALK_THROUGH_GATEWAY_RADIUS,
} from './RegionGatewayRules';

describe('RegionGatewayRules', () => {
  it('activates normal region exits by movement only', () => {
    expect(shouldActivateWalkThroughGateway(WALK_THROUGH_GATEWAY_RADIUS, false)).toBe(true);
    expect(shouldActivateWalkThroughGateway(WALK_THROUGH_GATEWAY_RADIUS + 1, false)).toBe(false);
  });

  it('never treats an interactive race gateway as a walk-through exit', () => {
    expect(shouldActivateWalkThroughGateway(INTERACTIVE_GATEWAY_RADIUS - 1, true)).toBe(false);
  });
});
