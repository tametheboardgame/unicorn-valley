export type ItemId = `item:${string}`;
export type CharacterId = `character:${string}`;
export type QuestId = `quest:${string}`;
export type DiscoveryId = `discovery:${string}`;

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
}
