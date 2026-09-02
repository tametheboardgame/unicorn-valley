import type { ItemId } from '../../content/contentTypes';
import type { SaveGame } from '../save/saveSchema';

export interface ShopUnlockState {
  unlocked: boolean;
  hint: string | null;
}

type ShopUnlockRule =
  | { type: 'always' }
  | { type: 'completed-quests'; count: number }
  | { type: 'discoveries'; count: number }
  | { type: 'finished-races'; count: number }
  | { type: 'combined'; completedQuests: number; finishedRaces: number };

const SHOP_UNLOCK_RULES: Partial<Record<ItemId, ShopUnlockRule>> = {
  'item:starlight-bow': { type: 'always' },
  'item:cloud-cushion': { type: 'always' },
  'item:moonflower-hair-clip': { type: 'completed-quests', count: 1 },
  'item:starlight-lamp': { type: 'discoveries', count: 5 },
  'item:rainbow-neck-ribbon': { type: 'finished-races', count: 1 },
  'item:rainbow-rug': { type: 'combined', completedQuests: 2, finishedRaces: 1 },
};

function completedQuestCount(save: SaveGame): number {
  return Object.values(save.quests.byQuestId).filter(({ status }) => status === 'completed').length;
}

function discoveryCount(save: SaveGame): number {
  return new Set([...save.collections.discoveryIds, ...save.world.uniqueDiscoveryIds]).size;
}

function finishedRaceCount(save: SaveGame): number {
  return Object.values(save.activities.racesById).filter(({ bestTimeMs }) => bestTimeMs !== null)
    .length;
}

export function resolveShopUnlock(save: SaveGame, itemId: ItemId): ShopUnlockState {
  const rule = SHOP_UNLOCK_RULES[itemId] ?? { type: 'always' };

  if (rule.type === 'always') {
    return { unlocked: true, hint: null };
  }
  if (rule.type === 'completed-quests') {
    const unlocked = completedQuestCount(save) >= rule.count;
    return {
      unlocked,
      hint: unlocked ? null : `Help a valley friend to unlock this.`,
    };
  }
  if (rule.type === 'discoveries') {
    const unlocked = discoveryCount(save) >= rule.count;
    return {
      unlocked,
      hint: unlocked ? null : `Find ${rule.count} discoveries to unlock this.`,
    };
  }
  if (rule.type === 'finished-races') {
    const unlocked = finishedRaceCount(save) >= rule.count;
    return {
      unlocked,
      hint: unlocked ? null : 'Finish a race to unlock this.',
    };
  }

  const unlocked =
    completedQuestCount(save) >= rule.completedQuests &&
    finishedRaceCount(save) >= rule.finishedRaces;
  return {
    unlocked,
    hint: unlocked ? null : 'Help two friends and finish a race to unlock this.',
  };
}
