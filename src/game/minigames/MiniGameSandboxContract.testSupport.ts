import {
  runMiniGameAdventureEffect,
  type MiniGameAdventureEffect,
} from './MiniGameOutcomeGateway';
import type { MiniGameSession } from './MiniGameSession';

export const MINI_GAME_ADVENTURE_EFFECTS: readonly MiniGameAdventureEffect[] = [
  'activity-progress',
  'quest',
  'world-flag',
  'relationship',
  'inventory',
  'shimmer',
  'collection',
  'unlock',
];

export function assertSandboxAdventureEffectsBlocked(session: MiniGameSession): void {
  if (session.sideEffectPolicy !== 'sandbox') {
    throw new Error('Sandbox regression contract requires a sandbox mini-game session.');
  }

  for (const effect of MINI_GAME_ADVENTURE_EFFECTS) {
    let writeCount = 0;
    const applied = runMiniGameAdventureEffect(session, effect, () => {
      writeCount += 1;
    });

    if (applied || writeCount !== 0) {
      throw new Error(`Sandbox mini-game session allowed adventure effect: ${effect}`);
    }
  }
}

export function assertWorldAdventureEffectsAllowed(session: MiniGameSession): void {
  if (session.sideEffectPolicy !== 'world') {
    throw new Error('World regression contract requires a world mini-game session.');
  }

  for (const effect of MINI_GAME_ADVENTURE_EFFECTS) {
    let writeCount = 0;
    const applied = runMiniGameAdventureEffect(session, effect, () => {
      writeCount += 1;
    });

    if (!applied || writeCount !== 1) {
      throw new Error(`World mini-game session rejected adventure effect: ${effect}`);
    }
  }
}
