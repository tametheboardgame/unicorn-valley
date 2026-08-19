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
] as const satisfies readonly DialogueDefinition[];
