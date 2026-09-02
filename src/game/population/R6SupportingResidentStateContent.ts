import {
  MAPLE_CAKE_READY_FLAG,
  TANSY_MAP_HUNT_ACTIVE_FLAG,
  TANSY_MAP_RESTORED_FLAG,
} from '../../content/r6VillageContent';
import type {
  ResidentStoryAnchorDefinition,
  ResidentTalkVariant,
  SupportingResidentId,
} from './AmbientPopulationTypes';

const WILLOW_GARDEN_PLANTED_FLAG = 'flag:willow-garden-planted';

export const R6_AMBIENT_RESIDENT_STORY_ANCHORS = [
  {
    id: 'resident-anchor:juniper:willow-garden',
    residentId: 'resident:juniper',
    sceneKey: 'MoonflowerGladeScene',
    position: { x: 1130, y: 1440 },
    interactionRadius: 120,
    activeWhen: {
      worldFlags: [{ id: WILLOW_GARDEN_PLANTED_FLAG, value: true }],
    },
  },
] as const satisfies readonly ResidentStoryAnchorDefinition[];

export const R6_SUPPORTING_RESIDENT_TALK_VARIANTS: Partial<
  Record<SupportingResidentId, readonly ResidentTalkVariant[]>
> = {
  'resident:juniper': [
    {
      id: 'resident-talk:juniper:willow-garden',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: WILLOW_GARDEN_PLANTED_FLAG, value: true }],
      },
      lines: [
        "Willow's moonflowers are doing brilliantly. I counted three tiny new buds!",
        'The garden smells different now. Sweet, but also a little bit sparkly.',
        'I am keeping watch for the first butterfly that notices the new flowers.',
      ],
    },
  ],
  'resident:tansy': [
    {
      id: 'resident-talk:tansy:map-restored',
      priority: 30,
      activeWhen: {
        worldFlags: [{ id: TANSY_MAP_RESTORED_FLAG, value: true }],
      },
      lines: [
        'The repaired map is pinned down with four bookmarks now. I am taking no chances.',
        'You found all three map corners in places I had walked past all week. Excellent noticing.',
        'I added tiny stars beside the places we have actually visited. The map is getting busy!',
      ],
    },
    {
      id: 'resident-talk:tansy:map-hunt',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: TANSY_MAP_HUNT_ACTIVE_FLAG, value: true }],
      },
      lines: [
        'Three missing corners. Notice board, Bakery, somewhere sunny. I am repeating that so I do not lose the clues too.',
        'The Story House clue table will always tell you which map corner we are looking for next.',
      ],
    },
  ],
  'resident:maple': [
    {
      id: 'resident-talk:maple:wobbly-cake-ready',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: MAPLE_CAKE_READY_FLAG, value: true }],
      },
      lines: [
        'Our Wobbly Cake leaned slightly to the left and tasted completely correct.',
        'The picnic-basket pattern is in the Bakery now. I gave it extra pockets for emergency buns.',
        'I still think “more sprinkles” is a valid answer to almost every baking question.',
      ],
    },
  ],
};
