import { describe, expect, it } from 'vitest';
import type {
  AmbientPopulationContext,
  ResidentPlacementDefinition,
  ResidentStoryAnchorDefinition,
} from './AmbientPopulationTypes';
import {
  chooseTalkLine,
  conditionMatches,
  movementDurationMs,
  nextRouteCursor,
  resolveResidentLocation,
} from './AmbientResidentRoutine';
import { R6_AMBIENT_RESIDENT_PLACEMENTS } from './R6SupportingResidentContent';

const morning: AmbientPopulationContext = {
  timeState: 'morning',
  worldFlags: {},
};

const night: AmbientPopulationContext = {
  timeState: 'night',
  worldFlags: {},
};

describe('ambient resident routine contract', () => {
  it('matches time and world-state conditions without inventing persistent position state', () => {
    expect(conditionMatches({ timeStates: ['morning'] }, morning)).toBe(true);
    expect(conditionMatches({ timeStates: ['night'] }, morning)).toBe(false);
    expect(
      conditionMatches(
        { worldFlags: [{ id: 'flag:test', value: true }] },
        { ...morning, worldFlags: { 'flag:test': true } },
      ),
    ).toBe(true);
  });

  it('supports loop, ping-pong and bounded random-neighbour routes', () => {
    expect(nextRouteCursor({ index: 2, direction: 1 }, 3, 'loop')).toEqual({
      index: 0,
      direction: 1,
    });
    expect(nextRouteCursor({ index: 2, direction: 1 }, 3, 'ping-pong')).toEqual({
      index: 1,
      direction: -1,
    });
    expect(nextRouteCursor({ index: 0, direction: 1 }, 3, 'random-neighbour', () => 0)).toEqual({
      index: 1,
      direction: -1,
    });
  });

  it('uses story anchors ahead of normal routines when required story state is active', () => {
    const placement: ResidentPlacementDefinition = {
      id: 'placement:test',
      residentId: 'resident:clover',
      sceneKey: 'RainbowMeadowScene',
      behaviour: 'purposeful-route',
      routeMode: 'loop',
      waypoints: [{ id: 'point:test', x: 100, y: 100 }],
      speedPxPerSecond: 80,
      interactionRadius: 120,
    };
    const anchor: ResidentStoryAnchorDefinition = {
      id: 'anchor:test',
      residentId: 'resident:clover',
      sceneKey: 'RainbowMeadowScene',
      position: { x: 200, y: 200 },
      interactionRadius: 120,
      activeWhen: { worldFlags: [{ id: 'flag:story-active', value: true }] },
    };

    expect(
      resolveResidentLocation('resident:clover', 'RainbowMeadowScene', [placement], [anchor], {
        ...morning,
        worldFlags: { 'flag:story-active': true },
      })?.kind,
    ).toBe('story-anchor');
  });

  it('proves contextual relocation for Tansy across day and evening', () => {
    expect(
      resolveResidentLocation(
        'resident:tansy',
        'SunbeamVillageScene',
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        [],
        morning,
      )?.id,
    ).toBe('resident-placement:tansy:village-day');
    expect(
      resolveResidentLocation(
        'resident:tansy',
        'SunbeamVillageScene',
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        [],
        night,
      ),
    ).toBeNull();
    expect(
      resolveResidentLocation(
        'resident:tansy',
        'RainbowMeadowScene',
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        [],
        night,
      )?.id,
    ).toBe('resident-placement:tansy:meadow-evening');
  });

  it('computes movement duration from authored speed with a safe lower bound', () => {
    expect(movementDurationMs({ x: 0, y: 0 }, { x: 100, y: 0 }, 100)).toBe(1000);
    expect(movementDurationMs({ x: 0, y: 0 }, { x: 1, y: 0 }, 100)).toBe(180);
  });

  it('rotates ambient talk rather than repeating one static crowd line', () => {
    const lines = ['one', 'two', 'three'] as const;
    expect(chooseTalkLine(lines, 0)).toBe('one');
    expect(chooseTalkLine(lines, 1)).toBe('two');
    expect(chooseTalkLine(lines, 3)).toBe('one');
  });
});
