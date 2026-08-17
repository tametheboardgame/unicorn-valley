import { describe, expect, it } from 'vitest';
import {
  DEFAULT_UNICORN_APPEARANCE,
  DEFAULT_UNICORN_NAME,
  normaliseUnicornName,
  parseUnicornAppearance,
  randomiseUnicornAppearance,
  serialiseUnicornAppearance,
} from './UnicornAppearance';

describe('unicorn appearance', () => {
  it('uses a complete good-looking default when stored values are missing or invalid', () => {
    expect(parseUnicornAppearance({ bodyColour: 'not-real' })).toEqual(DEFAULT_UNICORN_APPEARANCE);
  });

  it('round-trips all creator choices through the save appearance map', () => {
    const appearance = {
      ...DEFAULT_UNICORN_APPEARANCE,
      bodyColour: 'mint' as const,
      eyeColour: 'amber' as const,
      maneStyle: 'fluffy' as const,
      tailStyle: 'curl' as const,
      hornStyle: 'star' as const,
      marking: 'heart' as const,
      accessory: 'bell' as const,
    };

    expect(parseUnicornAppearance(serialiseUnicornAppearance(appearance))).toEqual(appearance);
  });

  it('normalises a blank or overlong name safely', () => {
    expect(normaliseUnicornName('   ')).toBe(DEFAULT_UNICORN_NAME);
    expect(normaliseUnicornName('  Moon   Flower  Sparkle   ')).toBe('Moon Flower Spar');
  });

  it('can randomise every cosmetic category deterministically for tests', () => {
    const values = [0.99, 0, 0.51, 0.75, 0.34, 0.2, 0.8, 0.6, 0.4];
    let index = 0;
    const randomised = randomiseUnicornAppearance(() => values[index++] ?? 0);

    expect(randomised.bodyColour).toBe('sky');
    expect(randomised.eyeColour).toBe('violet');
    expect(randomised.maneStyle).toBe('fluffy');
    expect(randomised.accessory).not.toBeUndefined();
  });
});
