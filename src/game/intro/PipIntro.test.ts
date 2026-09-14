import { describe, expect, it } from 'vitest';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import { getQuestStepId } from '../quests/QuestEngine';
import type { QuestProgress, SaveGame } from '../save/saveSchema';
import {
  isPipIntroduced,
  PIP_ARRIVAL_TRIGGER_X,
  PIP_INTRO_APPEARED_FLAG,
  resolvePipInteractionDialogueId,
  shouldTriggerPipArrival,
} from './PipIntro';

function progress(status: QuestProgress['status'], currentStepId?: string): QuestProgress {
  return { status, currentStepId } as QuestProgress;
}

function saveWithFlags(flags: Record<string, boolean>): SaveGame {
  return {
    world: { flags, uniqueDiscoveryIds: [] },
    collections: { discoveryIds: [], memoryIds: [] },
  } as unknown as SaveGame;
}

describe('Pip first encounter', () => {
  it('waits until the player has moved into the Glade before triggering the arrival', () => {
    const freshSave = saveWithFlags({});
    expect(shouldTriggerPipArrival(PIP_ARRIVAL_TRIGGER_X - 1, freshSave)).toBe(false);
    expect(shouldTriggerPipArrival(PIP_ARRIVAL_TRIGGER_X, freshSave)).toBe(true);
  });

  it('does not replay the magical arrival once Pip has appeared', () => {
    const introduced = saveWithFlags({ [PIP_INTRO_APPEARED_FLAG]: true });
    expect(isPipIntroduced(introduced)).toBe(true);
    expect(shouldTriggerPipArrival(PIP_ARRIVAL_TRIGGER_X + 100, introduced)).toBe(false);
  });
});

describe('Pip direct interaction dialogue', () => {
  it('uses the welcome before the first Glade discovery', () => {
    expect(resolvePipInteractionDialogueId(false, progress('not-started'), null)).toBe(
      'dialogue:pip-welcome',
    );
  });

  it('starts the mysterious trail from Pip after the first discovery', () => {
    expect(resolvePipInteractionDialogueId(true, progress('not-started'), null)).toBe(
      'dialogue:pip-strange-egg-intro',
    );
  });

  it('gives clue-specific guidance instead of one generic trail reminder', () => {
    const expected = [
      'dialogue:pip-strange-egg-feather',
      'dialogue:pip-strange-egg-moss',
      'dialogue:pip-strange-egg-tracks',
      'dialogue:pip-strange-egg-egg',
      'dialogue:pip-strange-egg-return',
    ] as const;

    expected.forEach((dialogueId, offset) => {
      expect(
        resolvePipInteractionDialogueId(
          true,
          progress('active', getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, offset + 1)),
          null,
        ),
      ).toBe(dialogueId);
    });
  });
});
