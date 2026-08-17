import type { FriendshipTier } from '../../content/contentTypes';

export interface GameEventMap {
  ITEM_COLLECTED: { itemId: string; quantity: number };
  CHARACTER_TALKED: { characterId: string };
  QUEST_STARTED: { questId: string; stepId: string | null };
  QUEST_STEP_CHANGED: { questId: string; stepId: string };
  QUEST_COMPLETED: { questId: string };
  RELATIONSHIP_CHANGED: {
    characterId: string;
    friendshipPoints: number;
    friendshipTier: FriendshipTier;
  };
  WORLD_FLAG_CHANGED: { flagId: string; value: boolean };
  RACE_FINISHED: { raceId: string; finishTimeMs: number };
  DISCOVERY_UNLOCKED: { discoveryId: string };
  SAVE_COMPLETED: { schemaVersion: number; savedAt: string };
}

export type EventListener<TPayload> = (payload: TPayload) => void;

export class TypedEventBus<TEvents extends object> {
  private readonly listeners = new Map<keyof TEvents, Set<EventListener<unknown>>>();

  public on<TKey extends keyof TEvents>(
    eventName: TKey,
    listener: EventListener<TEvents[TKey]>,
  ): () => void {
    const wrappedListener: EventListener<unknown> = (payload) => {
      listener(payload as TEvents[TKey]);
    };

    const eventListeners = this.listeners.get(eventName) ?? new Set<EventListener<unknown>>();
    eventListeners.add(wrappedListener);
    this.listeners.set(eventName, eventListeners);

    return () => {
      eventListeners.delete(wrappedListener);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    };
  }

  public emit<TKey extends keyof TEvents>(eventName: TKey, payload: TEvents[TKey]): void {
    const eventListeners = this.listeners.get(eventName);
    if (!eventListeners) {
      return;
    }

    for (const listener of [...eventListeners]) {
      listener(payload);
    }
  }

  public clear(): void {
    this.listeners.clear();
  }
}

export const gameEventBus = new TypedEventBus<GameEventMap>();
