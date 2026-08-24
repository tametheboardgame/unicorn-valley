import { describe, expect, it } from 'vitest';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { AUTO_TIME_STATE_DURATION_MS, AtmosphericTimeService } from './AtmosphericTimeService';
import {
  isWeatherDiscoveryAvailable,
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

  it('follows the three-minute automatic Valley time cycle', () => {
    const saveService = createSaveService();
    const atmosphere = new AtmosphericTimeService(saveService, saveService.load());
    const weather = new MagicalWeatherService(saveService, atmosphere, saveService.load());

    expect(weather.getState()).toBe('clear');
    atmosphere.advanceAutomatic(AUTO_TIME_STATE_DURATION_MS);
    expect(atmosphere.getState()).toBe('afternoon');
    expect(weather.refreshAutomatic()).toBe('rain');
    atmosphere.advanceAutomatic(AUTO_TIME_STATE_DURATION_MS * 2);
    expect(atmosphere.getState()).toBe('night');
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

  it('keeps a conditional discovery available whenever its weather returns until collected', () => {
    expect(isWeatherDiscoveryAvailable('clear', 'sparkle', false)).toBe(false);
    expect(isWeatherDiscoveryAvailable('sparkle', 'sparkle', false)).toBe(true);
    expect(isWeatherDiscoveryAvailable('clear', 'sparkle', false)).toBe(false);
    expect(isWeatherDiscoveryAvailable('sparkle', 'sparkle', false)).toBe(true);
    expect(isWeatherDiscoveryAvailable('sparkle', 'sparkle', true)).toBe(false);
  });
});
