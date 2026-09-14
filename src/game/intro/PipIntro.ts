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
export const PIP_POSITION = { x: 970, y: 825 } as const;
export const FIRST_SPARKLE_POSITION = { x: 1120, y: 1030 } as const;
export const FIRST_SPARKLE_COLLECTION_RADIUS = 78;

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
    return 'dialogue:pip-first-discovery';
  }

  return getPipEggDialogueId(save, progress);
}

/** Resolve Pip's current direct-talk response only when the player actually talks to Pip. */
export function getCurrentPipInteractionDialogueId(hasFirstDiscovery: boolean): DialogueId {
  const quests = getBrowserQuestEngine();
  return resolvePipInteractionDialogueId(
    hasFirstDiscovery,
    quests.getProgress(PIP_STRANGE_EGG_QUEST_ID),
    getBrowserSaveService().load(),
  );
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
    result: {
      type: 'dialogue',
      get dialogueId(): DialogueId {
        return getCurrentPipInteractionDialogueId(hasFirstDiscovery);
      },
    },
  };
}
