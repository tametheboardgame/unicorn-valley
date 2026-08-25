import { describe, expect, it, vi } from 'vitest';
import {
  ACCESSIBILITY_SETTINGS_STORAGE_KEY,
  AccessibilitySettingsStore,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  type AccessibilitySettingsStorage,
  normaliseAccessibilitySettings,
} from './AccessibilitySettings';

class MemoryStorage implements AccessibilitySettingsStorage {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('AccessibilitySettingsStore', () => {
  it('uses calm defaults when nothing has been saved', () => {
    expect(new AccessibilitySettingsStore(new MemoryStorage()).load()).toEqual(
      DEFAULT_ACCESSIBILITY_SETTINGS,
    );
  });

  it('persists reduced motion and high-visibility interaction preferences', () => {
    const storage = new MemoryStorage();
    const store = new AccessibilitySettingsStore(storage);

    store.save({ reducedMotion: true, highVisibilityInteractions: true });

    expect(new AccessibilitySettingsStore(storage).load()).toEqual({
      reducedMotion: true,
      highVisibilityInteractions: true,
    });
  });

  it('normalises malformed data without making the game inaccessible', () => {
    const storage = new MemoryStorage();
    storage.setItem(ACCESSIBILITY_SETTINGS_STORAGE_KEY, '{not-json');
    expect(new AccessibilitySettingsStore(storage).load()).toEqual(DEFAULT_ACCESSIBILITY_SETTINGS);
    expect(normaliseAccessibilitySettings({ reducedMotion: true })).toEqual({
      reducedMotion: true,
      highVisibilityInteractions: false,
    });
  });

  it('notifies active UI when a preference changes', () => {
    const store = new AccessibilitySettingsStore(new MemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.update({ highVisibilityInteractions: true });
    expect(listener).toHaveBeenCalledWith({
      reducedMotion: false,
      highVisibilityInteractions: true,
    });

    unsubscribe();
    store.update({ reducedMotion: true });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
