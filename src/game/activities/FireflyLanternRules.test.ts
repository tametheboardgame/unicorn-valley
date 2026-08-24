import { describe, expect, it } from 'vitest';
import {
  FIREFLY_ENDLESS_GLOW_THRESHOLD,
  FIREFLY_ENDLESS_MASTERY_THRESHOLD,
  FIREFLY_MULTICOLOUR_MISTAKE_LIMIT,
  FIREFLY_NORMAL_TARGET,
  FIREFLY_NORMAL_TUNING,
  getEndlessTuning,
  getMulticolourFireflyColour,
  isMulticolourAttemptFinished,
  normalCompletionCopy,
} from './FireflyLanternRules';

describe('R5-WP5.9F Firefly Lantern rules', () => {
  it('makes the three Normal difficulty tiers mechanically distinct', () => {
    expect(FIREFLY_NORMAL_TUNING.gentle.lifetimeMs).toBeGreaterThan(
      FIREFLY_NORMAL_TUNING.classic.lifetimeMs,
    );
    expect(FIREFLY_NORMAL_TUNING.classic.lifetimeMs).toBeGreaterThan(
      FIREFLY_NORMAL_TUNING.swift.lifetimeMs,
    );
    expect(FIREFLY_NORMAL_TUNING.gentle.hitSize).toBeGreaterThan(
      FIREFLY_NORMAL_TUNING.swift.hitSize,
    );
  });

  it('mixes yellow targets with several decoy colours', () => {
    const colours = Array.from({ length: 12 }, (_, index) => getMulticolourFireflyColour(index));

    expect(colours.filter((colour) => colour === 'yellow').length).toBeGreaterThanOrEqual(4);
    expect(new Set(colours.filter((colour) => colour !== 'yellow')).size).toBeGreaterThanOrEqual(3);
  });

  it('ends Multicolour after eight correct catches or three mistakes', () => {
    expect(isMulticolourAttemptFinished(FIREFLY_NORMAL_TARGET, 0)).toBe(true);
    expect(isMulticolourAttemptFinished(3, FIREFLY_MULTICOLOUR_MISTAKE_LIMIT)).toBe(true);
    expect(isMulticolourAttemptFinished(7, 2)).toBe(false);
  });

  it('ramps Endless pressure while retaining safe floors', () => {
    const start = getEndlessTuning(0);
    const glow = getEndlessTuning(FIREFLY_ENDLESS_GLOW_THRESHOLD);
    const mastery = getEndlessTuning(FIREFLY_ENDLESS_MASTERY_THRESHOLD);
    const extreme = getEndlessTuning(500);

    expect(glow.lifetimeMs).toBeLessThan(start.lifetimeMs);
    expect(mastery.hitSize).toBeLessThan(glow.hitSize);
    expect(extreme.lifetimeMs).toBeGreaterThanOrEqual(850);
    expect(extreme.hitSize).toBeGreaterThanOrEqual(62);
    expect(extreme.spawnDelayMs).toBeGreaterThanOrEqual(130);
  });

  it('never claims a perfect Normal run missed or lost lights', () => {
    const copy = normalCompletionCopy(FIREFLY_NORMAL_TARGET).toLowerCase();

    expect(copy).not.toContain('miss');
    expect(copy).not.toContain('wander');
    expect(copy).toContain('every light');
  });
});
