import { describe, expect, it } from 'vitest';
import { type GameEventMap, TypedEventBus } from '../game/events/GameEventBus';
import { buildCottageHomeView } from '../game/home/CottageHomeView';
import { InventoryService } from '../game/inventory/InventoryService';
import { QuestEngine, getQuestStepId } from '../game/quests/QuestEngine';
import type { SaveRepository } from '../game/save/SaveRepository';
import { SaveService } from '../game/save/SaveService';
import { SecretDiscoveryService } from '../game/discovery/SecretDiscoveryService';
import { getPebbleStoryPhase, isPebbleFountainRepaired } from '../game/story/PebbleCollectionStory';
import { PLACEHOLDER_CONTENT } from './placeholderContent';
import {
  PEBBLE_CHARACTER_ID,
  PEBBLE_COLLECTION_QUEST_ID,
  PEBBLE_CURIOUS_PIECE_ITEM_ID,
  PEBBLE_DISPLAY_REWARD_ITEM_ID,
  R4_PEBBLE_CHARACTERS,
  R4_PEBBLE_DIALOGUES,
  R4_PEBBLE_DISCOVERIES,
  R4_PEBBLE_ITEMS,
  R4_PEBBLE_QUESTS,
  R4_PEBBLE_SECRET_DEFINITIONS,
} from './r4PebbleStory';
import { validateContent } from './validateContent';

class MemorySaveRepository implements SaveRepository {
  private value: string | null = null;

  public read(): string | null {
    return this.value;
  }

  public write(serialisedSave: string): void {
    this.value = serialisedSave;
  }

  public remove(): void {
    this.value = null;
  }
}

describe("Pebble's Peculiar Pieces", () => {
  it('passes content validation and places one fixed curiosity in each exploration region', () => {
    const errors = validateContent({
      ...PLACEHOLDER_CONTENT,
      items: [...PLACEHOLDER_CONTENT.items, ...R4_PEBBLE_ITEMS],
      characters: [...PLACEHOLDER_CONTENT.characters, ...R4_PEBBLE_CHARACTERS],
      quests: [...PLACEHOLDER_CONTENT.quests, ...R4_PEBBLE_QUESTS],
      discoveries: [...PLACEHOLDER_CONTENT.discoveries, ...R4_PEBBLE_DISCOVERIES],
      dialogues: [...PLACEHOLDER_CONTENT.dialogues, ...R4_PEBBLE_DIALOGUES],
    });

    expect(errors).toEqual([]);
    expect(R4_PEBBLE_SECRET_DEFINITIONS).toHaveLength(3);
    expect(new Set(R4_PEBBLE_SECRET_DEFINITIONS.map(({ sceneKey }) => sceneKey))).toEqual(
      new Set(['MoonflowerGladeScene', 'SunbeamVillageScene', 'RainbowMeadowScene']),
    );
    expect(R4_PEBBLE_SECRET_DEFINITIONS.every(({ pattern }) => pattern === 'hidden-object')).toBe(
      true,
    );
  });

  it('uses the normal quest, discovery and inventory services from first find through reward', () => {
    const saveService = new SaveService(new MemorySaveRepository());
    saveService.createNewGame();
    const events = new TypedEventBus<GameEventMap>();
    const questEngine = new QuestEngine(saveService, events, () => '2026-08-21T08:30:00.000Z');
    const secrets = new SecretDiscoveryService(saveService, events);
    const inventory = new InventoryService(saveService, events);

    expect(getPebbleStoryPhase(questEngine.getProgress(PEBBLE_COLLECTION_QUEST_ID))).toBe(
      'introduction',
    );

    questEngine.startQuest(PEBBLE_COLLECTION_QUEST_ID);
    expect(getPebbleStoryPhase(questEngine.getProgress(PEBBLE_COLLECTION_QUEST_ID))).toBe(
      'collecting',
    );
    expect(questEngine.getProgress(PEBBLE_COLLECTION_QUEST_ID).currentStepId).toBe(
      getQuestStepId(PEBBLE_COLLECTION_QUEST_ID, 0),
    );

    for (const [index, definition] of R4_PEBBLE_SECRET_DEFINITIONS.entries()) {
      expect(secrets.discover(definition).status).toBe('discovered');
      expect(inventory.getQuantity(PEBBLE_CURIOUS_PIECE_ITEM_ID)).toBe(index + 1);
    }

    expect(getPebbleStoryPhase(questEngine.getProgress(PEBBLE_COLLECTION_QUEST_ID))).toBe(
      'return-to-pebble',
    );
    expect(secrets.discover(R4_PEBBLE_SECRET_DEFINITIONS[0]).status).toBe('already-discovered');
    expect(inventory.getQuantity(PEBBLE_CURIOUS_PIECE_ITEM_ID)).toBe(3);

    questEngine.notifyCharacterTalked(PEBBLE_CHARACTER_ID);

    const save = saveService.load();
    if (!save) {
      throw new Error('Expected Pebble completion to persist a save.');
    }
    expect(questEngine.getProgress(PEBBLE_COLLECTION_QUEST_ID).status).toBe('completed');
    expect(inventory.getQuantity(PEBBLE_CURIOUS_PIECE_ITEM_ID)).toBe(0);
    expect(inventory.getQuantity(PEBBLE_DISPLAY_REWARD_ITEM_ID)).toBe(1);
    expect(save.relationships.byCharacterId[PEBBLE_CHARACTER_ID]?.friendshipPoints).toBe(10);
    expect(isPebbleFountainRepaired(save)).toBe(true);
    expect(buildCottageHomeView(save).treasureRewards).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          itemId: PEBBLE_DISPLAY_REWARD_ITEM_ID,
          name: "Pebble's Curiosity Display",
        }),
      ]),
    );

    questEngine.destroy();
  });
});
