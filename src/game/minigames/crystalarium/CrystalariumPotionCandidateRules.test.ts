import { describe, expect, it } from 'vitest';
import {
  createC20PotionTrial,
  trialC20Potion,
  validC20PotionCandidate,
} from './CrystalariumPotionCandidateRules';

describe('C20 Gate D pure economic candidates (not live gameplay)', () => {
  for (const capacity of [100, 150, 200] as const) {
    for (const recovery of ['brook-spring', 'free-basic-at-zero'] as const) {
      it(`makes a finite, transparent ${capacity} / ${recovery} candidate`, () => {
        const candidate = createC20PotionTrial(capacity, recovery);
        expect(validC20PotionCandidate(candidate)).toBe(true);
        expect(candidate.capacity).toBe(capacity);
        expect(candidate.basicCost).toBe(1);
        expect(candidate.refinedCost).toBe(2);
      });

      it(`never charges ${capacity} / ${recovery} for blocked or unsaved growth`, () => {
        const candidate = createC20PotionTrial(capacity, recovery);
        const state = { remaining: 7 };
        for (const action of ['basic', 'refined', 'merge', 'offer', 'refill'] as const) {
          expect(
            trialC20Potion(candidate, state, action, { accepted: false, saved: true }),
          ).toEqual({
            accepted: false,
            state,
            spent: 0,
            awarded: 0,
            reason: 'No accepted, saved action.',
          });
          expect(
            trialC20Potion(candidate, state, action, { accepted: true, saved: false }).state,
          ).toBe(state);
        }
      });

      it(`caps awards and excludes negative stock in ${capacity} / ${recovery}`, () => {
        const candidate = createC20PotionTrial(capacity, recovery);
        const saved = { accepted: true, saved: true };
        const nearFull = { remaining: capacity - 1 };
        expect(trialC20Potion(candidate, nearFull, 'offer', saved).state.remaining).toBe(capacity);
        expect(trialC20Potion(candidate, nearFull, 'offer', saved).awarded).toBe(1);
        const empty = { remaining: 0 };
        expect(trialC20Potion(candidate, empty, 'refined', saved)).toMatchObject({
          accepted: false,
          state: empty,
          spent: 0,
        });
      });
    }
  }

  it('Brook Spring instantly restores 25 free units, including from zero', () => {
    const candidate = createC20PotionTrial(100, 'brook-spring');
    const saved = { accepted: true, saved: true };
    const dry = { remaining: 0 };
    expect(trialC20Potion(candidate, dry, 'basic', saved)).toMatchObject({
      accepted: false,
      state: dry,
    });
    expect(trialC20Potion(candidate, dry, 'refill', saved)).toMatchObject({
      accepted: true,
      state: { remaining: 25 },
      awarded: 25,
    });
    const recovered = trialC20Potion(candidate, dry, 'refill', saved).state;
    expect(trialC20Potion(candidate, recovered, 'basic', saved).state.remaining).toBe(24);
    expect(trialC20Potion(candidate, { remaining: 95 }, 'refill', saved).state.remaining).toBe(100);
  });

  it('free-basic mode can always grow at zero, but never grants a free refined shard', () => {
    const candidate = createC20PotionTrial(100, 'free-basic-at-zero');
    const saved = { accepted: true, saved: true };
    const dry = { remaining: 0 };
    const basic = trialC20Potion(candidate, dry, 'basic', saved);
    expect(basic).toMatchObject({ accepted: true, state: { remaining: 0 }, spent: 0 });
    expect(trialC20Potion(candidate, dry, 'refined', saved).accepted).toBe(false);
    expect(trialC20Potion(candidate, dry, 'refill', saved).accepted).toBe(false);
  });

  it('repeated actions are never silently charged after the last drop', () => {
    const candidate = createC20PotionTrial(150, 'brook-spring');
    const saved = { accepted: true, saved: true };
    const last = trialC20Potion(candidate, { remaining: 1 }, 'basic', saved);
    expect(last).toMatchObject({ accepted: true, state: { remaining: 0 }, spent: 1 });
    const next = trialC20Potion(candidate, last.state, 'basic', saved);
    expect(next).toMatchObject({ accepted: false, spent: 0, awarded: 0 });
    expect(next.state).toBe(last.state);
  });

  it('invalid candidate and invalid snapshot never mutate the trial state', () => {
    const candidate = createC20PotionTrial(100, 'brook-spring');
    const saved = { accepted: true, saved: true };
    for (const value of [-1, 101, 0.2, Number.NaN, Number.POSITIVE_INFINITY]) {
      const input = { remaining: value };
      expect(trialC20Potion(candidate, input, 'basic', saved).state).toBe(input);
    }
    const broken = { ...candidate, basicCost: -1 };
    expect(validC20PotionCandidate(broken)).toBe(false);
    const input = { remaining: 10 };
    expect(trialC20Potion(broken, input, 'basic', saved).state).toBe(input);
  });

  it('proves no hard wait in a long dry campaign: infinite free basic continuation', () => {
    const candidate = createC20PotionTrial(100, 'free-basic-at-zero');
    const saved = { accepted: true, saved: true };
    let state = { remaining: 0 };
    for (let i = 0; i < 1000; i += 1) {
      const result = trialC20Potion(candidate, state, 'basic', saved);
      expect(result.accepted).toBe(true);
      state = result.state;
    }
    expect(state.remaining).toBe(0);
  });

  it('proves Brook Spring can replenish every dry step without a timer', () => {
    const candidate = createC20PotionTrial(100, 'brook-spring');
    const saved = { accepted: true, saved: true };
    let state = { remaining: 0 };
    let refills = 0;
    for (let i = 0; i < 500; i += 1) {
      if (state.remaining === 0) {
        const refill = trialC20Potion(candidate, state, 'refill', saved);
        expect(refill.accepted).toBe(true);
        state = refill.state;
        refills += 1;
      }
      const growth = trialC20Potion(candidate, state, 'basic', saved);
      expect(growth.accepted).toBe(true);
      state = growth.state;
    }
    expect(refills).toBe(20);
    expect(state.remaining).toBe(0);
  });
});
