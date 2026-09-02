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
import { R5_FIREFLY_LANTERN_DISCOVERIES } from './r5FireflyLantern';
import { R5_LUMI_CHARACTERS, R5_LUMI_DIALOGUES, R5_LUMI_DISCOVERIES } from './r5LumiWoodsStory';
import { R5_RACE_DISCOVERIES, R5_RACE_ITEMS } from './r5RaceContent';
import { R5_WEATHER_DISCOVERIES } from './r5Weather';
import { R5_WHISPERING_WOODS_DISCOVERIES } from './r5WhisperingWoods';
import {
  R6_VILLAGE_CHARACTERS,
  R6_VILLAGE_DISCOVERIES,
  R6_VILLAGE_ITEMS,
  R6_VILLAGE_QUESTS,
} from './r6VillageContent';
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
  ...R4_PEBLE_ITEMS_PLACEHOLDER,
] as const;
