import { describe, expect, it } from 'vitest';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';
import { resolveRainbowMeadowWalkThroughDestination } from './RainbowMeadowTraversal';

describe('Rainbow Meadow walk-through routing', () => {
  it('routes the west threshold to Sunbeam Village', () => {
    expect(
      resolveRainbowMeadowWalkThroughDestination(RAINBOW_MEADOW_LAYOUT.sunbeamGateway.position),
    ).toBe('sunbeam-village');
  });

  it('routes the north threshold to Rainbow Run Race Hub', () => {
    expect(
      resolveRainbowMeadowWalkThroughDestination(
        RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.position,
      ),
    ).toBe('rainbow-run-hub');
  });

  it('does not trigger from the safe approach points', () => {
    expect(
      resolveRainbowMeadowWalkThroughDestination(RAINBOW_MEADOW_LAYOUT.sunbeamGateway.approach),
    ).toBeNull();
    expect(
      resolveRainbowMeadowWalkThroughDestination(
        RAINBOW_MEADOW_LAYOUT.hubFeatures.rainbowRunEntrance.approach,
      ),
    ).toBeNull();
  });
});
