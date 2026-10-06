export {
  ACCESSIBILITY_SETTINGS_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  AccessibilitySettingsStore,
  type AccessibilitySettings,
  type AccessibilitySettingsListener,
  type AccessibilitySettingsStorage,
  getBrowserAccessibilitySettingsStore,
  isReducedMotionEnabled,
  normaliseAccessibilitySettings,
} from '../runtime/StartupSharedRuntime';
