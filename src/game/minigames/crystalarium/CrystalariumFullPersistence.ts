import type { SaveService } from '../../save/SaveService';
import type { MiniGameSession } from '../MiniGameSession';
import { createCrystalariumFullState, type CrystalariumFullState } from './CrystalariumFullRules';
import {
  migrateCrystalariumQueue,
  readCrystalariumQueue,
  type CrystalariumQueueState,
} from './CrystalariumMultiOrderRules';
import { CRYSTALARIUM_FULL_VARIANT_ID, CRYSTALARIUM_GAME_ID } from './CrystalariumOpeningRules';

export const CRYSTALARIUM_SANDBOX_STORAGE_KEY = 'unicorn-valley:just-games:crystalarium:v1';

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
  return Boolean(
    session &&
      session.gameId === CRYSTALARIUM_GAME_ID &&
      session.variantId === CRYSTALARIUM_FULL_VARIANT_ID &&
      ((session.source === 'just-games' && session.sideEffectPolicy === 'sandbox') ||
        (session.source === 'world' &&
          session.sideEffectPolicy === 'world' &&
          ((session.returnTarget.sceneKey === 'CrystalBrookScene' &&
            session.worldContext?.locationId === 'crystal-brook' &&
            session.worldContext.interactionId === 'crystalarium-nursery') ||
            (session.returnTarget.sceneKey === 'CrystalGrottoScene' &&
              session.worldContext?.locationId === 'crystal-grotto' &&
              session.worldContext.interactionId === 'crystalarium-altar')))),
  );
}
/** Invalid or future-version sandbox records never contaminate adventure state. */
export function loadCrystalariumProgress(
  session: MiniGameSession | null,
  saves: SaveService,
  storage: CrystalariumProgressStorage | null = browserStorage(),
): CrystalariumQueueState {
  const fresh = migrateCrystalariumQueue(createCrystalariumFullState());
  if (!fresh) throw new Error('Crystalarium default save migration failed');
  if (!isFullCrystalariumSession(session)) return fresh;
  if (session?.source === 'world') {
    const value = saves.load()?.activities.crystalarium;
    return readCrystalariumQueue(value) ?? fresh;
  }
  try {
    const raw = storage?.getItem(CRYSTALARIUM_SANDBOX_STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : null;
    return readCrystalariumQueue(value) ?? fresh;
  } catch {
    return fresh;
  }
}
/** Fail closed. Callers must not claim a persistent move when its write failed. */
export function saveCrystalariumProgress(
  session: MiniGameSession | null,
  progress: CrystalariumFullState,
  saves: SaveService,
  storage: CrystalariumProgressStorage | null = browserStorage(),
): boolean {
  const queue = readCrystalariumQueue(progress);
  if (!isFullCrystalariumSession(session) || !queue) return false;
  if (session?.source === 'world') {
    const existing = saves.load();
    if (!existing) return false;
    const next = {
      ...existing,
      activities: { ...existing.activities, crystalarium: queue },
    };
    return saves.saveWithResult(next).status === 'saved';
  }
  try {
    if (!storage) return false;
    // Never replace an unreadable or future-version sandbox record with
    // an apparently fresh game: the user may return with a newer client.
    const stored = storage.getItem(CRYSTALARIUM_SANDBOX_STORAGE_KEY);
    if (stored !== null) {
      const previous: unknown = JSON.parse(stored);
      if (!readCrystalariumQueue(previous)) return false;
    }
    storage.setItem(CRYSTALARIUM_SANDBOX_STORAGE_KEY, JSON.stringify(queue));
    return true;
  } catch {
    return false;
  }
}
