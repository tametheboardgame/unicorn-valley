import type { SaveService } from '../save/SaveService';
import type { HomeStyleState } from '../save/saveSchema';
import { isKnownCottageStyle, resolveCottageStyle } from './CottageStyleCatalogue';
import { CottageStyleEntitlementService } from './CottageStyleEntitlementService';

export class CottageStyleService {
  private readonly entitlements: CottageStyleEntitlementService;

  public constructor(private readonly saveService: SaveService) {
    this.entitlements = new CottageStyleEntitlementService(saveService);
  }

  public getPersistedStyle(): HomeStyleState {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    return structuredClone(save.home.style);
  }

  public getResolvedStyle(): HomeStyleState {
    return resolveCottageStyle(this.getPersistedStyle());
  }

  public applyStyle(style: HomeStyleState): HomeStyleState {
    if (!isKnownCottageStyle(style)) {
      throw new Error('Cottage style contains an unknown wall, wallpaper or floor ID.');
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    if (!this.entitlements.canApplyStyle(style, save.home.style)) {
      throw new Error('Cottage style contains a locked home option.');
    }

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
