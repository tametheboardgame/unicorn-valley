import { describe, expect, it } from 'vitest';
import {
  PIP_STRANGE_EGG_FOUND_FLAG,
  PIP_STRANGE_EGG_QUEST_ID,
} from '../../content/r4EggArc';
import { getQuestStepId } from '../quests/QuestEngine';
import type { QuestProgress, SaveGame } from '../save/saveSchema';
import { resolvePipInteractionDialogueId } from './PipIntro';

function progress(status: QuestProgress['status'], currentStepId?: string): QuestProgress {
  return { status, currentStepId } as QuestProgress;
}

describe('Pip direct interaction dialogue', () => {
  it('uses the welcome before the first Glade discovery', () => {
    expect(resolvePipInteractionDialogueId(false, progress('not-started'), null)).toBe(
      'dialogue:pip-welcome',
    );
  });

  it('acknowledges the first discovery while the mysterious trail is still waiting to start', () => {
    expect(resolvePipInteractionDialogueId(true, progress('not-started'), null)).toBe(
      'dialogue:pip-first-discovery',
    );
  });

  it('switches to trail-aware guidance once the trail quest has advanced', () => {
    expect(
      resolvePipInteractionDialogueId(
        true,
        progress('active', getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 1)),
        null,
      ),
    ).toBe('dialogue:pip-strange-egg-searching');
  });

  it('reflects later egg state rather than repeating the introduction', () => {
    const save = {
      world: { flags: { [PIP_STRANGE_EGG_FOUND_FLAG]: true } },
      collections: { memoryIds: [] },
    } as unknown as SaveGame;

    expect(
      resolvePipInteractionDialogueId(
        true,
        progress('active', getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 4)),
        save,
      ),
    ).toBe('dialogue:pip-strange-egg-found');
  });
});
