import { describe, expect, it } from 'vitest';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { FIRST_DISCOVERY_ID } from '../intro/PipIntro';
import { getQuestStepId } from '../quests/QuestEngine';
import { createDefaultSave } from '../save/createDefaultSave';
import {
  ActivitySuggestionSession,
  getAvailableActivitySuggestions,
  MAX_VISIBLE_ACTIVITY_SUGGESTIONS,
} from './ActivitySuggestionModel';

describe('ActivitySuggestionModel', () => {
  it('offers optional ideas from the current save state', () => {
    const save = createDefaultSave('2026-08-17T14:30:00.000Z');

    expect(getAvailableActivitySuggestions(save).map((suggestion) => suggestion.id)).toEqual([
      'suggestion:first-sparkle',
      'suggestion:willow-moonflowers',
    ]);
  });

  it('stops suggesting a discovery once it has been completed', () => {
    const save = createDefaultSave();
    save.collections.discoveryIds.push(FIRST_DISCOVERY_ID);

    expect(
      getAvailableActivitySuggestions(save).some(
        (suggestion) => suggestion.id === 'suggestion:first-sparkle',
      ),
    ).toBe(false);
  });

  it('turns Willow progress into short state-aware guidance', () => {
    const save = createDefaultSave();
    save.quests.byQuestId[WILLOW_MOONFLOWERS_QUEST_ID] = {
      status: 'active',
      currentStepId: getQuestStepId(WILLOW_MOONFLOWERS_QUEST_ID, 1),
      completedAt: null,
    };

    const suggestion = getAvailableActivitySuggestions(save).find(
      (entry) => entry.id === 'suggestion:willow-moonflowers',
    );

    expect(suggestion?.title).toBe('Help Willow');
    expect(suggestion?.message).toContain('Three Moonflowers');
  });

  it('never suggests completed Willow content again', () => {
    const save = createDefaultSave();
    save.quests.byQuestId[WILLOW_MOONFLOWERS_QUEST_ID] = {
      status: 'completed',
      currentStepId: null,
      completedAt: '2026-08-17T14:35:00.000Z',
    };

    expect(
      getAvailableActivitySuggestions(save).some(
        (suggestion) => suggestion.id === 'suggestion:willow-moonflowers',
      ),
    ).toBe(false);
  });

  it('suggests decorating only while an owned decoration is still unplaced', () => {
    const save = createDefaultSave();
    save.inventory.ownedDecorationIds.push('item:moonflower-lantern');

    expect(
      getAvailableActivitySuggestions(save).some(
        (suggestion) => suggestion.id === 'suggestion:decorate-cottage',
      ),
    ).toBe(true);

    save.home.furnitureBySlot['home-slot:window'] = 'item:moonflower-lantern';

    expect(
      getAvailableActivitySuggestions(save).some(
        (suggestion) => suggestion.id === 'suggestion:decorate-cottage',
      ),
    ).toBe(false);
  });

  it('rotates and dismisses suggestions without changing game progress', () => {
    const save = createDefaultSave();
    const before = JSON.stringify(save);
    const session = new ActivitySuggestionSession();

    expect(session.getVisible(save)).toHaveLength(MAX_VISIBLE_ACTIVITY_SUGGESTIONS);
    expect(session.getVisible(save)[0]?.id).toBe('suggestion:first-sparkle');

    session.rotate(save);
    expect(session.getVisible(save)[0]?.id).toBe('suggestion:willow-moonflowers');

    session.dismissCurrent(save);
    expect(session.getVisible(save)[0]?.id).toBe('suggestion:first-sparkle');
    expect(JSON.stringify(save)).toBe(before);
  });
});
