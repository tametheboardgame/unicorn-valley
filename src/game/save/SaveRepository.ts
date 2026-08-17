import { SAVE_STORAGE_KEY } from './saveSchema';

export interface SaveRepository {
  read(): string | null;
  write(serialisedSave: string): void;
  remove(): void;
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
}

export function createBrowserSaveRepository(): LocalStorageSaveRepository {
  return new LocalStorageSaveRepository(globalThis.localStorage);
}
