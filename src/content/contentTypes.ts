export type ItemId = `item:${string}`;
export type CharacterId = `character:${string}`;
export type QuestId = `quest:${string}`;
export type DiscoveryId = `discovery:${string}`;
export type DialogueId = `dialogue:${string}`;
export type DialogueNodeId = `dialogue-node:${string}`;
export type DialogueFlagId = `flag:${string}`;
export type DialogueVariantSetId = `dialogue-variants:${string}`;

export type ItemCategory = 'collectable' | 'quest' | 'reward' | 'decoration' | 'accessory' | 'food';
export type FriendshipTier = 'just-met' | 'friend' | 'good-friend' | 'best-friend';
export type DialogueQuestStatus = 'not-started' | 'active' | 'completed';

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description?: string;
  category?: ItemCategory;
  icon?: string;
  discoveryId?: DiscoveryId;
  questCritical?: boolean;
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  role: string;
}

export interface DiscoveryDefinition {
  id: DiscoveryId;
  name: string;
  description: string;
}

export type DialogueEffect = {
  type: 'set-flag';
  flagId: DialogueFlagId;
  value: boolean;
};

export type DialogueCondition =
  | {
      type: 'minimum-friendship-tier';
      characterId: CharacterId;
      tier: FriendshipTier;
    }
  | {
      type: 'relationship-flag';
      characterId: CharacterId;
      flag: string;
      value?: boolean;
    }
  | {
      type: 'quest-status';
      questId: QuestId;
      status: DialogueQuestStatus;
    }
  | {
      type: 'world-flag';
      flagId: DialogueFlagId;
      value: boolean;
    };

export interface DialogueChoice {
  id: string;
  label: string;
  nextNodeId?: DialogueNodeId;
  effects?: readonly DialogueEffect[];
}

export type DialogueNode =
  | {
      id: DialogueNodeId;
      type: 'line';
      speakerId: CharacterId;
      text: string;
      nextNodeId?: DialogueNodeId;
    }
  | {
      id: DialogueNodeId;
      type: 'choice';
      speakerId: CharacterId;
      prompt: string;
      choices: readonly DialogueChoice[];
    };

export interface DialogueDefinition {
  id: DialogueId;
  name: string;
  startNodeId: DialogueNodeId;
  nodes: readonly DialogueNode[];
}

export interface DialogueVariant {
  dialogueId: DialogueId;
  priority?: number;
  conditions?: readonly DialogueCondition[];
}

export interface DialogueVariantSet {
  id: DialogueVariantSetId;
  variants: readonly DialogueVariant[];
}

export type QuestStep =
  | {
      type: 'talk-to-character';
      characterId: CharacterId;
    }
  | {
      type: 'collect-item';
      itemId: ItemId;
      quantity: number;
    }
  | {
      type: 'unlock-discovery';
      discoveryId: DiscoveryId;
    }
  | {
      type: 'finish-race';
      raceId: string;
      label: string;
    }
  | {
      type: 'award-item';
      itemId: ItemId;
      quantity: number;
    }
  | {
      type: 'consume-item';
      itemId: ItemId;
      quantity: number;
    }
  | {
      type: 'award-friendship';
      characterId: CharacterId;
      amount: number;
    }
  | {
      type: 'set-world-flag';
      flagId: DialogueFlagId;
      value: boolean;
    };

export interface QuestDefinition {
  id: QuestId;
  name: string;
  steps: readonly QuestStep[];
}

export interface ContentBundle {
  items: readonly ItemDefinition[];
  characters: readonly CharacterDefinition[];
  quests: readonly QuestDefinition[];
  discoveries: readonly DiscoveryDefinition[];
  dialogues: readonly DialogueDefinition[];
  dialogueVariantSets: readonly DialogueVariantSet[];
}
