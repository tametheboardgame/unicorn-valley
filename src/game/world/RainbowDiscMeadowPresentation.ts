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

    const direction = index % 2 === 0 ? 1 : -1;
    const pennantGraphics = scene.add
      .graphics()
      .setPosition(pennant.x, pennant.y - 35)
      .setName(`rainbow-disc:pennant:${index}`)
      .setDepth(depth + 0.01);
    pennantGraphics.fillStyle(index % 2 === 0 ? 0xf09fbe : 0x83c9df, 0.94);
    pennantGraphics.fillTriangle(0, 0, direction * 34, 8, 0, 18);
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

  const movementOffsets = [
    { x: 34, y: 16 },
    { x: 72, y: -34 },
    { x: 58, y: 46 },
    { x: -76, y: -38 },
    { x: -58, y: 42 },
  ] as const;

  const sprites = layout.players.map((player, index) => {
    const appearance =
      RAINBOW_DISC_PLAYER_APPEARANCES[index] ?? RAINBOW_DISC_PLAYER_APPEARANCES[0];
    const sprite = createResidentAppearanceSprite(
      scene,
      `rainbow-disc-player:${player.id}:idle`,
      `rainbow-disc:player:${player.id}`,
      appearance,
    )
      .setPosition(player.x, player.y)
      .setDepth(worldDepthForY(player.y + 48, 0.18));

    const movement = movementOffsets[index] ?? movementOffsets[0];
    scene.tweens.add({
      targets: sprite,
      x: player.x + movement.x,
      y: player.y + movement.y,
      duration: 1800 + index * 220,
      yoyo: true,
      repeat: -1,
      delay: index * 160,
      ease: 'Sine.InOut',
      onYoyo: () => sprite.setFlipX(movement.x > 0),
      onRepeat: () => sprite.setFlipX(movement.x < 0),
      onUpdate: () => sprite.setDepth(worldDepthForY(sprite.y + 48, 0.18)),
    });
    return sprite;
  });

  const firstPlayer = sprites[0];
  const disc = scene.add
    .ellipse(firstPlayer?.x ?? x, (firstPlayer?.y ?? y) - 38, 34, 12, 0xfff3bd, 1)
    .setStrokeStyle(3, 0xb88858, 0.9)
    .setName('rainbow-disc:ambient-disc')
    .setDepth(worldDepthForY((firstPlayer?.y ?? y) - 38, 0.42));

  let throwerIndex = 0;
  const animatePass = (): void => {
    if (!scene.sys.isActive() || sprites.length < 2) {
      return;
    }

    const thrower = sprites[throwerIndex];
    const receiverIndex = (throwerIndex + 1) % sprites.length;
    const receiver = sprites[receiverIndex];
    if (!thrower || !receiver) {
      return;
    }

    const flight = { progress: 0 };
    disc.setPosition(thrower.x, thrower.y - 38);

    scene.tweens.add({
      targets: flight,
      progress: 1,
      duration: 820,
      ease: 'Sine.InOut',
      onUpdate: () => {
        const progress = flight.progress;
        const startX = thrower.x;
        const startY = thrower.y - 38;
        const endX = receiver.x;
        const endY = receiver.y - 38;
        disc.setPosition(
          Phaser.Math.Linear(startX, endX, progress),
          Phaser.Math.Linear(startY, endY, progress) - Math.sin(Math.PI * progress) * 44,
        );
        disc.setAngle(disc.angle + 8);
        disc.setDepth(worldDepthForY(disc.y, 0.42));
      },
      onComplete: () => {
        disc.setPosition(receiver.x, receiver.y - 38);
        throwerIndex = receiverIndex;
        scene.time.delayedCall(380, animatePass);
      },
    });
  };
  scene.time.delayedCall(700, animatePass);
}
