import Phaser from 'phaser';
import type { CottageWallKey, HomeStyleState, HomeWallStyleState } from '../save/saveSchema';
import { COTTAGE_INTERIOR_MAP } from '../world/CottageInteriorMap';
import {
  COTTAGE_WALL_KEYS,
  getCottageFloorStyle,
  getCottageWallpaper,
  getCottageWallColour,
  resolveCottageStyle,
} from './CottageStyleCatalogue';

interface SurfaceBounds {
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
  wallStyle: HomeWallStyleState,
  bounds: SurfaceBounds,
  scale = 1,
): void {
  const wallpaper = getCottageWallpaper(wallStyle.wallpaperId);
  const wall = getCottageWallColour(wallStyle.wallColourId);
  if (wallpaper.pattern === 'none') return;

  const left = bounds.x - bounds.width / 2;
  const top = bounds.y - bounds.height / 2;
  const stepX = 105 * scale;
  const stepY = 76 * scale;
  const margin = Math.min(24 * scale, Math.max(6, Math.min(bounds.width, bounds.height) * 0.2));

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
      } else if (wallpaper.pattern === 'moon-sprigs') {
        graphics.lineStyle(Math.max(1, 2 * scale), wallpaper.ink, 0.32);
        graphics.strokeCircle(x, y, 7 * scale);
        graphics.fillStyle(wall.fill, 1);
        graphics.fillCircle(x + 3.5 * scale, y - scale, 6 * scale);
        graphics.lineStyle(Math.max(1, 1.7 * scale), wallpaper.accent, 0.34);
        graphics.lineBetween(x + 12 * scale, y + 7 * scale, x + 28 * scale, y + 18 * scale);
      } else {
        graphics.lineStyle(Math.max(1, 1.8 * scale), wallpaper.ink, 0.28);
        graphics.lineBetween(x - 16 * scale, y + 18 * scale, x + 14 * scale, y - 16 * scale);
        graphics.lineStyle(Math.max(1, 1.5 * scale), wallpaper.accent, 0.32);
        graphics.strokeEllipse(x + 4 * scale, y - 6 * scale, 10 * scale, 5 * scale);
      }
    }
  }
}

function drawFloorBoards(
  graphics: Phaser.GameObjects.Graphics,
  style: HomeStyleState,
  bounds: SurfaceBounds,
): void {
  const floor = getCottageFloorStyle(style.floorStyleId);
  const left = bounds.x - bounds.width / 2;
  const top = bounds.y - bounds.height / 2;
  const boardHeight = 68;

  graphics.fillStyle(floor.fill, 1);
  graphics.fillRect(left, top, bounds.width, bounds.height);
  graphics.lineStyle(2.3, floor.grain, 0.42);

  let row = 0;
  for (let y = top + boardHeight; y < top + bounds.height; row += 1, y += boardHeight) {
    graphics.lineBetween(left, y, left + bounds.width, y);
    const offset = row % 2 === 0 ? floor.plankWidth * 0.34 : floor.plankWidth * 0.78;
    for (let x = left + offset; x < left + bounds.width; x += floor.plankWidth) {
      graphics.lineBetween(x, y - boardHeight, x, y);
    }
  }
}

function wallBounds(): Record<CottageWallKey, readonly SurfaceBounds[]> {
  const shell = COTTAGE_INTERIOR_MAP.roomShell;
  const roomWidth = shell.right - shell.left;
  const floorHeight = shell.bottom - shell.backWallBottom;
  const roomCentreX = (shell.left + shell.right) / 2;
  const floorCentreY = shell.backWallBottom + floorHeight / 2;
  const sideWidth = 64;
  const frontHeight = 64;
  const doorGap = COTTAGE_INTERIOR_MAP.furnitureLayout.door.width + 40;
  const frontSegmentWidth = (roomWidth - doorGap) / 2;
  const frontLeftX = shell.left + frontSegmentWidth / 2;
  const frontRightX = shell.right - frontSegmentWidth / 2;

  return {
    back: [
      {
        x: roomCentreX,
        y: shell.top + (shell.backWallBottom - shell.top) / 2,
        width: roomWidth,
        height: shell.backWallBottom - shell.top,
      },
    ],
    left: [
      {
        x: shell.left + sideWidth / 2,
        y: floorCentreY,
        width: sideWidth,
        height: floorHeight,
      },
    ],
    right: [
      {
        x: shell.right - sideWidth / 2,
        y: floorCentreY,
        width: sideWidth,
        height: floorHeight,
      },
    ],
    front: [
      {
        x: frontLeftX,
        y: shell.bottom - frontHeight / 2,
        width: frontSegmentWidth,
        height: frontHeight,
      },
      {
        x: frontRightX,
        y: shell.bottom - frontHeight / 2,
        width: frontSegmentWidth,
        height: frontHeight,
      },
    ],
  };
}

export function renderCottageRoomSurfaces(
  scene: Phaser.Scene,
  persistedStyle: HomeStyleState,
): Phaser.GameObjects.GameObject[] {
  const style = resolveCottageStyle(persistedStyle);
  const shell = COTTAGE_INTERIOR_MAP.roomShell;
  const roomWidth = shell.right - shell.left;
  const floorHeight = shell.bottom - shell.backWallBottom;
  const roomCentreX = (shell.left + shell.right) / 2;
  const floorCentreY = shell.backWallBottom + floorHeight / 2;
  const floor = getCottageFloorStyle(style.floorStyleId);
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

  const floorGraphics = scene.add
    .graphics()
    .setName(`cottage-style-floor:${style.floorStyleId}`)
    .setData('cottage-style-id', style.floorStyleId)
    .setDepth(1);
  drawFloorBoards(floorGraphics, style, {
    x: roomCentreX,
    y: floorCentreY,
    width: roomWidth,
    height: floorHeight,
  });
  objects.push(floorGraphics);

  const boundsByWall = wallBounds();
  for (const wallKey of COTTAGE_WALL_KEYS) {
    const wallStyle = style.walls[wallKey];
    const wall = getCottageWallColour(wallStyle.wallColourId);
    const surface = scene.add
      .graphics()
      .setName(`cottage-style-wall:${wallKey}:${wallStyle.wallColourId}`)
      .setData('cottage-wall-key', wallKey)
      .setData('cottage-style-id', wallStyle.wallColourId)
      .setDepth(1.2);
    const wallpaper = scene.add
      .graphics()
      .setName(`cottage-style-wallpaper:${wallKey}:${wallStyle.wallpaperId}`)
      .setData('cottage-wall-key', wallKey)
      .setData('cottage-style-id', wallStyle.wallpaperId)
      .setDepth(1.4);

    for (const bounds of boundsByWall[wallKey]) {
      surface.fillStyle(wall.fill, 1);
      surface.fillRect(
        bounds.x - bounds.width / 2,
        bounds.y - bounds.height / 2,
        bounds.width,
        bounds.height,
      );
      drawWallpaperPattern(
        wallpaper,
        wallStyle,
        {
          ...bounds,
          width: Math.max(16, bounds.width - 18),
          height: Math.max(16, bounds.height - 18),
        },
        wallKey === 'back' ? 1 : 0.58,
      );
    }
    objects.push(surface, wallpaper);
  }

  objects.push(
    scene.add
      .rectangle(roomCentreX, shell.backWallBottom, roomWidth, 18, floor.seam, 0.82)
      .setName('cottage-floor-seam')
      .setDepth(2.25),
  );

  return objects;
}
