export interface AudioSettings {
  muted: boolean;
  musicEnabled: boolean;
  ambienceEnabled: boolean;
  sfxEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  ambienceVolume: number;
  sfxVolume: number;
  selectedMusicTrackId: string | null;
}

export interface AudioSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const AUDIO_SETTINGS_STORAGE_KEY = 'unicorn-valley:audio-settings:v1';

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  musicEnabled: true,
  ambienceEnabled: true,
  sfxEnabled: true,
  masterVolume: 0.62,
  musicVolume: 1,
  ambienceVolume: 1,
  sfxVolume: 1,
  selectedMusicTrackId: null,
};

function clampVolume(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function normaliseVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clampVolume(value) : fallback;
}

export function normaliseAudioSettings(value: unknown): AudioSettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }

  const candidate = value as Partial<AudioSettings>;
  return {
    muted: typeof candidate.muted === 'boolean' ? candidate.muted : DEFAULT_AUDIO_SETTINGS.muted,
    musicEnabled:
      typeof candidate.musicEnabled === 'boolean'
        ? candidate.musicEnabled
        : DEFAULT_AUDIO_SETTINGS.musicEnabled,
    ambienceEnabled:
      typeof candidate.ambienceEnabled === 'boolean'
        ? candidate.ambienceEnabled
        : DEFAULT_AUDIO_SETTINGS.ambienceEnabled,
    sfxEnabled:
      typeof candidate.sfxEnabled === 'boolean'
        ? candidate.sfxEnabled
        : DEFAULT_AUDIO_SETTINGS.sfxEnabled,
    masterVolume: normaliseVolume(candidate.masterVolume, DEFAULT_AUDIO_SETTINGS.masterVolume),
    musicVolume: normaliseVolume(candidate.musicVolume, DEFAULT_AUDIO_SETTINGS.musicVolume),
    ambienceVolume: normaliseVolume(
      candidate.ambienceVolume,
      DEFAULT_AUDIO_SETTINGS.ambienceVolume,
    ),
    sfxVolume: normaliseVolume(candidate.sfxVolume, DEFAULT_AUDIO_SETTINGS.sfxVolume),
    selectedMusicTrackId:
      typeof candidate.selectedMusicTrackId === 'string' &&
      candidate.selectedMusicTrackId.length > 0
        ? candidate.selectedMusicTrackId
        : null,
  };
}

function resolveBrowserStorage(): AudioSettingsStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class AudioSettingsStore {
  public constructor(
    private readonly storage: AudioSettingsStorage | null = resolveBrowserStorage(),
  ) {}

  public load(): AudioSettings {
    if (!this.storage) {
      return { ...DEFAULT_AUDIO_SETTINGS };
    }

    try {
      const raw = this.storage.getItem(AUDIO_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_AUDIO_SETTINGS };
      }
      return normaliseAudioSettings(JSON.parse(raw) as unknown);
    } catch {
      return { ...DEFAULT_AUDIO_SETTINGS };
    }
  }

  public save(settings: AudioSettings): AudioSettings {
    const normalised = normaliseAudioSettings(settings);
    try {
      this.storage?.setItem(AUDIO_SETTINGS_STORAGE_KEY, JSON.stringify(normalised));
    } catch {
      // Audio preferences are non-critical. Keep the game playable if storage is unavailable.
    }
    return normalised;
  }

  public update(patch: Partial<AudioSettings>): AudioSettings {
    return this.save({ ...this.load(), ...patch });
  }
}

let browserAudioSettingsStore: AudioSettingsStore | null = null;

export function getBrowserAudioSettingsStore(): AudioSettingsStore {
  browserAudioSettingsStore ??= new AudioSettingsStore();
  return browserAudioSettingsStore;
}
