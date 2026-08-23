import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import {
  ATMOSPHERIC_TIME_STATES,
  AtmosphericTimeService,
  chooseProgressionAtmosphericTime,
  readManualAtmosphericTime,
} from './AtmosphericTimeService';

class MemoryRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(value: string): void {
    this.value = value;
  }

  public remove(): void {
    this.value = null;
  }
}

function createService(): SaveService {
  const service = new SaveService(
    new MemoryRepository(),
    undefined,
    () => '2026-08-23T10:00:00.000Z',
  );
  service.save(service.createNewGame());
  return service;
}

describe('AtmosphericTimeService', () => {
  it('provides all four visual time states without using the real-world clock', () => {
    const saveService = createService();
    const service = new AtmosphericTimeService(saveService, saveService.load());

    expect(service.getState()).toBe('morning');
    expect(service.cycleMode()).toBe('morning');
    expect(service.cycleMode()).toBe('afternoon');
    expect(service.cycleMode()).toBe('sunset');
    expect(service.cycleMode()).toBe('night');
    expect(service.cycleMode()).toBe('auto');
    expect(ATMOSPHERIC_TIME_STATES).toHaveLength(4);
  });

  it('chooses progression-driven atmosphere from persistent game progress', () => {
    const saveService = createService();
    const save = saveService.load();
    expect(chooseProgressionAtmosphericTime(save)).toBe('morning');

    if (!save) {
      throw new Error('Expected save');
    }
    save.world.flags['flag:r5-brook-song-restored'] = true;
    expect(chooseProgressionAtmosphericTime(save)).toBe('afternoon');

    save.world.flags['flag:r5-woods-starwell-revealed'] = true;
    expect(chooseProgressionAtmosphericTime(save)).toBe('sunset');

    save.collections.memoryIds.push('memory:r5-firefly-lantern-first-completion');
    expect(chooseProgressionAtmosphericTime(save)).toBe('night');
  });

  it('persists a manual override and can return to automatic progression', () => {
    const saveService = createService();
    const service = new AtmosphericTimeService(saveService, saveService.load());

    service.setMode('night');
    expect(readManualAtmosphericTime(saveService.load())).toBe('night');

    const reloaded = new AtmosphericTimeService(saveService, saveService.load());
    expect(reloaded.getMode()).toBe('night');
    expect(reloaded.getState()).toBe('night');

    reloaded.setMode('auto');
    expect(readManualAtmosphericTime(saveService.load())).toBeNull();
    expect(reloaded.getState()).toBe('morning');
  });
});
