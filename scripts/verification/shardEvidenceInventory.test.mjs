import assert from 'node:assert/strict';
import test from 'node:test';
import { validateShardArtifactNames } from './shardEvidenceInventory.mjs';

const collection = (count) =>
  Array.from({ length: count }, (_, i) => 'tier3-chromium-' + (i + 1) + '-of-' + count);

test('every bounded shard count retains exactly one complete, ordered artifact inventory', () => {
  for (const count of [6, 8, 10, 12]) {
    const items = collection(count);
    assert.deepEqual(validateShardArtifactNames([...items].reverse()), {
      total: count,
      names: items,
    });
  }
});

test('rejects missing, duplicated, mixed, out-of-range and forged artifacts', () => {
  assert.throws(() => validateShardArtifactNames([]), /Missing/);
  for (const count of [6, 8, 10, 12]) {
    const items = collection(count);
    assert.throws(() => validateShardArtifactNames(items.slice(1)), /incomplete/);
    assert.throws(
      () => validateShardArtifactNames([...items.slice(0, -1), items[0]]),
      /Duplicated/,
    );
    assert.throws(
      () => validateShardArtifactNames([...items.slice(0, -1), 'tier3-chromium-1-of-6']),
      /Mixed|Duplicated/,
    );
    assert.throws(
      () => validateShardArtifactNames([...items.slice(0, -1), 'tier3-chromium-0-of-' + count]),
      /out-of-range/,
    );
    assert.throws(
      () => validateShardArtifactNames([...items.slice(0, -1), 'tier3-chromium-x-of-' + count]),
      /Unexpected/,
    );
  }
  assert.throws(() => validateShardArtifactNames(collection(7)), /Unsupported/);
});
