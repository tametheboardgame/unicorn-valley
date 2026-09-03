import { describe, expect, it } from 'vitest';
import { COTTAGE_INTERIOR_LOCATION_ID } from '../world/CottageInteriorMap';
import { CRYSTAL_BROOK_LOCATION_ID } from '../world/CrystalBrookMap';
import { RAINBOW_MEADOW_LOCATION_ID } from '../world/RainbowMeadowMap';
import { STARLIGHT_BEACH_LOCATION_ID } from '../world/StarlightBeachMap';
import { SUNBEAM_VILLAGE_LOCATION_ID } from '../world/SunbeamVillageMap';
import { WHISPERING_WOODS_LOCATION_ID } from '../world/WhisperingWoodsMap';
import { CONTINUE_LOCATION_IDS, resolveContinueDestination } from './ContinueLocation';
import { DEFAULT_START_LOCATION_ID } from './saveSchema';
import { MOONFLOWER_GLADE_LOCATION_ID } from './saveLocationCheckpoint';

describe('continue-location contract', () => {
  it.each([
    [DEFAULT_START_LOCATION_ID, 'CottageInteriorScene'],
    [COTTAGE_INTERIOR_LOCATION_ID, 'CottageInteriorScene'],
    [MOONFLOWER_GLADE_LOCATION_ID, 'MoonflowerGladeScene'],
    [SUNBEAM_VILLAGE_LOCATION_ID, 'SunbeamVillageScene'],
    [RAINBOW_MEADOW_LOCATION_ID, 'RainbowMeadowScene'],
    [CRYSTAL_BROOK_LOCATION_ID, 'CrystalBrookScene'],
    [WHISPERING_WOODS_LOCATION_ID, 'WhisperingWoodsScene'],
    [STARLIGHT_BEACH_LOCATION_ID, 'StarlightBeachScene'],
  ])('restores %s into %s', (locationId, sceneKey) => {
    expect(resolveContinueDestination(locationId).sceneKey).toBe(sceneKey);
  });

  it('keeps the contract exhaustive for every currently resumable location', () => {
    expect(new Set(CONTINUE_LOCATION_IDS)).toEqual(
      new Set([
        DEFAULT_START_LOCATION_ID,
        COTTAGE_INTERIOR_LOCATION_ID,
        MOONFLOWER_GLADE_LOCATION_ID,
        SUNBEAM_VILLAGE_LOCATION_ID,
        RAINBOW_MEADOW_LOCATION_ID,
        CRYSTAL_BROOK_LOCATION_ID,
        WHISPERING_WOODS_LOCATION_ID,
        STARLIGHT_BEACH_LOCATION_ID,
      ]),
    );
  });

  it('falls back safely for an unknown legacy location', () => {
    expect(resolveContinueDestination('location:old-or-removed').sceneKey).toBe(
      'MoonflowerGladeScene',
    );
  });

  it('marks only Starlight Beach as lazy-loaded', () => {
    for (const locationId of CONTINUE_LOCATION_IDS) {
      expect(resolveContinueDestination(locationId).lazyScene).toBe(
        locationId === STARLIGHT_BEACH_LOCATION_ID,
      );
    }
  });
});
