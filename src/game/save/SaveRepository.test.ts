import { describe, expect, it } from 'vitest';
import {
  LocalStorageSaveRepository,
  type KeyValueStorage,
  SAVE_SCHEMA_CHECKPOINT_STORAGE_KEY_PREFIX,
} from './SaveRepository';

class MemoryKeyValueStorage implements KeyValueStorage {
  private readonly values = new Map<string, string>();

  public get length(): number {
    return this.values.size;
  }

  public key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe('LocalStorageSaveRepository schema checkpoints', () => {
  it('discovers versioned checkpoints and removes only current-or-older versions', () => {
    const storage = new MemoryKeyValueStorage();
    const repository = new LocalStorageSaveRepository(storage);
    storage.setItem(`${SAVE_SCHEMA_CHECKPOINT_STORAGE_KEY_PREFIX}1`, 'v1');
    storage.setItem(`${SAVE_SCHEMA_CHECKPOINT_STORAGE_KEY_PREFIX}2`, 'v2');
    storage.setItem(`${SAVE_SCHEMA_CHECKPOINT_STORAGE_KEY_PREFIX}3`, 'v3');
    storage.setItem('unrelated', 'keep');

    expect(repository.getSchemaCheckpointVersions()).toEqual([3, 2, 1]);
    expect(repository.getHighestSchemaCheckpointVersion()).toBe(3);
    expect(repository.readSchemaCheckpoint(2)).toBe('v2');

    repository.removeSchemaCheckpointsUpTo(2);

    expect(repository.readSchemaCheckpoint(1)).toBeNull();
    expect(repository.readSchemaCheckpoint(2)).toBeNull();
    expect(repository.readSchemaCheckpoint(3)).toBe('v3');
    expect(storage.getItem('unrelated')).toBe('keep');
  });
});
