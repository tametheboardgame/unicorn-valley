import type Phaser from 'phaser';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import { createResidentAppearanceSprite } from '../population/SupportingResidentArt';
import { worldDepthForY } from './WorldDepth';
import { RAINBOW_MEADOW_LAYOUT } from './RainbowMeadowMap';

export const RAINBOW_DISC_PLAYER_APPEARANCES: readonly UnicornAppearance[] = [
  {
    bodyColour: 'cream',
    eyeColour: 'violet',
    maneStyle: 'swept',
    maneColour: 'coral',
    tailStyle: 'plume',
    tailColour: 'coral',
    hornStyle: 'star',
    marking: 'star',
    accessory: 'ribbon',
  },
  {
    bodyColour: 'mint',
    eyeColour: 'blue',
    maneStyle: 'fluffy',
    maneColour: 'plum',
    tailStyle: 'curl',
    tailColour: 'plum',
    hornStyle: 'classic',
    marking: 'freckles',
    accessory: 'none',
  },
  {
    bodyColour: 'sky',
    eyeColour: 'amber',
    maneStyle: 'crest',
    maneColour: 'gold',
    tailStyle: 'swish',
    tailColour: 'gold',
    hornStyle: 'short',
    marking: 'moon',
    accessory: 'scarf',
  },
  {
    bodyColour: 'peach',
    eyeColour: 'green',
    maneStyle: 'braid',
    maneColour: 'aqua',
    tailStyle: 'braid',
    tailColour: 'aqua',
    hornStyle: 'spiral',
    marking: 'heart',
    accessory: 'flower',
  },
  {
    bodyColour: 'lavender',
    eyeColour: 'aqua',
    maneStyle: 'cascade',
    maneColour: 'ice',
    tailStyle: 'ribbon',
    tailColour: 'lilac',
    hornStyle: 'crystal',
    marking: 'sparkles',
    accessory: 'bow',
  },
] as const;

export function createRainbowDiscMeadowPresentation(scene: Phaser.Scene): void {
  const layout = RAINBOW_MEADOW_LAYOUT.rainbowDisc;
  const { x, y } = layout.centre;

  scene.add
    .ellipse(x, y + 16, layout.field.width + 44, layout.field.height + 32, 0x5f9f67, 0.2)
    .setName('rainbow-disc:lawn-shadow')
    .setDepth(1.92);
  scene.add
    .ellipse(x, y, layout.field.width, layout.field.height, 0xa9df91, 0.92)
    .setName('rainbow-disc:lawn')
    .setDepth(1.94);

  const field = scene.add.graphics().setName('rainbow-disc:field-markings').setDepth(1.98);
  field.lineStyle(5, 0xf7f0c4, 0.58);
  field.strokeRoundedRect(
    x - layout.field.width / 2 + 30,
    y - layout.field.height / 2 + 32,
    layout.field.width - 60,
    layout.field.height - 64,
    50,
  );
  field.lineStyle(4, 0xf7f0c4, 0.4);
  field.lineBetween(x - 210, y - 150, x - 210, y + 150);
  field.lineBetween(x + 210, y - 150, x + 210, y + 150);

  layout.pennants.forEach((pennant, index) => {
    const depth = worldDepthForY(pennant.y, -0.08);
    scene.add
      .rectangle(pennant.x, pennant.y, 7, 70, 0x7e6049, 0.94)
      .setName(`rainbow-disc:pennant-post:${index}`)
      .setDepth(depth);
    scene.add
      .triangle(
        pennant.x + (index % 2 === 0 ? 17 : -17),
        pennant.y - 28,
        0,
        0,
        index % 2 === 0 ? 35 : -35,
        8,
        0,
        20,
        index % 2 === 0 ? 0xf09fbe : 0x83c9df,
        0.94,
      )
      .setDepth(depth + 0.01);
  });

  const signDepth = worldDepthForY(layout.sign.y + 68, -0.04);
  scene.add
    .rectangle(layout.sign.x, layout.sign.y + 48, 12, 96, 0x7d5b44, 1)
    .setName('rainbow-disc:sign-post')
    .setDepth(signDepth);
  scene.add
    .rectangle(layout.sign.x + 84, layout.sign.y, 180, 58, 0xf0d69b, 1)
    .setStrokeStyle(4, 0x7d5b44, 0.96)
    .setName('rainbow-disc:sign')
    .setDepth(signDepth + 0.04);
  scene.add
    .text(layout.sign.x + 84, layout.sign.y, 'RAINBOW DISC', {
      color: '#5f496d',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
    })
    .setOrigin(0.5)
    .setDepth(signDepth + 0.05);

  const sprites = layout.players.map((player, index) => {
    const appearance = RAINBOW_DISC_PLAYER_APPEARANCES[index] ?? RAINBOW_DISC_PLAYER_APPEARANCES[0];
    const sprite = createResidentAppearanceSprite(
      scene,
      `rainbow-disc-player:${player.id}:idle`,
      `rainbow-disc:player:${player.id}`,
      appearance,
    )
      .setPosition(player.x, player.y)
      .setDepth(worldDepthForY(player.y + 48, 0.18));

    scene.tweens.add({
      targets: sprite,
      y: player.y - (index % 2 === 0 ? 4 : 6),
      duration: 1100 + index * 130,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });
    return sprite;
  });

  const captain = sprites[0];
  scene.add
    .ellipse(layout.captain.x, layout.captain.y + 52, 116, 26, 0x587f5d, 0.16)
    .setName('rainbow-disc:captain-shadow')
    .setDepth(worldDepthForY(layout.captain.y + 55, -0.18));
  captain?.setScale(1.04);

  const disc = scene.add
    .ellipse(layout.discRoute[0].x, layout.discRoute[0].y, 34, 12, 0xfff3bd, 1)
    .setStrokeStyle(3, 0xb88858, 0.9)
    .setName('rainbow-disc:ambient-disc')
    .setDepth(worldDepthForY(layout.discRoute[0].y, 0.42));

  let routeIndex = 0;
  const animatePass = (): void => {
    if (!scene.sys.isActive()) {
      return;
    }
    routeIndex = (routeIndex + 1) % layout.discRoute.length;
    const target = layout.discRoute[routeIndex];
    scene.tweens.add({
      targets: disc,
      x: target.x,
      y: target.y,
      angle: disc.angle + 230,
      duration: 820,
      ease: 'Sine.InOut',
      onUpdate: () => disc.setDepth(worldDepthForY(disc.y, 0.42)),
      onComplete: () => {
        scene.time.delayedCall(380, animatePass);
      },
    });
  };
  scene.time.delayedCall(700, animatePass);
}
