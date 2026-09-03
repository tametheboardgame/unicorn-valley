import { CRYSTAL_BROOK_MAP } from '../world/CrystalBrookMap';
import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { WHISPERING_WOODS_MAP } from '../world/WhisperingWoodsMap';
import type {
  AmbientSafetyProfile,
  ResidentPlacementDefinition,
  SmallWorldInteractionDefinition,
  SupportingResidentDefinition,
} from './AmbientPopulationTypes';

export const R6_SUPPORTING_RESIDENTS = [
  {
    id: 'resident:clover',
    name: 'Clover',
    role: 'Cheerful Rainbow Run regular',
    appearance: {
      bodyColour: 'mint',
      eyeColour: 'green',
      maneStyle: 'swept',
      maneColour: 'gold',
      tailStyle: 'swish',
      tailColour: 'gold',
      hornStyle: 'classic',
      marking: 'star',
      accessory: 'ribbon',
    },
    talk: {
      lines: [
        'I like doing one slow lap before I race fast.',
        'The meadow breeze makes every race feel different.',
        'If you spot Breeze, tell them I am ready for another run!',
      ],
    },
  },
  {
    id: 'resident:breeze',
    name: 'Breeze',
    role: 'Fast runner and lookout fan',
    appearance: {
      bodyColour: 'sky',
      eyeColour: 'aqua',
      maneStyle: 'crest',
      maneColour: 'ice',
      tailStyle: 'ribbon',
      tailColour: 'aqua',
      hornStyle: 'star',
      marking: 'sparkles',
      accessory: 'scarf',
    },
    talk: {
      lines: [
        'I always notice the wind before I notice the finish line.',
        'High places are best for spotting secret paths.',
        'A good race can still be a good race when you stop to look around.',
      ],
    },
  },
  {
    id: 'resident:tansy',
    name: 'Tansy',
    role: 'Story House map and clue keeper',
    appearance: {
      bodyColour: 'lavender',
      eyeColour: 'violet',
      maneStyle: 'braid',
      maneColour: 'plum',
      tailStyle: 'braid',
      tailColour: 'lilac',
      hornStyle: 'spiral',
      marking: 'moon',
      accessory: 'bow',
    },
    talk: {
      lines: [
        'Maps are stories where you get to choose what happens next.',
        'I keep my favourite clues on little cards so I do not forget them.',
        'Some places look completely different when the sky changes.',
      ],
    },
  },
  {
    id: 'resident:maple',
    name: 'Maple',
    role: 'Bakery helper and picnic enthusiast',
    appearance: {
      bodyColour: 'peach',
      eyeColour: 'amber',
      maneStyle: 'fluffy',
      maneColour: 'coral',
      tailStyle: 'curl',
      tailColour: 'gold',
      hornStyle: 'short',
      marking: 'heart',
      accessory: 'flower',
    },
    talk: {
      lines: [
        'A bun tastes better outside. I am almost sure that is science.',
        'Marigold lets me test the decorations that are too silly for the counter.',
        'I keep finding crumbs in my mane. Very mysterious.',
      ],
    },
  },
  {
    id: 'resident:juniper',
    name: 'Juniper',
    role: 'Tiny-nature explorer',
    appearance: {
      bodyColour: 'cream',
      eyeColour: 'green',
      maneStyle: 'soft',
      maneColour: 'aqua',
      tailStyle: 'puff',
      tailColour: 'aqua',
      hornStyle: 'crystal',
      marking: 'freckles',
      accessory: 'bell',
    },
    talk: {
      lines: [
        'I found a beetle with a shiny back. It was extremely busy.',
        'Tiny things are easier to notice when you stop walking for a moment.',
        'I am checking whether moonflowers hum when nobody is looking.',
      ],
    },
  },
  {
    id: 'resident:fern',
    name: 'Fern',
    role: 'Woods mushroom and firefly watcher',
    appearance: {
      bodyColour: 'mint',
      eyeColour: 'aqua',
      maneStyle: 'braid',
      maneColour: 'midnight',
      tailStyle: 'curl',
      tailColour: 'midnight',
      hornStyle: 'crystal',
      marking: 'moon',
      accessory: 'flower',
    },
    talk: {
      lines: [
        'The Woods are never really quiet. You just have to listen smaller.',
        'Fireflies are terrible at standing in tidy lines.',
        'Mooncaps glow brightest when the path gets dark.',
      ],
    },
  },
  {
    id: 'resident:coral',
    name: 'Coral',
    role: 'Beachcomber and shell collector',
    appearance: {
      bodyColour: 'pearl',
      eyeColour: 'blue',
      maneStyle: 'soft',
      maneColour: 'coral',
      tailStyle: 'swish',
      tailColour: 'ice',
      hornStyle: 'spiral',
      marking: 'sparkles',
      accessory: 'ribbon',
    },
    talk: {
      lines: [
        'The best shells are not always the shiniest ones.',
        'I sort beach treasures by the sound they make in my pocket.',
        'The tide leaves clues everywhere if you know where to look.',
      ],
    },
  },
  {
    id: 'resident:skipper',
    name: 'Skipper',
    role: 'Kite and sand-course tinkerer',
    appearance: {
      bodyColour: 'buttercup',
      eyeColour: 'blue',
      maneStyle: 'crest',
      maneColour: 'aqua',
      tailStyle: 'ribbon',
      tailColour: 'coral',
      hornStyle: 'star',
      marking: 'star',
      accessory: 'scarf',
    },
    talk: {
      lines: [
        'A kite is just a flag that decided to go exploring.',
        'I am testing a sand track with exactly the right amount of wobble.',
        'If the wind changes, the whole game changes. That is the fun bit.',
      ],
    },
  },
  {
    id: 'resident:echo',
    name: 'Echo',
    role: 'Crystal-chime music maker',
    appearance: {
      bodyColour: 'lavender',
      eyeColour: 'rose',
      maneStyle: 'swept',
      maneColour: 'ice',
      tailStyle: 'braid',
      tailColour: 'lilac',
      hornStyle: 'crystal',
      marking: 'sparkles',
      accessory: 'bell',
    },
    talk: {
      lines: [
        'Every crystal has a note. I am trying to find the silliest one.',
        'Water changes a chime more than you would expect.',
        'Sometimes the Brook answers back. Ripple says that is normal.',
      ],
    },
  },
] as const satisfies readonly SupportingResidentDefinition[];

// WP2 deliberately placed only enough residents to prove the reusable life patterns.
// Region depth WPs extend this list with authored routines that remain within the same safety contract.
export const R6_AMBIENT_RESIDENT_PLACEMENTS = [
  {
    id: 'resident-placement:juniper:glade-wander',
    residentId: 'resident:juniper',
    sceneKey: 'MoonflowerGladeScene',
    behaviour: 'local-wander',
    routeMode: 'random-neighbour',
    speedPxPerSecond: 76,
    interactionRadius: 118,
    waypoints: [
      { id: 'juniper-glade-a', x: 990, y: 1370, pauseMs: 1700 },
      { id: 'juniper-glade-b', x: 1130, y: 1440, pauseMs: 2200 },
      { id: 'juniper-glade-c', x: 920, y: 1510, pauseMs: 1900 },
    ],
  },
  {
    id: 'resident-placement:clover:meadow-route',
    residentId: 'resident:clover',
    sceneKey: 'RainbowMeadowScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 112,
    interactionRadius: 126,
    waypoints: [
      { id: 'clover-meadow-a', x: 2050, y: 990, pauseMs: 650 },
      { id: 'clover-meadow-b', x: 2190, y: 1080, pauseMs: 550 },
      { id: 'clover-meadow-c', x: 2330, y: 1160, pauseMs: 850 },
    ],
  },
  {
    id: 'resident-placement:tansy:village-day',
    residentId: 'resident:tansy',
    sceneKey: 'SunbeamVillageScene',
    behaviour: 'activity-loop',
    routeMode: 'ping-pong',
    speedPxPerSecond: 70,
    interactionRadius: 122,
    priority: 20,
    activeWhen: { timeStates: ['morning', 'afternoon'] },
    waypoints: [
      { id: 'tansy-village-a', x: 2180, y: 860, pauseMs: 2600 },
      { id: 'tansy-village-b', x: 2300, y: 940, pauseMs: 3200 },
    ],
  },
  {
    id: 'resident-placement:tansy:meadow-evening',
    residentId: 'resident:tansy',
    sceneKey: 'RainbowMeadowScene',
    behaviour: 'local-wander',
    routeMode: 'ping-pong',
    speedPxPerSecond: 68,
    interactionRadius: 122,
    priority: 20,
    activeWhen: { timeStates: ['sunset', 'night'] },
    waypoints: [
      { id: 'tansy-meadow-a', x: 2070, y: 1490, pauseMs: 2600 },
      { id: 'tansy-meadow-b', x: 2200, y: 1540, pauseMs: 3100 },
    ],
  },
  {
    id: 'resident-placement:maple:village-bakery-route',
    residentId: 'resident:maple',
    sceneKey: 'SunbeamVillageScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 78,
    interactionRadius: 124,
    priority: 18,
    waypoints: [
      { id: 'maple-village-a', x: 1660, y: 1360, pauseMs: 1800 },
      { id: 'maple-village-b', x: 1840, y: 1390, pauseMs: 1100 },
      { id: 'maple-village-c', x: 2050, y: 1320, pauseMs: 2300 },
    ],
  },
] as const satisfies readonly ResidentPlacementDefinition[];

export const R6_SMALL_WORLD_INTERACTIONS = [
  {
    id: 'world-interaction:r6-5:village-chime',
    sceneKey: 'SunbeamVillageScene',
    kind: 'ring',
    label: 'Sunbeam chime',
    actionLabel: 'Ring',
    position: { x: 2440, y: 790 },
    interactionRadius: 116,
    feedback: 'Ting! A bright little chime skips across the village square.',
  },
  {
    id: 'world-interaction:r6-5:meadow-puddle',
    sceneKey: 'RainbowMeadowScene',
    kind: 'splash',
    label: 'Rainbow puddle',
    actionLabel: 'Splash',
    position: { x: 1570, y: 990 },
    interactionRadius: 120,
    feedback: 'Splash! Tiny rainbow drops sparkle for a moment before vanishing.',
  },
] as const satisfies readonly SmallWorldInteractionDefinition[];

function safetyProfile(
  sceneKey: string,
  map: {
    width: number;
    height: number;
    margin: number;
    colliders: readonly {
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
  },
  forbiddenPoints: AmbientSafetyProfile['forbiddenPoints'] = [],
): AmbientSafetyProfile {
  return {
    sceneKey,
    width: map.width,
    height: map.height,
    margin: map.margin,
    blockers: map.colliders,
    forbiddenPoints,
  };
}

export const R6_AMBIENT_SAFETY_PROFILES = [
  safetyProfile('MoonflowerGladeScene', MOONFLOWER_GLADE_MAP, [
    {
      id: 'transition:sunbeam-village',
      position: MOONFLOWER_GLADE_MAP.entrances[0].position,
      radius: 190,
    },
  ]),
  safetyProfile('SunbeamVillageScene', SUNBEAM_VILLAGE_MAP, [
    {
      id: 'transition:moonflower-glade',
      position: SUNBEAM_VILLAGE_MAP.entrances[0].position,
      radius: 190,
    },
    {
      id: 'transition:rainbow-meadow',
      position: SUNBEAM_VILLAGE_MAP.entrances[1].position,
      radius: 190,
    },
  ]),
  safetyProfile('RainbowMeadowScene', RAINBOW_MEADOW_MAP, [
    {
      id: 'transition:sunbeam-village',
      position: RAINBOW_MEADOW_MAP.entrances[0].position,
      radius: 190,
    },
    {
      id: 'activity:rainbow-run',
      position: RAINBOW_MEADOW_MAP.hubFeatures[0].position,
      radius: 170,
    },
  ]),
  safetyProfile('CrystalBrookScene', CRYSTAL_BROOK_MAP),
  safetyProfile('WhisperingWoodsScene', WHISPERING_WOODS_MAP),
] as const satisfies readonly AmbientSafetyProfile[];
