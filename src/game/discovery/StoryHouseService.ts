import { STARWELL_DISCOVERY_ID } from '../../content/r5LumiWoodsStory';
import {
  TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_MAP_RESTORED_FLAG,
  TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID,
  TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID,
} from '../../content/r6VillageContent';
import type { SaveService } from '../save/SaveService';
import type { SaveGame } from '../save/saveSchema';

export interface StoryHouseCard {
  id: string;
  title: string;
  icon: string;
  text: string;
  unlocked: boolean;
  read: boolean;
}

interface StoryHouseCardDefinition {
  id: string;
  title: string;
  icon: string;
  text: string;
  unlockedWhen: (save: SaveGame) => boolean;
}

const MEMORY_PREFIX = 'memory:story-house:';

const CARD_DEFINITIONS: readonly StoryHouseCardDefinition[] = [
  {
    id: 'welcome-to-sunbeam',
    title: 'Welcome to Sunbeam',
    icon: '☀️',
    text: 'The Story House keeps little notes about places you have really visited. Tansy says maps are stories with choices.',
    unlockedWhen: () => true,
  },
  {
    id: 'moonflowers-after-help',
    title: 'Moonflowers Remember',
    icon: '🌙',
    text: 'Willow wrote that Moonflowers grow brightest when somebody stops to notice what they need.',
    unlockedWhen: (save) => save.quests.byQuestId['quest:willows-moonflowers']?.status === 'completed',
  },
  {
    id: 'rainbow-run-scrapbook',
    title: 'A Finish Worth Celebrating',
    icon: '🎀',
    text: 'Nova keeps every finish ribbon, not only the fastest ones. Reaching the end is part of the story too.',
    unlockedWhen: (save) => save.quests.byQuestId['quest:nova-first-race']?.status === 'completed',
  },
  {
    id: 'brook-song-notes',
    title: 'The Brook Sings Back',
    icon: '🎵',
    text: 'Ripple says the Brook never plays exactly the same song twice, because the water is always moving.',
    unlockedWhen: (save) => save.quests.byQuestId['quest:ripple-brook-song']?.status === 'completed',
  },
  {
    id: 'starwell-page',
    title: 'A Page Full of Stars',
    icon: '🌌',
    text: 'Lumi left one page almost empty. Tilt it in the light and tiny Starwell dots appear between the words.',
    unlockedWhen: (save) =>
      save.collections.discoveryIds.includes(STARWELL_DISCOVERY_ID) ||
      save.world.uniqueDiscoveryIds.includes(STARWELL_DISCOVERY_ID),
  },
];

function memoryId(cardId: string): string {
  return `${MEMORY_PREFIX}${cardId}`;
}

function hasDiscovery(save: SaveGame, discoveryId: string): boolean {
  return (
    save.collections.discoveryIds.includes(discoveryId) ||
    save.world.uniqueDiscoveryIds.includes(discoveryId)
  );
}

export class StoryHouseService {
  public constructor(private readonly saveService: SaveService) {}

  public listCards(): readonly StoryHouseCard[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return CARD_DEFINITIONS.map((definition) => ({
      id: definition.id,
      title: definition.title,
      icon: definition.icon,
      text: definition.text,
      unlocked: definition.unlockedWhen(save),
      read: save.collections.memoryIds.includes(memoryId(definition.id)),
    }));
  }

  public readCard(cardId: string): StoryHouseCard | null {
    const card = this.listCards().find((candidate) => candidate.id === cardId);
    if (!card?.unlocked) {
      return null;
    }
    if (!card.read) {
      const save = this.saveService.load() ?? this.saveService.createNewGame();
      this.saveService.save({
        ...save,
        collections: {
          ...save.collections,
          memoryIds: [...save.collections.memoryIds, memoryId(cardId)],
        },
      });
    }
    return { ...card, read: true };
  }

  public getWonderbookSummary(): string {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const discoveryCount = new Set([
      ...save.collections.discoveryIds,
      ...save.world.uniqueDiscoveryIds,
    ]).size;
    const cards = this.listCards().filter(({ unlocked }) => unlocked);
    const unread = cards.filter(({ read }) => !read).length;
    return `${discoveryCount} discoveries have reached the Story House. ${unread === 0 ? 'Tansy has no new story cards right now.' : `${unread} story card${unread === 1 ? '' : 's'} waiting to be read.`}`;
  }

  public getCurrentClue(): string {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    if (save.world.flags[TANSY_MAP_RESTORED_FLAG]) {
      return 'Tansy’s repaired map is pinned proudly above the map table. The three corners fit perfectly.';
    }
    if (!save.world.flags[TANSY_MAP_HUNT_ACTIVE_FLAG]) {
      return 'Tansy has a rolled-up valley map on the table. Talk to her if you want to know why three corners are missing.';
    }
    if (!hasDiscovery(save, TANSY_NOTICE_MAP_CORNER_DISCOVERY_ID)) {
      return 'First clue: check somewhere the Village pins notices for everyone to read.';
    }
    if (!hasDiscovery(save, TANSY_BAKERY_MAP_CORNER_DISCOVERY_ID)) {
      return 'Second clue: Maple remembers a suspiciously papery bookmark on the Bakery recipe shelf.';
    }
    if (!hasDiscovery(save, TANSY_SUNDIAL_MAP_CORNER_DISCOVERY_ID)) {
      return 'Last clue: Tansy saw something flutter towards the sunny little dial in the square.';
    }
    return 'All three corners are found. Bring them back to Tansy at the Story House.';
  }
}
