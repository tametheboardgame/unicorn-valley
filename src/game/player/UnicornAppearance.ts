export const BODY_COLOURS = [
  { id: 'cream', label: 'Cream', value: 0xfff4df },
  { id: 'pink', label: 'Blossom', value: 0xf6b7dc },
  { id: 'lavender', label: 'Lavender', value: 0xd6b9f1 },
  { id: 'mint', label: 'Mint', value: 0xbde5cc },
  { id: 'sky', label: 'Sky', value: 0xb8dcf2 },
] as const;

export const EYE_COLOURS = [
  { id: 'violet', label: 'Violet', value: 0x6f4a8e },
  { id: 'blue', label: 'Blue', value: 0x4a78a8 },
  { id: 'green', label: 'Green', value: 0x4f8967 },
  { id: 'amber', label: 'Amber', value: 0x9a713d },
] as const;

export const HAIR_COLOURS = [
  { id: 'plum', label: 'Plum', value: 0x9b65b5 },
  { id: 'rose', label: 'Rose', value: 0xe77fa8 },
  { id: 'aqua', label: 'Aqua', value: 0x69c8ca },
  { id: 'gold', label: 'Gold', value: 0xe8b85d },
  { id: 'midnight', label: 'Midnight', value: 0x55486e },
] as const;

export const MANE_STYLES = [
  { id: 'soft', label: 'Soft Waves' },
  { id: 'fluffy', label: 'Fluffy' },
  { id: 'swept', label: 'Side Swept' },
] as const;

export const TAIL_STYLES = [
  { id: 'swish', label: 'Big Swish' },
  { id: 'curl', label: 'Curly' },
  { id: 'ribbon', label: 'Ribbon Tail' },
] as const;

export const HORN_STYLES = [
  { id: 'classic', label: 'Classic' },
  { id: 'star', label: 'Star Tip' },
  { id: 'spiral', label: 'Spiral' },
] as const;

export const MARKINGS = [
  { id: 'none', label: 'No Marking' },
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
  { id: 'moon', label: 'Moon' },
] as const;

export const ACCESSORIES = [
  { id: 'none', label: 'No Accessory' },
  { id: 'flower', label: 'Flower Clip' },
  { id: 'bow', label: 'Little Bow' },
  { id: 'bell', label: 'Silver Bell' },
] as const;

export type BodyColourId = (typeof BODY_COLOURS)[number]['id'];
export type EyeColourId = (typeof EYE_COLOURS)[number]['id'];
export type HairColourId = (typeof HAIR_COLOURS)[number]['id'];
export type ManeStyleId = (typeof MANE_STYLES)[number]['id'];
export type TailStyleId = (typeof TAIL_STYLES)[number]['id'];
export type HornStyleId = (typeof HORN_STYLES)[number]['id'];
export type MarkingId = (typeof MARKINGS)[number]['id'];
export type AccessoryId = (typeof ACCESSORIES)[number]['id'];

export interface UnicornAppearance {
  bodyColour: BodyColourId;
  eyeColour: EyeColourId;
  maneStyle: ManeStyleId;
  maneColour: HairColourId;
  tailStyle: TailStyleId;
  tailColour: HairColourId;
  hornStyle: HornStyleId;
  marking: MarkingId;
  accessory: AccessoryId;
}

export const DEFAULT_UNICORN_APPEARANCE: UnicornAppearance = {
  bodyColour: 'cream',
  eyeColour: 'violet',
  maneStyle: 'soft',
  maneColour: 'plum',
  tailStyle: 'swish',
  tailColour: 'plum',
  hornStyle: 'classic',
  marking: 'star',
  accessory: 'flower',
};

export const DEFAULT_UNICORN_NAME = 'Starlight';

function validId<T extends readonly { id: string }[]>(
  choices: T,
  value: string | undefined,
  fallback: T[number]['id'],
): T[number]['id'] {
  return choices.some((choice) => choice.id === value) ? (value as T[number]['id']) : fallback;
}

export function parseUnicornAppearance(
  values: Readonly<Record<string, string>>,
): UnicornAppearance {
  return {
    bodyColour: validId(BODY_COLOURS, values.bodyColour, DEFAULT_UNICORN_APPEARANCE.bodyColour),
    eyeColour: validId(EYE_COLOURS, values.eyeColour, DEFAULT_UNICORN_APPEARANCE.eyeColour),
    maneStyle: validId(MANE_STYLES, values.maneStyle, DEFAULT_UNICORN_APPEARANCE.maneStyle),
    maneColour: validId(HAIR_COLOURS, values.maneColour, DEFAULT_UNICORN_APPEARANCE.maneColour),
    tailStyle: validId(TAIL_STYLES, values.tailStyle, DEFAULT_UNICORN_APPEARANCE.tailStyle),
    tailColour: validId(HAIR_COLOURS, values.tailColour, DEFAULT_UNICORN_APPEARANCE.tailColour),
    hornStyle: validId(HORN_STYLES, values.hornStyle, DEFAULT_UNICORN_APPEARANCE.hornStyle),
    marking: validId(MARKINGS, values.marking, DEFAULT_UNICORN_APPEARANCE.marking),
    accessory: validId(ACCESSORIES, values.accessory, DEFAULT_UNICORN_APPEARANCE.accessory),
  };
}

export function serialiseUnicornAppearance(appearance: UnicornAppearance): Record<string, string> {
  return { ...appearance };
}

export function normaliseUnicornName(value: string): string {
  const trimmed = value.trim().replace(/\s+/g, ' ').slice(0, 16);
  return trimmed || DEFAULT_UNICORN_NAME;
}

function randomChoice<T>(values: readonly T[], random: () => number): T {
  const index = Math.min(values.length - 1, Math.floor(random() * values.length));
  return values[Math.max(0, index)];
}

export function randomiseUnicornAppearance(random: () => number = Math.random): UnicornAppearance {
  return {
    bodyColour: randomChoice(BODY_COLOURS, random).id,
    eyeColour: randomChoice(EYE_COLOURS, random).id,
    maneStyle: randomChoice(MANE_STYLES, random).id,
    maneColour: randomChoice(HAIR_COLOURS, random).id,
    tailStyle: randomChoice(TAIL_STYLES, random).id,
    tailColour: randomChoice(HAIR_COLOURS, random).id,
    hornStyle: randomChoice(HORN_STYLES, random).id,
    marking: randomChoice(MARKINGS, random).id,
    accessory: randomChoice(ACCESSORIES, random).id,
  };
}

export function colourValue(choices: readonly { id: string; value: number }[], id: string): number {
  return choices.find((choice) => choice.id === id)?.value ?? choices[0].value;
}
