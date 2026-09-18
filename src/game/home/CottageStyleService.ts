import type { SaveService } from '../save/SaveService';
import type { HomeStyleState } from '../save/saveSchema';
import { isKnownCottageStyle, resolveCottageStyle } from './CottageStyleCatalogue';

export class CottageStyleService {
  public constructor(private readonly saveService: SaveService) {}

  public getPersistedStyle(): HomeStyleState {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return structuredClone(save.home.style);
  }

  public getResolvedStyle(): HomeStyleState {
    return resolveCottageStyle(this.getPersistedStyle());
  }

  public applyStyle(style: HomeStyleState): HomeStyleState {
    if (!isKnownCottageStyle(style)) {
      throw new Error(
        'Cottage style contains an unknown wall, wallpaper or floor ID.',
      );
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const nextStyle = structuredClone(style);
    this.saveService.save({
      ...save,
      home: {
        ...save.home,
        style: nextStyle,
      },
    });
    return nextStyle;
  }
}
