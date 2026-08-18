import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RACE_SETTINGS,
  RACE_SETTINGS_STORAGE_KEY,
  RaceSettingsStore,
  getRaceAssistanceOption,
  normaliseRaceSettings,
  type RaceSettingsStorage,
} from './RaceSettings';

class MemoryStorage implements RaceSettingsStorage {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('RaceSettingsStore', () => {
  it('uses standard race timing by default', () => {
    const store = new RaceSettingsStore(new MemoryStorage());
    expect(store.load()).toEqual(DEFAULT_RACE_SETTINGS);
  });

  it('persists extra help between race sessions', () => {
    const storage = new MemoryStorage();
    const store = new RaceSettingsStore(storage);

    store.update({ assistanceMode: 'extra-help' });

    expect(new RaceSettingsStore(storage).load()).toEqual({ assistanceMode: 'extra-help' });
  });

  it('fails safely when a stored preference is malformed', () => {
    const storage = new MemoryStorage();
    storage.setItem(RACE_SETTINGS_STORAGE_KEY, '{not-json');

    expect(new RaceSettingsStore(storage).load()).toEqual(DEFAULT_RACE_SETTINGS);
    expect(normaliseRaceSettings({ assistanceMode: 'impossible-mode' })).toEqual(
      DEFAULT_RACE_SETTINGS,
    );
  });

  it('describes extra help without changing rewards or using failure language', () => {
    const option = getRaceAssistanceOption('extra-help');

    expect(option.description).toContain('Ribbons and rewards stay the same');
    expect(option.description.toLowerCase()).not.toContain('easy');
    expect(option.description.toLowerCase()).not.toContain('fail');
  });
});
