import type { SaveService } from './SaveService';
import type { SaveGame } from './saveSchema';

export const MOONFLOWER_GLADE_LOCATION_ID = 'location:moonflower-glade';

export function saveLocationCheckpoint(saveService: SaveService, locationId: string): SaveGame {
  const current = saveService.load() ?? saveService.createNewGame();

  if (current.profile.currentLocationId === locationId) {
    return current;
  }

  return saveService.save({
    ...current,
    profile: {
      ...current.profile,
      currentLocationId: locationId,
    },
  });
}
