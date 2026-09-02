import { describe, expect, it } from 'vitest';
import type { ResidentPlacementDefinition } from './AmbientPopulationTypes';
import {
  segmentCrossesRectangle,
  validateAmbientPopulationContent,
} from './AmbientPopulationValidation';
import {
  R6_AMBIENT_RESIDENT_PLACEMENTS,
  R6_AMBIENT_SAFETY_PROFILES,
  R6_SMALL_WORLD_INTERACTIONS,
  R6_SUPPORTING_RESIDENTS,
} from './R6SupportingResidentContent';

describe('ambient population validation', () => {
  it('keeps the shipped WP2 resident and interaction definitions on authored safe ground', () => {
    expect(
      validateAmbientPopulationContent(
        R6_SUPPORTING_RESIDENTS,
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        R6_SMALL_WORLD_INTERACTIONS,
        R6_AMBIENT_SAFETY_PROFILES,
      ),
    ).toEqual([]);
  });

  it('detects a route segment that cuts through a blocker', () => {
    expect(
      segmentCrossesRectangle(
        { x: 0, y: 50 },
        { x: 100, y: 50 },
        { x: 50, y: 50, width: 20, height: 20 },
      ),
    ).toBe(true);
  });

  it('rejects undersized moving-resident touch targets', () => {
    const unsafe: ResidentPlacementDefinition = {
      id: 'placement:unsafe-touch',
      residentId: 'resident:juniper',
      sceneKey: 'MoonflowerGladeScene',
      behaviour: 'local-wander',
      routeMode: 'loop',
      waypoints: [{ id: 'unsafe-touch-point', x: 900, y: 1400 }],
      speedPxPerSecond: 70,
      interactionRadius: 60,
    };
    const issues = validateAmbientPopulationContent(
      R6_SUPPORTING_RESIDENTS,
      [unsafe],
      [],
      R6_AMBIENT_SAFETY_PROFILES,
    );
    expect(issues.some((issue) => issue.includes('too small for touch-safe play'))).toBe(true);
  });

  it('rejects routes authored through world collision geometry', () => {
    const unsafe: ResidentPlacementDefinition = {
      id: 'placement:unsafe-route',
      residentId: 'resident:juniper',
      sceneKey: 'MoonflowerGladeScene',
      behaviour: 'purposeful-route',
      routeMode: 'loop',
      waypoints: [
        { id: 'unsafe-route-a', x: 1200, y: 600 },
        { id: 'unsafe-route-b', x: 1600, y: 600 },
      ],
      speedPxPerSecond: 70,
      interactionRadius: 120,
    };
    const issues = validateAmbientPopulationContent(
      R6_SUPPORTING_RESIDENTS,
      [unsafe],
      [],
      R6_AMBIENT_SAFETY_PROFILES,
    );
    expect(issues.some((issue) => issue.includes('route crosses blocker'))).toBe(true);
  });
});
