import { describe, expect, it, vi } from 'vitest';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import type { SaveRepository } from './SaveRepository';
import { SaveService } from './SaveService';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class MemorySaveRepository implements SaveRepository {
  public value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
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

  it('returns null when no save exists', () => {
    const service = new SaveService(new MemorySaveRepository());
    expect(service.load()).toBeNull();
  });

  it('returns null for malformed JSON or incomplete save data', () => {
    const repository = new MemorySaveRepository();
    const service = new SaveService(repository);

    repository.value = '{definitely-not-json';
    expect(service.load()).toBeNull();

    repository.value = JSON.stringify({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION });
    expect(service.load()).toBeNull();
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
