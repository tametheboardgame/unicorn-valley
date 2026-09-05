import type { DiscoveryDefinition } from '../../content/contentTypes';
import {
  BAKERY_OUTCOMES,
  BEACHCOMBING_OUTCOMES,
  CORAL_BEACHCOMBING_ACTIVITY_ID,
  MAPLE_BAKING_ACTIVITY_ID,
} from '../../content/r65RepeatableActivities';
import {
  MOONCAP_TRAIL_RACE_ID,
  MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID,
  PETAL_PARADE_RACE_ID,
  PETAL_PARADE_RIBBONS_DISCOVERY_ID,
  SHORELINE_SURGE_RACE_ID,
  SHORELINE_SURGE_RIBBONS_DISCOVERY_ID,
} from '../../content/r65RaceExpansion';
import { R65_CROSS_REGION_FOLLOW_UP_DISCOVERIES } from '../../content/r65CrossRegionFollowUp';
import { R65_STARLIGHT_BEACH_DISCOVERIES } from '../../content/r65StarlightBeach';
import { R5_CRYSTAL_BROOK_DISCOVERIES } from '../../content/r5CrystalBrook';
import { R5_CRYSTAL_BROOK_STORY_DISCOVERIES } from '../../content/r5CrystalBrookStory';
import { R5_FIREFLY_LANTERN_DISCOVERIES } from '../../content/r5FireflyLantern';
import { R5_LUMI_DISCOVERIES } from '../../content/r5LumiWoodsStory';
import { CRYSTAL_CASCADE_RACE_ID } from '../../content/r5RaceIds';
import { R5_WHISPERING_WOODS_DISCOVERIES } from '../../content/r5WhisperingWoods';
import { SUNRISE_SPRINT_RACE_ID } from '../../content/r3RaceIds';
import { R6_CRYSTAL_BROOK_DEPTH_DISCOVERIES } from '../../content/r6CrystalBrookDepthContent';
import { R6_GLADE_HOME_DISCOVERIES } from '../../content/r6GladeHomeContent';
import { R6_MEADOW_RUN_DISCOVERIES } from '../../content/r6MeadowRunContent';
import { R6_VILLAGE_DISCOVERIES } from '../../content/r6VillageContent';
import { R6_WHISPERING_WOODS_DEPTH_DISCOVERIES } from '../../content/r6WhisperingWoodsDepthContent';
import {
  FIREFLY_LANTERN_ACTIVITY_ID,
  FIREFLY_LANTERN_ENDLESS_ACTIVITY_ID,
  FIREFLY_LANTERN_MULTICOLOUR_ACTIVITY_ID,
} from '../activities/FireflyLanternActivity';
import type { SaveGame } from '../save/saveSchema';

export const WONDERBOOK_PROGRESS_ENTRIES_PER_PAGE = 2;

export interface WonderbookRegionEntry {
  id: string;
  name: string;
  hiddenName: string;
  icon: string;
  description: string;
  hint: string;
  revealed: boolean;
  discoveredCount: number;
  collectionLine?: string;
}

export interface WonderbookRaceEntry {
  id: string;
  name: string;
  icon: string;
  finished: boolean;
  ribbonCount: number;
  progressText: string;
  hint: string;
}

export interface WonderbookGoalEntry {
  id: string;
  name: string;
  icon: string;
  description: string;
  current: number;
  target: number;
  complete: boolean;
  progressText: string;
  hint: string;
}

export interface WonderbookProgressSpread<T> {
  index: number;
  leftPageNumber: number;
  rightPageNumber: number;
  left: readonly T[];
  right: readonly T[];
}

interface RegionDefinition {
  id: string;
  name: string;
  hiddenName: string;
  icon: string;
  description: string;
  hint: string;
  discoveryIds: readonly string[];
  alwaysRevealed?: boolean;
  collectionLine?: (save: SaveGame) => string | undefined;
}

interface RaceDefinition {
  id: string;
  name: string;
  icon: string;
  hint: string;
}

function discoveryIds(definitions: readonly DiscoveryDefinition[]): readonly string[] {
  return definitions.map(({ id }) => id);
}

function uniqueIds(...groups: readonly (readonly string[])[]): readonly string[] {
  return [...new Set(groups.flat())];
}

function boundedRecord(save: SaveGame, recordId: string, maximum: number): number {
  const value = save.activities.miniGameRecords[recordId] ?? 0;
  return Math.max(0, Math.min(maximum, Math.floor(value)));
}

function hasPlayedFireflyLantern(save: SaveGame): boolean {
  return [
    FIREFLY_LANTERN_ACTIVITY_ID,
    FIREFLY_LANTERN_MULTICOLOUR_ACTIVITY_ID,
    FIREFLY_LANTERN_ENDLESS_ACTIVITY_ID,
  ].some((recordId) => (save.activities.miniGameRecords[recordId] ?? 0) > 0);
}

const REGION_DEFINITIONS: readonly RegionDefinition[] = [
  {
    id: 'region:moonflower-glade',
    name: 'Moonflower Glade & Cottage',
    hiddenName: 'Moonflower Glade & Cottage',
    icon: '🌙',
    description:
      'Home, Moonflower Bridge and the little secrets that make the Glade feel lived in.',
    hint: 'There is always another small thing worth noticing near home.',
    discoveryIds: discoveryIds(R6_GLADE_HOME_DISCOVERIES),
    alwaysRevealed: true,
  },
  {
    id: 'region:sunbeam-village',
    name: 'Sunbeam Village',
    hiddenName: 'A sunny village...',
    icon: '☀️',
    description: 'Busy shops, resident stories and Maple’s colourful baking table.',
    hint: 'A bright village is waiting beyond the Glade.',
    discoveryIds: uniqueIds(
      discoveryIds(R6_VILLAGE_DISCOVERIES),
      BAKERY_OUTCOMES.map(({ discoveryId }) => discoveryId),
    ),
    collectionLine: (save) =>
      `Cake styles ${boundedRecord(save, MAPLE_BAKING_ACTIVITY_ID, BAKERY_OUTCOMES.length)} of ${BAKERY_OUTCOMES.length}`,
  },
  {
    id: 'region:rainbow-meadow',
    name: 'Rainbow Meadow & Run',
    hiddenName: 'A rainbow-bright place...',
    icon: '🌈',
    description: 'Picnic hills, a windmill lookout and playful races with room to wander.',
    hint: 'Follow the colour beyond the village and see what is happening away from the race gate.',
    discoveryIds: uniqueIds(discoveryIds(R6_MEADOW_RUN_DISCOVERIES), [
      PETAL_PARADE_RIBBONS_DISCOVERY_ID,
    ]),
  },
  {
    id: 'region:crystal-brook',
    name: 'Crystal Brook & Grotto',
    hiddenName: 'A sparkling stream...',
    icon: '💎',
    description: 'Reactive crystals, water reflections, a hidden grotto and Crystal Cascade.',
    hint: 'Somewhere in the valley, water and crystals answer curiosity with light and sound.',
    discoveryIds: uniqueIds(
      discoveryIds(R5_CRYSTAL_BROOK_DISCOVERIES),
      discoveryIds(R5_CRYSTAL_BROOK_STORY_DISCOVERIES),
      discoveryIds(R6_CRYSTAL_BROOK_DEPTH_DISCOVERIES),
    ),
  },
  {
    id: 'region:whispering-woods',
    name: 'Whispering Woods',
    hiddenName: 'A whispering path...',
    icon: '🍄',
    description: 'Friendly mystery, glowing mushrooms, Lumi’s clues and the Firefly Lantern grove.',
    hint: 'A leafy path hides gentle mysteries for unicorns who like looking closely.',
    discoveryIds: uniqueIds(
      discoveryIds(R5_WHISPERING_WOODS_DISCOVERIES),
      discoveryIds(R5_LUMI_DISCOVERIES),
      discoveryIds(R5_FIREFLY_LANTERN_DISCOVERIES),
      discoveryIds(R6_WHISPERING_WOODS_DEPTH_DISCOVERIES),
      [MOONCAP_TRAIL_RIBBONS_DISCOVERY_ID],
    ),
    collectionLine: (save) =>
      hasPlayedFireflyLantern(save)
        ? 'Firefly Lantern played ✨'
        : 'A lantern activity is still waiting',
  },
  {
    id: 'region:starlight-beach',
    name: 'Starlight Beach',
    hiddenName: 'A moonlit shore...',
    icon: '🐚',
    description:
      'Shell Cove, Moonlit Point, Coral’s notebook, Skipper’s course and a light linked to the Starwell.',
    hint: 'One valley path eventually reaches a shore where moonlight meets the sea.',
    discoveryIds: uniqueIds(
      discoveryIds(R65_STARLIGHT_BEACH_DISCOVERIES),
      discoveryIds(R65_CROSS_REGION_FOLLOW_UP_DISCOVERIES),
      BEACHCOMBING_OUTCOMES.map(({ discoveryId }) => discoveryId),
      [SHORELINE_SURGE_RIBBONS_DISCOVERY_ID],
    ),
    collectionLine: (save) =>
      `Beach notebook ${boundedRecord(save, CORAL_BEACHCOMBING_ACTIVITY_ID, BEACHCOMBING_OUTCOMES.length)} of ${BEACHCOMBING_OUTCOMES.length}`,
  },
];

const RACE_DEFINITIONS: readonly RaceDefinition[] = [
  {
    id: SUNRISE_SPRINT_RACE_ID,
    name: 'Sunrise Sprint',
    icon: '🌅',
    hint: 'Rainbow Run has a bright first regular course when you feel like racing.',
  },
  {
    id: CRYSTAL_CASCADE_RACE_ID,
    name: 'Crystal Cascade',
    icon: '💎',
    hint: 'A crystal course opens after the earlier Rainbow Run story and race progress.',
  },
  {
    id: PETAL_PARADE_RACE_ID,
    name: 'Petal Parade',
    icon: '🌸',
    hint: 'The Meadow has a flower-marked Rainbow Cup course.',
  },
  {
    id: MOONCAP_TRAIL_RACE_ID,
    name: 'Mooncap Trail',
    icon: '🍄',
    hint: 'A woodland course waits after you have explored Whispering Woods.',
  },
  {
    id: SHORELINE_SURGE_RACE_ID,
    name: 'Shoreline Surge',
    icon: '🌊',
    hint: 'Skipper has a dunes-to-Moonlit-Point course at Starlight Beach.',
  },
];

export function buildWonderbookRegionEntries(save: SaveGame): readonly WonderbookRegionEntry[] {
  const found = new Set(save.collections.discoveryIds);

  return REGION_DEFINITIONS.map((region) => {
    const discoveredCount = region.discoveryIds.filter((id) => found.has(id)).length;
    return {
      id: region.id,
      name: region.name,
      hiddenName: region.hiddenName,
      icon: region.icon,
      description: region.description,
      hint: region.hint,
      revealed: region.alwaysRevealed === true || discoveredCount > 0,
      discoveredCount,
      collectionLine: region.collectionLine?.(save),
    };
  });
}

export function buildWonderbookRaceEntries(save: SaveGame): readonly WonderbookRaceEntry[] {
  return RACE_DEFINITIONS.map((race) => {
    const record = save.activities.racesById[race.id];
    const ribbonCount = record?.ribbonIds.length ?? 0;
    const finished = record?.bestTimeMs != null || ribbonCount > 0;
    return {
      ...race,
      finished,
      ribbonCount,
      progressText: finished
        ? ribbonCount > 0
          ? `Finished · ${ribbonCount} ribbon${ribbonCount === 1 ? '' : 's'} remembered`
          : 'Finished · every finish counts'
        : 'Ready whenever racing sounds fun',
    };
  });
}

export function buildWonderbookGoalEntries(
  save: SaveGame,
  options: {
    knownFriends: number;
    totalFriends: number;
    regions?: readonly WonderbookRegionEntry[];
    races?: readonly WonderbookRaceEntry[];
  },
): readonly WonderbookGoalEntry[] {
  const regions = options.regions ?? buildWonderbookRegionEntries(save);
  const races = options.races ?? buildWonderbookRaceEntries(save);
  const exploredRegions = regions.filter(({ revealed }) => revealed).length;
  const finishedRaces = races.filter(({ finished }) => finished).length;
  const friendshipTarget = Math.max(1, Math.min(6, options.totalFriends));
  const curiosityTarget = 12;
  const curiosityCount = Math.min(curiosityTarget, save.collections.discoveryIds.length);

  return [
    {
      id: 'goal:valley-explorer',
      name: 'Valley Explorer',
      icon: '🗺️',
      description:
        'Fill the map in your head by finding something memorable in each big part of the valley.',
      current: exploredRegions,
      target: regions.length,
      complete: exploredRegions >= regions.length,
      progressText: `${exploredRegions} of ${regions.length} places remembered`,
      hint: 'No rush. A new place counts as soon as it gives you one real memory.',
    },
    {
      id: 'goal:friendship-garden',
      name: 'Friendship Garden',
      icon: '💛',
      description:
        'Meet valley residents and let friendships grow naturally through stories and return visits.',
      current: Math.min(friendshipTarget, options.knownFriends),
      target: friendshipTarget,
      complete: options.knownFriends >= friendshipTarget,
      progressText: `${options.knownFriends} friend${options.knownFriends === 1 ? '' : 's'} met`,
      hint: 'Friends appear through ordinary play. You never need to chase everyone at once.',
    },
    {
      id: 'goal:ribbon-journey',
      name: 'Ribbon Journey',
      icon: '🎀',
      description: 'Try every regular valley race course. Finishing matters; first place does not.',
      current: finishedRaces,
      target: races.length,
      complete: finishedRaces >= races.length,
      progressText: `${finishedRaces} of ${races.length} regular courses finished`,
      hint: 'Race when you want a burst of speed. Every finish counts towards the Rainbow Cup.',
    },
    {
      id: 'goal:curiosity-cabinet',
      name: 'Curiosity Cabinet',
      icon: '✨',
      description: `Your book already holds ${save.collections.discoveryIds.length} discoveries and ${save.collections.memoryIds.length} saved memories.`,
      current: curiosityCount,
      target: curiosityTarget,
      complete: save.collections.discoveryIds.length >= curiosityTarget,
      progressText: `${save.collections.discoveryIds.length} wonders noticed`,
      hint: 'Tap, inspect, revisit and try activities when something looks interesting.',
    },
  ];
}

export function paginateWonderbookProgress<T>(
  entries: readonly T[],
  entriesPerPage = WONDERBOOK_PROGRESS_ENTRIES_PER_PAGE,
): readonly WonderbookProgressSpread<T>[] {
  const safeEntriesPerPage = Math.max(1, Math.floor(entriesPerPage));
  const entriesPerSpread = safeEntriesPerPage * 2;
  const spreads: WonderbookProgressSpread<T>[] = [];

  for (let offset = 0; offset < entries.length; offset += entriesPerSpread) {
    const index = spreads.length;
    const spreadEntries = entries.slice(offset, offset + entriesPerSpread);
    spreads.push({
      index,
      leftPageNumber: index * 2 + 1,
      rightPageNumber: index * 2 + 2,
      left: spreadEntries.slice(0, safeEntriesPerPage),
      right: spreadEntries.slice(safeEntriesPerPage),
    });
  }

  if (spreads.length === 0) {
    spreads.push({
      index: 0,
      leftPageNumber: 1,
      rightPageNumber: 2,
      left: [],
      right: [],
    });
  }

  return spreads;
}
