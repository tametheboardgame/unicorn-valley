import type {
  CharacterDefinition,
  DialogueDefinition,
  DialogueFlagId,
  DialogueVariantSet,
  QuestDefinition,
} from './contentTypes';

export const MARIGOLD_CHARACTER_ID = 'character:marigold' as const;
export const MARIGOLD_PICNIC_QUEST_ID = 'quest:marigold-picnic' as const;
export const MARIGOLD_PICNIC_VARIANTS_ID = 'dialogue-variants:marigold-picnic-followup' as const;

export const PICNIC_READY_FLAG = 'flag:marigold-picnic-ready' as const;
export const PICNIC_SUNSHINE_FLAG = 'flag:marigold-picnic-theme-sunshine' as const;
export const PICNIC_MOONFLOWER_FLAG = 'flag:marigold-picnic-theme-moonflower' as const;
export const PICNIC_RAINBOW_FLAG = 'flag:marigold-picnic-theme-rainbow' as const;

export type PicnicTheme = 'sunshine' | 'moonflower' | 'rainbow';

export const PICNIC_THEME_FLAGS = {
  sunshine: PICNIC_SUNSHINE_FLAG,
  moonflower: PICNIC_MOONFLOWER_FLAG,
  rainbow: PICNIC_RAINBOW_FLAG,
} as const satisfies Record<PicnicTheme, DialogueFlagId>;

export const R4_PICNIC_CHARACTERS = [
  {
    id: MARIGOLD_CHARACTER_ID,
    name: 'Marigold',
    role: 'Baker and event organiser',
  },
] as const satisfies readonly CharacterDefinition[];

export const R4_PICNIC_QUESTS = [
  {
    id: MARIGOLD_PICNIC_QUEST_ID,
    name: "Marigold's Picnic Problem",
    steps: [
      { type: 'talk-to-character', characterId: MARIGOLD_CHARACTER_ID },
      { type: 'set-world-flag', flagId: PICNIC_READY_FLAG, value: true },
      { type: 'award-friendship', characterId: MARIGOLD_CHARACTER_ID, amount: 15 },
    ],
  },
] as const satisfies readonly QuestDefinition[];

export const R4_PICNIC_DIALOGUES = [
  {
    id: 'dialogue:marigold-picnic-intro',
    name: "Marigold's Picnic Problem - Introduction",
    startNodeId: 'dialogue-node:marigold-picnic-intro-1',
    nodes: [
      {
        id: 'dialogue-node:marigold-picnic-intro-1',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'Perfect timing! I have buns, berry fizz, napkins and exactly no idea what our meadow picnic should look like.',
        nextNodeId: 'dialogue-node:marigold-picnic-theme-choice',
      },
      {
        id: 'dialogue-node:marigold-picnic-theme-choice',
        type: 'choice',
        speakerId: MARIGOLD_CHARACTER_ID,
        prompt: 'Which picnic theme should we make?',
        choices: [
          {
            id: 'sunshine',
            label: 'Sunny yellow ☀️',
            nextNodeId: 'dialogue-node:marigold-picnic-sunshine-picked',
            effects: [
              { type: 'set-flag', flagId: PICNIC_SUNSHINE_FLAG, value: true },
              { type: 'set-flag', flagId: PICNIC_MOONFLOWER_FLAG, value: false },
              { type: 'set-flag', flagId: PICNIC_RAINBOW_FLAG, value: false },
            ],
          },
          {
            id: 'moonflower',
            label: 'Moonflower blue 🌙',
            nextNodeId: 'dialogue-node:marigold-picnic-moonflower-picked',
            effects: [
              { type: 'set-flag', flagId: PICNIC_SUNSHINE_FLAG, value: false },
              { type: 'set-flag', flagId: PICNIC_MOONFLOWER_FLAG, value: true },
              { type: 'set-flag', flagId: PICNIC_RAINBOW_FLAG, value: false },
            ],
          },
          {
            id: 'rainbow',
            label: 'Rainbow bright 🌈',
            nextNodeId: 'dialogue-node:marigold-picnic-rainbow-picked',
            effects: [
              { type: 'set-flag', flagId: PICNIC_SUNSHINE_FLAG, value: false },
              { type: 'set-flag', flagId: PICNIC_MOONFLOWER_FLAG, value: false },
              { type: 'set-flag', flagId: PICNIC_RAINBOW_FLAG, value: true },
            ],
          },
        ],
      },
      {
        id: 'dialogue-node:marigold-picnic-sunshine-picked',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'Sunshine it is! Yellow blankets, sunflower jars and enough warm colour to make the clouds jealous. Meet us on Picnic Hill!',
      },
      {
        id: 'dialogue-node:marigold-picnic-moonflower-picked',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'Moonflowers! Blue blankets, little silver stars and glowing flowers. Picnic Hill is going to look dreamy.',
      },
      {
        id: 'dialogue-node:marigold-picnic-rainbow-picked',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'Rainbow bright! Every colour gets invited. I will bring the striped blanket, you bring yourself, and we will meet on Picnic Hill!',
      },
    ],
  },
  {
    id: 'dialogue:marigold-picnic-sunshine-followup',
    name: "Marigold's Picnic - Sunshine Follow-up",
    startNodeId: 'dialogue-node:marigold-picnic-sunshine-followup-1',
    nodes: [
      {
        id: 'dialogue-node:marigold-picnic-sunshine-followup-1',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'Your sunshine picnic is still waiting on the hill. I may have baked one or twelve extra buns for it.',
      },
    ],
  },
  {
    id: 'dialogue:marigold-picnic-moonflower-followup',
    name: "Marigold's Picnic - Moonflower Follow-up",
    startNodeId: 'dialogue-node:marigold-picnic-moonflower-followup-1',
    nodes: [
      {
        id: 'dialogue-node:marigold-picnic-moonflower-followup-1',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'The Moonflower picnic looks especially magical when the breeze moves the little silver stars. Excellent choosing.',
      },
    ],
  },
  {
    id: 'dialogue:marigold-picnic-rainbow-followup',
    name: "Marigold's Picnic - Rainbow Follow-up",
    startNodeId: 'dialogue-node:marigold-picnic-rainbow-followup-1',
    nodes: [
      {
        id: 'dialogue-node:marigold-picnic-rainbow-followup-1',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'The rainbow picnic can be spotted from halfway across the meadow. Subtle? No. Splendid? Absolutely.',
      },
    ],
  },
  {
    id: 'dialogue:marigold-picnic-followup',
    name: "Marigold's Picnic - Follow-up",
    startNodeId: 'dialogue-node:marigold-picnic-followup-1',
    nodes: [
      {
        id: 'dialogue-node:marigold-picnic-followup-1',
        type: 'line',
        speakerId: MARIGOLD_CHARACTER_ID,
        text: 'The picnic is ready on the meadow hill. Come and see what everyone has brought!',
      },
    ],
  },
] as const satisfies readonly DialogueDefinition[];

export const R4_PICNIC_DIALOGUE_VARIANT_SETS = [
  {
    id: MARIGOLD_PICNIC_VARIANTS_ID,
    variants: [
      {
        dialogueId: 'dialogue:marigold-picnic-sunshine-followup',
        priority: 300,
        conditions: [
          { type: 'world-flag', flagId: PICNIC_READY_FLAG, value: true },
          { type: 'world-flag', flagId: PICNIC_SUNSHINE_FLAG, value: true },
        ],
      },
      {
        dialogueId: 'dialogue:marigold-picnic-moonflower-followup',
        priority: 300,
        conditions: [
          { type: 'world-flag', flagId: PICNIC_READY_FLAG, value: true },
          { type: 'world-flag', flagId: PICNIC_MOONFLOWER_FLAG, value: true },
        ],
      },
      {
        dialogueId: 'dialogue:marigold-picnic-rainbow-followup',
        priority: 300,
        conditions: [
          { type: 'world-flag', flagId: PICNIC_READY_FLAG, value: true },
          { type: 'world-flag', flagId: PICNIC_RAINBOW_FLAG, value: true },
        ],
      },
      {
        dialogueId: 'dialogue:marigold-picnic-followup',
        priority: 100,
        conditions: [{ type: 'world-flag', flagId: PICNIC_READY_FLAG, value: true }],
      },
    ],
  },
] as const satisfies readonly DialogueVariantSet[];
