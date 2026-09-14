import type { DialogueId, DiscoveryId } from '../../content/contentTypes';
import {
  LUMA_COMPANION_HATCHED_FLAG,
  PIP_EGG_CLUE_DISCOVERY_IDS,
  PIP_EGG_HATCH_READY_FLAG,
  PIP_STRANGE_EGG_DISCOVERY_ID,
  PIP_STRANGE_EGG_FOUND_FLAG,
  PIP_STRANGE_EGG_QUEST_ID,
} from '../../content/r4EggArc';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { getQuestStepId } from '../quests/QuestEngine';
import type { SaveService } from '../save/SaveService';
import type { QuestProgress, SaveGame } from '../save/saveSchema';

export type PipEggStage =
  | 'none'
  | 'found'
  | 'warm'
  | 'glowing'
  | 'cracking'
  | 'hatch-ready'
  | 'hatched';

export type PipEggActivityKind = 'discovery' | 'quest' | 'race';

export const PIP_EGG_PENDING_GROWTH_MEMORY = 'memory:pip-egg:pending-growth';
export const PIP_EGG_WARM_MEMORY = 'memory:pip-egg:stage-warm';
export const PIP_EGG_GLOWING_MEMORY = 'memory:pip-egg:stage-glowing';
export const PIP_EGG_CRACKING_MEMORY = 'memory:pip-egg:stage-cracking';
export const LUMA_COMPANION_MEMORY = 'memory:companion:luma';
export const PIP_EGG_HATCH_SCENE_MEMORY = 'memory:pip-egg:hatch-scene-seen';

export interface PipEggClueSpot {
  id: string;
  discoveryId: DiscoveryId;
  label: string;
  actionLabel: string;
  position: { x: number; y: number };
  feedback: string;
}

/**
 * One geographically readable trail through Moonflower Glade:
 * stream reeds -> far bank moss -> tracks towards Moonflower Field -> egg.
 */
export const PIP_EGG_CLUE_SPOTS = [
  {
    id: 'interaction:pip-egg-clue-feather',
    discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[0],
    label: 'Silver feather',
    actionLabel: 'Pick up feather',
    position: { x: 1230, y: 590 },
    feedback:
      'Silver feather found!\nIt points across the stream. Cross the bridge and check the reeds on the far bank.',
  },
  {
    id: 'interaction:pip-egg-clue-moss',
    discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[1],
    label: 'Warm moon-moss',
    actionLabel: 'Feel the moss',
    position: { x: 1590, y: 760 },
    feedback:
      'Warm moon-moss!\nTiny star-shaped tracks leave the moss and head south-east towards Moonflower Field.',
  },
  {
    id: 'interaction:pip-egg-clue-star',
    discoveryId: PIP_EGG_CLUE_DISCOVERY_IDS[2],
    label: 'Starry tracks',
    actionLabel: 'Follow the tracks',
    position: { x: 1745, y: 990 },
    feedback:
      'Starry tracks!\nFollow the little prints into Moonflower Field. Something is hiding at the end.',
  },
  {
    id: 'interaction:pip-strange-egg',
    discoveryId: PIP_STRANGE_EGG_DISCOVERY_ID,
    label: 'Strange egg',
    actionLabel: 'Pick up the egg',
    position: { x: 2075, y: 1260 },
    feedback:
      'You found a strange egg!\nTake it back to Pip. He will know how to keep it safe.',
  },
] as const satisfies readonly PipEggClueSpot[];

function withMemory(save: SaveGame, memoryId: string): SaveGame {
  if (save.collections.memoryIds.includes(memoryId)) {
    return save;
  }

  return {
    ...save,
    collections: {
      ...save.collections,
      memoryIds: [...save.collections.memoryIds, memoryId],
    },
  };
}

function withoutMemory(save: SaveGame, memoryId: string): SaveGame {
  if (!save.collections.memoryIds.includes(memoryId)) {
    return save;
  }

  return {
    ...save,
    collections: {
      ...save.collections,
      memoryIds: save.collections.memoryIds.filter((entry) => entry !== memoryId),
    },
  };
}

export function getPipEggStage(save: SaveGame | null): PipEggStage {
  if (save?.world.flags[PIP_STRANGE_EGG_FOUND_FLAG] !== true) {
    return 'none';
  }
  if (save.world.flags[LUMA_COMPANION_HATCHED_FLAG] === true) {
    return 'hatched';
  }
  if (save.world.flags[PIP_EGG_HATCH_READY_FLAG] === true) {
    return 'hatch-ready';
  }
  if (save.collections.memoryIds.includes(PIP_EGG_CRACKING_MEMORY)) {
    return 'cracking';
  }
  if (save.collections.memoryIds.includes(PIP_EGG_GLOWING_MEMORY)) {
    return 'glowing';
  }
  if (save.collections.memoryIds.includes(PIP_EGG_WARM_MEMORY)) {
    return 'warm';
  }
  return 'found';
}

function activeTrailDialogue(progress: QuestProgress): DialogueId | null {
  if (progress.status !== 'active') {
    return null;
  }

  const dialogueByStep = new Map<string, DialogueId>([
    [getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 1), 'dialogue:pip-strange-egg-feather'],
    [getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 2), 'dialogue:pip-strange-egg-moss'],
    [getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 3), 'dialogue:pip-strange-egg-tracks'],
    [getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 4), 'dialogue:pip-strange-egg-egg'],
    [getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 5), 'dialogue:pip-strange-egg-return'],
  ]);
  return progress.currentStepId ? (dialogueByStep.get(progress.currentStepId) ?? null) : null;
}

export function getPipEggDialogueId(save: SaveGame | null, progress: QuestProgress): DialogueId {
  if (
    progress.status === 'not-started' ||
    progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 0)
  ) {
    return 'dialogue:pip-strange-egg-intro';
  }

  const trailDialogue = activeTrailDialogue(progress);
  if (trailDialogue) {
    return trailDialogue;
  }

  const stage = getPipEggStage(save);
  if (stage === 'hatched') {
    return 'dialogue:pip-strange-egg-hatched';
  }
  if (stage === 'hatch-ready') {
    return 'dialogue:pip-strange-egg-hatch-ready';
  }
  if (stage === 'cracking') {
    return 'dialogue:pip-strange-egg-cracking';
  }
  if (stage === 'glowing') {
    return 'dialogue:pip-strange-egg-glowing';
  }
  if (stage === 'warm') {
    return 'dialogue:pip-strange-egg-warm';
  }
  if (stage === 'found') {
    return 'dialogue:pip-strange-egg-found';
  }
  return 'dialogue:pip-strange-egg-searching';
}

export function getActivePipEggClue(progress: QuestProgress): PipEggClueSpot | null {
  if (progress.status !== 'active') {
    return null;
  }

  for (let index = 1; index <= 4; index += 1) {
    if (progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, index)) {
      return PIP_EGG_CLUE_SPOTS[index - 1] ?? null;
    }
  }

  return null;
}

export class PipEggArcService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public getStage(): PipEggStage {
    return getPipEggStage(this.saveService.load());
  }

  public hasPendingGrowth(): boolean {
    return Boolean(
      this.saveService.load()?.collections.memoryIds.includes(PIP_EGG_PENDING_GROWTH_MEMORY),
    );
  }

  public recordActivity(kind: PipEggActivityKind): boolean {
    let save = this.saveService.load() ?? this.saveService.createNewGame();
    const stage = getPipEggStage(save);
    if (stage === 'none' || stage === 'hatch-ready' || stage === 'hatched') {
      return false;
    }
    if (save.collections.memoryIds.includes(PIP_EGG_PENDING_GROWTH_MEMORY)) {
      return false;
    }

    save = withMemory(save, `memory:pip-egg:activity-${kind}`);
    save = withMemory(save, PIP_EGG_PENDING_GROWTH_MEMORY);
    this.saveService.save(save);
    return true;
  }

  /**
   * Session boundaries no longer advance the egg. H1.9 makes growth player-readable: an adventure
   * marks the egg ready, and the next deliberate inspection in the cottage advances one stage.
   */
  public beginSession(): PipEggStage {
    return this.getStage();
  }

  public inspectEgg(): PipEggStage {
    let save = this.saveService.load() ?? this.saveService.createNewGame();
    const currentStage = getPipEggStage(save);
    if (
      !save.collections.memoryIds.includes(PIP_EGG_PENDING_GROWTH_MEMORY) ||
      currentStage === 'none' ||
      currentStage === 'hatch-ready' ||
      currentStage === 'hatched'
    ) {
      return currentStage;
    }

    save = withoutMemory(save, PIP_EGG_PENDING_GROWTH_MEMORY);

    if (currentStage === 'found') {
      save = withMemory(save, PIP_EGG_WARM_MEMORY);
    } else if (currentStage === 'warm') {
      save = withMemory(save, PIP_EGG_GLOWING_MEMORY);
    } else if (currentStage === 'glowing') {
      save = withMemory(save, PIP_EGG_CRACKING_MEMORY);
    } else if (currentStage === 'cracking') {
      save = {
        ...save,
        world: {
          ...save.world,
          flags: {
            ...save.world.flags,
            [PIP_EGG_HATCH_READY_FLAG]: true,
          },
        },
      };
    }

    const saved = this.saveService.save(save);
    if (
      currentStage !== 'hatch-ready' &&
      saved.world.flags[PIP_EGG_HATCH_READY_FLAG] === true
    ) {
      this.events.emit('WORLD_FLAG_CHANGED', { flagId: PIP_EGG_HATCH_READY_FLAG, value: true });
    }
    return getPipEggStage(saved);
  }

  public completeHatch(): boolean {
    let save = this.saveService.load();
    if (save?.world.flags[PIP_EGG_HATCH_READY_FLAG] !== true) {
      return false;
    }

    save = withMemory(save, LUMA_COMPANION_MEMORY);
    save = withMemory(save, PIP_EGG_HATCH_SCENE_MEMORY);
    save = {
      ...save,
      world: {
        ...save.world,
        flags: {
          ...save.world.flags,
          [PIP_EGG_HATCH_READY_FLAG]: false,
          [LUMA_COMPANION_HATCHED_FLAG]: true,
        },
      },
    };
    this.saveService.save(save);
    this.events.emit('WORLD_FLAG_CHANGED', { flagId: PIP_EGG_HATCH_READY_FLAG, value: false });
    this.events.emit('WORLD_FLAG_CHANGED', { flagId: LUMA_COMPANION_HATCHED_FLAG, value: true });
    return true;
  }
}
