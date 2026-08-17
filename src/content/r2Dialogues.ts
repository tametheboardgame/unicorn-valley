import type { DialogueDefinition } from './contentTypes';

export const R2_DIALOGUES = [
  {
    id: 'dialogue:willow-moonflowers-intro',
    name: "Willow's Moonflowers - Introduction",
    startNodeId: 'dialogue-node:willow-moonflowers-intro-1',
    nodes: [
      {
        id: 'dialogue-node:willow-moonflowers-intro-1',
        type: 'line',
        speakerId: 'character:willow',
        text: "Oh! Hello. I'm Willow. I'm trying to make this little patch feel more magical.",
        nextNodeId: 'dialogue-node:willow-moonflowers-intro-2',
      },
      {
        id: 'dialogue-node:willow-moonflowers-intro-2',
        type: 'line',
        speakerId: 'character:willow',
        text: 'Moonflowers would be perfect. Three bright ones from Moonflower Glade should be enough.',
        nextNodeId: 'dialogue-node:willow-moonflowers-intro-3',
      },
      {
        id: 'dialogue-node:willow-moonflowers-intro-3',
        type: 'line',
        speakerId: 'character:willow',
        text: 'Would you look for them? The flower patch is near the far side of the Glade.',
      },
    ],
  },
  {
    id: 'dialogue:willow-moonflowers-reminder',
    name: "Willow's Moonflowers - Reminder",
    startNodeId: 'dialogue-node:willow-moonflowers-reminder-1',
    nodes: [
      {
        id: 'dialogue-node:willow-moonflowers-reminder-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'The moonflowers grow back in Moonflower Glade. Three should make this patch glow beautifully.',
      },
    ],
  },
  {
    id: 'dialogue:willow-moonflowers-return',
    name: "Willow's Moonflowers - Return",
    startNodeId: 'dialogue-node:willow-moonflowers-return-1',
    nodes: [
      {
        id: 'dialogue-node:willow-moonflowers-return-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'You found them! They are even brighter than I hoped.',
        nextNodeId: 'dialogue-node:willow-moonflowers-return-2',
      },
      {
        id: 'dialogue-node:willow-moonflowers-return-2',
        type: 'line',
        speakerId: 'character:willow',
        text: 'There. All planted! I made you a Moonflower Lantern to say thank you.',
      },
    ],
  },
  {
    id: 'dialogue:willow-moonflowers-followup',
    name: "Willow's Moonflowers - Follow-up",
    startNodeId: 'dialogue-node:willow-moonflowers-followup-1',
    nodes: [
      {
        id: 'dialogue-node:willow-moonflowers-followup-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'Look at them glow! The village feels a little more like home now.',
      },
    ],
  },
  {
    id: 'dialogue:willow-moonflowers-friend-followup',
    name: "Willow's Moonflowers - Friend Follow-up",
    startNodeId: 'dialogue-node:willow-moonflowers-friend-followup-1',
    nodes: [
      {
        id: 'dialogue-node:willow-moonflowers-friend-followup-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'My friend! Every time the moonflowers glow, I remember that we planted them together.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
