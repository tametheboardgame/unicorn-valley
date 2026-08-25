import { describe, expect, it } from 'vitest';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class FutureCheckpointRepository implements SaveRepository {
  public value: string | null = null;
  public backupValue: string | null = null;
  public checkpoints = new Map<number, string>();

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }

  public readBackup(): string | null {
    return this.backupValue;
  }

  public writeBackup(serialisedSave: string): void {
    this.backupValue = serialisedSave;
  }

  public removeBackup(): void {
    this.backupValue = null;
  }

  public readSchemaCheckpoint(schemaVersion: number): string | null {
    return this.checkpoints.get(schemaVersion) ?? null;
  }

  public writeSchemaCheckpoint(schemaVersion: number, serialisedSave: string): void {
    this.checkpoints.set(schemaVersion, serialisedSave);
  }

  public getHighestSchemaCheckpointVersion(): number | null {
    const versions = [...this.checkpoints.keys()];
    return versions.length > 0 ? Math.max(...versions) : null;
  }

  public removeSchemaCheckpointsUpTo(schemaVersion: number): void {
    for (const version of this.checkpoints.keys()) {
      if (version <= schemaVersion) {
        this.checkpoints.delete(version);
      }
    }
  }
}

describe('SaveService future checkpoint validation', () => {
  it('ignores a corrupt future checkpoint so valid progress can load, save and reset', () => {
    const repository = new FutureCheckpointRepository();
    let now = '2026-08-25T20:00:00.000Z';
    const service = new SaveService(repository, undefined, () => now);
    const base = service.createNewGame();
    const first = service.save({
      ...base,
      profile: { ...base.profile, name: 'Starlight' },
    });

    const futureVersion = CURRENT_SAVE_SCHEMA_VERSION + 1;
    repository.checkpoints.set(futureVersion, '{broken-future-checkpoint');

    expect(service.load()?.profile.name).toBe('Starlight');

    now = '2026-08-25T20:05:00.000Z';
    service.save({
      ...first,
      profile: { ...first.profile, name: 'Moonbeam' },
    });

    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Moonbeam');

    service.clear();

    expect(repository.value).toBeNull();
    expect(repository.backupValue).toBeNull();
    expect(repository.checkpoints.has(CURRENT_SAVE_SCHEMA_VERSION)).toBe(false);
    expect(repository.checkpoints.get(futureVersion)).toBe('{broken-future-checkpoint');

    now = '2026-08-25T20:10:00.000Z';
    const restarted = service.save(service.createNewGame());
    expect(repository.value).toBe(JSON.stringify(restarted));
  });

  it('still protects a parseable checkpoint whose declared schema matches its future key', () => {
    const repository = new FutureCheckpointRepository();
    const futureVersion = CURRENT_SAVE_SCHEMA_VERSION + 1;
    const futureCheckpoint = JSON.stringify({
      schemaVersion: futureVersion,
      marker: 'newer-client-progress',
    });
    repository.checkpoints.set(futureVersion, futureCheckpoint);

    const service = new SaveService(repository);

    expect(service.load()).toBeNull();
    service.save(service.createNewGame());
    expect(repository.value).toBeNull();
    service.clear();
    expect(repository.checkpoints.get(futureVersion)).toBe(futureCheckpoint);
  });
});
