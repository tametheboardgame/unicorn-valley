import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';

export type AtmosphericTimeState = 'morning' | 'afternoon' | 'sunset' | 'night';
export type AtmosphericTimeMode = 'auto' | AtmosphericTimeState;

export interface AtmosphericTimeDefinition {
  id: AtmosphericTimeState;
  label: string;
  icon: string;
  overlayColor: number;
  overlayAlpha: number;
}

export const ATMOSPHERIC_TIME_STATES = [
  { id: 'morning', label: 'Morning', icon: '🌤️', overlayColor: 0xffe6ad, overlayAlpha: 0.08 },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️', overlayColor: 0xfff5d7, overlayAlpha: 0.03 },
  { id: 'sunset', label: 'Sunset', icon: '🌅', overlayColor: 0xf49b76, overlayAlpha: 0.13 },
  { id: 'night', label: 'Night', icon: '🌙', overlayColor: 0x243b68, overlayAlpha: 0.3 },
] as const satisfies readonly AtmosphericTimeDefinition[];

const MANUAL_TIME_FLAGS: Record<AtmosphericTimeState, string> = {
  morning: 'flag:atmosphere-time-manual-morning',
  afternoon: 'flag:atmosphere-time-manual-afternoon',
  sunset: 'flag:atmosphere-time-manual-sunset',
  night: 'flag:atmosphere-time-manual-night',
};

const FIREFLY_COMPLETION_MEMORY = 'memory:r5-firefly-lantern-first-completion';

export function chooseProgressionAtmosphericTime(save: SaveGame | null): AtmosphericTimeState {
  if (save?.collections.memoryIds.includes(FIREFLY_COMPLETION_MEMORY)) {
    return 'night';
  }
  if (save?.world.flags['flag:r5-woods-starwell-revealed'] === true) {
    return 'sunset';
  }
  if (save?.world.flags['flag:r5-brook-song-restored'] === true) {
    return 'afternoon';
  }
  return 'morning';
}

export function readManualAtmosphericTime(save: SaveGame | null): AtmosphericTimeState | null {
  if (!save) {
    return null;
  }
  return ATMOSPHERIC_TIME_STATES.find(
    ({ id }) => save.world.flags[MANUAL_TIME_FLAGS[id]] === true,
  )?.id ?? null;
}

function saveManualAtmosphericTime(
  saveService: SaveService,
  state: AtmosphericTimeState | null,
): void {
  const save = saveService.load() ?? saveService.createNewGame();
  const flags = { ...save.world.flags };
  for (const timeState of ATMOSPHERIC_TIME_STATES) {
    flags[MANUAL_TIME_FLAGS[timeState.id]] = state === timeState.id;
  }
  saveService.save({
    ...save,
    world: {
      ...save.world,
      flags,
    },
  });
}

export class AtmosphericTimeService {
  private state: AtmosphericTimeState;
  private mode: AtmosphericTimeMode;
  private readonly listeners = new Set<(state: AtmosphericTimeState) => void>();

  public constructor(
    private readonly saveService: SaveService | null,
    initialSave: SaveGame | null,
  ) {
    const manual = readManualAtmosphericTime(initialSave);
    this.mode = manual ?? 'auto';
    this.state = manual ?? chooseProgressionAtmosphericTime(initialSave);
  }

  public getState(): AtmosphericTimeState {
    return this.state;
  }

  public getMode(): AtmosphericTimeMode {
    return this.mode;
  }

  public getDefinition(): AtmosphericTimeDefinition {
    return ATMOSPHERIC_TIME_STATES.find(({ id }) => id === this.state) ?? ATMOSPHERIC_TIME_STATES[0];
  }

  public setMode(mode: AtmosphericTimeMode): AtmosphericTimeState {
    this.mode = mode;
    if (this.saveService) {
      saveManualAtmosphericTime(this.saveService, mode === 'auto' ? null : mode);
    }
    const save = this.saveService?.load() ?? null;
    this.setState(mode === 'auto' ? chooseProgressionAtmosphericTime(save) : mode);
    return this.state;
  }

  public cycleMode(): AtmosphericTimeMode {
    const modes: readonly AtmosphericTimeMode[] = ['auto', 'morning', 'afternoon', 'sunset', 'night'];
    const index = modes.indexOf(this.mode);
    const next = modes[(index + 1) % modes.length] ?? 'auto';
    this.setMode(next);
    return next;
  }

  public refreshProgression(): AtmosphericTimeState {
    if (this.mode !== 'auto') {
      return this.state;
    }
    const next = chooseProgressionAtmosphericTime(this.saveService?.load() ?? null);
    this.setState(next);
    return this.state;
  }

  public matches(state: AtmosphericTimeState): boolean {
    return this.state === state;
  }

  public subscribe(listener: (state: AtmosphericTimeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(state: AtmosphericTimeState): void {
    if (state === this.state) {
      return;
    }
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }
}

let browserAtmosphericTimeService: AtmosphericTimeService | null = null;

export function getBrowserAtmosphericTimeService(
  saveService?: SaveService,
): AtmosphericTimeService {
  if (!browserAtmosphericTimeService) {
    const save = saveService?.load() ?? null;
    browserAtmosphericTimeService = new AtmosphericTimeService(saveService ?? null, save);
  }
  return browserAtmosphericTimeService;
}

export function isAtmosphericTime(state: AtmosphericTimeState): boolean {
  return browserAtmosphericTimeService?.matches(state) ?? false;
}
