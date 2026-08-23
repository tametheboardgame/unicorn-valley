import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { AtmosphericTimeService } from './AtmosphericTimeService';
import {
  MAGICAL_WEATHER_STATES,
  MagicalWeatherService,
  readManualMagicalWeather,
  resolveAutomaticWeather,
} from './MagicalWeatherService';

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

function createSaveService(): SaveService {
  const service = new SaveService(
    new MemoryRepository(),
    undefined,
    () => '2026-08-23T10:30:00.000Z',
  );
  service.save(service.createNewGame());
  return service;
}

describe('MagicalWeatherService', () => {
  it('maps atmospheric states to gentle automatic weather without a real-world clock', () => {
    expect(resolveAutomaticWeather('morning')).toBe('clear');
    expect(resolveAutomaticWeather('afternoon')).toBe('rain');
    expect(resolveAutomaticWeather('sunset')).toBe('clear');
    expect(resolveAutomaticWeather('night')).toBe('sparkle');
    expect(MAGICAL_WEATHER_STATES).toHaveLength(3);
  });

  it('follows atmospheric changes while automatic', () => {
    const saveService = createSaveService();
    const atmosphere = new AtmosphericTimeService(saveService, saveService.load());
    const weather = new MagicalWeatherService(saveService, atmosphere, saveService.load());

    expect(weather.getState()).toBe('clear');
    atmosphere.setMode('afternoon');
    expect(weather.refreshAutomatic()).toBe('rain');
    atmosphere.setMode('night');
    expect(weather.refreshAutomatic()).toBe('sparkle');
  });

  it('persists manual weather and can safely return to automatic weather', () => {
    const saveService = createSaveService();
    const atmosphere = new AtmosphericTimeService(saveService, saveService.load());
    const weather = new MagicalWeatherService(saveService, atmosphere, saveService.load());

    weather.setMode('sparkle');
    expect(readManualMagicalWeather(saveService.load())).toBe('sparkle');

    const reloaded = new MagicalWeatherService(saveService, atmosphere, saveService.load());
    expect(reloaded.getMode()).toBe('sparkle');
    expect(reloaded.getState()).toBe('sparkle');

    reloaded.setMode('auto');
    expect(readManualMagicalWeather(saveService.load())).toBeNull();
    expect(reloaded.getState()).toBe('clear');
  });
});
