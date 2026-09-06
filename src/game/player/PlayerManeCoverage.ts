import type Phaser from 'phaser';
import type { UnicornAppearance } from './UnicornAppearance';
import { HAIR_COLOURS, colourValue } from './UnicornAppearance';
import {
  type UnicornProductionPose,
  UNICORN_PRODUCTION_POSES,
} from './UnicornProductionArt';

export const PLAYER_MANE_COVERAGE_NAME = 'world-player-mane-coverage';

interface CoveragePoseOffset {
  x: number;
  y: number;
  lift: number;
}

export const PLAYER_MANE_COVERAGE_POSE_OFFSETS: Readonly<
  Record<UnicornProductionPose, CoveragePoseOffset>
> = {
  idle: { x: 0, y: 0, lift: 0 },
  'walk-a': { x: 1, y: -1, lift: 1 },
  'walk-b': { x: -1, y: 1, lift: -1 },
  'gallop-a': { x: 4, y: -4, lift: 5 },
  'gallop-b': { x: -1, y: 0, lift: 2 },
  celebrate: { x: 3, y: -11, lift: 6 },
};

export function getPlayerManeCoverageTextureKey(
  appearance: Pick<UnicornAppearance, 'maneStyle' | 'maneColour'>,
  pose: UnicornProductionPose,
): string {
  return `player-mane-coverage:${appearance.maneStyle}:${appearance.maneColour}:${pose}`;
}

function drawCoverage(
  graphics: Phaser.GameObjects.Graphics,
  appearance: UnicornAppearance,
  pose: UnicornProductionPose,
): void {
  const offset = PLAYER_MANE_COVERAGE_POSE_OFFSETS[pose];
  const fill = colourValue(HAIR_COLOURS, appearance.maneColour);
  const x = 145 + offset.x;
  const y = 124 + offset.y - offset.lift;

  graphics.fillStyle(fill, 0.98);

  if (appearance.maneStyle === 'fluffy') {
    graphics.fillCircle(x + 2, y - 8, 14);
    graphics.fillCircle(x - 3, y + 6, 12);
  } else if (appearance.maneStyle === 'swept') {
    graphics.fillTriangle(x + 11, y - 18, x - 12, y + 15, x + 14, y + 12);
    graphics.fillEllipse(x - 1, y + 2, 18, 31);
  } else if (appearance.maneStyle === 'braid') {
    graphics.fillEllipse(x + 2, y - 9, 17, 19);
    graphics.fillEllipse(x - 2, y + 5, 16, 18);
    graphics.fillCircle(x - 4, y + 16, 5);
  } else if (appearance.maneStyle === 'crest') {
    graphics.fillTriangle(x + 10, y - 18, x - 9, y + 3, x + 10, y + 8);
    graphics.fillTriangle(x + 7, y - 2, x - 10, y + 15, x + 8, y + 16);
  } else {
    graphics.fillEllipse(x + 2, y - 7, 23, 29);
    graphics.fillEllipse(x - 2, y + 8, 19, 25);
  }

  graphics.fillStyle(0xffffff, 0.14);
  graphics.fillEllipse(x + 3, y - 8, 5, 18);
}

function ensureCoverageTextures(scene: Phaser.Scene, appearance: UnicornAppearance): void {
  for (const pose of UNICORN_PRODUCTION_POSES) {
    const key = getPlayerManeCoverageTextureKey(appearance, pose);
    if (scene.textures.exists(key)) {
      continue;
    }

    const graphics = scene.make.graphics({ x: 0, y: 0 }, false);
    drawCoverage(graphics, appearance, pose);
    graphics.generateTexture(key, 244, 202);
    graphics.destroy();
  }
}

export class PlayerManeCoverageLayer {
  private pose: UnicornProductionPose = 'idle';

  public readonly sprite: Phaser.GameObjects.Sprite;

  public constructor(
    scene: Phaser.Scene,
    appearance: UnicornAppearance,
    source: Phaser.Physics.Arcade.Sprite,
  ) {
    ensureCoverageTextures(scene, appearance);
    this.appearance = appearance;
    this.sprite = scene.add
      .sprite(source.x, source.y, getPlayerManeCoverageTextureKey(appearance, this.pose))
      .setName(PLAYER_MANE_COVERAGE_NAME)
      .setOrigin(0.5);
    this.sync(source, this.pose);
  }

  private readonly appearance: UnicornAppearance;

  public sync(source: Phaser.Physics.Arcade.Sprite, pose: UnicornProductionPose): void {
    if (pose !== this.pose) {
      this.pose = pose;
      this.sprite.setTexture(getPlayerManeCoverageTextureKey(this.appearance, pose));
    }

    this.sprite
      .setPosition(source.x, source.y)
      .setAngle(source.angle)
      .setDepth(source.depth + 0.04)
      .setDisplaySize(source.displayWidth, source.displayHeight)
      .setFlipX(source.flipX)
      .setFlipY(source.flipY)
      .setAlpha(source.alpha)
      .setVisible(source.visible);
  }

  public destroy(): void {
    this.sprite.destroy();
  }
}
