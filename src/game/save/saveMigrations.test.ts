import { describe, expect, it } from 'vitest';
import { createR4LongRunningSaveFixture } from './fixtures/r4LongRunningSaveFixture';
import { migrateSaveRecord, type SaveMigration } from './saveMigrations';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';
import { isSaveGame } from './saveValidation';

describe('migrateSaveRecord', () => {
  it('passes a current-version record through safely', () => {
    const current = { schemaVersion: CURRENT_SAVE_SCHEMA_VERSION, marker: 'current' };
    expect(migrateSaveRecord(current)).toEqual(current);
  });

  it('migrates the representative long-running schema-v1 save without losing progress', () => {
    const historical = {
      ...createR4LongRunningSaveFixture(),
      schemaVersion: 1,
    };

    const migrated = migrateSaveRecord(historical);
    expect(migrated && isSaveGame(migrated)).toBe(true);
    if (!migrated || !isSaveGame(migrated)) {
      throw new Error('Expected the schema-v1 fixture to migrate to a valid current save.');
    }

    expect(migrated.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(migrated.profile.name).toBe('Starlight');
    expect(migrated.inventory.itemQuantities['currency:shimmer']).toBe(18);
    expect(migrated.relationships.byCharacterId['character:willow']?.friendshipPoints).toBe(7);
    expect(migrated.quests.byQuestId['quest:pip-strange-egg']?.status).toBe('completed');
    expect(migrated.activities.racesById['race:rainbow-run']?.bestTimeMs).toBe(48200);
    expect(migrated.collections.memoryIds).toContain('memory:marigold-picnic');
  });

  it('applies migrations sequentially', () => {
    const toVersionOne: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 1,
      firstMigration: true,
    });
    const toVersionTwo: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 2,
      secondMigration: true,
    });
    const migrations = new Map([
      [0, toVersionOne],
      [1, toVersionTwo],
    ]);

    expect(migrateSaveRecord({ schemaVersion: 0 }, migrations)).toEqual({
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      firstMigration: true,
      secondMigration: true,
    });
  });

  it('rejects unsupported, missing or non-sequential migrations', () => {
    expect(migrateSaveRecord({ schemaVersion: 0 })).toBeNull();
    expect(migrateSaveRecord({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1 })).toBeNull();
    expect(
      migrateSaveRecord(
        { schemaVersion: 0 },
        new Map([[0, () => ({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION })]]),
      ),
    ).toBeNull();
  });
});
