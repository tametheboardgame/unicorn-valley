import type Phaser from 'phaser';
import type { DialogueId } from '../../content/contentTypes';
import { PIP_STRANGE_EGG_QUEST_ID } from '../../content/r4EggArc';
import {
  MARIGOLD_CHARACTER_ID,
  MARIGOLD_PICNIC_QUEST_ID,
  MARIGOLD_PICNIC_VARIANTS_ID,
} from '../../content/r4PicnicEvent';
import { PEBBLE_CHARACTER_ID, PEBBLE_COLLECTION_QUEST_ID } from '../../content/r4PebbleStory';
import { LUMI_CHARACTER_ID, LUMI_INTRO_RELATIONSHIP_FLAG } from '../../content/r5LumiWoodsStory';
import { RIPPLE_BROOK_QUEST_ID, RIPPLE_CHARACTER_ID } from '../../content/r5CrystalBrookStory';
import { SINGING_SHELL_ITEM_ID } from '../../content/r5CrystalBrook';
import { NOVA_FIRST_RACE_QUEST_ID } from '../../content/r3Quests';
import { WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import {
  WILLOW_POST_MOONFLOWERS_SEEN_FLAG,
  WILLOW_POST_MOONFLOWERS_VARIANTS_ID,
} from '../../content/r4DialogueVariants';
import { dialogueVariantSetRegistry } from '../../content/registries';
import { selectDialogueVariantSet } from '../dialogue/DialogueConditions';
import { getWorldConversationPresenter } from '../dialogue/WorldConversationPresenter';
import { gameEventBus } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import { getQuestStepId } from '../quests/QuestEngine';
import { getBrowserQuestEngine } from '../quests/browserQuestEngine';
import { RelationshipService } from '../relationships/RelationshipService';
import { getBrowserSaveService } from '../save/browserSaveService';
import { getRippleStoryPhase } from './CrystalBrookStory';
import {
  didWinNovaFirstRace,
  getNovaFirstRacePhase,
  NOVA_CHARACTER_ID,
} from './NovaFirstRaceStory';
import { getPebbleStoryPhase } from './PebbleCollectionStory';
import { getPipEggDialogueId } from './PipEggArc';
import { getWillowStoryPhase, WILLOW_CHARACTER_ID } from './WillowMoonflowersStory';

type ConversationPlan = { dialogueId: DialogueId; complete?: () => void };

function start(scene: Phaser.Scene, plan: ConversationPlan): void {
  getWorldConversationPresenter().start(scene, plan.dialogueId, { onComplete: plan.complete });
}

export function startWillowConversation(scene: Phaser.Scene): void {
  const save = getBrowserSaveService();
  const relationships = new RelationshipService(save);
  relationships.markMet(WILLOW_CHARACTER_ID);
  const quests = getBrowserQuestEngine();
  let progress = quests.getProgress(WILLOW_MOONFLOWERS_QUEST_ID);
  if (progress.status === 'not-started') progress = quests.startQuest(WILLOW_MOONFLOWERS_QUEST_ID);
  const phase = getWillowStoryPhase(progress);
  let dialogueId: DialogueId;
  let complete: (() => void) | undefined;
  if (phase === 'introduction') {
    dialogueId = 'dialogue:willow-moonflowers-intro';
    complete = () => quests.notifyCharacterTalked(WILLOW_CHARACTER_ID);
  } else if (phase === 'collecting') dialogueId = 'dialogue:willow-moonflowers-reminder';
  else if (phase === 'return-to-willow' || phase === 'resolving') {
    dialogueId = 'dialogue:willow-moonflowers-return';
    if (phase === 'return-to-willow')
      complete = () => quests.notifyCharacterTalked(WILLOW_CHARACTER_ID);
  } else {
    dialogueId =
      selectDialogueVariantSet(
        dialogueVariantSetRegistry.get(WILLOW_POST_MOONFLOWERS_VARIANTS_ID),
        { relationships, saveService: save },
      )?.id ?? 'dialogue:willow-moonflowers-followup';
    complete = () => relationships.addFlag(WILLOW_CHARACTER_ID, WILLOW_POST_MOONFLOWERS_SEEN_FLAG);
  }
  start(scene, { dialogueId, complete });
}

export function startMarigoldConversation(scene: Phaser.Scene): void {
  const save = getBrowserSaveService();
  const relationships = new RelationshipService(save);
  relationships.markMet(MARIGOLD_CHARACTER_ID);
  const quests = getBrowserQuestEngine();
  let progress = quests.getProgress(MARIGOLD_PICNIC_QUEST_ID);
  if (progress.status === 'not-started') progress = quests.startQuest(MARIGOLD_PICNIC_QUEST_ID);
  const incomplete = progress.status !== 'completed';
  const dialogueId = incomplete
    ? 'dialogue:marigold-picnic-intro'
    : (selectDialogueVariantSet(dialogueVariantSetRegistry.get(MARIGOLD_PICNIC_VARIANTS_ID), {
        relationships,
        saveService: save,
      })?.id ?? 'dialogue:marigold-picnic-followup');
  start(scene, {
    dialogueId,
    complete: incomplete ? () => quests.notifyCharacterTalked(MARIGOLD_CHARACTER_ID) : undefined,
  });
}

export function startLumiConversation(scene: Phaser.Scene): void {
  const relationships = new RelationshipService(getBrowserSaveService());
  relationships.markMet(LUMI_CHARACTER_ID);
  const first = !relationships.hasFlag(LUMI_CHARACTER_ID, LUMI_INTRO_RELATIONSHIP_FLAG);
  start(scene, {
    dialogueId: first ? 'dialogue:lumi-starwell-intro' : 'dialogue:lumi-starwell-followup',
    complete: first
      ? () => {
          relationships.addFriendship(LUMI_CHARACTER_ID, 8);
          relationships.addFlag(LUMI_CHARACTER_ID, LUMI_INTRO_RELATIONSHIP_FLAG);
        }
      : undefined,
  });
}

export function startPebbleConversation(scene: Phaser.Scene): void {
  new RelationshipService(getBrowserSaveService()).markMet(PEBBLE_CHARACTER_ID);
  const quests = getBrowserQuestEngine();
  const progress = quests.getProgress(PEBBLE_COLLECTION_QUEST_ID);
  const phase = getPebbleStoryPhase(progress);
  const ids: Record<typeof phase, DialogueId> = {
    introduction: 'dialogue:pebble-odd-things-intro',
    collecting: 'dialogue:pebble-odd-things-reminder',
    'return-to-pebble': 'dialogue:pebble-odd-things-return',
    resolving: 'dialogue:pebble-odd-things-return',
    completed: 'dialogue:pebble-odd-things-followup',
  };
  start(scene, {
    dialogueId: ids[phase],
    complete: () => {
      if (phase === 'introduction') quests.startQuest(PEBBLE_COLLECTION_QUEST_ID);
      if (phase === 'return-to-pebble') quests.notifyCharacterTalked(PEBBLE_CHARACTER_ID);
    },
  });
}

export function startRippleConversation(scene: Phaser.Scene): void {
  const save = getBrowserSaveService();
  new RelationshipService(save).markMet(RIPPLE_CHARACTER_ID);
  const quests = getBrowserQuestEngine();
  const inventory = new InventoryService(save);
  let progress = quests.getProgress(RIPPLE_BROOK_QUEST_ID);
  if (
    progress.status === 'active' &&
    progress.currentStepId === getQuestStepId(RIPPLE_BROOK_QUEST_ID, 1) &&
    inventory.hasItem(SINGING_SHELL_ITEM_ID, 2)
  ) {
    gameEventBus.emit('ITEM_COLLECTED', { itemId: SINGING_SHELL_ITEM_ID, quantity: 2 });
    progress = quests.getProgress(RIPPLE_BROOK_QUEST_ID);
  }
  const phase = getRippleStoryPhase(progress);
  const ids: Record<typeof phase, DialogueId> = {
    introduction: 'dialogue:ripple-brook-song-intro',
    collecting: 'dialogue:ripple-brook-song-reminder',
    'return-to-ripple': 'dialogue:ripple-brook-song-return',
    completed: 'dialogue:ripple-brook-song-followup',
  };
  start(scene, {
    dialogueId: ids[phase],
    complete: () => {
      if (phase === 'introduction') {
        if (progress.status === 'not-started') quests.startQuest(RIPPLE_BROOK_QUEST_ID);
        quests.notifyCharacterTalked(RIPPLE_CHARACTER_ID);
      }
      if (phase === 'return-to-ripple') quests.notifyCharacterTalked(RIPPLE_CHARACTER_ID);
      if (
        quests.getProgress(RIPPLE_BROOK_QUEST_ID).currentStepId ===
          getQuestStepId(RIPPLE_BROOK_QUEST_ID, 1) &&
        inventory.hasItem(SINGING_SHELL_ITEM_ID, 2)
      )
        gameEventBus.emit('ITEM_COLLECTED', { itemId: SINGING_SHELL_ITEM_ID, quantity: 2 });
    },
  });
}

export function startNovaConversation(scene: Phaser.Scene): void {
  const save = getBrowserSaveService();
  new RelationshipService(save).markMet(NOVA_CHARACTER_ID);
  const quests = getBrowserQuestEngine();
  let progress = quests.getProgress(NOVA_FIRST_RACE_QUEST_ID);
  if (progress.status === 'not-started') progress = quests.startQuest(NOVA_FIRST_RACE_QUEST_ID);
  const phase = getNovaFirstRacePhase(progress);
  const dialogueId: DialogueId =
    phase === 'invitation'
      ? 'dialogue:nova-first-race-intro'
      : phase === 'ready-to-race'
        ? 'dialogue:nova-first-race-reminder'
        : phase === 'result-ready'
          ? didWinNovaFirstRace(save.load() ?? save.createNewGame())
            ? 'dialogue:nova-first-race-result-win'
            : 'dialogue:nova-first-race-result-finish'
          : 'dialogue:nova-first-race-followup';
  start(scene, {
    dialogueId,
    complete:
      phase === 'invitation' || phase === 'result-ready'
        ? () => quests.notifyCharacterTalked(NOVA_CHARACTER_ID)
        : undefined,
  });
}

export function startPipEggConversation(scene: Phaser.Scene): void {
  const quests = getBrowserQuestEngine();
  let progress = quests.getProgress(PIP_STRANGE_EGG_QUEST_ID);
  const intro =
    progress.status === 'not-started' ||
    progress.currentStepId === getQuestStepId(PIP_STRANGE_EGG_QUEST_ID, 0);
  if (progress.status === 'not-started') progress = quests.startQuest(PIP_STRANGE_EGG_QUEST_ID);
  start(scene, {
    dialogueId: intro
      ? 'dialogue:pip-strange-egg-intro'
      : getPipEggDialogueId(getBrowserSaveService().load(), progress),
    complete: intro ? () => quests.notifyCharacterTalked('character:pip') : undefined,
  });
}
