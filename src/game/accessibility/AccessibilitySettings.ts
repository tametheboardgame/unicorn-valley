export interface AccessibilitySettings {
  reducedMotion: boolean;
  highVisibilityInteractions: boolean;
}

export interface AccessibilitySettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type AccessibilitySettingsListener = (settings: AccessibilitySettings) => void;

export const ACCESSIBILITY_SETTINGS_STORAGE_KEY = 'unicorn-valley:accessibility-settings:v1';

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  reducedMotion: false,
  highVisibilityInteractions: false,
};

export function normaliseAccessibilitySettings(value: unknown): AccessibilitySettings {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
  }

  const candidate = value as Partial<AccessibilitySettings>;
  return {
    reducedMotion:
      typeof candidate.reducedMotion === 'boolean'
        ? candidate.reducedMotion
        : DEFAULT_ACCESSIBILITY_SETTINGS.reducedMotion,
    highVisibilityInteractions:
      typeof candidate.highVisibilityInteractions === 'boolean'
        ? candidate.highVisibilityInteractions
        : DEFAULT_ACCESSIBILITY_SETTINGS.highVisibilityInteractions,
  };
}

function resolveBrowserStorage(): AccessibilitySettingsStorage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class AccessibilitySettingsStore {
  private readonly listeners = new Set<AccessibilitySettingsListener>();

  public constructor(
    private readonly storage: AccessibilitySettingsStorage | null = resolveBrowserStorage(),
  ) {}

  public load(): AccessibilitySettings {
    if (!this.storage) {
      return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    }

    try {
      const raw = this.storage.getItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
      }
      return normaliseAccessibilitySettings(JSON.parse(raw) as unknown);
    } catch {
      return { ...DEFAULT_ACCESSIBILITY_SETTINGS };
    }
  }

  public save(settings: AccessibilitySettings): AccessibilitySettings {
    const normalised = normaliseAccessibilitySettings(settings);
    try {
      this.storage?.setItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY, JSON.stringify(normalised));
    } catch {
      // Accessibility preferences are non-critical; keep the game playable without storage.
    }
    for (const listener of [...this.listeners]) {
      listener({ ...normalised });
    }
    return normalised;
  }

  public update(patch: Partial<AccessibilitySettings>): AccessibilitySettings {
    return this.save({ ...this.load(), ...patch });
  }

  public subscribe(listener: AccessibilitySettingsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

let browserAccessibilitySettingsStore: AccessibilitySettingsStore | null = null;

export function getBrowserAccessibilitySettingsStore(): AccessibilitySettingsStore {
  browserAccessibilitySettingsStore ??= new AccessibilitySettingsStore();
  return browserAccessibilitySettingsStore;
}

export function isReducedMotionEnabled(): boolean {
  return getBrowserAccessibilitySettingsStore().load().reducedMotion;
}
