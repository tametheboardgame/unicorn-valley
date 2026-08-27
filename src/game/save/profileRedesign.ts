import {
  normaliseUnicornName,
  serialiseUnicornAppearance,
  type UnicornAppearance,
} from '../player/UnicornAppearance';
import type { SaveGame } from './saveSchema';

export function hasNamedUnicorn(save: SaveGame): boolean {
  return Boolean(save.profile.name);
}

export function applyProfileRedesign(
  save: SaveGame,
  rawName: string,
  appearance: UnicornAppearance,
): SaveGame {
  return {
    ...save,
    profile: {
      ...save.profile,
      name: normaliseUnicornName(rawName),
      appearance: serialiseUnicornAppearance(appearance),
    },
  };
}
