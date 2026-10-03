import type Phaser from 'phaser';
import { describe, expect, it } from 'vitest';
import type { UnicornAppearance } from '../player/UnicornAppearance';
import { resolveRainbowDiscHornCatchPoint } from './RainbowDiscArt';

const appearance: UnicornAppearance = {
  bodyColour: 'cream',
  eyeColour: 'violet',
  maneStyle: 'swept',
  maneColour: 'coral',
  tailStyle: 'plume',
  tailColour: 'coral',
  hornStyle: 'star',
  marking: 'star',
  accessory: 'ribbon',
};

function fakeSprite(flipX = false): Phaser.GameObjects.Sprite {
  return {
    x: 500,
    y: 700,
    flipX,
    displayWidth: 165,
    displayHeight: 109,
    originX: 0.5,
    originY: 0.78,
  } as unknown as Phaser.GameObjects.Sprite;
}

describe('RainbowDiscArt horn catch geometry', () => {
  it('places the ring high on the horn rather than forward at the muzzle', () => {
    const point = resolveRainbowDiscHornCatchPoint(fakeSprite(false), appearance);
    expect(Math.abs(point.x - 500)).toBeLessThan(10);
    expect(point.y).toBeLessThan(650);
    expect(point.y).toBeGreaterThan(625);
  });

  it('mirrors the small horn offset when the unicorn faces left', () => {
    const right = resolveRainbowDiscHornCatchPoint(fakeSprite(false), appearance);
    const left = resolveRainbowDiscHornCatchPoint(fakeSprite(true), appearance);
    expect(right.x - 500).toBeCloseTo(500 - left.x, 4);
    expect(left.y).toBeCloseTo(right.y, 4);
  });
});
