import { describe, expect, it } from 'vitest';
import { isBlockingExplorationObject } from './ExplorationMovementBlocker';

describe('isBlockingExplorationObject', () => {
  it('blocks movement only for a visible active controls modal', () => {
    expect(isBlockingExplorationObject('exploration-controls-panel', true, true)).toBe(true);
    expect(isBlockingExplorationObject('exploration-controls-panel', true, false)).toBe(false);
  });

  it('does not block movement for ordinary feedback overlays', () => {
    expect(isBlockingExplorationObject('crystal-brook-story-feedback', true, true)).toBe(false);
  });
});
