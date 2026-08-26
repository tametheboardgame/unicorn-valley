import { describe, expect, it } from 'vitest';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class ResetTestRepository implements SaveRepository {
  public value: string | null = null;
  public backupValue: string | null = null;
  public checkpoints = new Map<number, string>();
  public failCheckpointWrites = false;

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
    if (this.failCheckpointWrites) {
      throw new Error('simulated checkpoint failure');
    }
    this.checkpoints.set(schemaVersion, serialisedSave);
  }

  public getHighestSchemaCheckpointVersion(): number | null {
    const versions = [...this.checkpoints.keys()];
    return versions.length > 0 ? Math.max(...versions) : null;
  }
}

describe('SaveService transactional New Game reset', () => {
  it('preserves the current adventure if the fresh checkpoint cannot be written', () => {
    const repository = new ResetTestRepository();
    const service = new SaveService(repository, undefined, () => '2026-08-26T21:30:00.000Z');
    const current = service.createNewGame();
    service.save({
      ...current,
      profile: {
        ...current.profile,
        name: 'Starlight',
      },
    });
    const currentPrimary = repository.value;

    repository.failCheckpointWrites = true;
    const result = service.resetToNewGameWithResult();

    expect(result.status).toBe('storage-failed');
    expect(repository.value).toBe(currentPrimary);
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Starlight');
    expect(JSON.parse(repository.backupValue ?? '{}').profile.name).toBe('Starlight');
  });

  it('commits the fresh adventure before discarding the old recovery backup', () => {
    const repository = new ResetTestRepository();
    let now = '2026-08-26T21:30:00.000Z';
    const service = new SaveService(repository, undefined, () => now);
    const current = service.createNewGame();
    service.save({
      ...current,
      profile: {
        ...current.profile,
        name: 'Starlight',
      },
    });

    now = '2026-08-26T21:35:00.000Z';
    const result = service.resetToNewGameWithResult();

    expect(result.status).toBe('saved');
    expect(result.save.profile.name).toBeNull();
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBeNull();
    expect(
      JSON.parse(repository.checkpoints.get(CURRENT_SAVE_SCHEMA_VERSION) ?? '{}').profile.name,
    ).toBeNull();
    expect(repository.backupValue).toBeNull();
  });
});
