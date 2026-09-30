import type { CharacterId } from '../../content/contentTypes';
import { MARIGOLD_CHARACTER_ID } from '../../content/r4PicnicEvent';
import { buildCottageHomeView } from '../home/CottageHomeView';
import { FriendVisitService } from '../home/FriendVisitService';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';
import { isMarigoldPicnicReady } from '../story/MarigoldPicnicStory';

export const NOVA_CHARACTER_ID = 'character:nova' as const;

export type NovaPresenceArea = 'rainbow-run-hub' | 'picnic-hill' | 'moonflower-cottage';
export type MarigoldPresenceArea = 'sunbeam-village' | 'picnic-hill';
export type CoreNpcPresenceArea = NovaPresenceArea | MarigoldPresenceArea;
export type CoreNpcPresenceActivity =
  | 'race-hosting'
  | 'picnic'
  | 'cottage-visit'
  | 'village-resident';
export type CoreNpcPresenceRepresentation = 'canonical-unicorn';

export interface CoreNpcPresence {
  characterId: typeof NOVA_CHARACTER_ID | typeof MARIGOLD_CHARACTER_ID;
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

const MARIGOLD_VILLAGE_PRESENCE: CoreNpcPresence = {
  characterId: MARIGOLD_CHARACTER_ID,
  area: 'sunbeam-village',
  activity: 'village-resident',
  representation: 'canonical-unicorn',
  availableForConcurrentActivity: false,
};

const MARIGOLD_PICNIC_PRESENCE: CoreNpcPresence = {
  characterId: MARIGOLD_CHARACTER_ID,
  area: 'picnic-hill',
  activity: 'picnic',
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

export function resolveMarigoldPresence(save: SaveGame): CoreNpcPresence {
  return isMarigoldPicnicReady(save) ? MARIGOLD_PICNIC_PRESENCE : MARIGOLD_VILLAGE_PRESENCE;
}

/**
 * Authoritative recurring-character presence resolver.
 *
 * Only characters with genuinely competing scene/story owners belong here. Nova established the
 * pattern for race/picnic/cottage conflicts; Marigold joins it because the picnic story explicitly
 * moves her from Sunbeam Village to Picnic Hill. Ambient residents such as Tansy keep their
 * existing routine authority when that system already owns every physical placement.
 */
export class CoreNpcPresenceService {
  public constructor(private readonly saveService: SaveService) {}

  public resolve(characterId: CharacterId): CoreNpcPresence | null {
    const storedSave = this.saveService.load();
    const save = storedSave ?? this.saveService.createNewGame();

    if (characterId === MARIGOLD_CHARACTER_ID) {
      return resolveMarigoldPresence(save);
    }

    if (characterId !== NOVA_CHARACTER_ID) {
      return null;
    }

    const currentCottageVisitorCharacterId = storedSave
      ? (new FriendVisitService(this.saveService).resolveNextVisit(buildCottageHomeView(save))
          ?.definition.characterId ?? null)
      : null;

    return resolveNovaPresence(save, currentCottageVisitorCharacterId);
  }
}
