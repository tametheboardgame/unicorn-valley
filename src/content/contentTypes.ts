export type ItemId = `item:${string}`;
export type CharacterId = `character:${string}`;
export type QuestId = `quest:${string}`;
export type DiscoveryId = `discovery:${string}`;
export type DialogueId = `dialogue:${string}`;
export type DialogueNodeId = `dialogue-node:${string}`;
export type DialogueFlagId = `flag:${string}`;

export interface ItemDefinition {
  id: ItemId;
  name: string;
  discoveryId?: DiscoveryId;
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
}
