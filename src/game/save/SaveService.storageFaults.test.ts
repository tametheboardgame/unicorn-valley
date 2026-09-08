import { describe, expect, it } from 'vitest';
import { BakeryService } from '../economy/BakeryService';
import { SHIMMER_ITEM_ID, ShimmerEconomyService } from '../economy/ShimmerEconomyService';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import type { SaveRepository } from './SaveRepository';
import { SaveService, SaveStorageUnavailableError } from './SaveService';
import { CURRENT_SAVE_SCHEMA_VERSION } from './saveSchema';

class FaultRepository implements SaveRepository {
  public primary: string | null = null;
  public backup: string | null = null;
  public checkpoints = new Map<number, string>();
  public denyReads = false;
  public failCheckpointWrites = false;
  public failPrimaryWrites = false;

  public read(): string | null {
    if (this.denyReads) throw new Error('storage access denied');
    return this.primary;
  }
  public write(value: string): void {
    if (this.failPrimaryWrites) throw new Error('primary quota exceeded');
    this.primary = value;
  }
  public remove(): void {
    this.primary = null;
  }
  public readBackup(): string | null {
    if (this.denyReads) throw new Error('storage access denied');
    return this.backup;
  }
  public writeBackup(value: string): void {
    this.backup = value;
  }
  public readSchemaCheckpoint(version: number): string | null {
    if (this.denyReads) throw new Error('storage access denied');
    return this.checkpoints.get(version) ?? null;
  }
  public writeSchemaCheckpoint(version: number, value: string): void {
    if (this.failCheckpointWrites) throw new Error('checkpoint quota exceeded');
    this.checkpoints.set(version, value);
  }
  public getSchemaCheckpointVersions(): number[] {
    if (this.denyReads) throw new Error('storage getter denied');
    return [...this.checkpoints.keys()].sort((a, b) => b - a);
  }
}

describe('SaveService storage fault boundary', () => {
  it('returns a typed read failure and never treats denied progress as an empty game', () => {
    const repository = new FaultRepository();
    const service = new SaveService(repository);
    repository.denyReads = true;

    expect(service.loadWithResult()).toEqual({ status: 'storage-failed', save: null });
    expect(() => service.load()).toThrow(SaveStorageUnavailableError);
  });

  it('recovers a corrupt primary from a valid backup without losing it', () => {
    const repository = new FaultRepository();
    const service = new SaveService(repository);
    const save = service.createNewGame();
    repository.primary = '{corrupt';
    repository.backup = JSON.stringify({ ...save, profile: { ...save.profile, name: 'Berry' } });

    expect(service.loadWithResult()).toMatchObject({
      status: 'loaded',
      save: { profile: { name: 'Berry' } },
    });
    expect(JSON.parse(repository.backup).profile.name).toBe('Berry');
  });

  it('blocks a valid future checkpoint even when a lower current save exists', () => {
    const repository = new FaultRepository();
    const service = new SaveService(repository);
    repository.primary = JSON.stringify(service.createNewGame());
    const futureVersion = CURRENT_SAVE_SCHEMA_VERSION + 1;
    repository.checkpoints.set(
      futureVersion,
      JSON.stringify({ ...service.createNewGame(), schemaVersion: futureVersion }),
    );

    expect(service.loadWithResult().status).toBe('blocked-newer-version');
    expect(service.saveWithResult(service.createNewGame()).status).toBe('blocked-newer-version');
  });

  it('counts a checkpoint as committed when the secondary primary write fails', () => {
    const repository = new FaultRepository();
    const events = new TypedEventBus<GameEventMap>();
    const completed: string[] = [];
    events.on('SAVE_COMPLETED', () => completed.push('saved'));
    const service = new SaveService(repository, events);
    repository.failPrimaryWrites = true;

    expect(service.saveWithResult(service.createNewGame()).status).toBe('saved');
    expect(repository.checkpoints.has(CURRENT_SAVE_SCHEMA_VERSION)).toBe(true);
    expect(completed).toEqual(['saved']);
  });

  it('requires the primary write when a repository has no checkpoint support', () => {
    const repository: SaveRepository = {
      read: () => null,
      write: () => {
        throw new Error('primary quota exceeded');
      },
      remove: () => undefined,
    };
    const events = new TypedEventBus<GameEventMap>();
    const completed: string[] = [];
    events.on('SAVE_COMPLETED', () => completed.push('saved'));

    expect(
      new SaveService(repository, events).saveWithResult(
        new SaveService(repository).createNewGame(),
      ).status,
    ).toBe('storage-failed');
    expect(completed).toEqual([]);
  });

  it('keeps a committed save successful when a SAVE_COMPLETED listener throws', () => {
    const repository = new FaultRepository();
    const events = new TypedEventBus<GameEventMap>();
    events.on('SAVE_COMPLETED', () => {
      throw new Error('dependent reconciliation failed');
    });
    const service = new SaveService(repository, events);

    expect(service.saveWithResult(service.createNewGame()).status).toBe('saved');
    expect(repository.checkpoints.has(CURRENT_SAVE_SCHEMA_VERSION)).toBe(true);
  });

  it('does not report or emit a three-Shimmer Berry Bun purchase until retry commits', () => {
    const repository = new FaultRepository();
    const events = new TypedEventBus<GameEventMap>();
    const order: string[] = [];
    events.on('SAVE_COMPLETED', () => order.push('save'));
    events.on('ITEM_COLLECTED', () => order.push('item'));
    const service = new SaveService(repository, events);
    const initial = service.createNewGame();
    service.save({
      ...initial,
      inventory: {
        ...initial.inventory,
        itemQuantities: { ...initial.inventory.itemQuantities, [SHIMMER_ITEM_ID]: 3 },
      },
    });
    order.length = 0;
    repository.failCheckpointWrites = true;
    const bakery = new BakeryService(service, events);

    expect(bakery.purchase('item:berry-bun')).toMatchObject({
      type: 'persistence-failed',
      balance: 3,
    });
    expect(order).toEqual([]);
    expect(service.load()?.inventory.itemQuantities['item:berry-bun']).toBeUndefined();
    expect(service.load()?.inventory.itemQuantities[SHIMMER_ITEM_ID]).toBe(3);

    repository.failCheckpointWrites = false;
    expect(bakery.purchase('item:berry-bun')).toMatchObject({
      type: 'purchased',
      balance: 2,
      ownedQuantity: 1,
    });
    expect(order).toEqual(['save', 'item']);
  });

  it('prevents inventory collection and Shimmer rewards from succeeding after a rejected write', () => {
    const repository = new FaultRepository();
    const events = new TypedEventBus<GameEventMap>();
    const collected: string[] = [];
    events.on('ITEM_COLLECTED', ({ itemId }) => collected.push(itemId));
    const service = new SaveService(repository, events);
    service.save(service.createNewGame());
    repository.failCheckpointWrites = true;

    expect(() => new InventoryService(service, events).addItem('item:berry-bun')).toThrow(
      SaveStorageUnavailableError,
    );
    expect(() => new ShimmerEconomyService(service).earn(2)).toThrow(SaveStorageUnavailableError);
    expect(collected).toEqual([]);
    expect(service.load()?.inventory.itemQuantities['item:berry-bun']).toBeUndefined();
    expect(service.load()?.inventory.itemQuantities[SHIMMER_ITEM_ID]).toBeUndefined();
  });
});
