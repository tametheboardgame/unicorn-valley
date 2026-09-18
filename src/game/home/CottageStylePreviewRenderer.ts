import type Phaser from 'phaser';
import type { HomeStyleState } from '../save/saveSchema';
import {
  getCottageFloorStyle,
  getCottageWallpaper,
  getCottageWallColour,
  resolveCottageStyle,
} from './CottageStyleCatalogue';

interface PreviewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function drawWallpaper(
  graphics: Phaser.GameObjects.Graphics,
  style: HomeStyleState,
  bounds: PreviewBounds,
): void {
  const wallpaper = getCottageWallpaper(style.wallpaperId);
  if (wallpaper.pattern === 'none') return;

  const left = bounds.x - bounds.width / 2 + 24;
  const top = bounds.y - bounds.height / 2 + 20;
  for (let row = 0, y = top; y < top + bounds.height - 30; row += 1, y += 42) {
    for (let x = left + (row % 2) * 34; x < left + bounds.width - 42; x += 68) {
      graphics.lineStyle(2, wallpaper.ink, 0.3);
      if (wallpaper.pattern === 'star-scatter') {
        graphics.lineBetween(x - 5, y, x + 5, y);
        graphics.lineBetween(x, y - 5, x, y + 5);
      } else if (wallpaper.pattern === 'moon-sprigs') {
        graphics.strokeCircle(x, y, 5);
        graphics.lineStyle(2, wallpaper.accent, 0.3);
        graphics.lineBetween(x + 9, y + 5, x + 20, y + 13);
      } else {
        graphics.lineBetween(x - 8, y + 10, x, y);
        graphics.lineBetween(x, y, x + 9, y - 10);
        graphics.lineStyle(2, wallpaper.accent, 0.3);
        graphics.strokeEllipse(x + 5, y - 5, 8, 4);
      }
    }
  }
}

function drawFloor(
  graphics: Phaser.GameObjects.Graphics,
  style: HomeStyleState,
  bounds: PreviewBounds,
): void {
  const floor = getCottageFloorStyle(style.floorStyleId);
  const left = bounds.x - bounds.width / 2;
  const top = bounds.y - bounds.height / 2;
  const rowHeight = 38;

  graphics.fillStyle(floor.fill, 1);
  graphics.fillRect(left, top, bounds.width, bounds.height);
  graphics.lineStyle(2, floor.grain, 0.44);
  for (let row = 1, y = top + rowHeight; y < top + bounds.height; row += 1, y += rowHeight) {
    graphics.lineBetween(left, y, left + bounds.width, y);
    const offset = row % 2 === 0 ? 54 : 122;
    for (let x = left + offset; x < left + bounds.width; x += 150) {
      graphics.lineBetween(x, y - rowHeight, x, y);
    }
  }
}

export function drawCottageStylePreview(
  graphics: Phaser.GameObjects.Graphics,
  persistedStyle: HomeStyleState,
  bounds: PreviewBounds,
): void {
  const style = resolveCottageStyle(persistedStyle);
  const wall = getCottageWallColour(style.wallColourId);
  const wallHeight = bounds.height * 0.48;
  const floorHeight = bounds.height - wallHeight;
  const wallBounds = {
    x: bounds.x,
    y: bounds.y - bounds.height / 2 + wallHeight / 2,
    width: bounds.width,
    height: wallHeight,
  };
  const floorBounds = {
    x: bounds.x,
    y: bounds.y + bounds.height / 2 - floorHeight / 2,
    width: bounds.width,
    height: floorHeight,
  };

  graphics.clear();
  graphics.fillStyle(0x3b284d, 0.18);
  graphics.fillRoundedRect(
    bounds.x - bounds.width / 2 + 7,
    bounds.y - bounds.height / 2 + 9,
    bounds.width,
    bounds.height,
    24,
  );
  graphics.fillStyle(wall.fill, 1);
  graphics.fillRoundedRect(
    wallBounds.x - wallBounds.width / 2,
    wallBounds.y - wallBounds.height / 2,
    wallBounds.width,
    wallBounds.height + 18,
    20,
  );
  drawWallpaper(graphics, style, wallBounds);
  drawFloor(graphics, style, floorBounds);

  graphics.lineStyle(5, 0xb98b72, 0.88);
  graphics.strokeRoundedRect(
    bounds.x - bounds.width / 2,
    bounds.y - bounds.height / 2,
    bounds.width,
    bounds.height,
    20,
  );

  const sofaY = bounds.y + bounds.height * 0.21;
  graphics.fillStyle(0x6fa08e, 0.95);
  graphics.fillRoundedRect(bounds.x + bounds.width * 0.16, sofaY - 32, bounds.width * 0.2, 64, 16);
  graphics.fillStyle(0xc59ad6, 0.94);
  graphics.fillRoundedRect(bounds.x + bounds.width * 0.185, sofaY - 20, 36, 32, 8);
  graphics.fillStyle(0xf0cf74, 0.94);
  graphics.fillRoundedRect(bounds.x + bounds.width * 0.245, sofaY - 20, 36, 32, 8);

  const tableY = bounds.y + bounds.height * 0.12;
  graphics.fillStyle(0xa77758, 0.95);
  graphics.fillEllipse(bounds.x - bounds.width * 0.14, tableY, 118, 52);
  graphics.fillRect(bounds.x - bounds.width * 0.14 - 9, tableY + 20, 18, 42);
}
