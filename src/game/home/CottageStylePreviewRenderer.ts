import type Phaser from 'phaser';
import type { CottageWallKey, HomeStyleState, HomeWallStyleState } from '../save/saveSchema';
import {
  COTTAGE_WALL_KEYS,
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
  wallStyle: HomeWallStyleState,
  bounds: PreviewBounds,
): void {
  const wallpaper = getCottageWallpaper(wallStyle.wallpaperId);
  if (wallpaper.pattern === 'none') return;

  const left = bounds.x - bounds.width / 2 + 8;
  const top = bounds.y - bounds.height / 2 + 8;
  const stepX = Math.max(22, Math.min(48, bounds.width / 4));
  const stepY = Math.max(18, Math.min(34, bounds.height / 3));

  for (let row = 0, y = top; y < top + bounds.height - 8; row += 1, y += stepY) {
    for (let x = left + (row % 2) * stepX * 0.35; x < left + bounds.width - 8; x += stepX) {
      graphics.lineStyle(1.5, wallpaper.ink, 0.36);
      if (wallpaper.pattern === 'star-scatter') {
        graphics.lineBetween(x - 4, y, x + 4, y);
        graphics.lineBetween(x, y - 4, x, y + 4);
      } else if (wallpaper.pattern === 'moon-sprigs') {
        graphics.strokeCircle(x, y, 4);
        graphics.lineStyle(1.5, wallpaper.accent, 0.34);
        graphics.lineBetween(x + 6, y + 3, x + 12, y + 8);
      } else {
        graphics.lineBetween(x - 5, y + 6, x, y);
        graphics.lineBetween(x, y, x + 5, y - 6);
      }
    }
  }
}

function drawWall(
  graphics: Phaser.GameObjects.Graphics,
  wallStyle: HomeWallStyleState,
  bounds: readonly PreviewBounds[],
  selected: boolean,
): void {
  const colour = getCottageWallColour(wallStyle.wallColourId);
  for (const part of bounds) {
    graphics.fillStyle(colour.fill, 1);
    graphics.fillRect(
      part.x - part.width / 2,
      part.y - part.height / 2,
      part.width,
      part.height,
    );
    drawWallpaper(graphics, wallStyle, part);
    if (selected) {
      graphics.lineStyle(4, 0xd3a84d, 0.96);
      graphics.strokeRect(
        part.x - part.width / 2 + 2,
        part.y - part.height / 2 + 2,
        part.width - 4,
        part.height - 4,
      );
    }
  }
}

export function drawCottageStylePreview(
  graphics: Phaser.GameObjects.Graphics,
  persistedStyle: HomeStyleState,
  bounds: PreviewBounds,
  selectedWall: CottageWallKey | null = null,
): void {
  const style = resolveCottageStyle(persistedStyle);
  const floor = getCottageFloorStyle(style.floorStyleId);
  const left = bounds.x - bounds.width / 2;
  const top = bounds.y - bounds.height / 2;
  const backHeight = bounds.height * 0.38;
  const sideWidth = bounds.width * 0.09;
  const frontHeight = bounds.height * 0.1;
  const floorTop = top + backHeight;
  const floorHeight = bounds.height - backHeight;
  const doorGap = bounds.width * 0.22;
  const frontSegment = (bounds.width - doorGap) / 2;

  const wallBounds: Record<CottageWallKey, readonly PreviewBounds[]> = {
    back: [
      {
        x: bounds.x,
        y: top + backHeight / 2,
        width: bounds.width,
        height: backHeight,
      },
    ],
    left: [
      {
        x: left + sideWidth / 2,
        y: floorTop + floorHeight / 2,
        width: sideWidth,
        height: floorHeight,
      },
    ],
    right: [
      {
        x: left + bounds.width - sideWidth / 2,
        y: floorTop + floorHeight / 2,
        width: sideWidth,
        height: floorHeight,
      },
    ],
    front: [
      {
        x: left + frontSegment / 2,
        y: top + bounds.height - frontHeight / 2,
        width: frontSegment,
        height: frontHeight,
      },
      {
        x: left + bounds.width - frontSegment / 2,
        y: top + bounds.height - frontHeight / 2,
        width: frontSegment,
        height: frontHeight,
      },
    ],
  };

  graphics.clear();
  graphics.fillStyle(0x3b284d, 0.18);
  graphics.fillRoundedRect(left + 7, top + 9, bounds.width, bounds.height, 24);

  graphics.fillStyle(floor.fill, 1);
  graphics.fillRect(left, floorTop, bounds.width, floorHeight);
  graphics.lineStyle(2, floor.grain, 0.42);
  for (let y = floorTop + 30; y < top + bounds.height; y += 30) {
    graphics.lineBetween(left, y, left + bounds.width, y);
  }

  for (const wallKey of COTTAGE_WALL_KEYS) {
    drawWall(graphics, style.walls[wallKey], wallBounds[wallKey], selectedWall === wallKey);
  }

  graphics.lineStyle(5, 0xb98b72, 0.88);
  graphics.strokeRoundedRect(left, top, bounds.width, bounds.height, 20);

  const sofaY = bounds.y + bounds.height * 0.2;
  graphics.fillStyle(0x6fa08e, 0.95);
  graphics.fillRoundedRect(bounds.x + bounds.width * 0.16, sofaY - 28, bounds.width * 0.2, 58, 14);
  graphics.fillStyle(0xc59ad6, 0.94);
  graphics.fillRoundedRect(bounds.x + bounds.width * 0.185, sofaY - 17, 32, 28, 7);
  graphics.fillStyle(0xf0cf74, 0.94);
  graphics.fillRoundedRect(bounds.x + bounds.width * 0.245, sofaY - 17, 32, 28, 7);

  const tableY = bounds.y + bounds.height * 0.1;
  graphics.fillStyle(0xa77758, 0.95);
  graphics.fillEllipse(bounds.x - bounds.width * 0.14, tableY, 108, 48);
  graphics.fillRect(bounds.x - bounds.width * 0.14 - 8, tableY + 18, 16, 36);
}
