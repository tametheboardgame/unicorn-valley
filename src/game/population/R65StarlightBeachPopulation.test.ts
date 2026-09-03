import { describe, expect, it } from 'vitest';
import {
  R6_AMBIENT_RESIDENT_PLACEMENTS,
  R6_AMBIENT_SAFETY_PROFILES,
  R6_SMALL_WORLD_INTERACTIONS,
} from './R6SupportingResidentContent';

describe('Starlight Beach population contract', () => {
  it('places Coral and Skipper through the reusable ambient population system', () => {
    const beachPlacements = R6_AMBIENT_RESIDENT_PLACEMENTS.filter(
      ({ sceneKey }) => sceneKey === 'StarlightBeachScene',
    );

    expect(beachPlacements.map(({ residentId }) => residentId)).toEqual([
      'resident:coral',
      'resident:skipper',
    ]);
    expect(beachPlacements.every(({ interactionRadius }) => interactionRadius >= 120)).toBe(true);
  });

  it('ships several immediate Beach interactions without pulling WP10 quests forward', () => {
    const beachInteractions = R6_SMALL_WORLD_INTERACTIONS.filter(
      ({ sceneKey }) => sceneKey === 'StarlightBeachScene',
    );

    expect(beachInteractions).toHaveLength(4);
    expect(beachInteractions.map(({ kind }) => kind)).toEqual(
      expect.arrayContaining(['inspect', 'ring', 'play', 'sit']),
    );
  });

  it('registers Beach collision and transition safety for autonomous residents', () => {
    const beachProfile = R6_AMBIENT_SAFETY_PROFILES.find(
      ({ sceneKey }) => sceneKey === 'StarlightBeachScene',
    );

    expect(beachProfile).toBeDefined();
    expect(beachProfile?.forbiddenPoints?.map(({ id }) => id)).toContain(
      'transition:whispering-woods',
    );
  });
});
