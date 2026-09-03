import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { worldDepthForY } from '../world/WorldDepth';
import { createSupportingResidentSprite } from './SupportingResidentArt';
import { R6_SUPPORTING_RESIDENTS } from './R6SupportingResidentContent';

const ECHO_OBJECT_NAME = 'supporting-resident:resident:echo';
const ECHO_RESIDENT_ID = 'resident:echo';

export class CrystalBrookEchoBridgeManager {
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

    const scene = this.game.scene.getScene('CrystalBrookScene');
    if (!scene?.scene.isActive() || scene.children.getByName(ECHO_OBJECT_NAME)) {
      return;
    }

    const echo = R6_SUPPORTING_RESIDENTS.find(({ id }) => id === ECHO_RESIDENT_ID);
    if (!echo) {
      return;
    }

    const sprite = createSupportingResidentSprite(scene, echo);
    const label = scene.add
      .text(0, -76, 'Echo', {
        color: '#eefcff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
        fontStyle: 'bold',
        backgroundColor: '#385866d8',
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    const resident = scene.add
      .container(2860, 1690, [sprite, label])
      .setName(ECHO_OBJECT_NAME)
      .setDepth(worldDepthForY(1690, 0.3));

    scene.tweens.add({
      targets: resident,
      x: 2990,
      y: 1760,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      hold: 1100,
      ease: 'Sine.InOut',
      onUpdate: () => resident.setDepth(worldDepthForY(resident.y, 0.3)),
    });
  }
}

let manager: CrystalBrookEchoBridgeManager | null = null;

export function getCrystalBrookEchoBridgeManager(game: Phaser.Game): CrystalBrookEchoBridgeManager {
  manager ??= new CrystalBrookEchoBridgeManager(game);
  return manager;
}
