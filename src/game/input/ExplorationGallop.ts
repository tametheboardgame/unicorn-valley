export const EXPLORATION_GALLOP_MULTIPLIER = 1.6;
export const EXPLORATION_SNACK_MULTIPLIER = 1.18;
export const EXPLORATION_SNACK_DURATION_MS = 45_000;

const GALLOP_CODES = new Set(['ShiftLeft', 'ShiftRight']);
const OUTDOOR_EXPLORATION_SCENES = new Set([
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
  'StarlightBeachScene',
]);

let keyboardGallopHeld = false;
let touchGallopHeld = false;
let trackingInstalled = false;
let snackBoostExpiresAt = 0;

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  const element = target as {
    tagName?: string;
    isContentEditable?: boolean;
  } | null;
  const tagName = element?.tagName?.toUpperCase();
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    element?.isContentEditable === true
  );
}

export function ensureExplorationGallopTracking(): void {
  if (trackingInstalled || typeof globalThis.addEventListener !== 'function') {
    return;
  }

  globalThis.addEventListener('keydown', (event: KeyboardEvent) => {
    if (GALLOP_CODES.has(event.code) && !isEditableKeyboardTarget(event.target)) {
      keyboardGallopHeld = true;
    }
  });
  globalThis.addEventListener('keyup', (event: KeyboardEvent) => {
    if (GALLOP_CODES.has(event.code)) {
      keyboardGallopHeld = false;
    }
  });
  globalThis.addEventListener('blur', () => {
    keyboardGallopHeld = false;
    touchGallopHeld = false;
  });
  trackingInstalled = true;
}

export function setTouchGallopHeld(held: boolean): void {
  touchGallopHeld = held;
}

export function isExplorationGallopHeld(sceneKey: string): boolean {
  ensureExplorationGallopTracking();
  return OUTDOOR_EXPLORATION_SCENES.has(sceneKey) && (keyboardGallopHeld || touchGallopHeld);
}

export function activateExplorationSnackBoost(now = Date.now()): number {
  snackBoostExpiresAt = now + EXPLORATION_SNACK_DURATION_MS;
  return snackBoostExpiresAt;
}

export function clearExplorationSnackBoost(): void {
  snackBoostExpiresAt = 0;
}

export function getExplorationSnackBoostRemainingMs(now = Date.now()): number {
  return Math.max(0, snackBoostExpiresAt - now);
}

export function getExplorationSnackBoostRemainingSeconds(now = Date.now()): number {
  return Math.ceil(getExplorationSnackBoostRemainingMs(now) / 1000);
}

export function isExplorationSnackBoostActive(now = Date.now()): boolean {
  return getExplorationSnackBoostRemainingMs(now) > 0;
}

export function explorationSpeedMultiplier(
  sceneKey: string,
  gallopHeld: boolean,
  now = Date.now(),
): number {
  if (!OUTDOOR_EXPLORATION_SCENES.has(sceneKey)) {
    return 1;
  }
  if (gallopHeld) {
    return EXPLORATION_GALLOP_MULTIPLIER;
  }
  return isExplorationSnackBoostActive(now) ? EXPLORATION_SNACK_MULTIPLIER : 1;
}
