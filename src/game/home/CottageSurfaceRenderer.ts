import Phaser from 'phaser';
import type { HomeStyleState } from '../save/saveSchema';
import {
  getCottageFloorStyle,
  getCottageWallpaper,
  getCottageWallColour,
  resolveCottageStyle,
} from './CottageStyleCatalogue';
import { COTTAGE_INTERIOR_MAP } from '../world/CottageInteriorMap';

export interface CottageSurfacePreviewBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

function drawStar(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  colour: number,
  alpha: number,
): void {
  graphics.lineStyle(Math.max(1, size * 0.16), colour, alpha);
  graphics.lineBetween(x - size, y, x + size, y);
  graphics.lineBetween(x, y - size, x, y + size);
  graphics.lineBetween(x - size * 0.65, y - size * 0.65, x + size * 0.65, y + size * 0.65);
  graphics.lineBetween(x - size * 0.65, y + size * 0.65, x + size * 0.65, y - size * 0.65);
}

function drawWallpaperPattern(
  graphics: Phaser.GameObjects.Graphics,
  style: HomeStyleState,
  bounds: CottageSurfacePreviewBounds,
  scale = 1,
): void {
  const wallpaper = getCottageWallpaper(style.wallpaperId);
  const wall = getCottageWallColour(style.wallColourId);
  if (wallpaper.pattern === 'none') {
    return;
  }

  const left = bounds.x - bounds.width / 2;
  const top = bounds.y - bounds.height / 2;
  const stepX = 105 * scale;
  const stepY = 76 * scale;
  const margin = 24 * scale;

  for (let row = 0, y = top + margin; y < top + bounds.height - margin; row += 1, y += stepY) {
    for (
      let col = 0, x = left + margin + (row % 2) * stepX * 0.46;
      x < left + bounds.width - margin;
      col += 1, x += stepX
    ) {
      if (wallpaper.pattern === 'star-scatter') {
        drawStar(graphics, x, y, 6 * scale, wallpaper.ink, 0.34);
        if ((row + col) % 2 === 0) {
          graphics.fillStyle(wallpaper.accent, 0.3);
          graphics.fillCircle(x + 24 * scale, y + 14 * scale, 2.8 * scale);
        }
        continue;
      }

      if (wallpaper.pattern === 'moon-sprigs') {
        graphics.lineStyle(Math.max(1, 2 * scale), wallpaper.ink, 0.32);
        graphics.strokeCircle(x, y, 7 * scale);
        graphics.fillStyle(wall.fill, 1);
        graphics.fillCircle(x + 3.5 * scale, y - 1 * scale, 6 * scale);
        graphics.lineStyle(Math.max(1, 1.7 * scale), wallpaper.accent, 0.34);
        graphics.lineBetween(x + 12 * scale, y + 7 * scale, x + 28 * scale, y + 18 * scale);
        graphics.strokeEllipse(x + 20 * scale, y + 10 * scale, 8 * scale, 4 * scale);
        graphics.strokeEllipse(x + 27 * scale, y + 17 * scale, 8 * scale, 4 * scale);
        continue;
      }

      graphics.lineStyle(Math.max(1, 1.8 * scale), wallpaper.ink, 0.28);
      graphics.beginPath();
      graphics.moveTo(x - 16 * scale, y + 18 * scale);
      graphics.lineTo(x - 7 * scale, y + 5 * scale);
      graphics.lineTo(x + 2 * scale, y - 4 * scale);
      graphics.lineTo(x + 14 * scale, y - 16 * scale);
      graphics.strokePath();
      graphics.lineStyle(Math.max(1, 1.5 * scale), wallpaper.accent, 0.32);
      graphics.strokeEllipse(x - 7 * scale, y + 5 * scale, 10 * scale, 5 * scale);
      graphics.strokeEllipse(x + 4 * scale, y - 6 * scale, 10 * scale, 5 * scale);
    }
  }
}

function drawFloorBoards(
  graphics: Phaser.GameObjects.Graphics,
  style: HomeStyleState,
  bounds: CottageSurfacePreviewBounds,
  scale = 1,
): void {
  const floor = getCottageFloorStyle(style.floorStyleId);
  const left = bounds.x - bounds.width / 2;
  const top = bounds.y - bounds.height / 2;
  const boardHeight = 68 * scale;
  const plankWidth = floor.plankWidth * scale;

  graphics.fillStyle(floor.fill, 1);
  graphics.fillRect(left, top, bounds.width, bounds.height);
  graphics.lineStyle(Math.max(1, 2.3 * scale), floor.grain, 0.42);

  let row = 0;
  for (let y = top + boardHeight; y < top + bounds.height; row += 1, y += boardHeight) {
    graphics.lineBetween(left, y, left + bounds.width, y);
    const offset = row % 2 === 0 ? plankWidth * 0.34 : plankWidth * 0.78;
    for (let x = left + offset; x < left + bounds.width; x += plankWidth) {
      graphics.lineBetween(x, y - boardHeight, x, y);
    }
  }

  graphics.lineStyle(Math.max(1, 3 * scale), floor.seam, 0.62);
  graphics.lineBetween(left, top, left + bounds.width, top);
}

export function renderCottageRoomSurfaces(
  scene: Phaser.Scene,
  persistedStyle: HomeStyleState,
): Phaser.GameObjects.GameObject[] {
  const style = resolveCottageStyle(persistedStyle);
  const wall = getCottageWallColour(style.wallColourId);
  const floor = getCottageFloorStyle(style.floorStyleId);
  const shell = COTTAGE_INTERIOR_MAP.roomShell;
  const roomWidth = shell.right - shell.left;
  const roomHeight = shell.bottom - shell.top;
  const roomCentreX = (shell.left + shell.right) / 2;
  const roomCentreY = (shell.top + shell.bottom) / 2;
  const wallHeight = shell.backWallBottom - shell.top;
  const wallCentreY = shell.top + wallHeight / 2;
  const floorHeight = shell.bottom - shell.backWallBottom;
  const floorCentreY = shell.backWallBottom + floorHeight / 2;
  const objects: Phaser.GameObjects.GameObject[] = [];

  objects.push(
    scene.add
      .rectangle(
        COTTAGE_INTERIOR_MAP.width / 2,
        COTTAGE_INTERIOR_MAP.height / 2,
        COTTAGE_INTERIOR_MAP.width,
        COTTAGE_INTERIOR_MAP.height,
        0xf4ddc7,
      )
      .setName('cottage-style-outside-room')
      .setDepth(0),
  );

  objects.push(
    scene.add
      .rectangle(roomCentreX, floorCentreY, roomWidth, floorHeight, floor.fill)
      .setName(`cottage-style-floor:${style.floorStyleId}`)
      .setData('cottage-style-id', style.floorStyleId)
      .setDepth(1),
  );

  objects.push(
    scene.add
      .rectangle(roomCentreX, wallCentreY, roomWidth, wallHeight, wall.fill)
      .setName(`cottage-style-wall:${style.wallColourId}`)
      .setData('cottage-style-id', style.wallColourId)
      .setDepth(1.2),
  );

  const wallpaperGraphics = scene.add
    .graphics()
    .setName(`cottage-style-wallpaper:${style.wallpaperId}`)
    .setData('cottage-style-id', style.wallpaperId)
    .setDepth(1.4);
  drawWallpaperPattern(
    wallpaperGraphics,
    style,
    {
      x: roomCentreX,
      y: wallCentreY,
      width: roomWidth - 34,
      height: wallHeight - 34,
    },
    1,
  );
  objects.push(wallpaperGraphics);

  const floorGraphics = scene.add
    .graphics()
    .setName(`cottage-style-floor-detail:${style.floorStyleId}`)
    .setDepth(1.5);
  drawFloorBoards(
    floorGraphics,
    style,
    {
      x: roomCentreX,
      y: floorCentreY,
      width: roomWidth,
      height: floorHeight,
    },
    1,
  );
  objects.push(floorGraphics);

  const baseboard = scene.add
    .rectangle(roomCentreX, shell.backWallBottom, roomWidth, 18, floor.seam, 0.82)
    .setName('cottage-floor-seam')
    .setDepth(2.25);
  objects.push(baseboard);

  const roomFrame = scene.add
    .rectangle(roomCentreX, roomCentreY, roomWidth, roomHeight, 0xffffff, 0.001)
    .setName('cottage-room-frame')
    .setStrokeStyle(18, 0xb98b72, 0.9)
    .setDepth(2.35);
  objects.push(roomFrame);

  return objects;
}

export function drawCottageStylePreview(
  graphics: Phaser.GameObjects.Graphics,
  persistedStyle: HomeStyleState,
  bounds: CottageSurfacePreviewBounds,
): void {
  const style = resolveCottageStyle(persistedStyle);
  const wall = getCottageWallColour(style.wallColourId);
  const floor = getCottageFloorStyle(style.floorStyleId);
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
  const scale = Math.max(0.34, Math.min(0.62, bounds.width / 900));

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
  drawWallpaperPattern(graphics, style, wallBounds, scale);
  drawFloorBoards(graphics, style, floorBounds, scale);

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
