import type { MiniGameSession } from './MiniGameSession';

export type MiniGameAdventureEffect =
  | 'activity-progress'
  | 'quest'
  | 'world-flag'
  | 'relationship'
  | 'inventory'
  | 'shimmer'
  | 'collection'
  | 'unlock';

export function canApplyAdventureEffect(
  session: MiniGameSession | null,
  _effect: MiniGameAdventureEffect,
): boolean {
  return session === null || session.sideEffectPolicy === 'world';
}

export function runMiniGameAdventureEffect(
  session: MiniGameSession | null,
  effect: MiniGameAdventureEffect,
  apply: () => void,
): boolean {
  if (!canApplyAdventureEffect(session, effect)) {
    return false;
  }

  apply();
  return true;
}
