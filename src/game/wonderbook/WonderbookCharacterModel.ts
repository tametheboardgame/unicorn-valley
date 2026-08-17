import type { CharacterDefinition, CharacterId, FriendshipTier } from '../../content/contentTypes';
import {
  FRIENDSHIP_TIER_LABELS,
  type RelationshipService,
} from '../relationships/RelationshipService';

export interface WonderbookCharacterEntry {
  id: CharacterId;
  name: string;
  role: string;
  known: boolean;
  friendshipTier: FriendshipTier;
  friendshipLabel: string;
}

export function buildWonderbookCharacterEntries(
  characters: readonly CharacterDefinition[],
  relationships: RelationshipService,
): readonly WonderbookCharacterEntry[] {
  return characters.map((character) => {
    const friendshipTier = relationships.getTier(character.id);
    return {
      id: character.id,
      name: character.name,
      role: character.role,
      known: relationships.hasMet(character.id),
      friendshipTier,
      friendshipLabel: FRIENDSHIP_TIER_LABELS[friendshipTier],
    };
  });
}
