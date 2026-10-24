import type { SaveService } from '../../save/SaveService';
import type { MiniGameSession } from '../MiniGameSession';
import {
  createCrystalariumFullState,
  isCrystalariumFullState,
  type CrystalariumFullState,
} from './CrystalariumFullRules';
import {
  CRYSTALARIUM_FULL_VARIANT_ID,
  CRYSTALARIUM_GAME_ID,
} from './CrystalariumOpeningRules';

export const CRYSTALARIUM_SANDBOX_STORAGE_KEY =
  'unicorn-valley:just-games:crystalarium:v1';

export interface CrystalariumProgressStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
function browserStorage(): CrystalariumProgressStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
export function isFullCrystalariumSession(session: MiniGameSession | null): boolean {
  return Boolean(session &&
    session.gameId === CRYSTALARIUM_GAME_ID &&
    session.variantId === CRYSTALARIUM_FULL_VARIANT_ID &&
    ((session.source === 'just-games' && session.sideEffectPolicy === 'sandbox') ||
     (session.source === 'world' && session.sideEffectPolicy === 'world' &&
      session.returnTarget.sceneKey === 'CrystalBrookScene' &&
      session.worldContext?.locationId === 'crystal-brook' &&
      session.worldContext.interactionId === 'crystalarium-nursery')));
}
/** Invalid or future-version sandbox records never contaminate adventure state. */
export function loadCrystalariumProgress(
  session: MiniGameSession | null,
  saves: SaveService,
  storage: CrystalariumProgressStorage | null = browserStorage(),
): CrystalariumFullState {
  if (!isFullCrystalariumSession(session)) return createCrystalariumFullState();
  if (session?.source === 'world') {
    const value = saves.load()?.activities.crystalarium;
    return isCrystalariumFullState(value) ? value : createCrystalariumFullState();
  }
  try {
    const raw = storage?.getItem(CRYSTALARIUM_SANDBOX_STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return isCrystalariumFullState(value) ? value : createCrystalariumFullState();
  } catch {
    return createCrystalariumFullState();
  }
}
/** Fail closed. Callers must not claim a persistent move when its write failed. */
export function saveCrystalariumProgress(
  session: MiniGameSession | null,
  progress: CrystalariumFullState,
  saves: SaveService,
  storage: CrystalariumProgressStorage | null = browserStorage(),
): boolean {
  if (!isFullCrystalariumSession(session) || !isCrystalariumFullState(progress)) return false;
  if (session?.source === 'world') {
    const existing = saves.load();
    if (!existing) return false;
    const next = {
      ...existing,
      activities: { ...existing.activities, crystalarium: progress },
    };
    return saves.saveWithResult(next).status === 'saved';
  }
  try {
    if (!storage) return false;
    storage.setItem(CRYSTALARIUM_SANDBOX_STORAGE_KEY, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
