import { describe, expect, it } from 'vitest';
import { DEFAULT_UNICORN_APPEARANCE } from '../player/UnicornAppearance';
import {
  CREATOR_CATEGORIES,
  CREATOR_CONTROL_DESCRIPTORS,
  CreatorDraft,
  creatorCategoryLabel,
} from './CreatorProgressiveModel';

describe('CreatorProgressiveModel', () => {
  it('uses the six approved progressive landscape categories in order', () => {
    expect(CREATOR_CATEGORIES.map(({ id }) => id)).toEqual([
      'colours',
      'mane',
      'tail',
      'horn',
      'markings',
      'accessories',
    ]);
  });

  it('exposes short child-readable labels for category navigation', () => {
    expect(creatorCategoryLabel('mane')).toBe('Mane');
    expect(creatorCategoryLabel('tail')).toBe('Tail');
    expect(creatorCategoryLabel('accessories')).toBe('Accessories');
  });

  it('owns detached draft commands without changing the saved source', () => {
    const saved = { ...DEFAULT_UNICORN_APPEARANCE };
    const draft = new CreatorDraft(saved, true);
    draft.set('bodyColour', 'pink');
    expect(draft.appearance.bodyColour).toBe('pink');
    expect(saved.bodyColour).toBe('cream');
    draft.restoreOriginal();
    expect(draft.appearance).toEqual(saved);
  });

  it('describes every approved category without coordinate inference', () => {
    expect(new Set(CREATOR_CONTROL_DESCRIPTORS.map(({ category }) => category))).toEqual(
      new Set(['colours', 'mane', 'tail', 'horn', 'markings', 'accessories']),
    );
  });
});
