import { describe, expect, it, vi } from 'vitest';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import { createR4LongRunningSaveFixture } from './fixtures/r4LongRunningSaveFixture';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class MemorySaveRepository implements SaveRepository {
  public value: string | null = null;
  public backupValue: string | null = null;
  public checkpoints = new Map<number, string>();
  public failBackupWrites = false;
  public failCheckpointWrites = false;
  public beforePrimaryWrite: (() => void) | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    const beforePrimaryWrite = this.beforePrimaryWrite;
    this.beforePrimaryWrite = null;
    beforePrimaryWrite?.();
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
      throw new Error('simulated storage quota failure');
    }
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
      throw new Error('simulated checkpoint quota failure');
    }
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

describe('SaveService', () => {
  it('creates, stores and reloads a new save', () => {
    const repository = new MemorySaveRepository();
    const events = new TypedEventBus<GameEventMap>();
    const clock = vi
      .fn()
      .mockReturnValueOnce('2026-08-17T08:00:00.000Z')
      .mockReturnValue('2026-08-17T08:05:00.000Z');
    const service = new SaveService(repository, events, clock);

    const newSave = service.createNewGame();
    const storedSave = service.save(newSave);
    const reloadedSave = service.load();

    expect(newSave.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(storedSave.lastSavedAt).toBe('2026-08-17T08:05:00.000Z');
    expect(reloadedSave).toEqual(storedSave);
    expect(repository.checkpoints.get(CURRENT_SAVE_SCHEMA_VERSION)).toBe(repository.value);
  });

  it('persists creator profile identity and appearance across a fresh service instance', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);
    const newSave = service.createNewGame();
    const appearance = {
      bodyColour: 'mint',
      eyeColour: 'amber',
      maneStyle: 'fluffy',
      maneColour: 'rose',
      tailStyle: 'curl',
      tailColour: 'aqua',
      hornStyle: 'star',
      marking: 'heart',
      accessory: 'bell',
    };

    service.save({
      ...newSave,
      profile: {
        ...newSave.profile,
        name: 'Moonbeam',
        appearance,
      },
    });

    const reloadedSave = new SaveService(repository).load();
    expect(reloadedSave?.profile.name).toBe('Moonbeam');
    expect(reloadedSave?.profile.appearance).toEqual(appearance);
  });

  it('returns null when no save, checkpoint or backup exists', () => {
    const service = new SaveService(new MemorySaveRepository());
    expect(service.load()).toBeNull();
  });

  it('returns null for malformed JSON or incomplete save data without a valid fallback', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);

    repository.value = '{definitely-not-json';
    expect(service.load()).toBeNull();

    repository.value = JSON.stringify({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION });
    expect(service.load()).toBeNull();
  });

  it('repairs a corrupt primary from the latest schema checkpoint', () => {
    const repository = new MemorySaveRepository();
    let now = '2026-08-25T18:00:00.000Z';
    const service = new SaveService(repository, undefined, () => now);
    const base = service.createNewGame();
    const first = service.save({
      ...base,
      profile: { ...base.profile, name: 'Starlight' },
    });
    const firstSerialised = repository.value;

    now = '2026-08-25T18:05:00.000Z';
    service.save({
      ...first,
      profile: { ...first.profile, name: 'Moonbeam' },
    });
    repository.value = '{broken-primary';

    const recovered = service.load();
    expect(recovered?.profile.name).toBe('Moonbeam');
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Moonbeam');
    expect(repository.backupValue).toBe(firstSerialised);
  });

  it('falls back to the last-known-good backup when no current checkpoint exists', () => {
    const repository = new MemorySaveRepository();
    repository.value = '{broken-primary';
    repository.backupValue = JSON.stringify(createR4LongRunningSaveFixture());

    const recovered = new SaveService(repository).load();

    expect(recovered?.profile.name).toBe('Starlight');
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Starlight');
  });

  it('does not replace a newer-schema primary with an older recovery backup', () => {
    const repository = new MemorySaveRepository();
    const futurePrimary = JSON.stringify({
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1,
      marker: 'newer-client-progress',
    });
    const compatibleBackup = JSON.stringify(createR4LongRunningSaveFixture());
    repository.value = futurePrimary;
    repository.backupValue = compatibleBackup;

    const loaded = new SaveService(repository).load();

    expect(loaded).toBeNull();
    expect(repository.value).toBe(futurePrimary);
    expect(repository.backupValue).toBe(compatibleBackup);
  });

  it('does not overwrite a newer-schema primary when an older client attempts to save', () => {
    const repository = new MemorySaveRepository();
    const events = new TypedEventBus<GameEventMap>();
    const listener = vi.fn();
    events.on('SAVE_COMPLETED', listener);
    const futurePrimary = JSON.stringify({
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1,
      marker: 'newer-client-progress',
    });
    const compatibleBackup = JSON.stringify(createR4LongRunningSaveFixture());
    repository.value = futurePrimary;
    repository.backupValue = compatibleBackup;
    const service = new SaveService(repository, events, () => '2026-08-25T18:10:00.000Z');

    const result = service.saveWithResult(service.createNewGame());

    expect(result.status).toBe('blocked-newer-version');
    expect(repository.value).toBe(futurePrimary);
    expect(repository.backupValue).toBe(compatibleBackup);
    expect(listener).not.toHaveBeenCalled();
  });

  it('retains a future-schema write-ahead checkpoint when a cross-tab race hits the primary', () => {
    const repository = new MemorySaveRepository();
    let now = '2026-08-25T18:00:00.000Z';
    const service = new SaveService(repository, undefined, () => now);
    const base = service.createNewGame();
    const first = service.save({
      ...base,
      profile: { ...base.profile, name: 'Starlight' },
    });
    const futureVersion = CURRENT_SAVE_SCHEMA_VERSION + 1;
    const futureSave = {
      ...createR4LongRunningSaveFixture(),
      schemaVersion: futureVersion,
      profile: {
        ...createR4LongRunningSaveFixture().profile,
        name: 'Future Star',
      },
    };
    const serialisedFuture = JSON.stringify(futureSave);

    repository.beforePrimaryWrite = () => {
      repository.checkpoints.set(futureVersion, serialisedFuture);
      repository.value = serialisedFuture;
    };
    now = '2026-08-25T18:15:00.000Z';
    service.save({
      ...first,
      profile: { ...first.profile, name: 'Moonbeam' },
    });

    expect(repository.checkpoints.get(futureVersion)).toBe(serialisedFuture);
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Moonbeam');
    expect(service.load()).toBeNull();

    const racedPrimary = repository.value;
    expect(service.saveWithResult(service.createNewGame()).status).toBe(
      'blocked-newer-version',
    );
    expect(repository.value).toBe(racedPrimary);
    expect(repository.checkpoints.get(futureVersion)).toBe(serialisedFuture);
  });

  it('loads a valid migration even when backup persistence runs out of quota', () => {
    const repository = new MemorySaveRepository();
    const historical = {
      ...createR4LongRunningSaveFixture(),
      schemaVersion: 1,
    };
    const serialisedHistorical = JSON.stringify(historical);
    repository.value = serialisedHistorical;
    repository.failBackupWrites = true;

    const loaded = new SaveService(repository).load();

    expect(loaded?.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(loaded?.profile.name).toBe('Starlight');
    expect(repository.value).toBe(serialisedHistorical);
    expect(repository.checkpoints.size).toBe(0);
  });

  it('keeps the old primary when backup quota is exhausted and loads the new checkpoint', () => {
    const repository = new MemorySaveRepository();
    let now = '2026-08-25T18:00:00.000Z';
    const service = new SaveService(repository, undefined, () => now);
    const base = service.createNewGame();
    const first = service.save({
      ...base,
      profile: { ...base.profile, name: 'Starlight' },
    });
    const firstSerialised = repository.value;

    repository.failBackupWrites = true;
    now = '2026-08-25T18:20:00.000Z';
    service.save({
      ...first,
      profile: { ...first.profile, name: 'Moonbeam' },
    });

    expect(repository.value).toBe(firstSerialised);
    expect(
      JSON.parse(repository.checkpoints.get(CURRENT_SAVE_SCHEMA_VERSION) ?? '{}').profile.name,
    ).toBe('Moonbeam');
    expect(service.load()?.profile.name).toBe('Moonbeam');
  });

  it('backs up an actual schema-v1 long-running save before migrating and normalising it', () => {
    const repository = new MemorySaveRepository();
    const historical = {
      ...createR4LongRunningSaveFixture(),
      schemaVersion: 1,
    };
    const serialisedHistorical = JSON.stringify(historical);
    repository.value = serialisedHistorical;

    const loaded = new SaveService(repository).load();

    expect(loaded?.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(loaded?.profile.name).toBe('Starlight');
    expect(loaded?.activities.racesById['race:rainbow-run']?.bestTimeMs).toBe(48200);
    expect(repository.backupValue).toBe(serialisedHistorical);
    expect(JSON.parse(repository.value ?? '{}').schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(
      JSON.parse(repository.checkpoints.get(CURRENT_SAVE_SCHEMA_VERSION) ?? '{}').schemaVersion,
    ).toBe(CURRENT_SAVE_SCHEMA_VERSION);
  });

  it('clears primary, backup and current-or-older schema checkpoints', () => {
    const repository = new MemorySaveRepository();
    repository.value = '{}';
    repository.backupValue = '{}';
    repository.checkpoints.set(1, '{}');
    repository.checkpoints.set(CURRENT_SAVE_SCHEMA_VERSION, '{}');

    new SaveService(repository).clear();

    expect(repository.value).toBeNull();
    expect(repository.backupValue).toBeNull();
    expect(repository.checkpoints.size).toBe(0);
  });

  it('emits SAVE_COMPLETED after checkpoint persistence', () => {
    const repository = new MemorySaveRepository();
    const events = new TypedEventBus<GameEventMap>();
    const listener = vi.fn();
    events.on('SAVE_COMPLETED', listener);
    const service = new SaveService(repository, events, () => '2026-08-17T08:10:00.000Z');

    service.save(service.createNewGame());

    expect(listener).toHaveBeenCalledWith({
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      savedAt: '2026-08-17T08:10:00.000Z',
    });
  });
});
