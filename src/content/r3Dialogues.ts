import type { DialogueDefinition } from './contentTypes';

export const R3_DIALOGUES = [
  {
    id: 'dialogue:nova-first-race-intro',
    name: "Nova's First Race - Invitation",
    startNodeId: 'dialogue-node:nova-first-race-intro-1',
    nodes: [
      {
        id: 'dialogue-node:nova-first-race-intro-1',
        type: 'line',
        speakerId: 'character:nova',
        text: "Hey! You made it. I'm Nova. Rainbow Run looks fast, but your first go is just about finding the rhythm.",
        nextNodeId: 'dialogue-node:nova-first-race-intro-2',
      },
      {
        id: 'dialogue-node:nova-first-race-intro-2',
        type: 'line',
        speakerId: 'character:nova',
        text: 'Your unicorn runs on its own. Tap JUMP or press Space when an obstacle comes up, and the bright strips give you a boost.',
        nextNodeId: 'dialogue-node:nova-first-race-intro-3',
      },
      {
        id: 'dialogue-node:nova-first-race-intro-3',
        type: 'line',
        speakerId: 'character:nova',
        text: "Cross the finish and come find me. Your first ribbon is for finishing, so your place doesn't decide whether you get one.",
      },
    ],
  },
  {
    id: 'dialogue:nova-first-race-reminder',
    name: "Nova's First Race - Ready",
    startNodeId: 'dialogue-node:nova-first-race-reminder-1',
    nodes: [
      {
        id: 'dialogue-node:nova-first-race-reminder-1',
        type: 'line',
        speakerId: 'character:nova',
        text: "The first-run flags are ready. Follow the course, jump what you want to jump, and keep going to the finish. I'll see you there.",
      },
    ],
  },
  {
    id: 'dialogue:nova-first-race-result-win',
    name: "Nova's First Race - First Place",
    startNodeId: 'dialogue-node:nova-first-race-result-win-1',
    nodes: [
      {
        id: 'dialogue-node:nova-first-race-result-win-1',
        type: 'line',
        speakerId: 'character:nova',
        text: "First place on your first run. That was quick. I thought I'd have longer to show you the course!",
        nextNodeId: 'dialogue-node:nova-first-race-result-win-2',
      },
      {
        id: 'dialogue-node:nova-first-race-result-win-2',
        type: 'line',
        speakerId: 'character:nova',
        text: 'That Finisher Ribbon is yours, and the Sunrise Sprint is open now. Winning this one got you bragging rights, not a locked-away story.',
      },
    ],
  },
  {
    id: 'dialogue:nova-first-race-result-finish',
    name: "Nova's First Race - Finished",
    startNodeId: 'dialogue-node:nova-first-race-result-finish-1',
    nodes: [
      {
        id: 'dialogue-node:nova-first-race-result-finish-1',
        type: 'line',
        speakerId: 'character:nova',
        text: "That's your first Rainbow Run in the book. Now you know where the jump, boost and finish all fit together.",
        nextNodeId: 'dialogue-node:nova-first-race-result-finish-2',
      },
      {
        id: 'dialogue-node:nova-first-race-result-finish-2',
        type: 'line',
        speakerId: 'character:nova',
        text: 'That Finisher Ribbon is yours, and the Sunrise Sprint is open now. Race it whenever you feel like another go.',
      },
    ],
  },
  {
    id: 'dialogue:nova-first-race-followup',
    name: "Nova's First Race - Follow-up",
    startNodeId: 'dialogue-node:nova-first-race-followup-1',
    nodes: [
      {
        id: 'dialogue-node:nova-first-race-followup-1',
        type: 'line',
        speakerId: 'character:nova',
        text: "Sunrise Sprint is open whenever you want it. No pressure from me. I'll race when you race.",
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];
