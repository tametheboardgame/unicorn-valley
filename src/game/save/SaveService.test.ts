import { describe, expect, it, vi } from 'vitest';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import { createR4LongRunningSaveFixture } from './fixtures/r4LongRunningSaveFixture';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class MemorySaveRepository implements SaveRepository {
  public value: string | null = null;
  public backupValue: string | null = null;

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

  it('returns null when no save or backup exists', () => {
    const service = new SaveService(new MemorySaveRepository());
    expect(service.load()).toBeNull();
  });

  it('returns null for malformed JSON or incomplete save data without a valid backup', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);

    repository.value = '{definitely-not-json';
    expect(service.load()).toBeNull();

    repository.value = JSON.stringify({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION });
    expect(service.load()).toBeNull();
  });

  it('preserves the previous valid save and repairs a corrupt primary from that backup', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository, undefined, () => '2026-08-25T18:00:00.000Z');
    const base = service.createNewGame();
    const first = service.save({
      ...base,
      profile: { ...base.profile, name: 'Starlight' },
    });
    const firstSerialised = repository.value;

    service.save({
      ...first,
      profile: { ...first.profile, name: 'Moonbeam' },
    });

    expect(repository.backupValue).toBe(firstSerialised);
    repository.value = '{broken-primary';

    const recovered = service.load();
    expect(recovered?.profile.name).toBe('Starlight');
    expect(JSON.parse(repository.value ?? '{}').profile.name).toBe('Starlight');
    expect(repository.backupValue).toBe(firstSerialised);
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

    service.save(service.createNewGame());

    expect(repository.value).toBe(futurePrimary);
    expect(repository.backupValue).toBe(compatibleBackup);
    expect(listener).not.toHaveBeenCalled();
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
  });

  it('clears both primary and recovery backup state', () => {
    const repository = new MemorySaveRepository();
    repository.value = '{}';
    repository.backupValue = '{}';

    new SaveService(repository).clear();

    expect(repository.value).toBeNull();
    expect(repository.backupValue).toBeNull();
  });

  it('emits SAVE_COMPLETED after persistence', () => {
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
