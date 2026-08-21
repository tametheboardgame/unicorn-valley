import type { DialogueDefinition } from './contentTypes';

export const R4_FRIEND_VISIT_DIALOGUES = [
  {
    id: 'dialogue:willow-cottage-visit',
    name: 'Willow Visits the Cottage',
    startNodeId: 'dialogue-node:willow-cottage-visit-1',
    nodes: [
      {
        id: 'dialogue-node:willow-cottage-visit-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'I hoped I might find you at home. After our moonflowers settled into the garden, I wanted to see the cottage they glow beside.',
        nextNodeId: 'dialogue-node:willow-cottage-visit-2',
      },
      {
        id: 'dialogue-node:willow-cottage-visit-2',
        type: 'line',
        speakerId: 'character:willow',
        text: 'It already feels peaceful here. I think a home grows a little at a time, just like a garden.',
      },
    ],
  },
  {
    id: 'dialogue:willow-cottage-visit-decorated',
    name: 'Willow Visits a Decorated Cottage',
    startNodeId: 'dialogue-node:willow-cottage-visit-decorated-1',
    nodes: [
      {
        id: 'dialogue-node:willow-cottage-visit-decorated-1',
        type: 'line',
        speakerId: 'character:willow',
        text: 'Oh, you have been making this place your own! I love seeing the things you chose living beside the moonflower garden.',
        nextNodeId: 'dialogue-node:willow-cottage-visit-decorated-2',
      },
      {
        id: 'dialogue-node:willow-cottage-visit-decorated-2',
        type: 'line',
        speakerId: 'character:willow',
        text: 'That is the nicest thing about visiting a friend. Their home tells you little stories about them without saying a word.',
      },
    ],
  },
  {
    id: 'dialogue:nova-cottage-visit',
    name: 'Nova Visits the Cottage',
    startNodeId: 'dialogue-node:nova-cottage-visit-1',
    nodes: [
      {
        id: 'dialogue-node:nova-cottage-visit-1',
        type: 'line',
        speakerId: 'character:nova',
        text: 'Surprise visit! Ever since our first Rainbow Run opened the way to Sunrise Sprint, I have wanted to see where my racing friend winds down.',
        nextNodeId: 'dialogue-node:nova-cottage-visit-2',
      },
      {
        id: 'dialogue-node:nova-cottage-visit-2',
        type: 'line',
        speakerId: 'character:nova',
        text: 'Very cosy. A perfect place to rest your hooves before we race again whenever you feel like it.',
      },
    ],
  },
  {
    id: 'dialogue:nova-cottage-visit-ribbon',
    name: 'Nova Visits a Cottage with Race Ribbons',
    startNodeId: 'dialogue-node:nova-cottage-visit-ribbon-1',
    nodes: [
      {
        id: 'dialogue-node:nova-cottage-visit-ribbon-1',
        type: 'line',
        speakerId: 'character:nova',
        text: 'You put a Rainbow Run prize on display! I knew I recognised that flash of ribbon the second I came through the door.',
        nextNodeId: 'dialogue-node:nova-cottage-visit-ribbon-2',
      },
      {
        id: 'dialogue-node:nova-cottage-visit-ribbon-2',
        type: 'line',
        speakerId: 'character:nova',
        text: 'Now your cottage remembers the race too. That makes this feel like a proper racing-friend headquarters.',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
