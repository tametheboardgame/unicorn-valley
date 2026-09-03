import { describe, expect, it } from 'vitest';
import {
  BUTTERFLY_WINDOW_CHARM_ITEM_ID,
  JUNIPER_BUTTERFLY_TRAIL_FLAG,
  R6_GLADE_HOME_SECRET_DEFINITIONS,
} from '../../content/r6GladeHomeContent';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { createDefaultSave } from '../save/createDefaultSave';
import { SecretDiscoveryService } from './SecretDiscoveryService';

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

describe('R6.5 Glade butterfly secret chain', () => {
  it('keeps every secret on the canonical secret ID namespace', () => {
    expect(R6_GLADE_HOME_SECRET_DEFINITIONS.every(({ id }) => id.startsWith('secret:'))).toBe(true);
    expect(new Set(R6_GLADE_HOME_SECRET_DEFINITIONS.map(({ id }) => id)).size).toBe(
      R6_GLADE_HOME_SECRET_DEFINITIONS.length,
    );
  });

  it('reveals in order and leaves a persistent Cottage reward', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    const save = createDefaultSave('2026-09-02T15:00:00.000Z');
    save.collections.discoveryIds.push('discovery:moonflower-sparkle');
    saveService.save(save);
    const secrets = new SecretDiscoveryService(saveService);

    expect(secrets.listAvailable(R6_GLADE_HOME_SECRET_DEFINITIONS)).toHaveLength(1);

    for (const definition of R6_GLADE_HOME_SECRET_DEFINITIONS) {
      expect(secrets.discover(definition).status).toBe('discovered');
    }

    const completed = saveService.load();
    expect(completed?.world.flags[JUNIPER_BUTTERFLY_TRAIL_FLAG]).toBe(true);
    expect(completed?.inventory.itemQuantities[BUTTERFLY_WINDOW_CHARM_ITEM_ID]).toBe(1);
    expect(secrets.listAvailable(R6_GLADE_HOME_SECRET_DEFINITIONS)).toHaveLength(0);
  });

  it('blocks later butterfly clues before the prior discovery exists', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    saveService.save(createDefaultSave('2026-09-02T15:00:00.000Z'));
    const secrets = new SecretDiscoveryService(saveService);

    expect(secrets.discover(R6_GLADE_HOME_SECRET_DEFINITIONS[1]).status).toBe('blocked');
    expect(secrets.discover(R6_GLADE_HOME_SECRET_DEFINITIONS[2]).status).toBe('blocked');
  });
});
