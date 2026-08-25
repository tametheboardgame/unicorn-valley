import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { createDefaultSave } from './createDefaultSave';
import { reconcileSaveGame } from './reconcileSaveGame';
import type { SaveRepository } from './SaveRepository';
import { migrateSaveRecord } from './saveMigrations';
import { CURRENT_SAVE_SCHEMA_VERSION, type SaveGame } from './saveSchema';
import { isSaveGame } from './saveValidation';

export type Clock = () => string;

const systemClock: Clock = () => new Date().toISOString();

interface DecodedSave {
  save: SaveGame;
  sourceVersion: number;
  serialisedCurrent: string;
}

function readSchemaVersion(value: unknown): number | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const schemaVersion = (value as Record<string, unknown>).schemaVersion;
  return Number.isInteger(schemaVersion) ? (schemaVersion as number) : null;
}

function readSerialisedSchemaVersion(serialisedSave: string): number | null {
  try {
    return readSchemaVersion(JSON.parse(serialisedSave) as unknown);
  } catch {
    return null;
  }
}

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
    if (serialisedSave !== null) {
      const primaryVersion = readSerialisedSchemaVersion(serialisedSave);
      if (primaryVersion !== null && primaryVersion > CURRENT_SAVE_SCHEMA_VERSION) {
        return null;
      }

      const decoded = this.decode(serialisedSave);
      if (decoded) {
        if (decoded.sourceVersion < CURRENT_SAVE_SCHEMA_VERSION) {
          this.repository.writeBackup?.(serialisedSave);
          this.repository.write(decoded.serialisedCurrent);
        }
        return decoded.save;
      }
    }

    return this.recoverFromBackup();
  }

  public save(save: SaveGame): SaveGame {
    const savedAt = this.now();
    const reconciledSave = reconcileSaveGame(save);
    const nextSave: SaveGame = {
      ...reconciledSave,
      schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
      lastSavedAt: savedAt,
    };

    this.preserveCurrentPrimaryAsBackup();
    this.repository.write(JSON.stringify(nextSave));
    this.events.emit('SAVE_COMPLETED', {
      schemaVersion: nextSave.schemaVersion,
      savedAt,
    });

    return nextSave;
  }

  public clear(): void {
    this.repository.remove();
    this.repository.removeBackup?.();
  }

  private decode(serialisedSave: string): DecodedSave | null {
    let parsedSave: unknown;
    try {
      parsedSave = JSON.parse(serialisedSave) as unknown;
    } catch {
      return null;
    }

    const sourceVersion = readSchemaVersion(parsedSave);
    if (sourceVersion === null) {
      return null;
    }

    const migratedSave = migrateSaveRecord(parsedSave);
    if (!migratedSave || !isSaveGame(migratedSave)) {
      return null;
    }

    const save = reconcileSaveGame(migratedSave);
    return {
      save,
      sourceVersion,
      serialisedCurrent: JSON.stringify(save),
    };
  }

  private preserveCurrentPrimaryAsBackup(): void {
    const serialisedSave = this.repository.read();
    if (serialisedSave === null || !this.decode(serialisedSave)) {
      return;
    }

    this.repository.writeBackup?.(serialisedSave);
  }

  private recoverFromBackup(): SaveGame | null {
    const serialisedBackup = this.repository.readBackup?.() ?? null;
    if (serialisedBackup === null) {
      return null;
    }

    const decoded = this.decode(serialisedBackup);
    if (!decoded) {
      return null;
    }

    this.repository.write(decoded.serialisedCurrent);
    return decoded.save;
  }
}
