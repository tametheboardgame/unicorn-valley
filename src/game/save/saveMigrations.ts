import { createDefaultSave } from './createDefaultSave';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

export type SaveRecord = Record<string, unknown>;
export type SaveMigration = (save: SaveRecord) => SaveRecord;

function isRecord(value: unknown): value is SaveRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeRecord(defaultValue: SaveRecord, value: unknown): SaveRecord {
  return isRecord(value) ? { ...defaultValue, ...value } : { ...defaultValue };
}

const migrateV1ToV2: SaveMigration = (save) => {
  const timestamp = typeof save.createdAt === 'string' ? save.createdAt : '1970-01-01T00:00:00.000Z';
  const defaults = createDefaultSave(timestamp);

  return {
    ...defaults,
    ...save,
    schemaVersion: 2,
    profile: mergeRecord(defaults.profile, save.profile),
    inventory: mergeRecord(defaults.inventory, save.inventory),
    relationships: mergeRecord(defaults.relationships, save.relationships),
    quests: mergeRecord(defaults.quests, save.quests),
    world: mergeRecord(defaults.world, save.world),
    home: mergeRecord(defaults.home, save.home),
    activities: mergeRecord(defaults.activities, save.activities),
    collections: mergeRecord(defaults.collections, save.collections),
  };
};

export const SAVE_MIGRATIONS: ReadonlyMap<number, SaveMigration> = new Map([[1, migrateV1ToV2]]);

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
