import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

export type SaveRecord = Record<string, unknown>;
export type SaveMigration = (save: SaveRecord) => SaveRecord;

export const SAVE_MIGRATIONS: ReadonlyMap<number, SaveMigration> = new Map();

function isRecord(value: unknown): value is SaveRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function migrateSaveRecord(
  value: unknown,
  migrations: ReadonlyMap<number, SaveMigration> = SAVE_MIGRATIONS,
): SaveRecord | null {
  if (!isRecord(value) || !Number.isInteger(value.schemaVersion)) {
    return null;
  }

  let current = { ...value };
  let version = current.schemaVersion as number;

  if (version < 0 || version > CURRENT_SAVE_SCHEMA_VERSION) {
    return null;
  }

  while (version < CURRENT_SAVE_SCHEMA_VERSION) {
    const migration = migrations.get(version);
    if (!migration) {
      return null;
    }

    current = migration(current);
    if (!Number.isInteger(current.schemaVersion)) {
      return null;
    }

    const nextVersion = current.schemaVersion as number;
    if (nextVersion !== version + 1) {
      return null;
    }

    version = nextVersion;
  }

  return current;
}
