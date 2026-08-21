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
import { R3_CHARACTERS, R3_DISCOVERIES, R3_ITEMS } from './r3Content';
import { R3_DIALOGUES } from './r3Dialogues';
import { R3_QUESTS } from './r3Quests';
import { R4_DIALOGUE_VARIANT_SETS } from './r4DialogueVariants';
import { R4_DIALOGUES } from './r4Dialogues';
import { R4_EGG_CHARACTERS, R4_EGG_DISCOVERIES, R4_EGG_QUESTS } from './r4EggArc';
import { R4_FRIEND_VISIT_DIALOGUES } from './r4FriendVisitDialogues';
import {
  R4_PEBBLE_CHARACTERS,
  R4_PEBBLE_DIALOGUES,
  R4_PEBBLE_DISCOVERIES,
  R4_PEBBLE_ITEMS,
  R4_PEBBLE_QUESTS,
} from './r4PebbleStory';
import {
  R4_PICNIC_CHARACTERS,
  R4_PICNIC_DIALOGUES,
  R4_PICNIC_DIALOGUE_VARIANT_SETS,
  R4_PICNIC_QUESTS,
} from './r4PicnicEvent';
import { R4_SECRET_DISCOVERIES } from './r4Secrets';
import { R4_SHOP_ITEMS } from './r4ShopContent';
import { R5_CRYSTAL_BROOK_DISCOVERIES, R5_CRYSTAL_BROOK_ITEMS } from './r5CrystalBrook';
import {
  R5_CRYSTAL_BROOK_STORY_CHARACTERS,
  R5_CRYSTAL_BROOK_STORY_DIALOGUES,
  R5_CRYSTAL_BROOK_STORY_DISCOVERIES,
  R5_CRYSTAL_BROOK_STORY_ITEMS,
  R5_CRYSTAL_BROOK_STORY_QUESTS,
} from './r5CrystalBrookStory';
import { R5_LUMI_CHARACTERS, R5_LUMI_DIALOGUES, R5_LUMI_DISCOVERIES } from './r5LumiWoodsStory';
import { R5_WHISPERING_WOODS_DISCOVERIES } from './r5WhisperingWoods';
import type {
  CharacterDefinition,
  CharacterId,
  DialogueDefinition,
  DialogueId,
  DialogueVariantSet,
  DialogueVariantSetId,
  DiscoveryDefinition,
  DiscoveryId,
  ItemDefinition,
  ItemId,
  QuestDefinition,
  QuestId,
} from './contentTypes';
import { assertValidContent } from './validateContent';

const ALL_ITEMS = [
  ...ITEMS,
  ...R2_ITEMS,
  ...R3_ITEMS,
  ...R4_SHOP_ITEMS,
  ...R4_PEBBLE_ITEMS,
  ...R5_CRYSTAL_BROOK_ITEMS,
  ...R5_CRYSTAL_BROOK_STORY_ITEMS,
] satisfies readonly ItemDefinition[];
const ALL_CHARACTERS = [
  ...CHARACTERS,
  ...R2_CHARACTERS,
  ...R3_CHARACTERS,
  ...R4_EGG_CHARACTERS,
  ...R4_PICNIC_CHARACTERS,
  ...R4_PEBBLE_CHARACTERS,
  ...R5_CRYSTAL_BROOK_STORY_CHARACTERS,
  ...R5_LUMI_CHARACTERS,
] satisfies readonly CharacterDefinition[];
const ALL_QUESTS = [
  ...QUESTS,
  ...R2_QUESTS,
  ...R3_QUESTS,
  ...R4_EGG_QUESTS,
  ...R4_PICNIC_QUESTS,
  ...R4_PEBBLE_QUESTS,
  ...R5_CRYSTAL_BROOK_STORY_QUESTS,
] satisfies readonly QuestDefinition[];
const ALL_DISCOVERIES = [
  ...DISCOVERIES,
  ...R3_DISCOVERIES,
  ...R4_EGG_DISCOVERIES,
  ...R4_SECRET_DISCOVERIES,
  ...R4_PEBBLE_DISCOVERIES,
  ...R5_CRYSTAL_BROOK_DISCOVERIES,
  ...R5_CRYSTAL_BROOK_STORY_DISCOVERIES,
  ...R5_WHISPERING_WOODS_DISCOVERIES,
  ...R5_LUMI_DISCOVERIES,
] satisfies readonly DiscoveryDefinition[];
const ALL_DIALOGUES = [
  ...DIALOGUES,
  ...R2_DIALOGUES,
  ...R3_DIALOGUES,
  ...R4_DIALOGUES,
  ...R4_FRIEND_VISIT_DIALOGUES,
  ...R4_PICNIC_DIALOGUES,
  ...R4_PEBBLE_DIALOGUES,
  ...R5_CRYSTAL_BROOK_STORY_DIALOGUES,
  ...R5_LUMI_DIALOGUES,
] satisfies readonly DialogueDefinition[];
const ALL_DIALOGUE_VARIANT_SETS = [
  ...R4_DIALOGUE_VARIANT_SETS,
  ...R4_PICNIC_DIALOGUE_VARIANT_SETS,
] satisfies readonly DialogueVariantSet[];

assertValidContent({
  ...PLACEHOLDER_CONTENT,
  items: ALL_ITEMS,
  characters: ALL_CHARACTERS,
  quests: ALL_QUESTS,
  discoveries: ALL_DISCOVERIES,
  dialogues: ALL_DIALOGUES,
  dialogueVariantSets: ALL_DIALOGUE_VARIANT_SETS,
});

export const itemRegistry = new ContentRegistry<ItemId, ItemDefinition>('item', ALL_ITEMS);
export const characterRegistry = new ContentRegistry<CharacterId, CharacterDefinition>(
  'character',
  ALL_CHARACTERS,
);
export const questRegistry = new ContentRegistry<QuestId, QuestDefinition>('quest', ALL_QUESTS);
export const discoveryRegistry = new ContentRegistry<DiscoveryId, DiscoveryDefinition>(
  'discovery',
  ALL_DISCOVERIES,
);
export const dialogueRegistry = new ContentRegistry<DialogueId, DialogueDefinition>(
  'dialogue',
  ALL_DIALOGUES,
);
export const dialogueVariantSetRegistry = new ContentRegistry<
  DialogueVariantSetId,
  DialogueVariantSet
>('dialogue variant set', ALL_DIALOGUE_VARIANT_SETS);
