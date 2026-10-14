/** Reject mixed-count, incomplete, duplicated or forged Tier 3 artifact collections. */
export function validateShardArtifactNames(names) {
  if (!Array.isArray(names) || !names.length) {
    throw new Error('Missing full Chromium shard artifacts');
  }
  const parsed = names.map((name) => {
    const match = /^tier3-chromium-(\d+)-of-(\d+)$/.exec(name);
    if (!match) throw new Error('Unexpected Chromium shard artifact: ' + name);
    const id = Number(match[1]);
    const total = Number(match[2]);
    if (![6, 8, 10, 12].includes(total) || id < 1 || id > total) {
      throw new Error('Unsupported or out-of-range Chromium shard artifact: ' + name);
    }
    return { id, total, name };
  });
  const total = parsed[0].total;
  if (parsed.some((x) => x.total !== total) || parsed.length !== total) {
    throw new Error('Mixed or incomplete Chromium shard artifact count');
  }
  const seen = new Set(parsed.map((x) => x.id));
  if (
    seen.size !== total ||
    parsed.some((x) => x.name !== 'tier3-chromium-' + x.id + '-of-' + total)
  ) {
    throw new Error('Duplicated, missing or misnamed Chromium shard artifacts');
  }
  return {
    total,
    names: parsed.sort((a, b) => a.id - b.id).map((x) => x.name),
  };
}
