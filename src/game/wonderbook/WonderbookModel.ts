import type { DiscoveryDefinition, DiscoveryId, DiscoveryKind } from '../../content/contentTypes';

export const WONDERBOOK_ENTRIES_PER_PAGE = 2;

export interface WonderbookEntry {
  id: DiscoveryId;
  name: string;
  description: string;
  discovered: boolean;
  kind: DiscoveryKind;
  icon?: string;
  undiscoveredHint?: string;
}

export interface WonderbookSpread {
  index: number;
  leftPageNumber: number;
  rightPageNumber: number;
  left: readonly WonderbookEntry[];
  right: readonly WonderbookEntry[];
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
      const leftRank =
        left.kind === 'secret' && left.discovered ? 0 : left.kind === 'secret' ? 2 : 1;
      const rightRank =
        right.kind === 'secret' && right.discovered ? 0 : right.kind === 'secret' ? 2 : 1;
      return leftRank - rightRank || left.index - right.index;
    })
    .map(({ index: _index, ...entry }) => entry);
}

export function paginateWonderbookEntries(
  entries: readonly WonderbookEntry[],
  entriesPerPage = WONDERBOOK_ENTRIES_PER_PAGE,
): readonly WonderbookSpread[] {
  const safeEntriesPerPage = Math.max(1, Math.floor(entriesPerPage));
  const entriesPerSpread = safeEntriesPerPage * 2;
  const spreads: WonderbookSpread[] = [];

  for (let offset = 0; offset < entries.length; offset += entriesPerSpread) {
    const index = spreads.length;
    const spreadEntries = entries.slice(offset, offset + entriesPerSpread);
    spreads.push({
      index,
      leftPageNumber: index * 2 + 1,
      rightPageNumber: index * 2 + 2,
      left: spreadEntries.slice(0, safeEntriesPerPage),
      right: spreadEntries.slice(safeEntriesPerPage),
    });
  }

  if (spreads.length === 0) {
    spreads.push({
      index: 0,
      leftPageNumber: 1,
      rightPageNumber: 2,
      left: [],
      right: [],
    });
  }

  return spreads;
}
