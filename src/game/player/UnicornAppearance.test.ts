import { describe, expect, it } from 'vitest';
import {
  ACCESSORIES,
  BODY_COLOURS,
  DEFAULT_UNICORN_APPEARANCE,
  DEFAULT_UNICORN_NAME,
  EYE_COLOURS,
  HAIR_COLOURS,
  HORN_STYLES,
  MANE_STYLES,
  MARKINGS,
  normaliseUnicornName,
  parseUnicornAppearance,
  randomiseUnicornAppearance,
  serialiseUnicornAppearance,
  TAIL_STYLES,
  UNICORN_COSMETIC_REGISTRY,
  type UnicornAppearance,
  validateUnicornCosmeticRegistry,
} from './UnicornAppearance';

describe('unicorn appearance', () => {
  it('uses a complete good-looking default when stored values are missing or invalid', () => {
    expect(parseUnicornAppearance({ bodyColour: 'not-real' })).toEqual(DEFAULT_UNICORN_APPEARANCE);
  });

  it('round-trips existing and Creator Plus choices through the save appearance map', () => {
    const appearance = {
      ...DEFAULT_UNICORN_APPEARANCE,
      bodyColour: 'peach' as const,
      eyeColour: 'rose' as const,
      maneStyle: 'braid' as const,
      maneColour: 'lilac' as const,
      tailStyle: 'puff' as const,
      tailColour: 'ice' as const,
      hornStyle: 'crystal' as const,
      marking: 'sparkles' as const,
      accessory: 'crown' as const,
    };

    expect(parseUnicornAppearance(serialiseUnicornAppearance(appearance))).toEqual(appearance);
  });

  it('normalises a blank or overlong name safely', () => {
    expect(normaliseUnicornName('   ')).toBe(DEFAULT_UNICORN_NAME);
    expect(normaliseUnicornName('  Moon   Flower  Sparkle   ')).toBe('Moon Flower Spar');
  });

  it('can randomise every cosmetic category using the complete registered option sets', () => {
    const randomised = randomiseUnicornAppearance(() => 0.999);

    expect(randomised.bodyColour).toBe(BODY_COLOURS.at(-1)?.id);
    expect(randomised.eyeColour).toBe(EYE_COLOURS.at(-1)?.id);
    expect(randomised.maneStyle).toBe(MANE_STYLES.at(-1)?.id);
    expect(randomised.maneColour).toBe(HAIR_COLOURS.at(-1)?.id);
    expect(randomised.tailStyle).toBe(TAIL_STYLES.at(-1)?.id);
    expect(randomised.tailColour).toBe(HAIR_COLOURS.at(-1)?.id);
    expect(randomised.hornStyle).toBe(HORN_STYLES.at(-1)?.id);
    expect(randomised.marking).toBe(MARKINGS.at(-1)?.id);
    expect(randomised.accessory).toBe(ACCESSORIES.at(-1)?.id);
  });

  it('keeps the cosmetic registry complete, labelled and duplicate-free', () => {
    expect(validateUnicornCosmeticRegistry()).toEqual([]);
    expect(BODY_COLOURS.length).toBeGreaterThanOrEqual(8);
    expect(MANE_STYLES.length).toBeGreaterThanOrEqual(5);
    expect(TAIL_STYLES.length).toBeGreaterThanOrEqual(5);
    expect(HORN_STYLES.length).toBeGreaterThanOrEqual(5);
    expect(MARKINGS.length).toBeGreaterThanOrEqual(6);
    expect(ACCESSORIES.length).toBeGreaterThanOrEqual(7);
  });

  it('keeps every default and registered cosmetic id parser-compatible', () => {
    const categories = Object.keys(UNICORN_COSMETIC_REGISTRY) as Array<keyof UnicornAppearance>;

    for (const category of categories) {
      const choices = UNICORN_COSMETIC_REGISTRY[category];
      const registeredIds = choices.map((choice) => choice.id as string);
      expect(registeredIds, `${category} should not be empty`).not.toHaveLength(0);
      expect(registeredIds, `${category} should contain its default`).toContain(
        DEFAULT_UNICORN_APPEARANCE[category],
      );

      for (const choice of choices) {
        const parsed = parseUnicornAppearance({ [category]: choice.id });
        expect(parsed[category], `${category}:${choice.id} should survive parsing`).toBe(choice.id);
      }
    }
  });

  it('keeps every registered cross-category pair compatible', () => {
    const categories = Object.keys(UNICORN_COSMETIC_REGISTRY) as Array<keyof UnicornAppearance>;

    for (let firstIndex = 0; firstIndex < categories.length; firstIndex += 1) {
      const firstCategory = categories[firstIndex];
      for (let secondIndex = firstIndex + 1; secondIndex < categories.length; secondIndex += 1) {
        const secondCategory = categories[secondIndex];

        for (const firstChoice of UNICORN_COSMETIC_REGISTRY[firstCategory]) {
          for (const secondChoice of UNICORN_COSMETIC_REGISTRY[secondCategory]) {
            const parsed = parseUnicornAppearance({
              [firstCategory]: firstChoice.id,
              [secondCategory]: secondChoice.id,
            });
            expect(
              parsed[firstCategory],
              `${firstCategory}:${firstChoice.id} should remain compatible with ${secondCategory}:${secondChoice.id}`,
            ).toBe(firstChoice.id);
            expect(
              parsed[secondCategory],
              `${secondCategory}:${secondChoice.id} should remain compatible with ${firstCategory}:${firstChoice.id}`,
            ).toBe(secondChoice.id);
          }
        }
      }
    }
  });
});
