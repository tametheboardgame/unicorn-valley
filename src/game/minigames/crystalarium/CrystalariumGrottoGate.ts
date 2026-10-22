import {
  CRYSTAL_GROTTO_GLOWING_FLAG,
  CRYSTAL_GROTTO_OPEN_FLAG,
  ECHO_CRYSTAL_CHIME_ITEM_ID,
  ECHO_CRYSTAL_SONG_QUEST_ID,
} from '../../../content/r6CrystalBrookDepthContent';
import { getQuestStepId } from '../../quests/QuestEngine';
import type { SaveGame } from '../../save/saveSchema';

export type GrottoGateEvidence =
  | 'sealed'
  | 'open-flag'
  | 'completed-song'
  | 'existing-chime'
  | 'legacy-song-progress'
  | 'glowing-grotto';

export interface GrottoGateAccess {
  readonly unlocked: boolean;
  readonly evidence: GrottoGateEvidence;
}

/**
 * Read-only migration predicate for H6.9B. Never reset an already-open Grotto.
 *
 * The shipped quest opens the door *before* entering the three-note song.
 * A save already at note step 3/4/5, or a later song step, is therefore
 * evidence that the opening sequence is finished, even if its flag was lost.
 *
 * New quest progress at index 1 (the future introductory resonance step)
 * must NOT grant access.
 */
export function getGrottoGateAccess(
  save: Pick<SaveGame, 'world' | 'quests' | 'inventory'> | null,
): GrottoGateAccess {
  if (!save) return { unlocked: false, evidence: 'sealed' };
  const flags = save.world.flags;
  if (flags[CRYSTAL_GROTTO_OPEN_FLAG] === true) {
    return { unlocked: true, evidence: 'open-flag' };
  }

  const quest = save.quests.byQuestId[ECHO_CRYSTAL_SONG_QUEST_ID];
  if (quest?.status === 'completed') {
    return { unlocked: true, evidence: 'completed-song' };
  }
  if ((save.inventory.itemQuantities[ECHO_CRYSTAL_CHIME_ITEM_ID] ?? 0) > 0) {
    return { unlocked: true, evidence: 'existing-chime' };
  }
  if (flags[CRYSTAL_GROTTO_GLOWING_FLAG] === true) {
    return { unlocked: true, evidence: 'glowing-grotto' };
  }
  if (quest?.status === 'active') {
    const progressedSteps = Array.from({ length: 8 }, (_, i) =>
      getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, i + 3),
    );
    if (quest.currentStepId !== null && progressedSteps.includes(quest.currentStepId)) {
      return { unlocked: true, evidence: 'legacy-song-progress' };
    }
  }
  return { unlocked: false, evidence: 'sealed' };
}
