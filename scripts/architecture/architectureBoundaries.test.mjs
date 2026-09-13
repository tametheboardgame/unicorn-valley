import assert from 'node:assert/strict';
import test from 'node:test';
import { extractImportSpecifiers, validateDependency } from './architectureBoundaries.mjs';

test('rejects a persistence dependency on a scene implementation', () => {
  const violations = validateDependency(
    'src/game/save/FakePersistenceOwner.ts',
    '../scenes/FakeScene',
  );

  assert.equal(violations.length, 1);
  assert.equal(violations[0].ruleId, 'persistence-does-not-own-orchestration-or-presentation');
  assert.equal(violations[0].resolvedTarget, 'src/game/scenes/FakeScene');
});

test('rejects a persistence dependency on application orchestration', () => {
  const violations = validateDependency(
    'src/game/save/FakePersistenceOwner.ts',
    '../application/FakeCoordinator',
  );

  assert.equal(violations.length, 1);
});

test('allows persistence dependencies on lower-level typed event infrastructure', () => {
  assert.deepEqual(
    validateDependency('src/game/save/SaveService.ts', '../events/GameEventBus'),
    [],
  );
});

test('extracts static, re-export and dynamic relative imports', () => {
  const source = `
    import type { SaveGame } from './saveSchema';
    export { thing } from '../world/Thing';
    const lazy = import('../scenes/LazyScene');
  `;

  assert.deepEqual(
    extractImportSpecifiers(source).sort(),
    ['./saveSchema', '../scenes/LazyScene', '../world/Thing'].sort(),
  );
});
