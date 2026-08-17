import { ContentRegistry } from './ContentRegistry';
import {
  CHARACTERS,
  DIALOGUES,
  DISCOVERIES,
  ITEMS,
  PLACEHOLDER_CONTENT,
  QUESTS,
} from './placeholderContent';
import { R2_CHARACTERS } from './r2Characters';
import { R2_DIALOGUES } from './r2Dialogues';
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
const ALL_CHARACTERS = [...CHARACTERS, ...R2_CHARACTERS] satisfies readonly CharacterDefinition[];
const ALL_QUESTS = [...QUESTS, ...R2_QUESTS] satisfies readonly QuestDefinition[];
const ALL_DIALOGUES = [...DIALOGUES, ...R2_DIALOGUES] satisfies readonly DialogueDefinition[];

assertValidContent({
  ...PLACEHOLDER_CONTENT,
  items: ALL_ITEMS,
  characters: ALL_CHARACTERS,
  quests: ALL_QUESTS,
  dialogues: ALL_DIALOGUES,
});

export const itemRegistry = new ContentRegistry<ItemId, ItemDefinition>('item', ALL_ITEMS);
export const characterRegistry = new ContentRegistry<CharacterId, CharacterDefinition>(
  'character',
  ALL_CHARACTERS,
);
export const questRegistry = new ContentRegistry<QuestId, QuestDefinition>('quest', ALL_QUESTS);
export const discoveryRegistry = new ContentRegistry<DiscoveryId, DiscoveryDefinition>(
  'discovery',
  DISCOVERIES,
);
export const dialogueRegistry = new ContentRegistry<DialogueId, DialogueDefinition>(
  'dialogue',
  ALL_DIALOGUES,
);
