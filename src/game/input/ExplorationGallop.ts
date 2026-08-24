export const EXPLORATION_GALLOP_MULTIPLIER = 1.6;

const GALLOP_CODES = new Set(['ShiftLeft', 'ShiftRight']);
const OUTDOOR_EXPLORATION_SCENES = new Set([
  'MoonflowerGladeScene',
  'SunbeamVillageScene',
  'RainbowMeadowScene',
  'CrystalBrookScene',
  'WhisperingWoodsScene',
]);

let keyboardGallopHeld = false;
let touchGallopHeld = false;
let trackingInstalled = false;

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

export function explorationSpeedMultiplier(sceneKey: string, gallopHeld: boolean): number {
  return OUTDOOR_EXPLORATION_SCENES.has(sceneKey) && gallopHeld ? EXPLORATION_GALLOP_MULTIPLIER : 1;
}
