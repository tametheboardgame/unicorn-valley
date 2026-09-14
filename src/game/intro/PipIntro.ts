import type { DialogueId } from '../../content/contentTypes';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import type { InteractionTarget } from '../interaction/InteractionTarget';
import { getQuestStepId } from '../quests/QuestEngine';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { getBrowserSaveService } from '../save/browserSaveService';
import type { QuestProgress, SaveGame } from '../save/saveSchema';
import { getPipEggDialogueId } from '../story/PipEggArc';

export const FIRST_DISCOVERY_ID = 'discovery:moonflower-sparkle' as const;
export const FIRST_DISCOVERY_FLAG = 'flag:first-sparkle-found';
export const PIP_INTRO_APPEARED_FLAG = 'flag:pip-intro-appeared';
export const PIP_WELCOME_COMPLETE_FLAG = 'flag:pip-welcome-complete';
export const PIP_POSITION = { x: 970, y: 825 } as const;
export const FIRST_SPARKLE_POSITION = { x: 1120, y: 1030 } as const;
export const FIRST_SPARKLE_COLLECTION_RADIUS = 78;
export const PIP_ARRIVAL_TRIGGER_X = 790;

export function isPipIntroduced(save: SaveGame | null): boolean {
  return Boolean(
    save?.world.flags[PIP_INTRO_APPEARED_FLAG] === true ||
      save?.collections.discoveryIds.includes(FIRST_DISCOVERY_ID) ||
      save?.world.uniqueDiscoveryIds.includes(FIRST_DISCOVERY_ID),
  );
}

export function shouldTriggerPipArrival(playerX: number, save: SaveGame | null): boolean {
  return !isPipIntroduced(save) && playerX >= PIP_ARRIVAL_TRIGGER_X;
}

export function resolvePipInteractionDialogueId(
  hasFirstDiscovery: boolean,
  progress: QuestProgress,
  save: SaveGame | null,
): DialogueId {
  if (!hasFirstDiscovery) {
    return 'dialogue:pip-welcome';
  }

  const awaitingTrailStart =
    progress.status === 'not-started' ||
    progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 0);
  if (awaitingTrailStart) {
    return 'dialogue:pip-strange-egg-intro';
  }

  return getPipEggDialogueId(save, progress);
}

/**
 * Resolve Pip's direct-talk response at the moment Talk is activated. The two talk gates in the
 * Mysterious Trail are deliberately acknowledged here so Pip himself starts and concludes the
 * trail instead of remote world markers doing it behind the player's back.
 */
export function getCurrentPipInteractionDialogueId(hasFirstDiscovery: boolean): DialogueId {
  if (!hasFirstDiscovery) {
    return 'dialogue:pip-welcome';
  }

  const quests = getBrowserQuestEngine();
  let progress = quests.getProgress(PIP_STRANGE_EGG_QUEST_ID);
  const awaitingTrailStart =
    progress.status === 'not-started' ||
    progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 0);
  if (awaitingTrailStart) {
    if (progress.status === 'not-started') {
      progress = quests.startQuest(PIP_STRANGE_EGG_QUEST_ID);
    }
    if (progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 0)) {
      quests.notifyCharacterTalked('character:pip');
    }
    return 'dialogue:pip-strange-egg-intro';
  }

  if (progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 5)) {
    quests.notifyCharacterTalked('character:pip');
    return 'dialogue:pip-strange-egg-return';
  }

  return getPipEggDialogueId(getBrowserSaveService().load(), progress);
}

export function createPipInteraction(hasFirstDiscovery: boolean): InteractionTarget {
  return {
    id: 'interaction:pip',
    label: 'Pip',
    actionLabel: 'Talk',
    actionKind: 'talk',
    position: PIP_POSITION,
    interactionRadius: 185,
    priority: 20,
    visible: () => isPipIntroduced(getBrowserSaveService().load()),
    enabled: () => isPipIntroduced(getBrowserSaveService().load()),
    result: {
      type: 'dialogue',
      get dialogueId(): DialogueId {
        return getCurrentPipInteractionDialogueId(hasFirstDiscovery);
      },
    },
  };
}
