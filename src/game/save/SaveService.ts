import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { createDefaultSave } from './createDefaultSave';
import type { SaveRepository } from './SaveRepository';
import { migrateSaveRecord } from './saveMigrations';
import { CURRENT_SAVE_SCHEMA_VERSION, type SaveGame } from './saveSchema';
import { isSaveGame } from './saveValidation';

export type Clock = () => string;

const systemClock: Clock = () => new Date().toISOString();

export class SaveService {
  public constructor(
    private readonly repository: SaveRepository,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
    private readonly now: Clock = systemClock,
  ) {}

  public createNewGame(): SaveGame {
    return createDefaultSave(this.now());
  }

  public load(): SaveGame | null {
    const serialisedSave = this.repository.read();
    if (serialisedSave === null) {
      return null;
    }

    let parsedSave: unknown;
    try {
      parsedSave = JSON.parse(serialisedSave) as unknown;
    } catch {
      return null;
    }

    const migratedSave = migrateSaveRecord(parsedSave);
    if (!migratedSave || !isSaveGame(migratedSave)) {
      return null;
    }

    return migratedSave;
  }

  public save(save: SaveGame): SaveGame {
    const savedAt = this.now();
    const nextSave: SaveGame = {
      ...save,
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      lastSavedAt: savedAt,
    };

    this.repository.write(JSON.stringify(nextSave));
    this.events.emit('SAVE_COMPLETED', {
      schemaVersion: nextSave.schemaVersion,
      savedAt,
    });

    return nextSave;
  }

  public clear(): void {
    this.repository.remove();
  }
}
