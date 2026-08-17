import { describe, expect, it } from 'vitest';
import { characterRegistry } from '../../content/registries';
import type { CharacterId } from '../../content/contentTypes';
import { selectDialogueVariant } from '../dialogue/DialogueConditions';
import { TypedEventBus, type GameEventMap } from '../events/GameEventBus';
import type { SaveRepository } from '../save/SaveRepository';
import { SaveService } from '../save/SaveService';
import { buildWonderbookCharacterEntries } from '../wonderbook/WonderbookCharacterModel';
import {
  MAX_FRIENDSHIP_POINTS,
  RelationshipService,
  getFriendshipTier,
  meetsFriendshipTier,
} from './RelationshipService';

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

describe('RelationshipService', () => {
  it('persists met state and friendship tiers across a fresh service instance', () => {
    const repository = new MemorySaveRepository();
    const relationships = new RelationshipService(new SaveService(repository));

    expect(relationships.hasMet('character:pip')).toBe(false);
    expect(relationships.getTier('character:pip')).toBe('just-met');
    relationships.markMet('character:pip');
    relationships.addFriendship('character:pip', 5);

    const reloaded = new RelationshipService(new SaveService(repository));
    expect(reloaded.hasMet('character:pip')).toBe(true);
    expect(reloaded.getRelationship('character:pip')).toEqual({
      friendshipPoints: 5,
      flags: [],
    });
    expect(reloaded.getTier('character:pip')).toBe('friend');
  });

  it('uses stable named tiers while keeping numeric progression internal', () => {
    expect(getFriendshipTier(0)).toBe('just-met');
    expect(getFriendshipTier(5)).toBe('friend');
    expect(getFriendshipTier(15)).toBe('good-friend');
    expect(getFriendshipTier(30)).toBe('best-friend');
    expect(meetsFriendshipTier('good-friend', 'friend')).toBe(true);
    expect(meetsFriendshipTier('friend', 'good-friend')).toBe(false);
  });

  it('emits relationship changes, caps progression and rejects unsafe changes', () => {
    const repository = new MemorySaveRepository();
    const bus = new TypedEventBus<GameEventMap>();
    const relationships = new RelationshipService(new SaveService(repository, bus), bus);
    const events: GameEventMap['RELATIONSHIP_CHANGED'][] = [];
    bus.on('RELATIONSHIP_CHANGED', (event) => events.push(event));

    relationships.addFriendship('character:willow', 15);
    relationships.addFriendship('character:willow', 100);
    relationships.addFriendship('character:willow', 1);

    expect(relationships.getRelationship('character:willow').friendshipPoints).toBe(
      MAX_FRIENDSHIP_POINTS,
    );
    expect(events).toEqual([
      {
        characterId: 'character:willow',
        friendshipPoints: 15,
        friendshipTier: 'good-friend',
      },
      {
        characterId: 'character:willow',
        friendshipPoints: MAX_FRIENDSHIP_POINTS,
        friendshipTier: 'best-friend',
      },
    ]);
    expect(() => relationships.addFriendship('character:willow', 0)).toThrow('positive integer');
    expect(() => relationships.addFriendship('character:not-real' as CharacterId, 1)).toThrow(
      'Unknown character ID',
    );
  });

  it('stores relationship flags idempotently', () => {
    const repository = new MemorySaveRepository();
    const relationships = new RelationshipService(new SaveService(repository));

    relationships.addFlag('character:willow', 'moonflowers-planted');
    relationships.addFlag('character:willow', 'moonflowers-planted');

    expect(relationships.getRelationship('character:willow').flags).toEqual([
      'moonflowers-planted',
    ]);
    expect(() => relationships.addFlag('character:willow', '   ')).toThrow('cannot be empty');
  });

  it('selects dialogue variants using friendship tier conditions', () => {
    const repository = new MemorySaveRepository();
    const relationships = new RelationshipService(new SaveService(repository));
    const variants = [
      {
        dialogueId: 'dialogue:pip-first-discovery' as const,
        conditions: [
          {
            type: 'minimum-friendship-tier' as const,
            characterId: 'character:pip' as const,
            tier: 'good-friend' as const,
          },
        ],
      },
      { dialogueId: 'dialogue:pip-welcome' as const },
    ];

    expect(selectDialogueVariant(variants, relationships)?.id).toBe('dialogue:pip-welcome');
    relationships.addFriendship('character:pip', 15);
    expect(selectDialogueVariant(variants, relationships)?.id).toBe('dialogue:pip-first-discovery');
  });

  it('builds Wonderbook character entries without exposing friendship points', () => {
    const repository = new MemorySaveRepository();
    const relationships = new RelationshipService(new SaveService(repository));
    relationships.markMet('character:pip');
    relationships.addFriendship('character:pip', 5);

    const entries = buildWonderbookCharacterEntries(characterRegistry.values(), relationships);
    const pip = entries.find((entry) => entry.id === 'character:pip');
    const willow = entries.find((entry) => entry.id === 'character:willow');

    expect(pip).toMatchObject({
      known: true,
      friendshipTier: 'friend',
      friendshipLabel: 'Friend',
    });
    expect(willow).toMatchObject({
      known: false,
      friendshipTier: 'just-met',
      friendshipLabel: 'Just Met',
    });
    expect(pip).not.toHaveProperty('friendshipPoints');
  });
});
