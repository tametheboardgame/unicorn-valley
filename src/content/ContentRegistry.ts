export interface IdentifiedContent<TId extends string> {
  id: TId;
}

export class ContentRegistry<TId extends string, TEntry extends IdentifiedContent<TId>> {
  private readonly entriesById = new Map<TId, TEntry>();

  public constructor(
    private readonly label: string,
    entries: readonly TEntry[],
  ) {
    for (const entry of entries) {
      if (this.entriesById.has(entry.id)) {
        throw new Error(`Duplicate ${this.label} ID: ${entry.id}`);
      }

      this.entriesById.set(entry.id, entry);
    }
  }

  public get(id: TId): TEntry {
    const entry = this.entriesById.get(id);
    if (!entry) {
      throw new Error(`Unknown ${this.label} ID: ${id}`);
    }

    return entry;
  }

  public has(id: TId): boolean {
    return this.entriesById.has(id);
  }

  public values(): readonly TEntry[] {
    return [...this.entriesById.values()];
  }
}
