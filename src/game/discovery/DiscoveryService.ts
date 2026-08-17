import type { DiscoveryId } from '../../content/contentTypes';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';

export class DiscoveryService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public hasDiscovery(discoveryId: DiscoveryId): boolean {
    const save = this.saveService.load();
    return Boolean(
      save?.collections.discoveryIds.includes(discoveryId) ||
        save?.world.uniqueDiscoveryIds.includes(discoveryId),
    );
  }

  public unlockDiscovery(discoveryId: DiscoveryId, worldFlagId?: string): SaveGame {
    const current = this.saveService.load() ?? this.saveService.createNewGame();
    const alreadyUnlocked =
      current.collections.discoveryIds.includes(discoveryId) ||
      current.world.uniqueDiscoveryIds.includes(discoveryId);
    const discoveryIds = current.collections.discoveryIds.includes(discoveryId)
      ? current.collections.discoveryIds
      : [...current.collections.discoveryIds, discoveryId];
    const uniqueDiscoveryIds = current.world.uniqueDiscoveryIds.includes(discoveryId)
      ? current.world.uniqueDiscoveryIds
      : [...current.world.uniqueDiscoveryIds, discoveryId];

    const saved = this.saveService.save({
      ...current,
      collections: {
        ...current.collections,
        discoveryIds,
      },
      world: {
        ...current.world,
        uniqueDiscoveryIds,
        flags: worldFlagId
          ? {
              ...current.world.flags,
              [worldFlagId]: true,
            }
          : current.world.flags,
      },
    });

    if (!alreadyUnlocked) {
      this.events.emit('DISCOVERY_UNLOCKED', { discoveryId });
    }
    if (worldFlagId && current.world.flags[worldFlagId] !== true) {
      this.events.emit('WORLD_FLAG_CHANGED', { flagId: worldFlagId, value: true });
    }

    return saved;
  }
}
