import { COTTAGE_INTERIOR_LOCATION_ID } from '../world/CottageInteriorMap';
import { CRYSTAL_BROOK_LOCATION_ID } from '../world/CrystalBrookMap';
import { RAINBOW_MEADOW_LOCATION_ID } from '../world/RainbowMeadowMap';
import { STARLIGHT_BEACH_LOCATION_ID } from '../world/StarlightBeachMap';
import { SUNBEAM_VILLAGE_LOCATION_ID } from '../world/SunbeamVillageMap';
import { WHISPERING_WOODS_LOCATION_ID } from '../world/WhisperingWoodsMap';
import { DEFAULT_START_LOCATION_ID } from './saveSchema';
import { MOONFLOWER_GLADE_LOCATION_ID } from './saveLocationCheckpoint';

export interface ContinueDestination {
  locationId: string;
  sceneKey: string;
  status: string;
  lazyScene: boolean;
}

const DESTINATIONS = new Map<string, ContinueDestination>([
  [
    DEFAULT_START_LOCATION_ID,
    {
      locationId: DEFAULT_START_LOCATION_ID,
      sceneKey: 'CottageInteriorScene',
      status: 'Your unicorn is cosy inside Moonflower Cottage.',
      lazyScene: false,
    },
  ],
  [
    COTTAGE_INTERIOR_LOCATION_ID,
    {
      locationId: COTTAGE_INTERIOR_LOCATION_ID,
      sceneKey: 'CottageInteriorScene',
      status: 'Your unicorn is cosy inside Moonflower Cottage.',
      lazyScene: false,
    },
  ],
  [
    MOONFLOWER_GLADE_LOCATION_ID,
    {
      locationId: MOONFLOWER_GLADE_LOCATION_ID,
      sceneKey: 'MoonflowerGladeScene',
      status: 'Your unicorn is waiting in Moonflower Glade.',
      lazyScene: false,
    },
  ],
  [
    SUNBEAM_VILLAGE_LOCATION_ID,
    {
      locationId: SUNBEAM_VILLAGE_LOCATION_ID,
      sceneKey: 'SunbeamVillageScene',
      status: 'Your unicorn is waiting in Sunbeam Village.',
      lazyScene: false,
    },
  ],
  [
    RAINBOW_MEADOW_LOCATION_ID,
    {
      locationId: RAINBOW_MEADOW_LOCATION_ID,
      sceneKey: 'RainbowMeadowScene',
      status: 'Your unicorn is waiting in Rainbow Meadow.',
      lazyScene: false,
    },
  ],
  [
    CRYSTAL_BROOK_LOCATION_ID,
    {
      locationId: CRYSTAL_BROOK_LOCATION_ID,
      sceneKey: 'CrystalBrookScene',
      status: 'Your unicorn is waiting beside Crystal Brook.',
      lazyScene: false,
    },
  ],
  [
    WHISPERING_WOODS_LOCATION_ID,
    {
      locationId: WHISPERING_WOODS_LOCATION_ID,
      sceneKey: 'WhisperingWoodsScene',
      status: 'Your unicorn is waiting in Whispering Woods.',
      lazyScene: false,
    },
  ],
  [
    STARLIGHT_BEACH_LOCATION_ID,
    {
      locationId: STARLIGHT_BEACH_LOCATION_ID,
      sceneKey: 'StarlightBeachScene',
      status: 'Your unicorn is waiting on Starlight Beach.',
      lazyScene: true,
    },
  ],
]);

const FALLBACK_DESTINATION: ContinueDestination = {
  locationId: MOONFLOWER_GLADE_LOCATION_ID,
  sceneKey: 'MoonflowerGladeScene',
  status: 'Your unicorn is waiting in Moonflower Glade.',
  lazyScene: false,
};

export const CONTINUE_LOCATION_IDS = [...DESTINATIONS.keys()] as readonly string[];

export function resolveContinueDestination(locationId: string | undefined): ContinueDestination {
  return (locationId ? DESTINATIONS.get(locationId) : null) ?? FALLBACK_DESTINATION;
}
