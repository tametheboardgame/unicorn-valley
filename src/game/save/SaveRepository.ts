import { SAVE_STORAGE_KEY } from './saveSchema';

export const SAVE_BACKUP_STORAGE_KEY = `${SAVE_STORAGE_KEY}.backup`;
export const SAVE_SCHEMA_CHECKPOINT_STORAGE_KEY_PREFIX = `${SAVE_STORAGE_KEY}.schema.`;

export interface SaveRepository {
  read(): string | null;
  write(serialisedSave: string): void;
  remove(): void;
  readBackup?(): string | null;
  writeBackup?(serialisedSave: string): void;
  removeBackup?(): void;
  readSchemaCheckpoint?(schemaVersion: number): string | null;
  writeSchemaCheckpoint?(schemaVersion: number, serialisedSave: string): void;
  getHighestSchemaCheckpointVersion?(): number | null;
  removeSchemaCheckpointsUpTo?(schemaVersion: number): void;
}

export interface KeyValueStorage {
  readonly length?: number;
  key?(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageSaveRepository implements SaveRepository {
  public constructor(
    private readonly storage: KeyValueStorage,
    private readonly storageKey: string = SAVE_STORAGE_KEY,
    private readonly backupStorageKey: string = `${storageKey}.backup`,
    private readonly schemaCheckpointPrefix: string = `${storageKey}.schema.`,
  ) {}

  public read(): string | null {
    return this.storage.getItem(this.storageKey);
  }

  public write(serialisedSave: string): void {
    this.storage.setItem(this.storageKey, serialisedSave);
  }

  public remove(): void {
    this.storage.removeItem(this.storageKey);
  }

  public readBackup(): string | null {
    return this.storage.getItem(this.backupStorageKey);
  }

  public writeBackup(serialisedSave: string): void {
    this.storage.setItem(this.backupStorageKey, serialisedSave);
  }

  public removeBackup(): void {
    this.storage.removeItem(this.backupStorageKey);
  }

  public readSchemaCheckpoint(schemaVersion: number): string | null {
    return this.storage.getItem(this.getSchemaCheckpointKey(schemaVersion));
  }

  public writeSchemaCheckpoint(schemaVersion: number, serialisedSave: string): void {
    this.storage.setItem(this.getSchemaCheckpointKey(schemaVersion), serialisedSave);
  }

  public getHighestSchemaCheckpointVersion(): number | null {
    let highestVersion: number | null = null;
    for (const key of this.getSchemaCheckpointKeys()) {
      const schemaVersion = this.readCheckpointVersion(key);
      if (schemaVersion === null) {
        continue;
      }
      highestVersion =
        highestVersion === null ? schemaVersion : Math.max(highestVersion, schemaVersion);
    }
    return highestVersion;
  }

  public removeSchemaCheckpointsUpTo(schemaVersion: number): void {
    for (const key of this.getSchemaCheckpointKeys()) {
      const checkpointVersion = this.readCheckpointVersion(key);
      if (checkpointVersion !== null && checkpointVersion <= schemaVersion) {
        this.storage.removeItem(key);
      }
    }
  }

  private getSchemaCheckpointKey(schemaVersion: number): string {
    return `${this.schemaCheckpointPrefix}${schemaVersion}`;
  }

  private getSchemaCheckpointKeys(): string[] {
    if (this.storage.length === undefined || !this.storage.key) {
      return [];
    }

    const keys: string[] = [];
    for (let index = 0; index < this.storage.length; index += 1) {
      const key = this.storage.key(index);
      if (key?.startsWith(this.schemaCheckpointPrefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  private readCheckpointVersion(key: string): number | null {
    const rawVersion = key.slice(this.schemaCheckpointPrefix.length);
    const schemaVersion = Number(rawVersion);
    return Number.isInteger(schemaVersion) && schemaVersion >= 0 ? schemaVersion : null;
  }
}

export function createBrowserSaveRepository(): LocalStorageSaveRepository {
  return new LocalStorageSaveRepository(globalThis.localStorage);
}
