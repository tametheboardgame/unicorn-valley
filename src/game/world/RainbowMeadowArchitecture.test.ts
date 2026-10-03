import { describe, expect, it } from 'vitest';
import {
  ENVIRONMENT_PRODUCTION_SCENE_ENVIRONMENTS,
  EXPLORATION_GEOMETRY_SUPPORTED_SCENE_KEYS,
  VISUAL_TIGHTENING_SUPPORTED_SCENE_KEYS,
  WORLD_TRAVERSAL_POLISH_SUPPORTED_SCENE_KEYS,
} from './RegionPresentationOwnership';
import { resolveRainbowMeadowWalkThroughDestination } from './RainbowMeadowTraversal';

describe('H4.11 Rainbow Meadow architecture ownership', () => {
  it('keeps generic compatibility managers free of Meadow composition ownership', () => {
    expect(WORLD_TRAVERSAL_POLISH_SUPPORTED_SCENE_KEYS).not.toContain('RainbowMeadowScene');
    expect(EXPLORATION_GEOMETRY_SUPPORTED_SCENE_KEYS).not.toContain('RainbowMeadowScene');
    expect(ENVIRONMENT_PRODUCTION_SCENE_ENVIRONMENTS).not.toHaveProperty('RainbowMeadowScene');
    expect(VISUAL_TIGHTENING_SUPPORTED_SCENE_KEYS).not.toContain('RainbowMeadowScene');
  });

  it('keeps walk-through routing in a Meadow-owned pure contract', () => {
    expect(resolveRainbowMeadowWalkThroughDestination).toBeTypeOf('function');
  });
});
