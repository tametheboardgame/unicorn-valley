import type { SecretDiscoveryCondition, SecretDiscoveryDefinition } from '../../content/r4Secrets';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';
import { DiscoveryService } from './DiscoveryService';

export interface SecretDiscoveryResult {
  status: 'discovered' | 'already-discovered' | 'blocked';
  save: SaveGame;
}

export function isSecretConditionMet(condition: SecretDiscoveryCondition, save: SaveGame): boolean {
  if (condition.type === 'discovery') {
    const expected = condition.discovered ?? true;
    const actual =
      save.collections.discoveryIds.includes(condition.discoveryId) ||
      save.world.uniqueDiscoveryIds.includes(condition.discoveryId);
    return actual === expected;
  }

  if (condition.type === 'quest-status') {
    const actual = save.quests.byQuestId[condition.questId]?.status ?? 'not-started';
    return actual === condition.status;
  }

  return (save.world.flags[condition.flagId] ?? false) === condition.value;
}

export class SecretDiscoveryService {
  private readonly discoveries: DiscoveryService;

  public constructor(
    private readonly saveService: SaveService,
    events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {
    this.discoveries = new DiscoveryService(saveService, events);
  }

  public isDiscovered(definition: SecretDiscoveryDefinition): boolean {
    return this.discoveries.hasDiscovery(definition.discoveryId);
  }

  public isAvailable(definition: SecretDiscoveryDefinition): boolean {
    if (this.isDiscovered(definition)) {
      return false;
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return (definition.conditions ?? []).every((condition) =>
      isSecretConditionMet(condition, save),
    );
  }

  public listAvailable(
    definitions: readonly SecretDiscoveryDefinition[],
    sceneKey?: string,
  ): readonly SecretDiscoveryDefinition[] {
    return definitions.filter(
      (definition) =>
        (!sceneKey || definition.sceneKey === sceneKey) && this.isAvailable(definition),
    );
  }

  public discover(definition: SecretDiscoveryDefinition): SecretDiscoveryResult {
    const current = this.saveService.load() ?? this.saveService.createNewGame();
    if (this.isDiscovered(definition)) {
      return { status: 'already-discovered', save: current };
    }

    if (
      !(definition.conditions ?? []).every((condition) => isSecretConditionMet(condition, current))
    ) {
      return { status: 'blocked', save: current };
    }

    const saved = this.discoveries.unlockDiscovery(definition.discoveryId, definition.worldFlagId);
    return { status: 'discovered', save: saved };
  }
}
