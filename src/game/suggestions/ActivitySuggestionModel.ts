import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { FIRST_DISCOVERY_ID } from '../intro/PipIntro';
import { getQuestStepId } from '../quests/QuestEngine';
import type { SaveGame } from '../save/saveSchema';

export const MAX_VISIBLE_ACTIVITY_SUGGESTIONS = 1;

export type ActivitySuggestionId =
  | 'suggestion:first-sparkle'
  | 'suggestion:willow-moonflowers'
  | 'suggestion:decorate-cottage';

export interface ActivitySuggestion {
  id: ActivitySuggestionId;
  title: string;
  message: string;
}

interface ActivitySuggestionDefinition {
  id: ActivitySuggestionId;
  isAvailable: (save: SaveGame) => boolean;
  build: (save: SaveGame) => ActivitySuggestion;
}

function getWillowProgress(save: SaveGame) {
  return save.quests.byQuestId[WILLOW_MOONFLOWERS_QUEST_ID];
}

function getWillowMessage(save: SaveGame): string {
  const progress = getWillowProgress(save);
  if (!progress || progress.status === 'not-started') {
    return 'Willow is in Sunbeam Village. You could go and say hello.';
  }

  if (progress.currentStepId === getQuestStepId(WILLOW_MOONFLOWERS_QUEST_ID, 0)) {
    return 'Willow is in Sunbeam Village. Go and see what she needs.';
  }

  if (progress.currentStepId === getQuestStepId(WILLOW_MOONFLOWERS_QUEST_ID, 1)) {
    return 'Three Moonflowers are waiting at the Moonflower Patch in the Glade.';
  }

  if (progress.currentStepId === getQuestStepId(WILLOW_MOONFLOWERS_QUEST_ID, 2)) {
    return 'You found enough Moonflowers. Take them back to Willow in Sunbeam Village.';
  }

  return 'Willow could use a hoof. See what she needs next.';
}

function hasPlacedOwnedDecoration(save: SaveGame): boolean {
  const ownedDecorationIds = new Set(save.inventory.ownedDecorationIds);
  return Object.values(save.home.furnitureBySlot).some((itemId) => ownedDecorationIds.has(itemId));
}

const ACTIVITY_SUGGESTION_DEFINITIONS: readonly ActivitySuggestionDefinition[] = [
  {
    id: 'suggestion:first-sparkle',
    isAvailable: (save) => !save.collections.discoveryIds.includes(FIRST_DISCOVERY_ID),
    build: () => ({
      id: 'suggestion:first-sparkle',
      title: 'Look for a sparkle',
      message: 'Something twinkly is hiding near Pip in Moonflower Glade.',
    }),
  },
  {
    id: 'suggestion:willow-moonflowers',
    isAvailable: (save) => getWillowProgress(save)?.status !== 'completed',
    build: (save) => ({
      id: 'suggestion:willow-moonflowers',
      title: getWillowProgress(save)?.status === 'active' ? 'Help Willow' : 'Meet Willow',
      message: getWillowMessage(save),
    }),
  },
  {
    id: 'suggestion:decorate-cottage',
    isAvailable: (save) =>
      save.inventory.ownedDecorationIds.length > 0 && !hasPlacedOwnedDecoration(save),
    build: () => ({
      id: 'suggestion:decorate-cottage',
      title: 'Decorate your cottage',
      message: 'You have a decoration ready. Try it on one of the glowing ✦ spots at home.',
    }),
  },
];

export function getAvailableActivitySuggestions(save: SaveGame): ActivitySuggestion[] {
  return ACTIVITY_SUGGESTION_DEFINITIONS.filter((definition) => definition.isAvailable(save)).map(
    (definition) => definition.build(save),
  );
}

export class ActivitySuggestionSession {
  private readonly dismissedIds = new Set<ActivitySuggestionId>();
  private rotationOffset = 0;

  public getVisible(save: SaveGame): ActivitySuggestion[] {
    const available = this.getUndismissed(save);
    if (available.length === 0) {
      return [];
    }

    const offset = this.rotationOffset % available.length;
    const rotated = [...available.slice(offset), ...available.slice(0, offset)];
    return rotated.slice(0, MAX_VISIBLE_ACTIVITY_SUGGESTIONS);
  }

  public rotate(save: SaveGame): void {
    const available = this.getUndismissed(save);
    if (available.length > 1) {
      this.rotationOffset = (this.rotationOffset + 1) % available.length;
    }
  }

  public dismissCurrent(save: SaveGame): void {
    const current = this.getVisible(save)[0];
    if (!current) {
      return;
    }

    this.dismissedIds.add(current.id);
    const remaining = this.getUndismissed(save);
    this.rotationOffset = remaining.length === 0 ? 0 : this.rotationOffset % remaining.length;
  }

  private getUndismissed(save: SaveGame): ActivitySuggestion[] {
    return getAvailableActivitySuggestions(save).filter(
      (suggestion) => !this.dismissedIds.has(suggestion.id),
    );
  }
}
