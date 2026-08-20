import type { DiscoveryDefinition, DiscoveryId, DiscoveryKind } from '../../content/contentTypes';

export interface WonderbookEntry {
  id: DiscoveryId;
  name: string;
  description: string;
  discovered: boolean;
  kind: DiscoveryKind;
  icon?: string;
  undiscoveredHint?: string;
}

export function buildWonderbookEntries(
  discoveries: readonly DiscoveryDefinition[],
  discoveredIds: readonly string[],
): readonly WonderbookEntry[] {
  const discovered = new Set(discoveredIds);

  return discoveries
    .map((entry, index) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description,
      discovered: discovered.has(entry.id),
      kind: entry.kind ?? 'standard',
      icon: entry.icon,
      undiscoveredHint: entry.undiscoveredHint,
      index,
    }))
    .sort((left, right) => {
      const leftRank = left.kind === 'secret' && left.discovered ? 0 : left.kind === 'secret' ? 2 : 1;
      const rightRank =
        right.kind === 'secret' && right.discovered ? 0 : right.kind === 'secret' ? 2 : 1;
      return leftRank - rightRank || left.index - right.index;
    })
    .map(({ index: _index, ...entry }) => entry);
}
