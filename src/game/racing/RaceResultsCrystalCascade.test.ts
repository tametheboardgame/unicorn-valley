import { describe, expect, it } from 'vitest';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import {
  CRYSTAL_CASCADE_FINISHER_RIBBON_ITEM_ID,
  CRYSTAL_CASCADE_PODIUM_ROSETTE_ITEM_ID,
  CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID,
} from '../../content/r5RaceContent';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  CRYSTAL_CASCADE_FINISHER_RIBBON_ID,
  CRYSTAL_CASCADE_PODIUM_ROSETTE_ID,
  RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID,
  applyRaceResultToSave,
} from './RaceResults';

describe('Crystal Cascade race results', () => {
  it('creates a distinct race record and finisher ribbon', () => {
    const result = applyRaceResultToSave(createDefaultSave(), {
      raceId: CRYSTAL_CASCADE_RACE_ID,
      finishTimeMs: 11_600,
      place: 4,
      participantCount: 4,
    });

    expect(result.save.activities.racesById[CRYSTAL_CASCADE_RACE_ID]).toEqual({
      bestTimeMs: 11_600,
      ribbonIds: [CRYSTAL_CASCADE_FINISHER_RIBBON_ID],
    });
    expect(result.save.inventory.itemQuantities[CRYSTAL_CASCADE_FINISHER_RIBBON_ITEM_ID]).toBe(1);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID] ?? 0).toBe(0);
    expect(result.save.collections.discoveryIds).toContain(CRYSTAL_CASCADE_RIBBONS_DISCOVERY_ID);
  });

  it('adds the course-specific podium rosette without replacing the finisher ribbon', () => {
    const result = applyRaceResultToSave(createDefaultSave(), {
      raceId: CRYSTAL_CASCADE_RACE_ID,
      finishTimeMs: 10_200,
      place: 2,
      participantCount: 4,
    });

    expect(result.save.activities.racesById[CRYSTAL_CASCADE_RACE_ID].ribbonIds).toEqual([
      CRYSTAL_CASCADE_FINISHER_RIBBON_ID,
      CRYSTAL_CASCADE_PODIUM_ROSETTE_ID,
    ]);
    expect(result.save.inventory.itemQuantities[CRYSTAL_CASCADE_PODIUM_ROSETTE_ITEM_ID]).toBe(1);
  });
});
