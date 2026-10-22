import Phaser from 'phaser';
import { RefreshThrottle } from '../performance/RefreshThrottle';
import { worldDepthForY } from '../world/WorldDepth';

const ROOT_NAME = 'wp18f-world-experience';

function enhanceShellCove(scene: Phaser.Scene): void {
  if (scene.children.getByName(`${ROOT_NAME}:shell-cove`)) {
    return;
  }

  const anchor = scene.add.container(820, 790).setName(`${ROOT_NAME}:shell-cove`).setDepth(2.45);
  const outerWater = scene.add
    .ellipse(0, 15, 570, 300, 0x59bfd1, 0.94)
    .setStrokeStyle(13, 0xf8edcf, 0.92);
  const innerWater = scene.add.ellipse(18, 9, 435, 210, 0xa3e5e2, 0.54);
  const foam = scene.add.ellipse(-18, 88, 380, 74, 0xfaf2d6, 0.5).setStrokeStyle(5, 0xffffff, 0.36);
  anchor.add([outerWater, innerWater, foam]);

  for (const [x, y, width, height, colour] of [
    [535, 760, 180, 125, 0xa87875],
    [615, 650, 145, 105, 0xbc8580],
    [1035, 675, 175, 120, 0xa97979],
    [1110, 795, 150, 110, 0xbc8980],
  ] as const) {
    scene.add
      .ellipse(x, y, width, height, colour, 0.96)
      .setStrokeStyle(4, 0x80676c, 0.66)
      .setDepth(worldDepthForY(y, 0.08));
  }

  for (const [x, y, rotation] of [
    [660, 810, -18],
    [995, 800, 17],
    [775, 690, 8],
  ] as const) {
    scene.add
      .text(x, y, '🐚', { fontFamily: 'system-ui, sans-serif', fontSize: '30px' })
      .setOrigin(0.5)
      .setAngle(rotation)
      .setDepth(worldDepthForY(y, 0.25));
  }

  createUnicornSandcastle(scene, 1160, 1025);
}

function createUnicornSandcastle(scene: Phaser.Scene, x: number, y: number): void {
  if (scene.children.getByName(`${ROOT_NAME}:unicorn-sandcastle`)) {
    return;
  }

  const sand = 0xdcae68;
  const shadow = 0xb98751;
  const body = scene.add.ellipse(0, 0, 102, 55, sand, 1).setStrokeStyle(4, shadow, 0.78);
  const neck = scene.add.ellipse(38, -27, 38, 70, sand, 1).setStrokeStyle(4, shadow, 0.78);
  const head = scene.add.circle(63, -53, 27, sand, 1).setStrokeStyle(4, shadow, 0.78);
  const horn = scene.add
    .triangle(68, -91, 0, 30, 8, 0, 16, 30, 0xf4d893, 1)
    .setStrokeStyle(2, shadow, 0.7);
  const mane = scene.add.ellipse(31, -42, 22, 62, 0xf0cf8c, 0.96).setAngle(18);
  const tail = scene.add.ellipse(-60, -6, 25, 61, 0xf0cf8c, 0.96).setAngle(-38);
  const eye = scene.add.circle(72, -57, 3, 0x70554b, 0.86);
  const shellCrown = scene.add
    .text(61, -78, '🐚', { fontFamily: 'system-ui, sans-serif', fontSize: '15px' })
    .setOrigin(0.5);
  scene.add
    .container(x, y, [tail, body, neck, mane, head, horn, eye, shellCrown])
    .setName(`${ROOT_NAME}:unicorn-sandcastle`)
    .setDepth(worldDepthForY(y, 0.28));
}

function enhanceWhisperingWoods(scene: Phaser.Scene): void {
  if (scene.children.getByName(`${ROOT_NAME}:whispering-woods`)) {
    return;
  }
  scene.add.container(0, 0).setName(`${ROOT_NAME}:whispering-woods`).setVisible(false);

  for (const [x, y, width, height, colour] of [
    [1175, 635, 360, 180, 0xa8c8ff],
    [1980, 1080, 430, 190, 0xb6f0c3],
    [2730, 910, 390, 170, 0xabc7ee],
  ] as const) {
    scene.add
      .ellipse(x, y, width, height, colour, 0.07)
      .setStrokeStyle(3, colour, 0.09)
      .setDepth(1.7);
  }

  for (const [index, [x, y]] of [
    [1040, 560],
    [1280, 700],
    [1880, 980],
    [2070, 1170],
    [2540, 840],
    [2860, 1050],
  ].entries()) {
    const mote = scene.add
      .circle(x, y, index % 2 === 0 ? 6 : 4, index % 2 === 0 ? 0xe4f6ae : 0xcce8ff, 0.7)
      .setName(`${ROOT_NAME}:woods-mote:${index}`)
      .setDepth(15.5);
    if (index % 2 === 0) {
      scene.tweens.add({
        targets: mote,
        y: y - 22,
        alpha: { from: 0.22, to: 0.86 },
        scale: { from: 0.8, to: 1.18 },
        duration: 1500 + index * 120,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }
  }

  for (const [x, y] of [
    [1115, 580],
    [1245, 645],
    [1935, 1030],
    [2035, 1055],
  ] as const) {
    scene.add
      .text(x, y, '✦', {
        color: '#efffc7',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '17px',
      })
      .setOrigin(0.5)
      .setAlpha(0.52)
      .setDepth(worldDepthForY(y, 0.24));
  }
}

export class R65WorldExperiencePresentationManager {
  private readonly refresh = new RefreshThrottle(250);

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

    for (const scene of this.game.scene.getScenes(true)) {
      if (scene.scene.key === 'StarlightBeachScene') {
        enhanceShellCove(scene);
      } else if (scene.scene.key === 'WhisperingWoodsScene') {
        enhanceWhisperingWoods(scene);
      }
    }
  }
}

let manager: R65WorldExperiencePresentationManager | null = null;

export function getR65WorldExperiencePresentationManager(
  game: Phaser.Game,
): R65WorldExperiencePresentationManager {
  manager ??= new R65WorldExperiencePresentationManager(game);
  return manager;
}
