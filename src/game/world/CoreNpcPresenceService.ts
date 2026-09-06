import type { CharacterId } from '../../content/contentTypes';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';
import { buildCottageHomeView } from '../home/CottageHomeView';
import { FriendVisitService } from '../home/FriendVisitService';
import { isMarigoldPicnicReady } from '../story/MarigoldPicnicStory';

export const NOVA_CHARACTER_ID = 'character:nova' as const;

export type CoreNpcPresenceActivity = 'race-hosting' | 'picnic' | 'cottage-visit';
export type CoreNpcPresenceArea = 'rainbow-run-hub' | 'picnic-hill' | 'moonflower-cottage';
export type CoreNpcPresenceRepresentation = 'canonical-unicorn';

export interface CoreNpcPresence {
  characterId: typeof NOVA_CHARACTER_ID;
  area: CoreNpcPresenceArea;
  activity: CoreNpcPresenceActivity;
  representation: CoreNpcPresenceRepresentation;
  availableForConcurrentActivity: false;
}

const NOVA_RACE_HUB_PRESENCE: CoreNpcPresence = {
  characterId: NOVA_CHARACTER_ID,
  area: 'rainbow-run-hub',
  activity: 'race-hosting',
  representation: 'canonical-unicorn',
  availableForConcurrentActivity: false,
};

const NOVA_PICNIC_PRESENCE: CoreNpcPresence = {
  characterId: NOVA_CHARACTER_ID,
  area: 'picnic-hill',
  activity: 'picnic',
  representation: 'canonical-unicorn',
  availableForConcurrentActivity: false,
};

const NOVA_COTTAGE_PRESENCE: CoreNpcPresence = {
  characterId: NOVA_CHARACTER_ID,
  area: 'moonflower-cottage',
  activity: 'cottage-visit',
  representation: 'canonical-unicorn',
  availableForConcurrentActivity: false,
};

export function resolveNovaPresence(
  save: SaveGame,
  currentCottageVisitorCharacterId: CharacterId | null,
): CoreNpcPresence {
  if (currentCottageVisitorCharacterId === NOVA_CHARACTER_ID) {
    return NOVA_COTTAGE_PRESENCE;
  }

  if (isMarigoldPicnicReady(save)) {
    return NOVA_PICNIC_PRESENCE;
  }

  return NOVA_RACE_HUB_PRESENCE;
}

/**
 * Authoritative recurring-character presence resolver.
 *
 * WP18F deliberately starts with Nova, whose race-host/picnic/cottage roles currently overlap.
 * New recurring characters can be added here when they have the same multi-system need rather
 * than building a full ambient life simulation for every NPC.
 */
export class CoreNpcPresenceService {
  public constructor(private readonly saveService: SaveService) {}

  public resolve(characterId: CharacterId): CoreNpcPresence | null {
    if (characterId !== NOVA_CHARACTER_ID) {
      return null;
    }

    const storedSave = this.saveService.load();
    const save = storedSave ?? this.saveService.createNewGame();
    const currentCottageVisitorCharacterId = storedSave
      ? (new FriendVisitService(this.saveService).resolveNextVisit(buildCottageHomeView(save))
          ?.definition.characterId ?? null)
      : null;

    return resolveNovaPresence(save, currentCottageVisitorCharacterId);
  }
}
