import Phaser from 'phaser';
import { COTTAGE_INTERIOR_MAP, type CottageRectLayout } from '../world/CottageInteriorMap';
import type { MapPoint } from '../world/MapTraversal';

const PALETTE = {
  timberDark: 0x6e4f45,
  timber: 0x916751,
  timberLight: 0xc4936f,
  cream: 0xfff4e5,
  creamShade: 0xe7d0bb,
  rose: 0xe9bfd4,
  roseDark: 0xb9819f,
  lavender: 0xc8a4d9,
  lavenderDark: 0x9e78b0,
  sage: 0x91b9a8,
  sageDark: 0x638878,
  gold: 0xf0cc78,
  goldLight: 0xffe7a3,
  hearthDark: 0x4d3940,
  stone: 0xb78b78,
  stoneLight: 0xd5aa91,
  sky: 0xbce6ef,
  skyLight: 0xe8f6f2,
  outsideGreen: 0x9dc8a8,
  ink: 0x624b59,
  roomOutside: 0xf4ddc7,
} as const;

const FURNITURE_SCALE = {
  bed: 0.9,
  teaTable: 0.9,
  sofa: 0.82,
  treasureShelf: 0.94,
} as const;

function addFloorShadow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.11,
): void {
  scene.add.ellipse(x, y, width, height, PALETTE.ink, alpha).setDepth(4);
}

function drawCrescent(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  colour: number,
  cutoutColour: number,
): void {
  graphics.fillStyle(colour, 1);
  graphics.fillCircle(x, y, radius);
  graphics.fillStyle(cutoutColour, 1);
  graphics.fillCircle(x + radius * 0.42, y - radius * 0.16, radius * 0.82);
}

function lowerFloorSeamBehindFurniture(scene: Phaser.Scene): void {
  const seam = scene.children.getByName('cottage-floor-seam');
  if (seam instanceof Phaser.GameObjects.Rectangle) {
    seam.setDepth(2.25);
  }
}

function renderWindow(scene: Phaser.Scene, window: CottageRectLayout): void {
  const left = window.x - window.width / 2;
  const top = window.y - window.height / 2;
  const bottom = top + window.height;
  const graphics = scene.add.graphics().setDepth(5);

  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(left - 13, top - 13, window.width + 26, window.height + 26, 18);
  graphics.fillStyle(PALETTE.sky, 1);
  graphics.fillRoundedRect(left, top, window.width, window.height, 10);

  graphics.fillStyle(PALETTE.skyLight, 0.7);
  graphics.fillCircle(window.x - 54, window.y - 25, 18);
  graphics.fillCircle(window.x - 34, window.y - 28, 24);
  graphics.fillCircle(window.x - 9, window.y - 23, 17);

  // The landscape owns the whole lower portion of the glass so there can never be a strip
  // of sky beneath the hills. All geometry remains inside the window aperture.
  const landscapeTop = window.y + 27;
  graphics.fillStyle(PALETTE.outsideGreen, 0.58);
  graphics.fillRect(left, landscapeTop, window.width, bottom - landscapeTop);
  graphics.fillEllipse(window.x - 42, landscapeTop + 4, 150, 40);
  graphics.fillEllipse(window.x + 58, landscapeTop + 8, 140, 42);

  graphics.fillStyle(PALETTE.cream, 0.94);
  graphics.fillRect(window.x - 4, top + 3, 8, window.height - 6);
  graphics.fillRect(left + 3, window.y - 4, window.width - 6, 8);

  graphics.fillStyle(PALETTE.rose, 0.96);
  graphics.fillRoundedRect(left - 31, top - 12, 29, window.height + 54, 13);
  graphics.fillRoundedRect(left + window.width + 2, top - 12, 29, window.height + 54, 13);
  graphics.fillStyle(PALETTE.roseDark, 0.88);
  graphics.fillRect(left - 24, window.y + 12, 16, 8);
  graphics.fillRect(left + window.width + 8, window.y + 12, 16, 8);
  graphics.fillStyle(PALETTE.gold, 0.95);
  graphics.fillCircle(left - 16, window.y + 16, 5);
  graphics.fillCircle(left + window.width + 16, window.y + 16, 5);
}

function renderFireplace(scene: Phaser.Scene): void {
  const fireplace = COTTAGE_INTERIOR_MAP.furnitureLayout.fireplace;
  const left = fireplace.x - fireplace.width / 2;
  const top = fireplace.y - fireplace.height / 2;

  scene.add
    .ellipse(fireplace.x, fireplace.y + 62, fireplace.width + 90, 86, PALETTE.gold, 0.09)
    .setDepth(4);

  const graphics = scene.add.graphics().setDepth(6);
  graphics.fillStyle(PALETTE.stone, 1);
  graphics.fillRoundedRect(left - 18, top - 6, fireplace.width + 36, fireplace.height + 25, 18);
  graphics.fillStyle(PALETTE.stoneLight, 1);
  graphics.fillRoundedRect(left - 5, top + 7, fireplace.width + 10, fireplace.height - 5, 14);

  graphics.lineStyle(3, PALETTE.stone, 0.55);
  for (const xOffset of [0.25, 0.5, 0.75]) {
    const x = left + fireplace.width * xOffset;
    graphics.lineBetween(x, top + 10, x, top + 42);
  }
  graphics.lineBetween(left + 3, top + 44, left + fireplace.width - 3, top + 44);

  const openingWidth = fireplace.width * 0.52;
  const openingHeight = fireplace.height * 0.63;
  graphics.fillStyle(PALETTE.hearthDark, 1);
  graphics.fillRoundedRect(
    fireplace.x - openingWidth / 2,
    fireplace.y - openingHeight / 2 + 26,
    openingWidth,
    openingHeight,
    26,
  );
  graphics.fillStyle(0x2f252d, 0.9);
  graphics.fillRect(fireplace.x - openingWidth / 2 + 13, fireplace.y + 42, openingWidth - 26, 17);

  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(left - 30, top - 35, fireplace.width + 60, 34, 11);
  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(left - 19, top - 42, fireplace.width + 38, 16, 8);

  graphics.lineStyle(10, PALETTE.timber, 1);
  graphics.lineBetween(fireplace.x - 42, fireplace.y + 50, fireplace.x + 36, fireplace.y + 35);
  graphics.lineBetween(fireplace.x + 42, fireplace.y + 50, fireplace.x - 34, fireplace.y + 34);

  graphics.fillStyle(0xf28f4b, 0.95);
  graphics.fillEllipse(fireplace.x - 16, fireplace.y + 34, 44, 70);
  graphics.fillEllipse(fireplace.x + 18, fireplace.y + 33, 42, 74);
  graphics.fillStyle(0xffd568, 1);
  graphics.fillEllipse(fireplace.x, fireplace.y + 42, 38, 62);
  graphics.fillStyle(0xfff0a7, 0.92);
  graphics.fillEllipse(fireplace.x, fireplace.y + 49, 18, 40);

  drawCrescent(graphics, fireplace.x, top - 24, 16, PALETTE.goldLight, PALETTE.timberDark);
  graphics.fillStyle(PALETTE.goldLight, 0.95);
  for (const [dx, dy] of [
    [-38, -21],
    [39, -18],
    [-55, -7],
    [56, -5],
  ] as const) {
    graphics.fillCircle(fireplace.x + dx, top + dy, 3);
  }
}

function renderBed(scene: Phaser.Scene): void {
  const bed = COTTAGE_INTERIOR_MAP.furnitureLayout.bed;
  const width = bed.width * FURNITURE_SCALE.bed;
  const height = bed.height * FURNITURE_SCALE.bed;
  const left = bed.x - width / 2;
  const top = bed.y - height / 2;

  addFloorShadow(scene, bed.x + 5, bed.y + height * 0.41, width + 30, 76, 0.11);

  const graphics = scene.add.graphics().setDepth(6);

  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(left - 8, top - 10, width + 16, height + 22, 17);
  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(left + 8, top - 19, width - 16, 62, 19);

  graphics.fillStyle(PALETTE.cream, 1);
  graphics.fillRoundedRect(left + 14, top + 38, width - 28, height - 54, 17);
  graphics.fillStyle(PALETTE.rose, 1);
  graphics.fillRoundedRect(left + 18, top + 91, width - 36, height - 105, 14);
  graphics.fillStyle(PALETTE.lavender, 0.96);
  graphics.fillRoundedRect(left + 18, bed.y + 9, width - 36, height * 0.42, 14);
  graphics.fillStyle(PALETTE.lavenderDark, 0.3);
  graphics.fillRoundedRect(left + 27, bed.y + 21, width - 54, 10, 6);

  const pillowGap = 10;
  const pillowWidth = (width - 66 - pillowGap) / 2;
  const pillowY = top + 50;
  graphics.fillStyle(PALETTE.cream, 1);
  graphics.fillRoundedRect(left + 28, pillowY, pillowWidth, 43, 15);
  graphics.fillRoundedRect(left + 28 + pillowWidth + pillowGap, pillowY, pillowWidth, 43, 15);
  graphics.lineStyle(2, PALETTE.creamShade, 0.7);
  graphics.strokeRoundedRect(left + 28, pillowY, pillowWidth, 43, 15);
  graphics.strokeRoundedRect(left + 28 + pillowWidth + pillowGap, pillowY, pillowWidth, 43, 15);

  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(left - 10, bed.y + height / 2 - 20, width + 20, 34, 10);
  graphics.fillStyle(PALETTE.gold, 0.82);
  graphics.fillCircle(bed.x - width * 0.31, bed.y + height / 2 - 4, 4);
  graphics.fillCircle(bed.x + width * 0.31, bed.y + height / 2 - 4, 4);

  drawCrescent(graphics, bed.x, top + 7, 13, PALETTE.goldLight, PALETTE.timber);
  graphics.fillStyle(PALETTE.goldLight, 0.9);
  graphics.fillCircle(bed.x - 39, top + 9, 3);
  graphics.fillCircle(bed.x + 40, top + 10, 3);
}

function renderChair(scene: Phaser.Scene, x: number, y: number, facing: -1 | 1): void {
  const graphics = scene.add.graphics().setDepth(5);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(x - 33, y - 42, 66, 76, 19);
  graphics.fillStyle(PALETTE.timberLight, 1);
  graphics.fillRoundedRect(x - 27, y - 34, 54, 53, 16);
  graphics.fillStyle(PALETTE.cream, 0.95);
  graphics.fillEllipse(x, y + 7, 48, 32);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRect(x - 24 + facing * 3, y + 19, 8, 30);
  graphics.fillRect(x + 16 + facing * 3, y + 19, 8, 30);
}

function renderTeaTable(scene: Phaser.Scene): void {
  const table = COTTAGE_INTERIOR_MAP.furnitureLayout.teaTable;
  const width = table.width * FURNITURE_SCALE.teaTable;
  const height = table.height * FURNITURE_SCALE.teaTable;
  const chairOffset = width / 2 + 24;

  addFloorShadow(scene, table.x, table.y + 34, width + 66, height * 0.68, 0.1);
  renderChair(scene, table.x - chairOffset, table.y + 8, 1);
  renderChair(scene, table.x + chairOffset, table.y + 8, -1);

  // Draw the pedestal first so the tabletop naturally occludes its upper section.
  const pedestal = scene.add.graphics().setDepth(5.5);
  pedestal.fillStyle(PALETTE.timberDark, 1);
  pedestal.fillRoundedRect(table.x - 11, table.y + 40, 22, 78, 9);
  pedestal.fillEllipse(table.x, table.y + 98, 78, 22);

  const tabletop = scene.add.graphics().setDepth(6);
  tabletop.fillStyle(PALETTE.timberDark, 1);
  tabletop.fillEllipse(table.x, table.y + 13, width + 10, height + 3);
  tabletop.fillStyle(PALETTE.timberLight, 1);
  tabletop.fillEllipse(table.x, table.y, width, height);
  tabletop.lineStyle(3, PALETTE.timber, 0.74);
  tabletop.strokeEllipse(table.x, table.y, width - 16, height - 14);

  tabletop.fillStyle(PALETTE.lavender, 1);
  tabletop.fillEllipse(table.x, table.y - 10, 43, 30);
  tabletop.fillRoundedRect(table.x - 9, table.y - 29, 18, 8, 4);
  tabletop.fillStyle(PALETTE.goldLight, 1);
  tabletop.fillCircle(table.x, table.y - 30, 4);
  tabletop.fillStyle(PALETTE.roseDark, 1);
  tabletop.fillTriangle(
    table.x - 20,
    table.y - 15,
    table.x - 39,
    table.y - 8,
    table.x - 20,
    table.y - 4,
  );
  tabletop.lineStyle(4, PALETTE.roseDark, 1);
  tabletop.strokeCircle(table.x + 22, table.y - 10, 10);

  for (const dx of [-48, 48]) {
    tabletop.fillStyle(PALETTE.cream, 1);
    tabletop.fillEllipse(table.x + dx, table.y + 14, 22, 16);
    tabletop.lineStyle(3, PALETTE.roseDark, 0.9);
    tabletop.strokeCircle(table.x + dx + Math.sign(dx) * 10, table.y + 14, 5);
    tabletop.lineStyle(2, PALETTE.creamShade, 0.8);
    tabletop.strokeEllipse(table.x + dx, table.y + 20, 28, 8);
  }
}

function renderSofa(scene: Phaser.Scene): void {
  const sofa = COTTAGE_INTERIOR_MAP.furnitureLayout.sofa;
  const width = sofa.width * FURNITURE_SCALE.sofa;
  const height = sofa.height * FURNITURE_SCALE.sofa;
  const left = sofa.x - width / 2;
  const top = sofa.y - height / 2;

  addFloorShadow(scene, sofa.x, sofa.y + 48, width + 30, 56, 0.1);

  const graphics = scene.add.graphics().setDepth(6);
  const armWidth = 36;
  const innerLeft = left + armWidth;
  const innerWidth = width - armWidth * 2;
  const seatGap = 8;
  const seatWidth = (innerWidth - seatGap) / 2;

  graphics.fillStyle(PALETTE.sageDark, 1);
  graphics.fillRoundedRect(left - 5, top - 20, width + 10, height + 28, 27);
  graphics.fillStyle(PALETTE.sage, 1);
  graphics.fillRoundedRect(innerLeft - 3, top - 12, innerWidth + 6, 72, 22);

  graphics.fillStyle(0xa8cbbb, 1);
  graphics.fillRoundedRect(innerLeft, sofa.y - 1, seatWidth, 57, 16);
  graphics.fillRoundedRect(innerLeft + seatWidth + seatGap, sofa.y - 1, seatWidth, 57, 16);
  graphics.lineStyle(2, PALETTE.sageDark, 0.38);
  graphics.lineBetween(sofa.x, sofa.y + 3, sofa.x, sofa.y + 50);

  graphics.fillStyle(PALETTE.sageDark, 1);
  graphics.fillRoundedRect(left - 13, sofa.y - 17, armWidth, 77, 17);
  graphics.fillRoundedRect(left + width - armWidth + 13, sofa.y - 17, armWidth, 77, 17);
  graphics.fillRect(left + 16, sofa.y + 45, 9, 29);
  graphics.fillRect(left + width - 25, sofa.y + 45, 9, 29);

  const pillowWidth = Math.min(48, seatWidth * 0.58);
  const pillowXOffset = innerWidth * 0.25;
  graphics.fillStyle(PALETTE.goldLight, 1);
  graphics.fillRoundedRect(sofa.x - pillowXOffset - pillowWidth / 2, sofa.y - 17, pillowWidth, 42, 14);
  graphics.fillStyle(PALETTE.lavender, 1);
  graphics.fillRoundedRect(sofa.x + pillowXOffset - pillowWidth / 2, sofa.y - 17, pillowWidth, 42, 14);
  graphics.lineStyle(2, PALETTE.cream, 0.62);
  graphics.lineBetween(
    sofa.x - pillowXOffset - pillowWidth * 0.33,
    sofa.y + 2,
    sofa.x - pillowXOffset + pillowWidth * 0.33,
    sofa.y - 10,
  );
  graphics.lineBetween(
    sofa.x + pillowXOffset - pillowWidth * 0.33,
    sofa.y - 10,
    sofa.x + pillowXOffset + pillowWidth * 0.33,
    sofa.y + 2,
  );
}

function renderTreasureShelf(scene: Phaser.Scene): void {
  const shelf = COTTAGE_INTERIOR_MAP.furnitureLayout.treasureShelf;
  const width = shelf.width * FURNITURE_SCALE.treasureShelf;
  const height = shelf.height * FURNITURE_SCALE.treasureShelf;
  const left = shelf.x - width / 2;
  const top = shelf.y - height / 2;
  const graphics = scene.add.graphics().setDepth(6);

  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(left - 12, top - 48, width + 24, height + 65, 15);
  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(left, top - 37, width, height + 40, 11);
  graphics.fillStyle(0x795647, 0.72);
  graphics.fillRoundedRect(left + 12, top - 25, width - 24, height + 16, 8);

  graphics.fillStyle(PALETTE.timberLight, 1);
  graphics.fillRoundedRect(left - 16, top + 3, width + 32, 15, 7);
  graphics.fillRoundedRect(left - 16, top + 40, width + 32, 15, 7);
  graphics.fillStyle(PALETTE.gold, 0.85);
  graphics.fillCircle(left + 17, top + 65, 5);
  graphics.fillCircle(left + width - 17, top + 65, 5);

  graphics.fillStyle(PALETTE.cream, 0.88);
  graphics.fillRoundedRect(left + 20, top - 13, 24, 37, 5);
  graphics.fillStyle(PALETTE.rose, 0.9);
  graphics.fillRoundedRect(left + 49, top - 6, 20, 30, 5);
  graphics.fillStyle(PALETTE.sage, 0.9);
  graphics.fillRoundedRect(left + 73, top - 10, 22, 34, 5);

  drawCrescent(graphics, shelf.x + width * 0.31, top + 24, 11, PALETTE.goldLight, 0x795647);
}

function renderWonderbookNook(
  scene: Phaser.Scene,
  position: MapPoint,
  scale: number,
  yOffset: number,
): void {
  const x = position.x;
  const y = position.y + yOffset;

  scene.add.ellipse(x, y + 19 * scale, 176 * scale, 92 * scale, PALETTE.lavender, 0.13).setDepth(3);
  scene.add
    .ellipse(x, y + 16 * scale, 120 * scale, 61 * scale, PALETTE.goldLight, 0.07)
    .setDepth(4);

  const graphics = scene.add.graphics().setDepth(5);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(x - 45 * scale, y + 20 * scale, 90 * scale, 27 * scale, 10 * scale);
  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(x - 37 * scale, y + 13 * scale, 74 * scale, 23 * scale, 8 * scale);
  graphics.fillStyle(PALETTE.gold, 0.72);
  graphics.fillCircle(x - 27 * scale, y + 24 * scale, 3 * scale);
  graphics.fillCircle(x + 27 * scale, y + 24 * scale, 3 * scale);
}

function renderExitGap(scene: Phaser.Scene): void {
  const door = COTTAGE_INTERIOR_MAP.furnitureLayout.door;
  const shell = COTTAGE_INTERIOR_MAP.roomShell;
  const openingWidth = door.width + 18;

  scene.add
    .rectangle(door.x, shell.bottom, openingWidth, 28, PALETTE.roomOutside, 1)
    .setName('cottage-exit-gap')
    .setDepth(6);
  scene.add
    .ellipse(door.x, shell.bottom + 20, door.width + 10, 44, PALETTE.skyLight, 0.22)
    .setDepth(4);

  const graphics = scene.add.graphics().setDepth(7);
  graphics.fillStyle(PALETTE.timberDark, 0.9);
  graphics.fillRoundedRect(door.x - openingWidth / 2 - 13, shell.bottom - 31, 20, 45, 8);
  graphics.fillRoundedRect(door.x + openingWidth / 2 - 7, shell.bottom - 31, 20, 45, 8);
  graphics.fillStyle(PALETTE.timberLight, 0.75);
  graphics.fillRoundedRect(door.x - door.width / 2 + 8, shell.bottom - 13, door.width - 16, 6, 3);
  graphics.fillStyle(PALETTE.goldLight, 0.7);
  graphics.fillCircle(door.x - openingWidth / 2 - 3, shell.bottom - 22, 4);
  graphics.fillCircle(door.x + openingWidth / 2 + 3, shell.bottom - 22, 4);
}

export function renderCottagePermanentFurnishings(scene: Phaser.Scene): void {
  lowerFloorSeamBehindFurniture(scene);
  for (const window of COTTAGE_INTERIOR_MAP.windowLayout) {
    renderWindow(scene, window);
  }
  renderFireplace(scene);
  renderBed(scene);
  renderTeaTable(scene);
  renderSofa(scene);
  renderTreasureShelf(scene);
  renderExitGap(scene);
}

export function renderCottageWonderbookNook(
  scene: Phaser.Scene,
  position: MapPoint,
  scale = 0.64,
  yOffset = 12,
): void {
  renderWonderbookNook(scene, position, scale, yOffset);
}
