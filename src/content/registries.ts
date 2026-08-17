import { ContentRegistry } from './ContentRegistry';
import {
  CHARACTERS,
  DIALOGUES,
  DISCOVERIES,
  ITEMS,
  PLACEHOLDER_CONTENT,
  QUESTS,
} from './placeholderContent';
import { R2_ITEMS } from './r2Items';
import type {
  CharacterDefinition,
  CharacterId,
  DialogueDefinition,
  DialogueId,
  DiscoveryDefinition,
  DiscoveryId,
  ItemDefinition,
  ItemId,
  QuestDefinition,
  QuestId,
} from './contentTypes';
import { assertValidContent } from './validateContent';

const ALL_ITEMS = [...ITEMS, ...R2_ITEMS] satisfies readonly ItemDefinition[];

assertValidContent({
  ...PLACEHOLDER_CONTENT,
  items: ALL_ITEMS,
});

export const itemRegistry = new ContentRegistry<ItemId, ItemDefinition>('item', ALL_ITEMS);
export const characterRegistry = new ContentRegistry<CharacterId, CharacterDefinition>(
  'character',
  CHARACTERS,
);
export const questRegistry = new ContentRegistry<QuestId, QuestDefinition>('quest', QUESTS);
export const discoveryRegistry = new ContentRegistry<DiscoveryId, DiscoveryDefinition>(
  'discovery',
  DISCOVERIES,
);
export const dialogueRegistry = new ContentRegistry<DialogueId, DialogueDefinition>(
  'dialogue',
  DIALOGUES,
);
