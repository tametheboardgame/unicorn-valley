import { describe, expect, it } from 'vitest';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import type { QuestProgress } from '../save/saveSchema';
import { createDefaultSave } from '../save/createDefaultSave';
import { getQuestStepId } from '../quests/QuestEngine';
import {
  didWinNovaFirstRace,
  getNovaFirstRacePhase,
  recordNovaFirstRaceResult,
} from './NovaFirstRaceStory';

function activeProgress(stepIndex: number): QuestProgress {
  return {
    status: 'active',
    currentStepId: getQuestStepId(NOVA_FIRST_RACE_QUEST_ID, stepIndex),
    completedAt: null,
  };
}

describe('NovaFirstRaceStory', () => {
  it('maps quest progress to invitation, race, result and follow-up phases', () => {
    expect(
      getNovaFirstRacePhase({
        status: 'not-started',
        currentStepId: null,
        completedAt: null,
      }),
    ).toBe('invitation');
    expect(getNovaFirstRacePhase(activeProgress(0))).toBe('invitation');
    expect(getNovaFirstRacePhase(activeProgress(1))).toBe('ready-to-race');
    expect(getNovaFirstRacePhase(activeProgress(2))).toBe('result-ready');
    expect(
      getNovaFirstRacePhase({
        status: 'completed',
        currentStepId: null,
        completedAt: '2026-08-18T06:30:00.000Z',
      }),
    ).toBe('complete');
  });

  it('remembers whether the player crossed the tutorial finish first', () => {
    const save = createDefaultSave('2026-08-18T06:00:00.000Z');

    const winningSave = recordNovaFirstRaceResult(save, 1);
    expect(didWinNovaFirstRace(winningSave)).toBe(true);

    const finishingSave = recordNovaFirstRaceResult(save, 2);
    expect(didWinNovaFirstRace(finishingSave)).toBe(false);
  });

  it('rejects invalid finishing places', () => {
    const save = createDefaultSave('2026-08-18T06:00:00.000Z');
    expect(() => recordNovaFirstRaceResult(save, 0)).toThrow(/positive integer/);
  });
});
