import { characterRegistry, discoveryRegistry, itemRegistry, questRegistry } from '../../content/registries';
import type { CharacterId, DiscoveryId, ItemId, QuestDefinition, QuestId, QuestStep } from '../../content/contentTypes';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import { InventoryService } from '../inventory/InventoryService';
import type { SaveService } from '../save/SaveService';
import type { QuestProgress, SaveGame } from '../save/saveSchema';

export interface QuestObjective {
  questId: QuestId;
  questName: string;
  stepId: string;
  label: string;
}

export type QuestClock = () => string;

const systemClock: QuestClock = () => new Date().toISOString();

export function getQuestStepId(questId: QuestId, index: number): string {
  return `quest-step:${questId.slice('quest:'.length)}:${index}`;
}

function findStepIndex(quest: QuestDefinition, stepId: string | null): number {
  if (!stepId) {
    return -1;
  }

  return quest.steps.findIndex((_, index) => getQuestStepId(quest.id, index) === stepId);
}

function objectiveLabel(step: QuestStep): string {
  switch (step.type) {
    case 'talk-to-character':
      return `Talk to ${characterRegistry.get(step.characterId).name}`;
    case 'collect-item': {
      const item = itemRegistry.get(step.itemId);
      return `Find ${step.quantity} ${item.name}${step.quantity === 1 ? '' : 's'}`;
    }
    case 'unlock-discovery':
      return `Discover ${discoveryRegistry.get(step.discoveryId).name}`;
    case 'award-item':
    case 'set-world-flag':
      return 'A little surprise is happening…';
  }
}

export class QuestEngine {
  private readonly inventory: InventoryService;
  private readonly unsubscribe: Array<() => void> = [];

  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
    private readonly now: QuestClock = systemClock,
  ) {
    this.inventory = new InventoryService(saveService, events);
    this.unsubscribe.push(
      events.on('ITEM_COLLECTED', ({ itemId }) => this.handleItemCollected(itemId as ItemId)),
      events.on('CHARACTER_TALKED', ({ characterId }) =>
        this.handleCharacterTalked(characterId as CharacterId),
      ),
      events.on('DISCOVERY_UNLOCKED', ({ discoveryId }) =>
        this.handleDiscoveryUnlocked(discoveryId as DiscoveryId),
      ),
    );
  }

  public startQuest(questId: QuestId): QuestProgress {
    const quest = questRegistry.get(questId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const existing = save.quests.byQuestId[questId];
    if (existing?.status === 'completed') {
      return existing;
    }

    if (existing?.status === 'active') {
      this.processAutomaticSteps(questId);
      return this.getProgress(questId);
    }

    const firstStepId = quest.steps.length > 0 ? getQuestStepId(questId, 0) : null;
    const progress: QuestProgress = {
      status: quest.steps.length > 0 ? 'active' : 'completed',
      currentStepId: firstStepId,
      completedAt: quest.steps.length > 0 ? null : this.now(),
    };
    this.saveProgress(save, questId, progress);
    this.events.emit('QUEST_STARTED', { questId, stepId: firstStepId });

    if (firstStepId) {
      this.events.emit('QUEST_STEP_CHANGED', { questId, stepId: firstStepId });
      this.processAutomaticSteps(questId);
    } else {
      this.events.emit('QUEST_COMPLETED', { questId });
    }

    return this.getProgress(questId);
  }

  public getProgress(questId: QuestId): QuestProgress {
    questRegistry.get(questId);
    const save = this.saveService.load();
    return (
      save?.quests.byQuestId[questId] ?? {
        status: 'not-started',
        currentStepId: null,
        completedAt: null,
      }
    );
  }

  public getCurrentObjective(questId: QuestId): QuestObjective | null {
    const quest = questRegistry.get(questId);
    const progress = this.getProgress(questId);
    if (progress.status !== 'active') {
      return null;
    }

    const index = findStepIndex(quest, progress.currentStepId);
    if (index < 0) {
      return null;
    }

    return {
      questId,
      questName: quest.name,
      stepId: getQuestStepId(questId, index),
      label: objectiveLabel(quest.steps[index]),
    };
  }

  public notifyCharacterTalked(characterId: CharacterId): void {
    characterRegistry.get(characterId);
    this.events.emit('CHARACTER_TALKED', { characterId });
  }

  public destroy(): void {
    for (const unsubscribe of this.unsubscribe) {
      unsubscribe();
    }
    this.unsubscribe.length = 0;
  }

  private handleItemCollected(itemId: ItemId): void {
    for (const quest of questRegistry.values()) {
      const step = this.getActiveStep(quest);
      if (
        step?.type === 'collect-item' &&
        step.itemId === itemId &&
        this.inventory.hasItem(step.itemId, step.quantity)
      ) {
        this.advanceQuest(quest);
      }
    }
  }

  private handleCharacterTalked(characterId: CharacterId): void {
    for (const quest of questRegistry.values()) {
      const step = this.getActiveStep(quest);
      if (step?.type === 'talk-to-character' && step.characterId === characterId) {
        this.advanceQuest(quest);
      }
    }
  }

  private handleDiscoveryUnlocked(discoveryId: DiscoveryId): void {
    for (const quest of questRegistry.values()) {
      const step = this.getActiveStep(quest);
      if (step?.type === 'unlock-discovery' && step.discoveryId === discoveryId) {
        this.advanceQuest(quest);
      }
    }
  }

  private getActiveStep(quest: QuestDefinition): QuestStep | null {
    const progress = this.getProgress(quest.id);
    if (progress.status !== 'active') {
      return null;
    }
    const index = findStepIndex(quest, progress.currentStepId);
    return index >= 0 ? quest.steps[index] : null;
  }

  private advanceQuest(quest: QuestDefinition): void {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const progress = save.quests.byQuestId[quest.id];
    if (!progress || progress.status !== 'active') {
      return;
    }

    const currentIndex = findStepIndex(quest, progress.currentStepId);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= quest.steps.length) {
      const completed: QuestProgress = {
        status: 'completed',
        currentStepId: null,
        completedAt: this.now(),
      };
      this.saveProgress(save, quest.id, completed);
      this.events.emit('QUEST_COMPLETED', { questId: quest.id });
      return;
    }

    const nextStepId = getQuestStepId(quest.id, nextIndex);
    this.saveProgress(save, quest.id, {
      status: 'active',
      currentStepId: nextStepId,
      completedAt: null,
    });
    this.events.emit('QUEST_STEP_CHANGED', { questId: quest.id, stepId: nextStepId });
    this.processAutomaticSteps(quest.id);
  }

  private processAutomaticSteps(questId: QuestId): void {
    const quest = questRegistry.get(questId);

    while (true) {
      const step = this.getActiveStep(quest);
      if (!step) {
        return;
      }

      if (step.type === 'award-item') {
        this.inventory.addItem(step.itemId, step.quantity);
        this.advanceQuest(quest);
        continue;
      }

      if (step.type === 'set-world-flag') {
        const save = this.saveService.load() ?? this.saveService.createNewGame();
        this.saveService.save({
          ...save,
          world: {
            ...save.world,
            flags: {
              ...save.world.flags,
              [step.flagId]: step.value,
            },
          },
        });
        this.events.emit('WORLD_FLAG_CHANGED', { flagId: step.flagId, value: step.value });
        this.advanceQuest(quest);
        continue;
      }

      return;
    }
  }

  private saveProgress(save: SaveGame, questId: QuestId, progress: QuestProgress): void {
    this.saveService.save({
      ...save,
      quests: {
        ...save.quests,
        byQuestId: {
          ...save.quests.byQuestId,
          [questId]: progress,
        },
      },
    });
  }
}
