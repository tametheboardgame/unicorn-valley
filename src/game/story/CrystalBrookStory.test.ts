import { describe, expect, it } from 'vitest';
import {
  BROOK_PRISM_MOBILE_ITEM_ID,
  BROOK_SONG_RESTORED_FLAG,
  RIPPLE_BROOK_QUEST_ID,
  R5_CRYSTAL_BROOK_STORY_QUESTS,
} from '../../content/r5CrystalBrookStory';
import { getQuestStepId } from '../quests/QuestEngine';
import { getRippleStoryPhase } from './CrystalBrookStory';

describe('Crystal Brook story', () => {
  it('maps quest progress into the expected Ripple conversation phases', () => {
    expect(
      getRippleStoryPhase({ status: 'not-started', currentStepId: null, completedAt: null }),
    ).toBe('introduction');
    expect(
      getRippleStoryPhase({
        status: 'active',
        currentStepId: getQuestStepId(RIPPLE_BROOK_QUEST_ID, 1),
        completedAt: null,
      }),
    ).toBe('collecting');
    expect(
      getRippleStoryPhase({
        status: 'active',
        currentStepId: getQuestStepId(RIPPLE_BROOK_QUEST_ID, 2),
        completedAt: null,
      }),
    ).toBe('return-to-ripple');
    expect(
      getRippleStoryPhase({
        status: 'completed',
        currentStepId: null,
        completedAt: '2026-08-21T09:30:00.000Z',
      }),
    ).toBe('completed');
  });

  it('ends with a home reward, friendship and a persistent brook change', () => {
    const quest = R5_CRYSTAL_BROOK_STORY_QUESTS[0];
    expect(quest.steps).toContainEqual({
      type: 'award-item',
      itemId: BROOK_PRISM_MOBILE_ITEM_ID,
      quantity: 1,
    });
    expect(quest.steps).toContainEqual({
      type: 'set-world-flag',
      flagId: BROOK_SONG_RESTORED_FLAG,
      value: true,
    });
    expect(quest.steps.some((step) => step.type === 'award-friendship')).toBe(true);
  });
});
