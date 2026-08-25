import { describe, expect, it } from 'vitest';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class OrderingRepository implements SaveRepository {
  public value: string | null = null;
  public backupValue: string | null = null;
  public checkpoints = new Map<number, string>();
  public failBackupWrites = false;
  public afterCheckpointMiss: ((schemaVersion: number) => void) | null = null;

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
    if (this.failBackupWrites) {
      throw new Error('simulated backup quota failure');
    }
    this.backupValue = serialisedSave;
  }

  public removeBackup(): void {
    this.backupValue = null;
  }

  public readSchemaCheckpoint(schemaVersion: number): string | null {
    const checkpoint = this.checkpoints.get(schemaVersion) ?? null;
    if (checkpoint === null && this.afterCheckpointMiss) {
      const afterCheckpointMiss = this.afterCheckpointMiss;
      this.afterCheckpointMiss = null;
      afterCheckpointMiss(schemaVersion);
    }
    return checkpoint;
  }

  public writeSchemaCheckpoint(schemaVersion: number, serialisedSave: string): void {
    this.checkpoints.set(schemaVersion, serialisedSave);
  }

  public getSchemaCheckpointVersions(): number[] {
    return [...this.checkpoints.keys()].sort((left, right) => right - left);
  }

  public getHighestSchemaCheckpointVersion(): number | null {
    return this.getSchemaCheckpointVersions()[0] ?? null;
  }

  public removeSchemaCheckpointsUpTo(schemaVersion: number): void {
    for (const version of this.checkpoints.keys()) {
      if (version <= schemaVersion) {
        this.checkpoints.delete(version);
      }
    }
  }
}

describe('SaveService checkpoint ordering', () => {
  it('keeps the write-ahead checkpoint authoritative after the device clock moves backwards', () => {
    const repository = new OrderingRepository();
    let now = '2026-08-25T21:00:00.000Z';
    const service = new SaveService(repository, undefined, () => now);
    const base = service.createNewGame();
    const first = service.save({
      ...base,
      profile: { ...base.profile, name: 'Starlight' },
    });
    const firstPrimary = repository.value;

    repository.failBackupWrites = true;
    now = '2026-08-25T20:00:00.000Z';
    service.save({
      ...first,
      profile: { ...first?.profile, name: 'Moonbeam' },
    });

    expect(repository.value).toBe(firstPrimary);
    expect(
      JSON.parse(repository.checkpoints.get(CURRENT_SAVE_SCHEMA_VERSION) ?? '{}').profile.name,
    ).toBe('Moonbeam');

    const loaded = service.load();

    expect(loaded?.profile.name).toBe('Moonbeam');
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Moonbeam');
  });

  it('does not backfill a stale primary over a checkpoint created by another same-schema tab', () => {
    const repository = new OrderingRepository();
    let now = '2026-08-25T21:00:00.000Z';
    const service = new SaveService(repository, undefined, () => now);
    const base = service.createNewGame();
    const first = service.save({
      ...base,
      profile: { ...base.profile, name: 'Starlight' },
    });
    expect(first).not.toBeNull();

    repository.checkpoints.clear();
    const newerSave = {
      ...first!,
      lastSavedAt: '2026-08-25T21:05:00.000Z',
      profile: { ...first!.profile, name: 'Moonbeam' },
    };
    const serialisedNewer = JSON.stringify(newerSave);
    repository.afterCheckpointMiss = (schemaVersion) => {
      repository.checkpoints.set(schemaVersion, serialisedNewer);
    };

    expect(service.load()?.profile.name).toBe('Starlight');
    expect(repository.checkpoints.get(CURRENT_SAVE_SCHEMA_VERSION)).toBe(serialisedNewer);

    now = '2026-08-25T21:10:00.000Z';
    expect(service.load()?.profile.name).toBe('Moonbeam');
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Moonbeam');
  });
});
