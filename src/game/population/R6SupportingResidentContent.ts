import {
  MAPLE_CAKE_QUEST_ID,
  MAPLE_CHARACTER_ID,
  TANSY_CHARACTER_ID,
  TANSY_MAP_QUEST_ID,
} from '../../content/r6VillageContent';
import { CRYSTAL_BROOK_MAP } from '../world/CrystalBrookMap';
import { MOONFLOWER_GLADE_MAP } from '../world/MoonflowerGladeMap';
import { RAINBOW_MEADOW_MAP } from '../world/RainbowMeadowMap';
import { STARLIGHT_BEACH_MAP } from '../world/StarlightBeachMap';
import { SUNBEAM_VILLAGE_LAYOUT } from '../world/SunbeamVillageLayout';
import { SUNBEAM_VILLAGE_MAP } from '../world/SunbeamVillageMap';
import { WHISPERING_WOODS_MAP } from '../world/WhisperingWoodsMap';
import type {
  AmbientSafetyProfile,
  ResidentPlacementDefinition,
  SmallWorldInteractionDefinition,
  SupportingResidentDefinition,
} from './AmbientPopulationTypes';
import { R6_MEADOW_RESIDENT_PLACEMENTS } from './R6MeadowPopulationContent';

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
    characterId: TANSY_CHARACTER_ID,
    startsQuestId: TANSY_MAP_QUEST_ID,
    questIntroLine:
      'Three corners escaped from my favourite map. One likes notices, one smells like baking, and one flew somewhere sunny.',
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
    characterId: MAPLE_CHARACTER_ID,
    startsQuestId: MAPLE_CAKE_QUEST_ID,
    questIntroLine:
      'I need a celebration cake with personality. Pick a colour plan in the Bakery, then bring the magnificently wobbly result back to me!',
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
    id: 'resident:cinnamon',
    name: 'Cinnamon',
    role: 'Sunbeam Bakery baker',
    appearance: {
      bodyColour: 'buttercup',
      eyeColour: 'amber',
      maneStyle: 'soft',
      maneColour: 'rose',
      tailStyle: 'curl',
      tailColour: 'gold',
      hornStyle: 'classic',
      marking: 'freckles',
      accessory: 'none',
    },
    talk: {
      lines: [
        'The first tray of berry buns is always the one that makes the whole Bakery smell awake.',
        'Maple is my most enthusiastic cake planner and my least reliable sprinkle counter.',
        'If you hear a tiny bell, the next batch is ready. If you hear a big crash, that was probably a tray.',
      ],
    },
  },
  {
    id: 'resident:velvet',
    name: 'Velvet',
    role: 'Twinkle & Thread stylist and shopkeeper',
    appearance: {
      bodyColour: 'pearl',
      eyeColour: 'violet',
      maneStyle: 'braid',
      maneColour: 'plum',
      tailStyle: 'ribbon',
      tailColour: 'rose',
      hornStyle: 'spiral',
      marking: 'sparkles',
      accessory: 'bow',
    },
    talk: {
      lines: [
        'The best accessory is the one that makes you stand a little taller.',
        'I rearrange the displays whenever inspiration strikes. Inspiration strikes a lot.',
        'Some treasures only appear after a proper adventure. I think that makes them better.',
      ],
    },
  },
  {
    id: 'resident:quill',
    name: 'Quill',
    role: 'Story House librarian and storykeeper',
    appearance: {
      bodyColour: 'sky',
      eyeColour: 'green',
      maneStyle: 'swept',
      maneColour: 'midnight',
      tailStyle: 'plume',
      tailColour: 'lilac',
      hornStyle: 'moon',
      marking: 'star',
      accessory: 'glasses',
    },
    talk: {
      lines: [
        'Every shelf has a story, but the best ones are the stories you bring back with you.',
        'I keep the newest adventure cards near the round table so nobody has to reach too high.',
        'A good library should have quiet corners, bright lamps and at least one cushion that is impossible to sit on neatly.',
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

  {
    id: 'resident:poppy',
    name: 'Poppy',
    role: 'Playground explorer',
    appearance: {
      bodyColour: 'pink',
      eyeColour: 'violet',
      maneStyle: 'fluffy',
      maneColour: 'rose',
      tailStyle: 'puff',
      tailColour: 'rose',
      hornStyle: 'short',
      marking: 'heart',
      accessory: 'bow',
    },
    talk: {
      lines: [
        'I can get all the way across the climbing frame without touching the grass!',
        'The climbing frame is a castle today. Tomorrow it might be a cloud.',
        'I am trying to invent a route that uses every single bar.',
      ],
    },
  },
  {
    id: 'resident:milo',
    name: 'Milo',
    role: 'Seesaw champion',
    appearance: {
      bodyColour: 'mint',
      eyeColour: 'green',
      maneStyle: 'swept',
      maneColour: 'gold',
      tailStyle: 'swish',
      tailColour: 'gold',
      hornStyle: 'short',
      marking: 'star',
      accessory: 'none',
    },
    talk: {
      lines: [
        'The best seesaw bounce is the one where both unicorns start laughing.',
        'I can almost make the seesaw land perfectly level.',
        'Bean says faster is better. I think higher is better.',
      ],
    },
  },
  {
    id: 'resident:lulu',
    name: 'Lulu',
    role: 'Slide racer',
    appearance: {
      bodyColour: 'lavender',
      eyeColour: 'blue',
      maneStyle: 'soft',
      maneColour: 'aqua',
      tailStyle: 'curl',
      tailColour: 'aqua',
      hornStyle: 'short',
      marking: 'sparkles',
      accessory: 'flower',
    },
    talk: {
      lines: [
        'I am practising my fastest slide. I think the whoosh is the important part.',
        'I counted three different ways to say whoosh on the slide.',
        'The top of the slide is the best lookout in the playground.',
      ],
    },
  },
  {
    id: 'resident:bean',
    name: 'Bean',
    role: 'Playground game inventor',
    appearance: {
      bodyColour: 'buttercup',
      eyeColour: 'amber',
      maneStyle: 'crest',
      maneColour: 'coral',
      tailStyle: 'ribbon',
      tailColour: 'coral',
      hornStyle: 'short',
      marking: 'freckles',
      accessory: 'ribbon',
    },
    talk: {
      lines: [
        'We invented a game where every pink flower is lava. The rules keep changing.',
        'The yellow flowers are safe today. Probably.',
        'I make the games and everyone else keeps adding better rules.',
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
      {
        id: 'tansy-village-a',
        x: SUNBEAM_VILLAGE_LAYOUT.buildings.library.x - 210,
        y: SUNBEAM_VILLAGE_LAYOUT.buildings.library.approach.y + 40,
        pauseMs: 2600,
      },
      {
        id: 'tansy-village-b',
        x: 1960,
        y: 1030,
        pauseMs: 2100,
      },
      {
        id: 'tansy-village-c',
        x: 1840,
        y: 1160,
        pauseMs: 3000,
      },
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
    speedPxPerSecond: 74,
    interactionRadius: 136,
    priority: 60,
    waypoints: [
      {
        id: 'maple-village-a',
        x: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.x - 180,
        y: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.approach.y + 75,
        pauseMs: 2600,
      },
      {
        id: 'maple-village-b',
        x: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.x + 175,
        y: SUNBEAM_VILLAGE_LAYOUT.buildings.bakery.approach.y + 75,
        pauseMs: 1500,
      },
      {
        id: 'maple-village-c',
        x: 990,
        y: 900,
        pauseMs: 2100,
      },
    ],
  },

  {
    id: 'resident-placement:poppy:sunbeam-playground',
    residentId: 'resident:poppy',
    sceneKey: 'SunbeamVillageScene',
    behaviour: 'local-wander',
    routeMode: 'ping-pong',
    speedPxPerSecond: 52,
    interactionRadius: 104,
    priority: 24,
    presentationScale: 0.56,
    waypoints: [
      { id: 'poppy-playground-a', x: 2620, y: 1605, pauseMs: 2100 },
      { id: 'poppy-playground-b', x: 2650, y: 1650, pauseMs: 1500 },
    ],
  },
  {
    id: 'resident-placement:milo:sunbeam-playground',
    residentId: 'resident:milo',
    sceneKey: 'SunbeamVillageScene',
    behaviour: 'local-wander',
    routeMode: 'ping-pong',
    speedPxPerSecond: 48,
    interactionRadius: 104,
    priority: 24,
    presentationScale: 0.56,
    waypoints: [
      { id: 'milo-playground-a', x: 2570, y: 1810, pauseMs: 1800 },
      { id: 'milo-playground-b', x: 2670, y: 1810, pauseMs: 2300 },
    ],
  },
  {
    id: 'resident-placement:lulu:sunbeam-playground',
    residentId: 'resident:lulu',
    sceneKey: 'SunbeamVillageScene',
    behaviour: 'local-wander',
    routeMode: 'ping-pong',
    speedPxPerSecond: 54,
    interactionRadius: 104,
    priority: 24,
    presentationScale: 0.56,
    waypoints: [
      { id: 'lulu-playground-a', x: 2720, y: 1565, pauseMs: 1700 },
      { id: 'lulu-playground-b', x: 2835, y: 1575, pauseMs: 2200 },
    ],
  },
  {
    id: 'resident-placement:bean:sunbeam-playground',
    residentId: 'resident:bean',
    sceneKey: 'SunbeamVillageScene',
    behaviour: 'local-wander',
    routeMode: 'ping-pong',
    speedPxPerSecond: 50,
    interactionRadius: 104,
    priority: 24,
    presentationScale: 0.56,
    waypoints: [
      { id: 'bean-playground-a', x: 2820, y: 1795, pauseMs: 2400 },
      { id: 'bean-playground-b', x: 2740, y: 1795, pauseMs: 1700 },
    ],
  },
  {
    id: 'resident-placement:echo:crystal-brook-route',
    residentId: 'resident:echo',
    sceneKey: 'CrystalBrookScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 66,
    interactionRadius: 150,
    priority: 60,
    waypoints: [
      { id: 'echo-brook-a', x: 2860, y: 1690, pauseMs: 1800 },
      { id: 'echo-brook-b', x: 2990, y: 1760, pauseMs: 1800 },
    ],
  },
  {
    id: 'resident-placement:fern:woods-route',
    residentId: 'resident:fern',
    sceneKey: 'WhisperingWoodsScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 72,
    interactionRadius: 138,
    priority: 60,
    waypoints: [
      { id: 'fern-woods-a', x: 2550, y: 850, pauseMs: 2200 },
      { id: 'fern-woods-b', x: 2980, y: 820, pauseMs: 1900 },
    ],
  },
  ...R6_MEADOW_RESIDENT_PLACEMENTS,
  {
    id: 'resident-placement:coral:beach-shell-cove',
    residentId: 'resident:coral',
    sceneKey: 'StarlightBeachScene',
    behaviour: 'local-wander',
    routeMode: 'random-neighbour',
    speedPxPerSecond: 70,
    interactionRadius: 126,
    priority: 22,
    waypoints: [
      { id: 'coral-beach-a', x: 760, y: 1040, pauseMs: 2200 },
      { id: 'coral-beach-b', x: 980, y: 1120, pauseMs: 1800 },
      { id: 'coral-beach-c', x: 1120, y: 980, pauseMs: 2500 },
    ],
  },
  {
    id: 'resident-placement:skipper:beach-star-dunes',
    residentId: 'resident:skipper',
    sceneKey: 'StarlightBeachScene',
    behaviour: 'purposeful-route',
    routeMode: 'ping-pong',
    speedPxPerSecond: 88,
    interactionRadius: 126,
    priority: 20,
    waypoints: [
      { id: 'skipper-beach-a', x: 2320, y: 1050, pauseMs: 1400 },
      { id: 'skipper-beach-b', x: 2540, y: 1120, pauseMs: 1000 },
      { id: 'skipper-beach-c', x: 2780, y: 1050, pauseMs: 1900 },
    ],
  },
] as const satisfies readonly ResidentPlacementDefinition[];

export const R6_SMALL_WORLD_INTERACTIONS = [
  {
    id: 'world-interaction:r6-5:village-playground-slide',
    sceneKey: 'SunbeamVillageScene',
    kind: 'play',
    label: 'Playground slide',
    actionLabel: 'Play',
    position: { ...SUNBEAM_VILLAGE_LAYOUT.playground.equipment.slide.interaction },
    interactionRadius: 112,
    feedback: 'Whoosh! You trot up, slide down and land with a tiny sparkle of dust.',
  },
  {
    id: 'world-interaction:r6-5:village-playground-seesaw',
    sceneKey: 'SunbeamVillageScene',
    kind: 'play',
    label: 'Playground seesaw',
    actionLabel: 'Play',
    position: { ...SUNBEAM_VILLAGE_LAYOUT.playground.equipment.seesaw.interaction },
    interactionRadius: 112,
    feedback: 'Up, down, up! The seesaw gives a cheerful wooden creak.',
  },
  {
    id: 'world-interaction:r6-5:village-playground-climbing-frame',
    sceneKey: 'SunbeamVillageScene',
    kind: 'play',
    label: 'Climbing frame',
    actionLabel: 'Play',
    position: { ...SUNBEAM_VILLAGE_LAYOUT.playground.equipment.climbingFrame.interaction },
    interactionRadius: 112,
    feedback: 'You scramble across the frame and hop down with a proud little flourish.',
  },
  {
    id: 'world-interaction:r6-5:village-chime',
    sceneKey: 'SunbeamVillageScene',
    kind: 'ring',
    label: 'Sunbeam chime',
    actionLabel: 'Ring',
    position: {
      x: SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.approach.x - 110,
      y: SUNBEAM_VILLAGE_LAYOUT.entrances.rainbowMeadow.approach.y - 100,
    },
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
  {
    id: 'world-interaction:r6-5:beach-tide-pool-peek',
    sceneKey: 'StarlightBeachScene',
    kind: 'inspect',
    label: 'Curious tide pool',
    actionLabel: 'Peek',
    position: { x: 1780, y: 1450 },
    interactionRadius: 118,
    feedback: 'A tiny crab peeks from behind a pebble, waves one claw, then hides again. 🦀',
  },
  {
    id: 'world-interaction:r6-5:beach-driftwood-chime',
    sceneKey: 'StarlightBeachScene',
    kind: 'ring',
    label: 'Driftwood shell chime',
    actionLabel: 'Ring',
    position: { x: 1420, y: 1120 },
    interactionRadius: 120,
    feedback: 'Clink-clink! The little shells make a soft sea-glass tune in the breeze.',
  },
  {
    id: 'world-interaction:r6-5:beach-kite-ribbons',
    sceneKey: 'StarlightBeachScene',
    kind: 'play',
    label: 'Skipper’s kite ribbons',
    actionLabel: 'Flutter',
    position: { x: 2580, y: 980 },
    interactionRadius: 120,
    feedback: 'The ribbons snap into a bright zig-zag, then settle back into the sea breeze.',
  },
  {
    id: 'world-interaction:r6-5:beach-moonlit-seat',
    sceneKey: 'StarlightBeachScene',
    kind: 'sit',
    label: 'Moonlit Point',
    actionLabel: 'Sit',
    position: { x: 3040, y: 1460 },
    interactionRadius: 126,
    feedback: 'For a moment the whole sea looks sprinkled with tiny stars. ✨',
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
  safetyProfile('StarlightBeachScene', STARLIGHT_BEACH_MAP, [
    {
      id: 'transition:whispering-woods',
      position: STARLIGHT_BEACH_MAP.entrances[0].position,
      radius: 190,
    },
  ]),
] as const satisfies readonly AmbientSafetyProfile[];
