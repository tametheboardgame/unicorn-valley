import {
  BEACH_RACE_ROUTE_READY_FLAG,
  CORAL_SHELL_STORIES_ACTIVE_FLAG,
  CORAL_SHELL_STORIES_COMPLETE_FLAG,
  SKIPPER_WIND_STORY_ACTIVE_FLAG,
} from '../../content/r65StarlightBeach';
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
import { R6_MEADOW_RESIDENT_TALK_VARIANTS } from './R6MeadowPopulationContent';

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

const BASE_RESIDENT_TALK_VARIANTS: Partial<
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
  'resident:coral': [
    {
      id: 'resident-talk:coral:shell-stories-complete',
      priority: 30,
      activeWhen: {
        worldFlags: [{ id: CORAL_SHELL_STORIES_COMPLETE_FLAG, value: true }],
      },
      lines: [
        'Our three-shell story is still sitting at Shell Cove. The tide has not managed to edit it yet.',
        'The beachcombing basket is ready whenever you fancy another slow look along the shore.',
        'Twinkle & Thread copied one of the shell patterns onto a ribbon. I think it looks extremely beachy.',
      ],
    },
    {
      id: 'resident-talk:coral:shell-stories-active',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: CORAL_SHELL_STORIES_ACTIVE_FLAG, value: true }],
      },
      lines: [
        'We need the Sunrise Spiral, Moon-speckle and Wave-fan shells. None of them need to be taken apart or traded.',
        'One shell hides near the Cove, one likes the tide pools and one is tucked towards Moonlit Point.',
        'When you have all three, bring them to the little shell circle in the Cove.',
      ],
    },
  ],
  'resident:skipper': [
    {
      id: 'resident-talk:skipper:route-ready',
      priority: 30,
      activeWhen: {
        worldFlags: [{ id: BEACH_RACE_ROUTE_READY_FLAG, value: true }],
      },
      lines: [
        'The shoreline route board is up! It is still an idea, not a proper race yet, but the wind line is brilliant.',
        'The dune marker and Moonlit Point make a very wiggly pair. Exactly what I hoped for.',
        'I am leaving the flags where they are so the Rainbow Run crew can see the route later.',
      ],
    },
    {
      id: 'resident-talk:skipper:wind-story-active',
      priority: 20,
      activeWhen: {
        worldFlags: [{ id: SKIPPER_WIND_STORY_ACTIVE_FLAG, value: true }],
      },
      lines: [
        'Start with the striped marker high in Star Dunes. It whistles when the breeze is right.',
        'If the dune marker points seaward, keep following the wind all the way to Moonlit Point.',
        'This is route-testing, not racing. Looking around is part of the job.',
      ],
    },
  ],
};

const residentIds = [
  'resident:clover',
  'resident:breeze',
  'resident:tansy',
  'resident:maple',
  'resident:juniper',
  'resident:fern',
  'resident:coral',
  'resident:skipper',
  'resident:echo',
] as const satisfies readonly SupportingResidentId[];

export const R6_SUPPORTING_RESIDENT_TALK_VARIANTS = Object.fromEntries(
  residentIds
    .map(
      (residentId) =>
        [
          residentId,
          [
            ...(BASE_RESIDENT_TALK_VARIANTS[residentId] ?? []),
            ...(R6_MEADOW_RESIDENT_TALK_VARIANTS[residentId] ?? []),
          ],
        ] as const,
    )
    .filter(([, variants]) => variants.length > 0),
) as Partial<Record<SupportingResidentId, readonly ResidentTalkVariant[]>>;
