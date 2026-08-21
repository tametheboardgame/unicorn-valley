import type { SaveGame } from '../save/saveSchema';

export type AtmosphericTimeState = 'morning' | 'afternoon' | 'sunset' | 'night';

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

export function chooseProgressionAtmosphericTime(save: SaveGame | null): AtmosphericTimeState {
  if (save?.world.flags['flag:r5-woods-starwell-revealed'] === true) {
    return 'sunset';
  }
  if (save?.world.flags['flag:r5-brook-song-restored'] === true) {
    return 'afternoon';
  }
  return 'morning';
}

export class AtmosphericTimeService {
  private state: AtmosphericTimeState;
  private readonly listeners = new Set<(state: AtmosphericTimeState) => void>();

  public constructor(initialState: AtmosphericTimeState = 'afternoon') {
    this.state = initialState;
  }

  public getState(): AtmosphericTimeState {
    return this.state;
  }

  public getDefinition(): AtmosphericTimeDefinition {
    return ATMOSPHERIC_TIME_STATES.find(({ id }) => id === this.state) ?? ATMOSPHERIC_TIME_STATES[1];
  }

  public setState(state: AtmosphericTimeState): void {
    if (state === this.state) {
      return;
    }
    this.state = state;
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  public cycle(): AtmosphericTimeState {
    const index = ATMOSPHERIC_TIME_STATES.findIndex(({ id }) => id === this.state);
    const next = ATMOSPHERIC_TIME_STATES[(index + 1) % ATMOSPHERIC_TIME_STATES.length]?.id ?? 'morning';
    this.setState(next);
    return next;
  }

  public matches(state: AtmosphericTimeState): boolean {
    return this.state === state;
  }

  public subscribe(listener: (state: AtmosphericTimeState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

let browserAtmosphericTimeService: AtmosphericTimeService | null = null;

export function getBrowserAtmosphericTimeService(save: SaveGame | null = null): AtmosphericTimeService {
  browserAtmosphericTimeService ??= new AtmosphericTimeService(chooseProgressionAtmosphericTime(save));
  return browserAtmosphericTimeService;
}

export function isAtmosphericTime(state: AtmosphericTimeState): boolean {
  return getBrowserAtmosphericTimeService().matches(state);
}
