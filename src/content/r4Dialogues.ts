import type { DialogueDefinition } from './contentTypes';

export const R4_DIALOGUES = [
  {
    id: 'dialogue:willow-moonflowers-returning-followup',
    name: "Willow's Moonflowers - Returning Follow-up",
    startNodeId: 'dialogue-node:willow-moonflowers-returning-followup-1',
    nodes: [
      {
        id: 'dialogue-node:willow-moonflowers-returning-followup-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'You came back! The moonflowers have been glowing all morning. I think they remember you too.',
      },
    ],
  },
  {
    id: 'dialogue:willow-moonflowers-good-friend-followup',
    name: "Willow's Moonflowers - Good Friend Follow-up",
    startNodeId: 'dialogue-node:willow-moonflowers-good-friend-followup-1',
    nodes: [
      {
        id: 'dialogue-node:willow-moonflowers-good-friend-followup-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'There you are! I saved the brightest little patch for when you visited. It always makes me think of our adventure.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-intro',
    name: "Pip's Strange Egg - Mystery Begins",
    startNodeId: 'dialogue-node:pip-strange-egg-intro-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-intro-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'I found the oddest little trail in the glade: a silver feather, warm moss and tiny star marks!',
        nextNodeId: 'dialogue-node:pip-strange-egg-intro-2',
      },
      {
        id: 'dialogue-node:pip-strange-egg-intro-2',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Will you help me follow the clues? I have a feeling something very small and very mysterious is hiding nearby.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-searching',
    name: "Pip's Strange Egg - Searching",
    startNodeId: 'dialogue-node:pip-strange-egg-searching-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-searching-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'The next clue is sparkling somewhere in Moonflower Glade. Follow anything that looks a little too magical to be ordinary!',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-found',
    name: "Pip's Strange Egg - Found",
    startNodeId: 'dialogue-node:pip-strange-egg-found-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-found-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'An egg! Let us keep it safe in your cottage. Maybe ordinary adventures will help it decide what it wants to become.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-warm',
    name: "Pip's Strange Egg - Warm",
    startNodeId: 'dialogue-node:pip-strange-egg-warm-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-warm-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'It is warmer! Do something fun around the valley, then check on it another time. No hurry at all.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-glowing',
    name: "Pip's Strange Egg - Glowing",
    startNodeId: 'dialogue-node:pip-strange-egg-glowing-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-glowing-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Look at that glow! I think it likes hearing about your adventures. I wonder what is listening inside.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-cracking',
    name: "Pip's Strange Egg - Cracking",
    startNodeId: 'dialogue-node:pip-strange-egg-cracking-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-cracking-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Did you hear that tiny crack? Something is definitely getting ready to say hello!',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-hatch-ready',
    name: "Pip's Strange Egg - Hatch Ready",
    startNodeId: 'dialogue-node:pip-strange-egg-hatch-ready-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-hatch-ready-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'The shell is wobbling! Go home and look at the nest. I think this is the moment!',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-hatched',
    name: "Pip's Strange Egg - Hatched",
    startNodeId: 'dialogue-node:pip-strange-egg-hatched-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-hatched-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Luma chose you! I knew the strange little trail was leading to something wonderful.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
