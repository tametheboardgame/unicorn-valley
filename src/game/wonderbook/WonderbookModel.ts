import type { DiscoveryDefinition, DiscoveryId } from '../../content/contentTypes';

export interface WonderbookEntry {
  id: DiscoveryId;
  name: string;
  description: string;
  discovered: boolean;
}

export function buildWonderbookEntries(
  discoveries: readonly DiscoveryDefinition[],
  discoveredIds: readonly string[],
): readonly WonderbookEntry[] {
  const discovered = new Set(discoveredIds);

  return discoveries.map((entry) => ({
    id: entry.id,
    name: entry.name,
    description: entry.description,
    discovered: discovered.has(entry.id),
  }));
}
