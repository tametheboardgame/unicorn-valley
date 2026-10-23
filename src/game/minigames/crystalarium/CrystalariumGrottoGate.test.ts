import { describe, expect, it } from 'vitest';
import {
  CRYSTAL_GROTTO_GLOWING_FLAG,
  CRYSTAL_GROTTO_OPEN_FLAG,
  ECHO_CRYSTAL_CHIME_ITEM_ID,
  ECHO_CRYSTAL_SONG_QUEST_ID,
} from '../../../content/r6CrystalBrookDepthContent';
import { getQuestStepId } from '../../quests/QuestEngine';
import { createDefaultSave } from '../../save/createDefaultSave';
import { getGrottoGateAccess } from './CrystalariumGrottoGate';

const freshSave = () => createDefaultSave('2026-10-22T12:00:00.000Z');

describe('H6.9A existing-save Crystal Grotto gate classification', () => {
  it('seals the door for fresh players and for a new, unfinished opening melody', () => {
    expect(getGrottoGateAccess(null)).toEqual({ unlocked: false, evidence: 'sealed' });
    const save = freshSave();
    expect(getGrottoGateAccess(save).unlocked).toBe(false);
    save.quests.byQuestId[ECHO_CRYSTAL_SONG_QUEST_ID] = {
      status: 'active',
      currentStepId: getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 1),
      completedAt: null,
    };
    expect(getGrottoGateAccess(save)).toEqual({ unlocked: false, evidence: 'sealed' });
  });

  it('never reseals an old Grotto with the existing open flag', () => {
    const save = freshSave();
    save.world.flags[CRYSTAL_GROTTO_OPEN_FLAG] = true;
    expect(getGrottoGateAccess(save)).toEqual({ unlocked: true, evidence: 'open-flag' });
  });

  it('recognises all three legacy note-stage save positions without changing step IDs', () => {
    for (const index of [3, 4, 5, 6, 7, 8, 9, 10]) {
      const save = freshSave();
      save.quests.byQuestId[ECHO_CRYSTAL_SONG_QUEST_ID] = {
        status: 'active',
        currentStepId: getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, index),
        completedAt: null,
      };
      expect(getGrottoGateAccess(save)).toEqual({
        unlocked: true,
        evidence: 'legacy-song-progress',
      });
    }
  });

  it('honours completed quests, earned reward and glowing grotto as independent legacy evidence', () => {
    const completed = freshSave();
    completed.quests.byQuestId[ECHO_CRYSTAL_SONG_QUEST_ID] = {
      status: 'completed',
      currentStepId: null,
      completedAt: '2026-10-21T10:00:00.000Z',
    };
    expect(getGrottoGateAccess(completed).unlocked).toBe(true);

    const rewarded = freshSave();
    rewarded.inventory.itemQuantities[ECHO_CRYSTAL_CHIME_ITEM_ID] = 1;
    expect(getGrottoGateAccess(rewarded)).toEqual({
      unlocked: true,
      evidence: 'existing-chime',
    });

    const glowing = freshSave();
    glowing.world.flags[CRYSTAL_GROTTO_GLOWING_FLAG] = true;
    expect(getGrottoGateAccess(glowing)).toEqual({
      unlocked: true,
      evidence: 'glowing-grotto',
    });
  });

  it('is read-only and does not grant an unlock on incomplete quest progress', () => {
    const save = freshSave();
    save.quests.byQuestId[ECHO_CRYSTAL_SONG_QUEST_ID] = {
      status: 'active',
      currentStepId: getQuestStepId(ECHO_CRYSTAL_SONG_QUEST_ID, 2),
      completedAt: null,
    };
    const previous = JSON.stringify(save);
    expect(getGrottoGateAccess(save).unlocked).toBe(false);
    expect(JSON.stringify(save)).toBe(previous);
  });
});
