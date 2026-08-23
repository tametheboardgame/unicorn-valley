import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';
import {
  getBrowserAtmosphericTimeService,
  type AtmosphericTimeService,
  type AtmosphericTimeState,
} from './AtmosphericTimeService';

export type MagicalWeatherState = 'clear' | 'rain' | 'sparkle';
export type MagicalWeatherMode = 'auto' | MagicalWeatherState;

export interface MagicalWeatherDefinition {
  id: MagicalWeatherState;
  label: string;
  icon: string;
}

export const MAGICAL_WEATHER_STATES = [
  { id: 'clear', label: 'Clear', icon: '🌤️' },
  { id: 'rain', label: 'Gentle Rain', icon: '🌧️' },
  { id: 'sparkle', label: 'Sparkle Shower', icon: '✨' },
] as const satisfies readonly MagicalWeatherDefinition[];

const MANUAL_WEATHER_FLAGS: Record<MagicalWeatherState, string> = {
  clear: 'flag:magical-weather-manual-clear',
  rain: 'flag:magical-weather-manual-rain',
  sparkle: 'flag:magical-weather-manual-sparkle',
};

export function resolveAutomaticWeather(timeState: AtmosphericTimeState): MagicalWeatherState {
  if (timeState === 'afternoon') {
    return 'rain';
  }
  if (timeState === 'night') {
    return 'sparkle';
  }
  return 'clear';
}

export function isWeatherDiscoveryAvailable(
  currentWeather: MagicalWeatherState,
  requiredWeather: MagicalWeatherState,
  alreadyDiscovered: boolean,
): boolean {
  return !alreadyDiscovered && currentWeather === requiredWeather;
}

export function readManualMagicalWeather(save: SaveGame | null): MagicalWeatherState | null {
  if (!save) {
    return null;
  }
  return (
    MAGICAL_WEATHER_STATES.find(({ id }) => save.world.flags[MANUAL_WEATHER_FLAGS[id]] === true)
      ?.id ?? null
  );
}

function saveManualMagicalWeather(
  saveService: SaveService,
  state: MagicalWeatherState | null,
): void {
  const save = saveService.load() ?? saveService.createNewGame();
  const flags = { ...save.world.flags };
  for (const weather of MAGICAL_WEATHER_STATES) {
    flags[MANUAL_WEATHER_FLAGS[weather.id]] = state === weather.id;
  }
  saveService.save({
    ...save,
    world: {
      ...save.world,
      flags,
    },
  });
}

export class MagicalWeatherService {
  private state: MagicalWeatherState;
  private mode: MagicalWeatherMode;
  private readonly listeners = new Set<(state: MagicalWeatherState) => void>();

  public constructor(
    private readonly saveService: SaveService | null,
    private readonly atmosphericTime: AtmosphericTimeService,
    initialSave: SaveGame | null,
  ) {
    const manual = readManualMagicalWeather(initialSave);
    this.mode = manual ?? 'auto';
    this.state = manual ?? resolveAutomaticWeather(this.atmosphericTime.getState());
  }

  public getState(): MagicalWeatherState {
    return this.state;
  }

  public getMode(): MagicalWeatherMode {
    return this.mode;
  }

  public getDefinition(): MagicalWeatherDefinition {
    return MAGICAL_WEATHER_STATES.find(({ id }) => id === this.state) ?? MAGICAL_WEATHER_STATES[0];
  }

  public setMode(mode: MagicalWeatherMode): MagicalWeatherState {
    this.mode = mode;
    if (this.saveService) {
      saveManualMagicalWeather(this.saveService, mode === 'auto' ? null : mode);
    }
    this.setState(
      mode === 'auto' ? resolveAutomaticWeather(this.atmosphericTime.getState()) : mode,
    );
    return this.state;
  }

  public cycleMode(): MagicalWeatherMode {
    const modes: readonly MagicalWeatherMode[] = ['auto', 'clear', 'rain', 'sparkle'];
    const index = modes.indexOf(this.mode);
    const next = modes[(index + 1) % modes.length] ?? 'auto';
    this.setMode(next);
    return next;
  }

  public refreshAutomatic(): MagicalWeatherState {
    if (this.mode !== 'auto') {
      return this.state;
    }
    this.setState(resolveAutomaticWeather(this.atmosphericTime.getState()));
    return this.state;
  }

  public matches(state: MagicalWeatherState): boolean {
    return this.state === state;
  }

  public subscribe(listener: (state: MagicalWeatherState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(state: MagicalWeatherState): void {
    if (state === this.state) {
      return;
    }
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

let browserMagicalWeatherService: MagicalWeatherService | null = null;

export function getBrowserMagicalWeatherService(saveService?: SaveService): MagicalWeatherService {
  if (!browserMagicalWeatherService) {
    const atmosphericTime = getBrowserAtmosphericTimeService(saveService);
    browserMagicalWeatherService = new MagicalWeatherService(
      saveService ?? null,
      atmosphericTime,
      saveService?.load() ?? null,
    );
  }
  return browserMagicalWeatherService;
}

export function isMagicalWeather(state: MagicalWeatherState): boolean {
  return browserMagicalWeatherService?.matches(state) ?? false;
}
