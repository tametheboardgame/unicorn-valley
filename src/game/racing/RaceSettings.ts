export type RaceAssistanceMode = 'standard' | 'extra-help';

export interface RaceSettings {
  assistanceMode: RaceAssistanceMode;
}

export interface RaceSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface RaceAssistanceOption {
  id: RaceAssistanceMode;
  label: string;
  description: string;
}

export const RACE_SETTINGS_STORAGE_KEY = 'unicorn-valley:race-settings:v1';

export const DEFAULT_RACE_SETTINGS: RaceSettings = {
  assistanceMode: 'standard',
};

export const RACE_ASSISTANCE_OPTIONS: readonly RaceAssistanceOption[] = [
  {
    id: 'standard',
    label: 'Standard',
    description: 'Original Rainbow Run jump timing and pace.',
  },
  {
    id: 'extra-help',
    label: 'Extra help',
    description:
      'A little more room for jumps and a gentle speed boost. Ribbons and rewards stay the same.',
  },
];

export function getRaceAssistanceOption(mode: RaceAssistanceMode): RaceAssistanceOption {
  return (
    RACE_ASSISTANCE_OPTIONS.find((option) => option.id === mode) ?? RACE_ASSISTANCE_OPTIONS[0]
  );
}

export function normaliseRaceSettings(value: unknown): RaceSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_RACE_SETTINGS };
  }

  const candidate = value as Partial<RaceSettings>;
  return {
    assistanceMode:
      candidate.assistanceMode === 'extra-help' || candidate.assistanceMode === 'standard'
        ? candidate.assistanceMode
        : DEFAULT_RACE_SETTINGS.assistanceMode,
  };
}

function resolveBrowserStorage(): RaceSettingsStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class RaceSettingsStore {
  public constructor(
    private readonly storage: RaceSettingsStorage | null = resolveBrowserStorage(),
  ) {}

  public load(): RaceSettings {
    if (!this.storage) {
      return { ...DEFAULT_RACE_SETTINGS };
    }

    try {
      const raw = this.storage.getItem(RACE_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_RACE_SETTINGS };
      }
      return normaliseRaceSettings(JSON.parse(raw) as unknown);
    } catch {
      return { ...DEFAULT_RACE_SETTINGS };
    }
  }

  public save(settings: RaceSettings): RaceSettings {
    const normalised = normaliseRaceSettings(settings);
    try {
      this.storage?.setItem(RACE_SETTINGS_STORAGE_KEY, JSON.stringify(normalised));
    } catch {
      // Race assistance is a convenience preference. Keep racing playable if storage is unavailable.
    }
    return normalised;
  }

  public update(patch: Partial<RaceSettings>): RaceSettings {
    return this.save({ ...this.load(), ...patch });
  }
}

let browserRaceSettingsStore: RaceSettingsStore | null = null;

export function getBrowserRaceSettingsStore(): RaceSettingsStore {
  browserRaceSettingsStore ??= new RaceSettingsStore();
  return browserRaceSettingsStore;
}
