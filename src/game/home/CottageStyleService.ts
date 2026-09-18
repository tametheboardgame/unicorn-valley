import type { SaveService } from '../save/SaveService';
import type { HomeStyleState } from '../save/saveSchema';
import {
  DEFAULT_COTTAGE_STYLE,
  isKnownCottageStyle,
  resolveCottageStyle,
} from './CottageStyleCatalogue';

export class CottageStyleService {
  public constructor(private readonly saveService: SaveService) {}

  public getPersistedStyle(): HomeStyleState {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return {
      walls: {
        back: { ...save.home.style.walls.back },
        left: { ...save.home.style.walls.left },
        right: { ...save.home.style.walls.right },
        front: { ...save.home.style.walls.front },
      },
      floorStyleId: save.home.style.floorStyleId,
    };
  }

  public getResolvedStyle(): HomeStyleState {
    return resolveCottageStyle(this.getPersistedStyle());
  }

  public applyStyle(style: HomeStyleState): HomeStyleState {
    if (!isKnownCottageStyle(style)) {
      throw new Error('Cottage style contains an unknown wall, wallpaper or floor ID.');
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const nextStyle: HomeStyleState = {
      walls: {
        back: { ...style.walls.back },
        left: { ...style.walls.left },
        right: { ...style.walls.right },
        front: { ...style.walls.front },
      },
      floorStyleId: style.floorStyleId,
    };
    this.saveService.save({
      ...save,
      home: {
        ...save.home,
        style: nextStyle,
      },
    });
    return nextStyle;
  }

  public resetToDefault(): HomeStyleState {
    return this.applyStyle({
      walls: {
        back: { ...DEFAULT_COTTAGE_STYLE.walls.back },
        left: { ...DEFAULT_COTTAGE_STYLE.walls.left },
        right: { ...DEFAULT_COTTAGE_STYLE.walls.right },
        front: { ...DEFAULT_COTTAGE_STYLE.walls.front },
      },
      floorStyleId: DEFAULT_COTTAGE_STYLE.floorStyleId,
    });
  }
}
