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
    name: "Pip's Mysterious Trail - Mystery Begins",
    startNodeId: 'dialogue-node:pip-strange-egg-intro-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-intro-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'You found the sparkle! And while you were exploring, I spotted something else very strange.',
        nextNodeId: 'dialogue-node:pip-strange-egg-intro-2',
      },
      {
        id: 'dialogue-node:pip-strange-egg-intro-2',
        type: 'line',
        speakerId: 'character:pip',
        text: 'A silver feather is caught in the reeds on the LEFT bank of the stream, just NORTH of the bridge. I do not know what left it there.',
        nextNodeId: 'dialogue-node:pip-strange-egg-intro-3',
      },
      {
        id: 'dialogue-node:pip-strange-egg-intro-3',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Let us follow the clues together. Start with that feather. If you get lost, come back and ask me.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-searching',
    name: "Pip's Mysterious Trail - General Reminder",
    startNodeId: 'dialogue-node:pip-strange-egg-searching-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-searching-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'We are still following the mysterious trail. Look for the only clue that is gently glowing, or come back to me if you need a hint.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-feather',
    name: "Pip's Mysterious Trail - Find the Feather",
    startNodeId: 'dialogue-node:pip-strange-egg-feather-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-feather-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'First clue: find the SILVER FEATHER caught in the reeds on the left bank of the stream, just north of the bridge.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-moss',
    name: "Pip's Mysterious Trail - Find the Warm Moss",
    startNodeId: 'dialogue-node:pip-strange-egg-moss-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-moss-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'That feather points across the water. Cross the bridge and look for a patch of WARM MOON-MOSS beside the reeds on the far bank.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-tracks',
    name: "Pip's Mysterious Trail - Follow the Tracks",
    startNodeId: 'dialogue-node:pip-strange-egg-tracks-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-tracks-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Something rested in that warm moss. Look just south-east of it for tiny STAR-SHAPED TRACKS in the grass, heading towards Moonflower Field.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-egg',
    name: "Pip's Mysterious Trail - Find What Made the Tracks",
    startNodeId: 'dialogue-node:pip-strange-egg-egg-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-egg-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'The little tracks lead straight into Moonflower Field. Follow them into the flowers and look for whatever is hiding at the end.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-return',
    name: "Pip's Mysterious Trail - Bring the Egg Back",
    startNodeId: 'dialogue-node:pip-strange-egg-return-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-return-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'You found an EGG at the end of the tracks! I knew this trail was leading somewhere important.',
        nextNodeId: 'dialogue-node:pip-strange-egg-return-2',
      },
      {
        id: 'dialogue-node:pip-strange-egg-return-2',
        type: 'line',
        speakerId: 'character:pip',
        text: 'Let us keep it safe in your cottage. I have made a cosy little nest for it inside. We can check on it after our adventures.',
      },
    ],
  },
  {
    id: 'dialogue:pip-strange-egg-found',
    name: "Pip's Strange Egg - Safe at Home",
    startNodeId: 'dialogue-node:pip-strange-egg-found-1',
    nodes: [
      {
        id: 'dialogue-node:pip-strange-egg-found-1',
        type: 'line',
        speakerId: 'character:pip',
        text: 'The strange egg is safe in its nest inside your cottage. Go have an adventure, then come home and check on it. I think adventures help it grow!',
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
        text: 'The egg is warm now! Have another adventure somewhere in the valley, then come back to the cottage and check it again.',
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
        text: 'It is glowing! Whatever is inside definitely likes hearing about your adventures. One more adventure might make something happen.',
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
        text: 'There is a tiny crack in the shell! Do one more adventure, then hurry back and inspect the egg. I think it is nearly ready.',
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
        text: 'The shell is wobbling! Go inside your cottage and check the nest. I think somebody is ready to meet you!',
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
        text: 'Luma chose you! I knew that funny little feather trail was leading us to someone wonderful.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
