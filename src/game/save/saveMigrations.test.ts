import { describe, expect, it } from 'vitest';
import { migrateSaveRecord, type SaveMigration } from './saveMigrations';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

describe('migrateSaveRecord', () => {
  it('passes a current-version record through safely', () => {
    const current = { schemaVersion: CURRENT_SAVE_SCHEMA_VERSION, marker: 'current' };
    expect(migrateSaveRecord(current)).toEqual(current);
  });

  it('applies migrations sequentially', () => {
    const migration: SaveMigration = (save) => ({
      ...save,
      schemaVersion: 1,
      migrated: true,
    });
    const migrations = new Map([[0, migration]]);

    expect(migrateSaveRecord({ schemaVersion: 0 }, migrations)).toEqual({
      schemaVersion: 1,
      migrated: true,
    });
  });

  it('rejects unsupported, missing or non-sequential migrations', () => {
    expect(migrateSaveRecord({ schemaVersion: 0 })).toBeNull();
    expect(migrateSaveRecord({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1 })).toBeNull();
    expect(
      migrateSaveRecord(
        { schemaVersion: 0 },
        new Map([[0, () => ({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1 })]]),
      ),
    ).toBeNull();
  });
});
