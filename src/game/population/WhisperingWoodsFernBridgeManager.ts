import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { worldDepthForY } from '../world/WorldDepth';
import { createSupportingResidentSprite } from './SupportingResidentArt';
import { R6_SUPPORTING_RESIDENTS } from './R6SupportingResidentContent';

const FERN_OBJECT_NAME = 'supporting-resident:resident:fern';
const FERN_RESIDENT_ID = 'resident:fern';

export class WhisperingWoodsFernBridgeManager {
  private readonly refresh = new RefreshThrottle(120);

  public constructor(private readonly game: Phaser.Game) {
    this.game.events.on(Phaser.Core.Events.POST_STEP, this.update, this);
    this.game.events.once(Phaser.Core.Events.DESTROY, () => {
      this.game.events.off(Phaser.Core.Events.POST_STEP, this.update, this);
    });
  }

  private update(): void {
    if (!this.refresh.shouldRun(this.game.loop.time)) {
      return;
    }

    const scene = this.game.scene.getScene('WhisperingWoodsScene');
    if (!scene?.scene.isActive() || scene.children.getByName(FERN_OBJECT_NAME)) {
      return;
    }

    const fern = R6_SUPPORTING_RESIDENTS.find(({ id }) => id === FERN_RESIDENT_ID);
    if (!fern) {
      return;
    }

    const sprite = createSupportingResidentSprite(scene, fern);
    const label = scene.add
      .text(0, -76, 'Fern', {
        color: '#efffe8',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#294838d8',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const resident = scene.add
      .container(2550, 850, [sprite, label])
      .setName(FERN_OBJECT_NAME)
      .setDepth(worldDepthForY(850, 0.3));

    scene.tweens.add({
      targets: resident,
      x: 2980,
      y: 820,
      duration: 3600,
      yoyo: true,
      repeat: -1,
      hold: 1500,
      ease: 'Sine.InOut',
      onUpdate: () => resident.setDepth(worldDepthForY(resident.y, 0.3)),
    });
  }
}

let manager: WhisperingWoodsFernBridgeManager | null = null;

export function getWhisperingWoodsFernBridgeManager(
  game: Phaser.Game,
): WhisperingWoodsFernBridgeManager {
  manager ??= new WhisperingWoodsFernBridgeManager(game);
  return manager;
}
