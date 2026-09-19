import {
  COTTAGE_STARTER_HOME_STYLE_IDS,
  isCottageHomeStyleEntitlementId,
  type CottageHomeStyleEntitlementId,
} from '../../content/cottageHomeStyleEntitlements';
import { type GameEventMap, type TypedEventBus, gameEventBus } from '../events/GameEventBus';
import type { SaveService } from '../save/SaveService';
import type { HomeStyleState } from '../save/saveSchema';

export type CottageStyleUnlockSource = 'quest' | 'reward' | 'shop' | 'system' | 'diagnostic';

export class CottageStyleEntitlementService {
  public constructor(
    private readonly saveService: SaveService,
    private readonly events: TypedEventBus<GameEventMap> = gameEventBus,
  ) {}

  public getUnlockedStyleIds(): readonly CottageHomeStyleEntitlementId[] {
    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const unlocked = new Set<string>(COTTAGE_STARTER_HOME_STYLE_IDS);
    for (const styleId of save.home.unlockedStyleIds) {
      if (isCottageHomeStyleEntitlementId(styleId)) unlocked.add(styleId);
    }
    return [...unlocked] as CottageHomeStyleEntitlementId[];
  }

  public isUnlocked(styleId: string): boolean {
    return (
      isCottageHomeStyleEntitlementId(styleId) && this.getUnlockedStyleIds().includes(styleId)
    );
  }

  public grantStyle(
    styleId: string,
    source: CottageStyleUnlockSource = 'reward',
  ): boolean {
    if (!isCottageHomeStyleEntitlementId(styleId)) {
      throw new Error(`Unknown cottage style entitlement: ${styleId}`);
    }

    const save = this.saveService.load() ?? this.saveService.createNewGame();
    const unlockedStyleIds = new Set<string>([
      ...COTTAGE_STARTER_HOME_STYLE_IDS,
      ...save.home.unlockedStyleIds,
    ]);
    if (unlockedStyleIds.has(styleId)) return false;

    unlockedStyleIds.add(styleId);
    this.saveService.save({
      ...save,
      home: {
        ...save.home,
        unlockedStyleIds: [...unlockedStyleIds],
      },
    });
    this.events.emit('HOME_STYLE_UNLOCKED', { styleId, source });
    return true;
  }

  public grantStyles(
    styleIds: readonly string[],
    source: CottageStyleUnlockSource = 'reward',
  ): readonly string[] {
    return styleIds.filter((styleId) => this.grantStyle(styleId, source));
  }

  public canUseStyle(styleId: string, currentlySelectedId?: string): boolean {
    if (styleId === currentlySelectedId) return true;
    return this.isUnlocked(styleId);
  }

  public canApplyStyle(nextStyle: HomeStyleState, currentStyle: HomeStyleState): boolean {
    const nextIds = [
      ...Object.values(nextStyle.walls).flatMap((wall) => [wall.wallColourId, wall.wallpaperId]),
      nextStyle.floorStyleId,
      ...Object.values(nextStyle.furnitureVariants),
    ];
    const currentIds = new Set([
      ...Object.values(currentStyle.walls).flatMap((wall) => [wall.wallColourId, wall.wallpaperId]),
      currentStyle.floorStyleId,
      ...Object.values(currentStyle.furnitureVariants),
    ]);

    return nextIds.every((styleId) => this.canUseStyle(styleId, currentIds.has(styleId) ? styleId : undefined));
  }
}
