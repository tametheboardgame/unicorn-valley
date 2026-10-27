import { describe, expect, it } from 'vitest';
import { CrystalariumGuide, crystalariumGuideKey, guideStage } from './CrystalariumGuide';
import {
  createCrystalariumFullState,
  moveOrMergeCrystal,
  offerResonancePattern,
  spawnCrystal,
} from './CrystalariumFullRules';

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe('H6.9C9 optional child-first guide', () => {
  it('teaches accepted Grow → merge → pictured offer, then dismisses without touching game saves', () => {
    const store = memoryStorage();
    const initial = createCrystalariumFullState();
    const guide = new CrystalariumGuide('just-games', initial, store);
    expect(guide.getPrompt()?.stage).toBe('grow');
    const grown = spawnCrystal(initial);
    expect(grown.accepted).toBe(true);
    if (!grown.accepted) return;
    guide.observe(initial, grown.state);
    expect(guide.getPrompt()?.stage).toBe('merge');
    const merged = moveOrMergeCrystal(grown.state, 0, 1);
    expect(merged.accepted).toBe(true);
    if (!merged.accepted) return;
    guide.observe(grown.state, merged.state);
    expect(guide.getPrompt()?.stage).toBe('offer');
    const offered = offerResonancePattern(merged.state);
    expect(offered.accepted).toBe(true);
    if (!offered.accepted) return;
    guide.observe(merged.state, offered.state);
    expect(guide.getPrompt()).toBeNull();
    expect(store.values.get(crystalariumGuideKey('just-games'))).toBe('seen');
    expect(store.values.get(crystalariumGuideKey('world'))).toBeUndefined();
    guide.replay(offered.state);
    expect(guide.getPrompt()?.stage).toBe('explore');
  });

  it('does not advance after rejected actions, and can be skipped/replayed', () => {
    const store = memoryStorage();
    const initial = createCrystalariumFullState();
    const guide = new CrystalariumGuide('world', initial, store);
    guide.observe(initial, initial);
    expect(guide.getPrompt()?.stage).toBe('grow');
    guide.skip();
    expect(guide.getPrompt()).toBeNull();
    expect(new CrystalariumGuide('world', initial, store).getPrompt()).toBeNull();
    expect(new CrystalariumGuide('just-games', initial, store).getPrompt()?.stage).toBe('grow');
    guide.replay(initial);
    expect(guide.getPrompt()?.stage).toBe('grow');
  });

  it('starts at a sensible actual-board stage, never overwriting progress', () => {
    const initial = createCrystalariumFullState();
    expect(guideStage(initial)).toBe('grow');
    const grow = spawnCrystal(initial);
    expect(grow.accepted).toBe(true);
    if (!grow.accepted) return;
    expect(guideStage(grow.state)).toBe('merge');
    const merge = moveOrMergeCrystal(grow.state, 0, 1);
    expect(merge.accepted).toBe(true);
    if (!merge.accepted) return;
    expect(guideStage(merge.state)).toBe('offer');
    const completed = offerResonancePattern(merge.state);
    expect(completed.accepted).toBe(true);
    if (!completed.accepted) return;
    expect(guideStage(completed.state)).toBe('explore');
  });

  it('keeps working when the optional guide preference store is unavailable', () => {
    const store = {
      getItem: (_key: string): string | null => {
        throw new Error('blocked');
      },
      setItem: (_key: string, _value: string): void => {
        throw new Error('blocked');
      },
    };
    const guide = new CrystalariumGuide('just-games', createCrystalariumFullState(), store);
    expect(guide.getPrompt()?.stage).toBe('grow');
    expect(() => guide.skip()).not.toThrow();
    expect(guide.getPrompt()).toBeNull();
  });
});
