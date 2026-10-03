import Phaser from 'phaser';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import {
  createResidentAppearanceSprite,
  SUPPORTING_RESIDENT_ART_LAYOUT,
} from '../population/SupportingResidentArt';
import { createRainbowDiscRing, drawRainbowTarget } from './RainbowDiscArt';
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

function createMeadowRecreationSign(
  scene: Phaser.Scene,
  options: {
    name: string;
    x: number;
    y: number;
    width: number;
    title: string;
    subtitle: string;
  },
): void {
  const { name, x, y, width, title, subtitle } = options;
  const boardHeight = 78;
  const legSpacing = width * 0.3;
  const depth = worldDepthForY(y + boardHeight / 2 + 92, 0.32);

  for (const [side, legX] of [
    ['left', x - legSpacing],
    ['right', x + legSpacing],
  ] as const) {
    scene.add
      .rectangle(legX, y + 76, 13, 112, 0x7b5a43, 1)
      .setStrokeStyle(2, 0x5f4637, 0.8)
      .setName(`${name}-leg-${side}`)
      .setDepth(depth);
  }

  const board = scene.add
    .graphics()
    .setPosition(x, y)
    .setName(name)
    .setDepth(depth + 0.03);
  board.fillStyle(0xe8d8a9, 1);
  board.lineStyle(5, 0x765442, 0.96);
  board.fillRoundedRect(-width / 2, -boardHeight / 2, width, boardHeight, 18);
  board.strokeRoundedRect(-width / 2, -boardHeight / 2, width, boardHeight, 18);
  board.fillStyle(0xd7b7e4, 0.9);
  board.fillRoundedRect(-width / 2 + 10, -boardHeight / 2 + 9, width - 20, 9, 5);
  drawRainbowTarget(board, -width / 2 + 30, 0, 12, 4);

  scene.add
    .text(x + 14, y - 8, title, {
      color: '#5b4668',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(depth + 0.05);

  scene.add
    .text(x + 14, y + 17, subtitle, {
      color: '#7a607f',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      align: 'center',
    })
    .setOrigin(0.5)
    .setDepth(depth + 0.05);
}

function resolveHornCatchPoint(
  sprite: Phaser.GameObjects.Sprite,
  appearance: UnicornAppearance,
): { x: number; y: number } {
  const tipOffset =
    appearance.hornStyle === 'star'
      ? -82
      : appearance.hornStyle === 'short'
        ? -75
        : appearance.hornStyle === 'crystal' || appearance.hornStyle === 'moon'
          ? -85
          : -88;
  const textureX =
    SUPPORTING_RESIDENT_ART_LAYOUT.drawX + 78 * SUPPORTING_RESIDENT_ART_LAYOUT.drawScale;
  const textureY =
    SUPPORTING_RESIDENT_ART_LAYOUT.drawY + (tipOffset + 10) * SUPPORTING_RESIDENT_ART_LAYOUT.drawScale;
  const originTextureX = SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth * sprite.originX;
  const originTextureY = SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight * sprite.originY;
  const localX =
    (textureX - originTextureX) *
    (sprite.displayWidth / SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth);
  const localY =
    (textureY - originTextureY) *
    (sprite.displayHeight / SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight);

  return {
    x: sprite.x + (sprite.flipX ? -localX : localX),
    y: sprite.y + localY,
  };
}

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

  createMeadowRecreationSign(scene, {
    name: 'rainbow-disc:sign',
    x: layout.sign.x,
    y: layout.sign.y,
    width: 220,
    title: 'RAINBOW DISC',
    subtitle: 'PLAY ↓',
  });

  const practice = layout.practice;
  createMeadowRecreationSign(scene, {
    name: 'rainbow-disc:practice-sign',
    x: practice.sign.x,
    y: practice.sign.y,
    width: 200,
    title: 'DISC PRACTICE',
    subtitle: 'THROW ↓',
  });
  const practiceDepth = worldDepthForY(practice.centre.y + 90, -0.04);
  const practiceGraphics = scene.add
    .graphics()
    .setName('rainbow-disc:practice-range')
    .setDepth(practiceDepth + 0.01);
  practiceGraphics.lineStyle(5, 0xf4edc4, 0.72);
  practiceGraphics.lineBetween(
    practice.throwLine.x,
    practice.throwLine.y - 105,
    practice.throwLine.x,
    practice.throwLine.y + 105,
  );
  practice.targets.forEach((target, index) => {
    practiceGraphics.lineStyle(8, 0x7d5b44, 0.9);
    practiceGraphics.lineBetween(target.x, target.y + target.radius, target.x, target.y + 78);
    drawRainbowTarget(practiceGraphics, target.x, target.y, target.radius, 7);
    practiceGraphics.fillStyle(0xfff1b5, 0.9);
    practiceGraphics.fillCircle(target.x, target.y, Math.max(6, target.radius * 0.18));
    scene.add
      .text(target.x + 50, target.y - 8, index === 0 ? '1' : index === 1 ? '2' : '3', {
        color: '#6a5577',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(practiceDepth + 0.03);
  });

  const movementOffsets = [
    { x: 34, y: 16 },
    { x: 72, y: -34 },
    { x: 58, y: 46 },
    { x: -76, y: -38 },
    { x: -58, y: 42 },
  ] as const;

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

  const hornPoint = (sprite: Phaser.GameObjects.Sprite, index: number): { x: number; y: number } =>
    resolveHornCatchPoint(
      sprite,
      RAINBOW_DISC_PLAYER_APPEARANCES[index] ?? RAINBOW_DISC_PLAYER_APPEARANCES[0],
    );

  const firstPlayer = sprites[0];
  const firstHorn = firstPlayer ? hornPoint(firstPlayer, 0) : { x, y };
  const disc = createRainbowDiscRing(
    scene,
    'rainbow-disc:ambient-disc',
    firstHorn.x,
    firstHorn.y,
    18,
    7,
  )
    .setScale(1, 0.58)
    .setDepth(worldDepthForY(firstHorn.y, 0.42));

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

    thrower.setFlipX(receiver.x < thrower.x);
    receiver.setFlipX(thrower.x < receiver.x);

    const tossDirection = thrower.flipX ? -1 : 1;
    scene.tweens.add({
      targets: thrower,
      angle: tossDirection * 7,
      duration: 120,
      yoyo: true,
      ease: 'Sine.Out',
    });

    const flight = { progress: 0 };
    const throwHorn = hornPoint(thrower, throwerIndex);
    disc.setPosition(throwHorn.x, throwHorn.y);

    scene.tweens.add({
      targets: flight,
      progress: 1,
      duration: 820,
      ease: 'Sine.InOut',
      onUpdate: () => {
        const progress = flight.progress;
        const start = hornPoint(thrower, throwerIndex);
        const end = hornPoint(receiver, receiverIndex);
        disc.setPosition(
          Phaser.Math.Linear(start.x, end.x, progress),
          Phaser.Math.Linear(start.y, end.y, progress) - Math.sin(Math.PI * progress) * 44,
        );
        disc.setAngle(disc.angle + 10);
        disc.setDepth(worldDepthForY(disc.y, 0.42));
      },
      onComplete: () => {
        const catchDirection = receiver.flipX ? -1 : 1;
        scene.tweens.add({
          targets: receiver,
          angle: catchDirection * 6,
          duration: 120,
          yoyo: true,
          ease: 'Sine.Out',
        });

        const hold = { progress: 0 };
        scene.tweens.add({
          targets: hold,
          progress: 1,
          duration: 360,
          onUpdate: () => {
            const catchHorn = hornPoint(receiver, receiverIndex);
            disc.setPosition(catchHorn.x, catchHorn.y);
            disc.setAngle(disc.angle + 3);
            disc.setDepth(worldDepthForY(disc.y, 0.42));
          },
          onComplete: () => {
            throwerIndex = receiverIndex;
            scene.time.delayedCall(120, animatePass);
          },
        });
      },
    });
  };
  scene.time.delayedCall(700, animatePass);
}
