import { describe, expect, it } from 'vitest';
import { SaveService } from '../save/SaveService';
import { InMemorySaveRepository } from '../save/InMemorySaveRepository';
import {
  ATMOSPHERIC_TIME_STATES,
  AtmosphericTimeService,
  chooseProgressionAtmosphericTime,
} from './AtmosphericTimeService';

describe('AtmosphericTimeService', () => {
  it('cycles through all four states without relying on the real-world clock', () => {
    const service = new AtmosphericTimeService('morning');
    expect(service.cycle()).toBe('afternoon');
    expect(service.cycle()).toBe('sunset');
    expect(service.cycle()).toBe('night');
    expect(service.cycle()).toBe('morning');
    expect(ATMOSPHERIC_TIME_STATES).toHaveLength(4);
  });

  it('can choose a progression-driven starting mood from save state', () => {
    const saveService = new SaveService(new InMemorySaveRepository());
    const save = saveService.createNewGame();
    expect(chooseProgressionAtmosphericTime(save)).toBe('morning');

    save.world.flags['flag:r5-brook-song-restored'] = true;
    expect(chooseProgressionAtmosphericTime(save)).toBe('afternoon');

    save.world.flags['flag:r5-woods-starwell-revealed'] = true;
    expect(chooseProgressionAtmosphericTime(save)).toBe('sunset');
  });
});
