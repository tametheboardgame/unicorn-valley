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

interface StoredSave {
  serialised: string;
  decoded: DecodedSave;
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

function savedAtMillis(save: SaveGame): number {
  const parsed = Date.parse(save.lastSavedAt);
  return Number.isFinite(parsed) ? parsed : 0;
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
    if (this.hasFutureSchemaCheckpoint()) {
      return null;
    }

    const serialisedPrimary = this.repository.read();
    if (serialisedPrimary !== null && this.isFutureVersion(serialisedPrimary)) {
      return null;
    }

    const primary = this.decodeStored(serialisedPrimary);
    const checkpoint = this.readCurrentCheckpoint();

    if (checkpoint && this.shouldPreferCheckpoint(checkpoint, primary)) {
      this.tryWritePrimary(checkpoint.decoded.serialisedCurrent);
      return checkpoint.decoded.save;
    }

    if (primary) {
      if (primary.decoded.sourceVersion < CURRENT_SAVE_SCHEMA_VERSION) {
        this.persistMigrationBestEffort(primary.serialised, primary.decoded);
      } else if (!checkpoint || this.shouldPreferCheckpoint(primary, checkpoint)) {
        this.tryWriteCheckpoint(primary.decoded.serialisedCurrent);
      }
      return primary.decoded.save;
    }

    if (checkpoint) {
      this.tryWritePrimary(checkpoint.decoded.serialisedCurrent);
      return checkpoint.decoded.save;
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

    if (this.hasFutureSchemaCheckpoint()) {
      return nextSave;
    }

    const currentPrimary = this.repository.read();
    if (currentPrimary !== null && this.isFutureVersion(currentPrimary)) {
      return nextSave;
    }

    const previous = this.readPreferredCurrentRecord(currentPrimary);
    const backupStored = previous === null || this.tryWriteBackup(previous.serialised);
    const serialisedNext = JSON.stringify(nextSave);
    if (!this.tryWriteCheckpoint(serialisedNext)) {
      return nextSave;
    }

    if (this.hasFutureSchemaCheckpoint()) {
      return nextSave;
    }

    if (backupStored) {
      this.tryWritePrimary(serialisedNext);
    }

    this.events.emit('SAVE_COMPLETED', {
      schemaVersion: nextSave.schemaVersion,
      savedAt,
    });

    return nextSave;
  }

  public clear(): void {
    const currentPrimary = this.repository.read();
    if (
      this.hasFutureSchemaCheckpoint() ||
      (currentPrimary !== null && this.isFutureVersion(currentPrimary))
    ) {
      return;
    }

    this.repository.remove();
    this.repository.removeBackup?.();
    this.repository.removeSchemaCheckpointsUpTo?.(CURRENT_SAVE_SCHEMA_VERSION);
  }

  private hasFutureSchemaCheckpoint(): boolean {
    const highestVersion = this.repository.getHighestSchemaCheckpointVersion?.() ?? null;
    if (highestVersion === null || highestVersion <= CURRENT_SAVE_SCHEMA_VERSION) {
      return false;
    }

    const serialisedCheckpoint = this.repository.readSchemaCheckpoint?.(highestVersion) ?? null;
    return (
      serialisedCheckpoint !== null && readSerialisedSchemaVersion(serialisedCheckpoint) === highestVersion
    );
  }

  private isFutureVersion(serialisedSave: string): boolean {
    const version = readSerialisedSchemaVersion(serialisedSave);
    return version !== null && version > CURRENT_SAVE_SCHEMA_VERSION;
  }

  private decodeStored(serialisedSave: string | null): StoredSave | null {
    if (serialisedSave === null) {
      return null;
    }
    const decoded = this.decode(serialisedSave);
    return decoded ? { serialised: serialisedSave, decoded } : null;
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

  private readCurrentCheckpoint(): StoredSave | null {
    const serialisedCheckpoint =
      this.repository.readSchemaCheckpoint?.(CURRENT_SAVE_SCHEMA_VERSION) ?? null;
    const checkpoint = this.decodeStored(serialisedCheckpoint);
    return checkpoint?.decoded.sourceVersion === CURRENT_SAVE_SCHEMA_VERSION ? checkpoint : null;
  }

  private shouldPreferCheckpoint(checkpoint: StoredSave, primary: StoredSave | null): boolean {
    if (!primary || primary.decoded.sourceVersion < CURRENT_SAVE_SCHEMA_VERSION) {
      return true;
    }
    return savedAtMillis(checkpoint.decoded.save) >= savedAtMillis(primary.decoded.save);
  }

  private readPreferredCurrentRecord(serialisedPrimary: string | null): StoredSave | null {
    const primary = this.decodeStored(serialisedPrimary);
    const checkpoint = this.readCurrentCheckpoint();
    return checkpoint && this.shouldPreferCheckpoint(checkpoint, primary) ? checkpoint : primary;
  }

  private persistMigrationBestEffort(serialisedSource: string, decoded: DecodedSave): void {
    if (!this.tryWriteBackup(serialisedSource)) {
      return;
    }
    if (!this.tryWriteCheckpoint(decoded.serialisedCurrent) || this.hasFutureSchemaCheckpoint()) {
      return;
    }
    this.tryWritePrimary(decoded.serialisedCurrent);
  }

  private recoverFromBackup(): SaveGame | null {
    const serialisedBackup = this.repository.readBackup?.() ?? null;
    const backup = this.decodeStored(serialisedBackup);
    if (!backup) {
      return null;
    }

    if (
      this.tryWriteCheckpoint(backup.decoded.serialisedCurrent) &&
      !this.hasFutureSchemaCheckpoint()
    ) {
      this.tryWritePrimary(backup.decoded.serialisedCurrent);
    }
    return backup.decoded.save;
  }

  private tryWriteBackup(serialisedSave: string): boolean {
    if (!this.repository.writeBackup) {
      return true;
    }
    try {
      this.repository.writeBackup(serialisedSave);
      return true;
    } catch {
      return false;
    }
  }

  private tryWriteCheckpoint(serialisedSave: string): boolean {
    if (!this.repository.writeSchemaCheckpoint) {
      return true;
    }
    try {
      this.repository.writeSchemaCheckpoint(CURRENT_SAVE_SCHEMA_VERSION, serialisedSave);
      return true;
    } catch {
      return false;
    }
  }

  private tryWritePrimary(serialisedSave: string): boolean {
    try {
      this.repository.write(serialisedSave);
      return true;
    } catch {
      return false;
    }
  }
}
