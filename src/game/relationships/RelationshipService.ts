import { characterRegistry } from '../../content/registries';
import type { CharacterId, FriendshipTier } from '../../content/contentTypes';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';
import type { RelationshipProgress, SaveGame } from '../save/saveSchema';

export const MAX_FRIENDSHIP_POINTS = 100;

const FRIENDSHIP_TIER_THRESHOLDS: readonly [FriendshipTier, number][] = [
  ['best-friend', 30],
  ['good-friend', 15],
  ['friend', 5],
  ['just-met', 0],
];

export const FRIENDSHIP_TIER_LABELS: Readonly<Record<FriendshipTier, string>> = {
  'just-met': 'Just Met',
  friend: 'Friend',
  'good-friend': 'Good Friend',
  'best-friend': 'Best Friend',
};

const DEFAULT_RELATIONSHIP: RelationshipProgress = {
  friendshipPoints: 0,
  flags: [],
};

export function getFriendshipTier(friendshipPoints: number): FriendshipTier {
  const safePoints = Math.max(0, Math.min(MAX_FRIENDSHIP_POINTS, friendshipPoints));
  return (
    FRIENDSHIP_TIER_THRESHOLDS.find(([, threshold]) => safePoints >= threshold)?.[0] ?? 'just-met'
  );
}

export function meetsFriendshipTier(
  currentTier: FriendshipTier,
  minimumTier: FriendshipTier,
): boolean {
  const rank: Readonly<Record<FriendshipTier, number>> = {
    'just-met': 0,
    friend: 1,
    'good-friend': 2,
    'best-friend': 3,
  };
  return rank[currentTier] >= rank[minimumTier];
}

export class RelationshipService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public hasMet(characterId: CharacterId): boolean {
    characterRegistry.get(characterId);
    return Boolean(this.saveService.load()?.relationships.byCharacterId[characterId]);
  }

  public markMet(characterId: CharacterId): RelationshipProgress {
    characterRegistry.get(characterId);
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const current = save.relationships.byCharacterId[characterId];
    if (current) {
      return this.copyProgress(current);
    }

    const next = this.copyProgress(DEFAULT_RELATIONSHIP);
    this.saveRelationship(save, characterId, next);
    return next;
  }

  public getRelationship(characterId: CharacterId): RelationshipProgress {
    characterRegistry.get(characterId);
    const stored = this.saveService.load()?.relationships.byCharacterId[characterId];
    return this.copyProgress(stored ?? DEFAULT_RELATIONSHIP);
  }

  public getTier(characterId: CharacterId): FriendshipTier {
    return getFriendshipTier(this.getRelationship(characterId).friendshipPoints);
  }

  public meetsTier(characterId: CharacterId, minimumTier: FriendshipTier): boolean {
    return meetsFriendshipTier(this.getTier(characterId), minimumTier);
  }

  public addFriendship(characterId: CharacterId, amount: number): RelationshipProgress {
    characterRegistry.get(characterId);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new Error(`Friendship increase must be a positive integer. Received: ${amount}`);
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const current = save.relationships.byCharacterId[characterId] ?? DEFAULT_RELATIONSHIP;
    const friendshipPoints = Math.min(MAX_FRIENDSHIP_POINTS, current.friendshipPoints + amount);
    const next: RelationshipProgress = {
      friendshipPoints,
      flags: [...current.flags],
    };

    if (friendshipPoints === current.friendshipPoints) {
      return next;
    }

    this.saveRelationship(save, characterId, next);
    this.events.emit('RELATIONSHIP_CHANGED', {
      characterId,
      friendshipPoints,
      friendshipTier: getFriendshipTier(friendshipPoints),
    });

    return next;
  }

  public addFlag(characterId: CharacterId, flag: string): RelationshipProgress {
    characterRegistry.get(characterId);
    const trimmed = flag.trim();
    if (!trimmed) {
      throw new Error('Relationship flag cannot be empty.');
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const current = save.relationships.byCharacterId[characterId] ?? DEFAULT_RELATIONSHIP;
    if (current.flags.includes(trimmed)) {
      return this.copyProgress(current);
    }

    const next: RelationshipProgress = {
      friendshipPoints: current.friendshipPoints,
      flags: [...current.flags, trimmed],
    };
    this.saveRelationship(save, characterId, next);
    return next;
  }

  private saveRelationship(
    save: SaveGame,
    characterId: CharacterId,
    progress: RelationshipProgress,
  ): void {
    this.saveService.save({
      ...save,
      relationships: {
        ...save.relationships,
        byCharacterId: {
          ...save.relationships.byCharacterId,
          [characterId]: progress,
        },
      },
    });
  }

  private copyProgress(progress: RelationshipProgress): RelationshipProgress {
    return {
      friendshipPoints: progress.friendshipPoints,
      flags: [...progress.flags],
    };
  }
}
