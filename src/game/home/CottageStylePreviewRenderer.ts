import type Phaser from 'phaser';
import type {
  CottageFurnitureStyleKey,
  CottageWallKey,
  HomeStyleState,
  HomeWallStyleState,
} from '../save/saveSchema';
import { getCottageFurniturePalette } from './CottageFurnitureVariantCatalogue';
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
    graphics.fillRect(part.x - part.width / 2, part.y - part.height / 2, part.width, part.height);
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
  selectedFurniture: CottageFurnitureStyleKey | null = null,
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

  const sofaPalette = getCottageFurniturePalette('sofa', style.furnitureVariants.sofa);
  const sofaX = bounds.x + bounds.width * 0.25;
  const sofaY = bounds.y + bounds.height * 0.2;
  graphics.fillStyle(sofaPalette[0], 0.98);
  graphics.fillRoundedRect(sofaX - 65, sofaY - 31, 130, 65, 16);
  graphics.fillStyle(sofaPalette[1], 1);
  graphics.fillRoundedRect(sofaX - 52, sofaY - 22, 104, 43, 12);
  graphics.fillStyle(0xffe7a3, 1);
  graphics.fillRoundedRect(sofaX - 35, sofaY - 16, 25, 25, 6);
  graphics.fillStyle(0xc8a4d9, 1);
  graphics.fillRoundedRect(sofaX + 10, sofaY - 16, 25, 25, 6);
  if (selectedFurniture === 'sofa') {
    graphics.lineStyle(4, 0xd3a84d, 0.96);
    graphics.strokeRoundedRect(sofaX - 70, sofaY - 36, 140, 75, 18);
  }

  const teaPalette = getCottageFurniturePalette('teaSet', style.furnitureVariants.teaSet);
  const tableX = bounds.x - bounds.width * 0.04;
  const tableY = bounds.y + bounds.height * 0.1;
  graphics.fillStyle(teaPalette[0], 1);
  graphics.fillEllipse(tableX, tableY + 5, 112, 50);
  graphics.fillStyle(teaPalette[1], 1);
  graphics.fillEllipse(tableX, tableY, 104, 43);
  graphics.fillStyle(0xc8a4d9, 1);
  graphics.fillCircle(tableX, tableY - 6, 10);
  graphics.fillStyle(teaPalette[0], 1);
  graphics.fillRect(tableX - 7, tableY + 20, 14, 35);
  if (selectedFurniture === 'teaSet') {
    graphics.lineStyle(4, 0xd3a84d, 0.96);
    graphics.strokeRoundedRect(tableX - 64, tableY - 34, 128, 96, 15);
  }

  const bedPalette = getCottageFurniturePalette('bed', style.furnitureVariants.bed);
  const bedX = bounds.x - bounds.width * 0.29;
  const bedY = bounds.y + bounds.height * 0.22;
  graphics.fillStyle(bedPalette[0], 1);
  graphics.fillRoundedRect(bedX - 70, bedY - 48, 140, 96, 14);
  graphics.fillStyle(0xfff4e5, 1);
  graphics.fillRoundedRect(bedX - 59, bedY - 38, 118, 70, 11);
  graphics.fillStyle(0xe9bfd4, 1);
  graphics.fillRoundedRect(bedX - 55, bedY + 2, 110, 30, 9);
  graphics.fillStyle(bedPalette[1], 0.98);
  graphics.fillRoundedRect(bedX - 52, bedY + 17, 104, 24, 8);
  if (selectedFurniture === 'bed') {
    graphics.lineStyle(4, 0xd3a84d, 0.96);
    graphics.strokeRoundedRect(bedX - 76, bedY - 54, 152, 108, 17);
  }

  const fireplacePalette = getCottageFurniturePalette(
    'fireplace',
    style.furnitureVariants.fireplace,
  );
  const fireX = bounds.x - bounds.width * 0.29;
  const fireY = top + backHeight * 0.62;
  graphics.fillStyle(fireplacePalette[0], 1);
  graphics.fillRoundedRect(fireX - 48, fireY - 34, 96, 72, 12);
  graphics.fillStyle(fireplacePalette[1], 1);
  graphics.fillRoundedRect(fireX - 40, fireY - 27, 80, 58, 10);
  graphics.fillStyle(0x4d3940, 1);
  graphics.fillRoundedRect(fireX - 22, fireY - 3, 44, 36, 13);
  graphics.fillStyle(0xffb45a, 0.96);
  graphics.fillEllipse(fireX, fireY + 13, 21, 34);
  if (selectedFurniture === 'fireplace') {
    graphics.lineStyle(4, 0xd3a84d, 0.96);
    graphics.strokeRoundedRect(fireX - 55, fireY - 41, 110, 86, 15);
  }
}
