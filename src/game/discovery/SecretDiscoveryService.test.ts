import { describe, expect, it } from 'vitest';
import {
  HOLLOW_TREE_STAR_DISCOVERY_ID,
  MOONFLOWER_SONG_DISCOVERY_ID,
  MOONLIT_TRAIL_DISCOVERY_ID,
  MOONLIT_TRAIL_REVEALED_FLAG,
  R4_SECRET_DEFINITIONS,
} from '../../content/r4Secrets';
import { WILLOW_GARDEN_PLANTED_FLAG, WILLOW_MOONFLOWERS_QUEST_ID } from '../../content/r2Quests';
import { type GameEventMap, TypedEventBus } from '../events/GameEventBus';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { SecretDiscoveryService, isSecretConditionMet } from './SecretDiscoveryService';

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

function createReadyService() {
  const repository = new MemorySaveRepository();
  const saveService = new SaveService(repository);
  const save = saveService.createNewGame();
  saveService.save({
    ...save,
    collections: {
      ...save.collections,
      discoveryIds: [...save.collections.discoveryIds, 'discovery:moonflower-sparkle'],
    },
    world: {
      ...save.world,
      uniqueDiscoveryIds: [...save.world.uniqueDiscoveryIds, 'discovery:moonflower-sparkle'],
      flags: {
        ...save.world.flags,
        [WILLOW_GARDEN_PLANTED_FLAG]: true,
      },
    },
    quests: {
      ...save.quests,
      byQuestId: {
        ...save.quests.byQuestId,
        [WILLOW_MOONFLOWERS_QUEST_ID]: {
          status: 'completed',
          currentStepId: null,
          completedAt: '2026-08-20T11:00:00.000Z',
        },
      },
    },
  });

  const events = new TypedEventBus<GameEventMap>();
  return {
    saveService,
    service: new SecretDiscoveryService(saveService, events),
  };
}

describe('SecretDiscoveryService', () => {
  it('uses one shared framework for three different secret patterns', () => {
    expect(new Set(R4_SECRET_DEFINITIONS.map(({ pattern }) => pattern))).toEqual(
      new Set(['hidden-object', 'conditional-clue', 'hidden-path']),
    );
    expect(R4_SECRET_DEFINITIONS.map(({ feedbackTier }) => feedbackTier)).toEqual([
      'twinkle',
      'secret',
      'grand',
    ]);
  });

  it('evaluates discovery, quest and world-flag conditions from persistent save state', () => {
    const { saveService } = createReadyService();
    const save = saveService.load();
    expect(save).not.toBeNull();
    if (!save) {
      return;
    }

    expect(
      isSecretConditionMet(
        { type: 'discovery', discoveryId: 'discovery:moonflower-sparkle' },
        save,
      ),
    ).toBe(true);
    expect(
      isSecretConditionMet(
        { type: 'quest-status', questId: WILLOW_MOONFLOWERS_QUEST_ID, status: 'completed' },
        save,
      ),
    ).toBe(true);
    expect(
      isSecretConditionMet(
        { type: 'world-flag', flagId: WILLOW_GARDEN_PLANTED_FLAG, value: true },
        save,
      ),
    ).toBe(true);
  });

  it('reveals secrets in sequence and persists the hidden path without duplicate unlocks', () => {
    const { saveService, service } = createReadyService();
    const [hiddenObject, conditionalClue, hiddenPath] = R4_SECRET_DEFINITIONS;

    expect(
      service.listAvailable(R4_SECRET_DEFINITIONS, 'MoonflowerGladeScene').map(({ id }) => id),
    ).toEqual([hiddenObject.id, conditionalClue.id]);
    expect(service.discover(hiddenPath).status).toBe('blocked');

    expect(service.discover(hiddenObject).status).toBe('discovered');
    expect(service.discover(conditionalClue).status).toBe('discovered');
    expect(service.isAvailable(hiddenPath)).toBe(true);
    expect(service.discover(hiddenPath).status).toBe('discovered');

    const saved = saveService.load();
    expect(saved?.collections.discoveryIds).toEqual(
      expect.arrayContaining([
        HOLLOW_TREE_STAR_DISCOVERY_ID,
        MOONFLOWER_SONG_DISCOVERY_ID,
        MOONLIT_TRAIL_DISCOVERY_ID,
      ]),
    );
    expect(saved?.world.flags[MOONLIT_TRAIL_REVEALED_FLAG]).toBe(true);
    expect(service.discover(hiddenPath).status).toBe('already-discovered');
    expect(
      saveService
        .load()
        ?.collections.discoveryIds.filter((id) => id === MOONLIT_TRAIL_DISCOVERY_ID),
    ).toHaveLength(1);
  });
});
