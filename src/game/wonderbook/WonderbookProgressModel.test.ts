import { describe, expect, it } from 'vitest';
import {
  CORAL_BEACHCOMBING_ACTIVITY_ID,
  MAPLE_BAKING_ACTIVITY_ID,
  SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID,
  TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID,
} from '../../content/r65RepeatableActivities';
import {
  PETAL_PARADE_RACE_ID,
  SHORELINE_SURGE_RACE_ID,
} from '../../content/r65RaceExpansion';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  buildWonderbookGoalEntries,
  buildWonderbookRaceEntries,
  buildWonderbookRegionEntries,
  paginateWonderbookProgress,
} from './WonderbookProgressModel';

describe('WonderbookProgressModel', () => {
  it('starts with home revealed and keeps later regions as friendly promises', () => {
    const regions = buildWonderbookRegionEntries(createDefaultSave('2026-09-05T00:00:00.000Z'));

    expect(regions).toHaveLength(6);
    expect(regions[0]).toMatchObject({
      id: 'region:moonflower-glade',
      revealed: true,
    });
    expect(regions.slice(1).every(({ revealed }) => !revealed)).toBe(true);
    expect(regions.at(-1)).toMatchObject({
      id: 'region:starlight-beach',
      hiddenName: 'A moonlit shore...',
      revealed: false,
    });
  });

  it('derives finite Bakery and Beach collection progress from existing mini-game records', () => {
    const save = createDefaultSave('2026-09-05T00:00:00.000Z');
    save.collections.discoveryIds.push(
      SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID,
      TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID,
    );
    save.activities.miniGameRecords[MAPLE_BAKING_ACTIVITY_ID] = 2;
    save.activities.miniGameRecords[CORAL_BEACHCOMBING_ACTIVITY_ID] = 3;

    const regions = buildWonderbookRegionEntries(save);
    const village = regions.find(({ id }) => id === 'region:sunbeam-village');
    const beach = regions.find(({ id }) => id === 'region:starlight-beach');

    expect(village).toMatchObject({
      revealed: true,
      collectionLine: 'Cake styles 2 of 3',
    });
    expect(beach).toMatchObject({
      revealed: true,
      collectionLine: 'Beach notebook 3 of 3',
    });
  });

  it('tracks regular race finishes and ribbons without requiring first place', () => {
    const save = createDefaultSave('2026-09-05T00:00:00.000Z');
    save.activities.racesById[PETAL_PARADE_RACE_ID] = {
      bestTimeMs: 81234,
      ribbonIds: ['item:petal-parade-finisher-ribbon'],
    };
    save.activities.racesById[SHORELINE_SURGE_RACE_ID] = {
      bestTimeMs: null,
      ribbonIds: ['item:shoreline-surge-finisher-ribbon'],
    };

    const races = buildWonderbookRaceEntries(save);
    const petal = races.find(({ id }) => id === PETAL_PARADE_RACE_ID);
    const shoreline = races.find(({ id }) => id === SHORELINE_SURGE_RACE_ID);

    expect(races).toHaveLength(5);
    expect(petal).toMatchObject({ finished: true, ribbonCount: 1 });
    expect(shoreline).toMatchObject({ finished: true, ribbonCount: 1 });
    expect(races.filter(({ finished }) => finished)).toHaveLength(2);
  });

  it('builds gentle long-term goals entirely from existing save state', () => {
    const save = createDefaultSave('2026-09-05T00:00:00.000Z');
    save.collections.discoveryIds.push(
      SUNSHINE_SPRINKLE_CAKE_DISCOVERY_ID,
      TIDEPOOL_STAR_NOTEBOOK_DISCOVERY_ID,
      ...Array.from({ length: 10 }, (_, index) => `discovery:test-${index}`),
    );
    save.collections.memoryIds.push('memory:first', 'memory:second');
    save.activities.racesById[PETAL_PARADE_RACE_ID] = {
      bestTimeMs: 81234,
      ribbonIds: [],
    };

    const goals = buildWonderbookGoalEntries(save, {
      knownFriends: 4,
      totalFriends: 10,
    });

    expect(goals.map(({ id }) => id)).toEqual([
      'goal:valley-explorer',
      'goal:friendship-garden',
      'goal:ribbon-journey',
      'goal:curiosity-cabinet',
    ]);
    expect(goals.find(({ id }) => id === 'goal:friendship-garden')).toMatchObject({
      current: 4,
      target: 6,
      complete: false,
    });
    expect(goals.find(({ id }) => id === 'goal:ribbon-journey')).toMatchObject({
      current: 1,
      target: 5,
      complete: false,
    });
    expect(goals.find(({ id }) => id === 'goal:curiosity-cabinet')).toMatchObject({
      current: 12,
      target: 12,
      complete: true,
    });
  });

  it('paginates progress cards with two entries per visible page', () => {
    const spreads = paginateWonderbookProgress(['a', 'b', 'c', 'd', 'e']);

    expect(spreads).toHaveLength(2);
    expect(spreads[0]).toMatchObject({
      leftPageNumber: 1,
      rightPageNumber: 2,
      left: ['a', 'b'],
      right: ['c', 'd'],
    });
    expect(spreads[1]).toMatchObject({
      leftPageNumber: 3,
      rightPageNumber: 4,
      left: ['e'],
      right: [],
    });
  });
});
