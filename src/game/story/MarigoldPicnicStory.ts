import {
  PICNIC_MOONFLOWER_FLAG,
  PICNIC_RAINBOW_FLAG,
  PICNIC_READY_FLAG,
  PICNIC_SUNSHINE_FLAG,
  type PicnicTheme,
} from '../../content/r4PicnicEvent';
import type { SaveGame } from '../save/saveSchema';

export function getPicnicTheme(save: SaveGame | null): PicnicTheme | null {
  if (save?.world.flags[PICNIC_SUNSHINE_FLAG] === true) {
    return 'sunshine';
  }
  if (save?.world.flags[PICNIC_MOONFLOWER_FLAG] === true) {
    return 'moonflower';
  }
  if (save?.world.flags[PICNIC_RAINBOW_FLAG] === true) {
    return 'rainbow';
  }
  return null;
}

export function isMarigoldPicnicReady(save: SaveGame | null): boolean {
  return save?.world.flags[PICNIC_READY_FLAG] === true && getPicnicTheme(save) !== null;
}
