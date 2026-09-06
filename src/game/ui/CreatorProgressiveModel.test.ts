import { describe, expect, it } from 'vitest';
import { CREATOR_CATEGORIES, creatorCategoryLabel } from './CreatorProgressiveModel';

describe('CreatorProgressiveModel', () => {
  it('uses the six approved progressive landscape categories in order', () => {
    expect(CREATOR_CATEGORIES.map(({ id }) => id)).toEqual([
      'main',
      'colours',
      'mane-tail',
      'horn',
      'markings',
      'accessories',
    ]);
  });

  it('exposes short child-readable labels for category navigation', () => {
    expect(creatorCategoryLabel('main')).toBe('Main');
    expect(creatorCategoryLabel('mane-tail')).toBe('Mane & Tail');
    expect(creatorCategoryLabel('accessories')).toBe('Accessories');
  });
});
