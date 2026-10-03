import { describe, expect, it } from 'vitest';
import { ENVIRONMENT_PRODUCTION_SCENE_ENVIRONMENTS } from '../visual/EnvironmentProductionPresentationManager';
import { VISUAL_TIGHTENING_SUPPORTED_SCENES } from '../visual/VisualTighteningManager';
import { EXPLORATION_GEOMETRY_SUPPORTED_SCENES } from './ExplorationGeometryPresentationManager';
import { resolveRainbowMeadowWalkThroughDestination } from './RainbowMeadowTraversal';
import { createRainbowMeadowTraversalPresentation } from './RainbowMeadowTraversalPresentation';
import { WORLD_TRAVERSAL_POLISH_SUPPORTED_SCENES } from './WorldTraversalPolishManager';

describe('H4.11 Rainbow Meadow architecture ownership', () => {
  it('keeps generic compatibility managers free of Meadow composition ownership', () => {
    expect(WORLD_TRAVERSAL_POLISH_SUPPORTED_SCENES.has('RainbowMeadowScene')).toBe(false);
    expect(EXPLORATION_GEOMETRY_SUPPORTED_SCENES.has('RainbowMeadowScene')).toBe(false);
    expect(ENVIRONMENT_PRODUCTION_SCENE_ENVIRONMENTS.RainbowMeadowScene).toBeUndefined();
    expect(VISUAL_TIGHTENING_SUPPORTED_SCENES.has('RainbowMeadowScene')).toBe(false);
  });

  it('keeps traversal presentation and routing explicitly Meadow-owned', () => {
    expect(createRainbowMeadowTraversalPresentation).toBeTypeOf('function');
    expect(resolveRainbowMeadowWalkThroughDestination).toBeTypeOf('function');
  });
});
