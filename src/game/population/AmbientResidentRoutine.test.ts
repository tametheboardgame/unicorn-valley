import { describe, expect, it } from 'vitest';
import type {
  AmbientPopulationContext,
  ResidentPlacementDefinition,
  ResidentStoryAnchorDefinition,
  ResidentTalkDefinition,
} from './AmbientPopulationTypes';
import {
  chooseTalkLine,
  conditionMatches,
  movementDurationMs,
  nextRouteCursor,
  resolveResidentLocation,
  resolveResidentTalkLines,
} from './AmbientResidentRoutine';
import {
  R6_AMBIENT_RESIDENT_PLACEMENTS,
  R6_SUPPORTING_RESIDENTS,
} from './R6SupportingResidentContent';
import {
  R6_AMBIENT_RESIDENT_STORY_ANCHORS,
  R6_SUPPORTING_RESIDENT_TALK_VARIANTS,
} from './R6SupportingResidentStateContent';

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

  it('wires a production story anchor for Juniper after Willow garden progression', () => {
    const context: AmbientPopulationContext = {
      ...morning,
      worldFlags: { 'flag:willow-garden-planted': true },
    };
    expect(
      resolveResidentLocation(
        'resident:juniper',
        'MoonflowerGladeScene',
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        R6_AMBIENT_RESIDENT_STORY_ANCHORS,
        context,
      )?.id,
    ).toBe('resident-anchor:juniper:willow-garden');
  });

  it('proves contextual relocation for Tansy across day and evening', () => {
    expect(
      resolveResidentLocation(
        'resident:tansy',
        'SunbeamVillageScene',
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        R6_AMBIENT_RESIDENT_STORY_ANCHORS,
        morning,
      )?.id,
    ).toBe('resident-placement:tansy:village-day');
    expect(
      resolveResidentLocation(
        'resident:tansy',
        'SunbeamVillageScene',
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        R6_AMBIENT_RESIDENT_STORY_ANCHORS,
        night,
      ),
    ).toBeNull();
    expect(
      resolveResidentLocation(
        'resident:tansy',
        'RainbowMeadowScene',
        R6_AMBIENT_RESIDENT_PLACEMENTS,
        R6_AMBIENT_RESIDENT_STORY_ANCHORS,
        night,
      )?.id,
    ).toBe('resident-placement:tansy:meadow-evening');
  });

  it('resolves conditional talk lines from progression while preserving default talk', () => {
    const juniper = R6_SUPPORTING_RESIDENTS.find(({ id }) => id === 'resident:juniper');
    expect(juniper).toBeDefined();
    if (!juniper) {
      return;
    }
    const talk: ResidentTalkDefinition = {
      ...juniper.talk,
      variants: R6_SUPPORTING_RESIDENT_TALK_VARIANTS[juniper.id],
    };

    expect(resolveResidentTalkLines(talk, morning)).toEqual(juniper.talk.lines);
    expect(
      resolveResidentTalkLines(talk, {
        ...morning,
        worldFlags: { 'flag:willow-garden-planted': true },
      })[0],
    ).toContain("Willow's moonflowers");
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
