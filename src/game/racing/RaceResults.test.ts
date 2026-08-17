import { describe, expect, it } from 'vitest';
import { HomeDecorationService } from '../home/HomeDecorationService';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  RAINBOW_RUN_FINISHER_RIBBON_ID,
  RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID,
  RAINBOW_RUN_PODIUM_ROSETTE_ID,
  RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID,
  RAINBOW_RUN_RIBBONS_DISCOVERY_ID,
  RAINBOW_RUN_SPARKLE_ITEM_ID,
  applyRaceResultToSave,
} from './RaceResults';

const RACE_ID = 'race-course:rainbow-run-practice';

class MemorySaveRepository implements SaveRepository {
  public value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

function apply(place: number, finishTimeMs: number, save = createDefaultSave()) {
  return applyRaceResultToSave(save, {
    raceId: RACE_ID,
    finishTimeMs,
    place,
    participantCount: 4,
  });
}

describe('Rainbow Run race results', () => {
  it('gives a positive persistent reward even for last place', () => {
    const result = apply(4, 12_400);
    const record = result.save.activities.racesById[RACE_ID];

    expect(result.summary.isPersonalBest).toBe(true);
    expect(result.summary.participationSparkles).toBe(2);
    expect(result.summary.podiumBonusSparkles).toBe(0);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_SPARKLE_ITEM_ID]).toBe(2);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID]).toBe(1);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID] ?? 0).toBe(0);
    expect(record).toEqual({
      bestTimeMs: 12_400,
      ribbonIds: [RAINBOW_RUN_FINISHER_RIBBON_ID],
    });
    expect(result.save.collections.discoveryIds).toContain(RAINBOW_RUN_RIBBONS_DISCOVERY_ID);
    expect(result.save.world.uniqueDiscoveryIds).toContain(RAINBOW_RUN_RIBBONS_DISCOVERY_ID);
  });

  it('adds a podium bonus and one-time podium rosette', () => {
    const result = apply(2, 10_600);
    const record = result.save.activities.racesById[RACE_ID];

    expect(result.summary.podiumBonusSparkles).toBe(2);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_SPARKLE_ITEM_ID]).toBe(4);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID]).toBe(1);
    expect(result.save.inventory.itemQuantities[RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID]).toBe(1);
    expect(record.ribbonIds).toEqual([
      RAINBOW_RUN_FINISHER_RIBBON_ID,
      RAINBOW_RUN_PODIUM_ROSETTE_ID,
    ]);
  });

  it('does not duplicate unique ribbons while repeat races still earn participation rewards', () => {
    const first = apply(1, 9_800);
    const second = apply(1, 10_300, first.save);
    const record = second.save.activities.racesById[RACE_ID];

    expect(second.summary.isPersonalBest).toBe(false);
    expect(second.summary.newRibbonIds).toHaveLength(0);
    expect(second.summary.newRewardItemIds).toHaveLength(0);
    expect(second.save.inventory.itemQuantities[RAINBOW_RUN_SPARKLE_ITEM_ID]).toBe(8);
    expect(second.save.inventory.itemQuantities[RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID]).toBe(1);
    expect(second.save.inventory.itemQuantities[RAINBOW_RUN_PODIUM_ROSETTE_ITEM_ID]).toBe(1);
    expect(record.bestTimeMs).toBe(9_800);
    expect(record.ribbonIds).toEqual([
      RAINBOW_RUN_FINISHER_RIBBON_ID,
      RAINBOW_RUN_PODIUM_ROSETTE_ID,
    ]);
  });

  it('updates the personal best only when the new time is faster', () => {
    const first = apply(4, 12_000);
    const slower = apply(4, 12_500, first.save);
    const faster = apply(4, 11_250, slower.save);

    expect(slower.summary.isPersonalBest).toBe(false);
    expect(slower.summary.bestTimeMs).toBe(12_000);
    expect(faster.summary.isPersonalBest).toBe(true);
    expect(faster.summary.previousBestTimeMs).toBe(12_000);
    expect(faster.summary.bestTimeMs).toBe(11_250);
    expect(faster.save.activities.racesById[RACE_ID].bestTimeMs).toBe(11_250);
  });

  it('survives reload and exposes its ribbon through the existing cottage decoration system', () => {
    const repository = new MemorySaveRepository();
    const saveService = new SaveService(repository);
    const result = apply(4, 12_400, saveService.createNewGame());
    saveService.save(result.save);

    const reloadedService = new SaveService(repository);
    const reloaded = reloadedService.load();
    const decorations = new HomeDecorationService(reloadedService).listOwnedDecorations();

    expect(reloaded?.activities.racesById[RACE_ID]).toEqual({
      bestTimeMs: 12_400,
      ribbonIds: [RAINBOW_RUN_FINISHER_RIBBON_ID],
    });
    expect(decorations.map(({ definition }) => definition.id)).toContain(
      RAINBOW_RUN_FINISHER_RIBBON_ITEM_ID,
    );
  });

  it('rejects impossible result data instead of corrupting the save', () => {
    expect(() =>
      applyRaceResultToSave(createDefaultSave(), {
        raceId: RACE_ID,
        finishTimeMs: 9_000,
        place: 5,
        participantCount: 4,
      }),
    ).toThrow('Race finishing place must be within the participant count.');
  });
});
