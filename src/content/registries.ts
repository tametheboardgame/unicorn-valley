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
import { R2_QUESTS } from './r2Quests';
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
const ALL_QUESTS = [...QUESTS, ...R2_QUESTS] satisfies readonly QuestDefinition[];

assertValidContent({
  ...PLACEHOLDER_CONTENT,
  items: ALL_ITEMS,
  quests: ALL_QUESTS,
});

export const itemRegistry = new ContentRegistry<ItemId, ItemDefinition>('item', ALL_ITEMS);
export const characterRegistry = new ContentRegistry<CharacterId, CharacterDefinition>(
  'character',
  CHARACTERS,
);
export const questRegistry = new ContentRegistry<QuestId, QuestDefinition>('quest', ALL_QUESTS);
export const discoveryRegistry = new ContentRegistry<DiscoveryId, DiscoveryDefinition>(
  'discovery',
  DISCOVERIES,
);
export const dialogueRegistry = new ContentRegistry<DialogueId, DialogueDefinition>(
  'dialogue',
  DIALOGUES,
);
