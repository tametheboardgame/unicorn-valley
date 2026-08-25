import { SAVE_STORAGE_KEY } from './saveSchema';

export const SAVE_BACKUP_STORAGE_KEY = `${SAVE_STORAGE_KEY}.backup`;

export interface SaveRepository {
  read(): string | null;
  write(serialisedSave: string): void;
  remove(): void;
  readBackup?(): string | null;
  writeBackup?(serialisedSave: string): void;
  removeBackup?(): void;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export class LocalStorageSaveRepository implements SaveRepository {
  public constructor(
    private readonly storage: KeyValueStorage,
    private readonly storageKey: string = SAVE_STORAGE_KEY,
    private readonly backupStorageKey: string = `${storageKey}.backup`,
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
}

export function createBrowserSaveRepository(): LocalStorageSaveRepository {
  return new LocalStorageSaveRepository(globalThis.localStorage);
}
