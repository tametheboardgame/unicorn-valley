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

function renderWindow(scene: Phaser.Scene, window: CottageRectLayout): void {
  const left = window.x - window.width / 2;
  const top = window.y - window.height / 2;
  const graphics = scene.add.graphics().setDepth(5);

  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(left - 13, top - 13, window.width + 26, window.height + 26, 18);
  graphics.fillStyle(PALETTE.sky, 1);
  graphics.fillRoundedRect(left, top, window.width, window.height, 10);

  graphics.fillStyle(PALETTE.skyLight, 0.7);
  graphics.fillCircle(window.x - 54, window.y - 25, 18);
  graphics.fillCircle(window.x - 34, window.y - 28, 24);
  graphics.fillCircle(window.x - 9, window.y - 23, 17);
  graphics.fillStyle(PALETTE.outsideGreen, 0.58);
  graphics.fillEllipse(window.x - 42, window.y + 53, 160, 62);
  graphics.fillEllipse(window.x + 62, window.y + 57, 155, 72);

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

  scene.add.ellipse(fireplace.x, fireplace.y + 62, fireplace.width + 90, 86, PALETTE.gold, 0.09).setDepth(4);

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

  drawCrescent(
    graphics,
    fireplace.x,
    top - 24,
    16,
    PALETTE.goldLight,
    PALETTE.timberDark,
  );
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
  const left = bed.x - bed.width / 2;
  const top = bed.y - bed.height / 2;

  addFloorShadow(scene, bed.x + 8, bed.y + bed.height * 0.39, bed.width + 46, 92, 0.13);

  const graphics = scene.add.graphics().setDepth(6);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(left - 8, top - 15, bed.width + 16, bed.height + 28, 18);
  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(left + 7, top - 27, bed.width - 14, 76, 22);
  graphics.fillStyle(PALETTE.cream, 1);
  graphics.fillRoundedRect(left + 13, top + 42, bed.width - 26, bed.height - 62, 18);

  graphics.fillStyle(PALETTE.rose, 1);
  graphics.fillRoundedRect(left + 18, top + 100, bed.width - 36, bed.height - 118, 16);
  graphics.fillStyle(PALETTE.lavender, 0.96);
  graphics.fillRoundedRect(left + 18, bed.y + 7, bed.width - 36, bed.height * 0.47, 15);
  graphics.fillStyle(PALETTE.lavenderDark, 0.34);
  graphics.fillRoundedRect(left + 24, bed.y + 19, bed.width - 48, 13, 7);

  graphics.fillStyle(PALETTE.cream, 1);
  graphics.fillRoundedRect(left + 31, top + 57, bed.width * 0.38, 55, 18);
  graphics.fillRoundedRect(bed.x + 4, top + 57, bed.width * 0.38, 55, 18);
  graphics.lineStyle(3, PALETTE.creamShade, 0.72);
  graphics.strokeRoundedRect(left + 31, top + 57, bed.width * 0.38, 55, 18);
  graphics.strokeRoundedRect(bed.x + 4, top + 57, bed.width * 0.38, 55, 18);

  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(left - 12, bed.y + bed.height / 2 - 21, bed.width + 24, 39, 11);
  graphics.fillStyle(PALETTE.gold, 0.82);
  graphics.fillCircle(bed.x - 92, bed.y + bed.height / 2 - 2, 5);
  graphics.fillCircle(bed.x + 92, bed.y + bed.height / 2 - 2, 5);

  drawCrescent(graphics, bed.x, top + 8, 15, PALETTE.goldLight, PALETTE.timber);
  graphics.fillStyle(PALETTE.goldLight, 0.9);
  graphics.fillCircle(bed.x - 44, top + 10, 3);
  graphics.fillCircle(bed.x + 45, top + 11, 3);
}

function renderChair(scene: Phaser.Scene, x: number, y: number, facing: -1 | 1): void {
  const graphics = scene.add.graphics().setDepth(5);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(x - 39, y - 48, 78, 86, 22);
  graphics.fillStyle(PALETTE.timberLight, 1);
  graphics.fillRoundedRect(x - 32, y - 39, 64, 61, 18);
  graphics.fillStyle(PALETTE.cream, 0.95);
  graphics.fillEllipse(x, y + 8, 58, 39);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRect(x - 28 + facing * 4, y + 22, 9, 34);
  graphics.fillRect(x + 19 + facing * 4, y + 22, 9, 34);
}

function renderTeaTable(scene: Phaser.Scene): void {
  const table = COTTAGE_INTERIOR_MAP.furnitureLayout.teaTable;
  const chairOffset = table.width / 2 + 28;

  addFloorShadow(scene, table.x, table.y + 40, table.width + 80, table.height * 0.7, 0.12);
  renderChair(scene, table.x - chairOffset, table.y + 8, 1);
  renderChair(scene, table.x + chairOffset, table.y + 8, -1);

  const graphics = scene.add.graphics().setDepth(6);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillEllipse(table.x, table.y + 16, table.width + 12, table.height + 4);
  graphics.fillStyle(PALETTE.timberLight, 1);
  graphics.fillEllipse(table.x, table.y, table.width, table.height);
  graphics.lineStyle(4, PALETTE.timber, 0.78);
  graphics.strokeEllipse(table.x, table.y, table.width - 18, table.height - 16);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(table.x - 13, table.y + 54, 26, 86, 10);
  graphics.fillEllipse(table.x, table.y + 114, 92, 26);

  graphics.fillStyle(PALETTE.cream, 1);
  graphics.fillEllipse(table.x, table.y - 7, 68, 49);
  graphics.fillCircle(table.x + 22, table.y - 30, 7);
  graphics.fillStyle(PALETTE.roseDark, 1);
  graphics.fillEllipse(table.x, table.y - 8, 48, 35);
  graphics.lineStyle(6, PALETTE.roseDark, 1);
  graphics.strokeCircle(table.x + 35, table.y - 5, 15);
  graphics.fillStyle(PALETTE.roseDark, 1);
  graphics.fillTriangle(
    table.x - 26,
    table.y - 12,
    table.x - 52,
    table.y - 3,
    table.x - 26,
    table.y + 2,
  );
  graphics.fillStyle(PALETTE.goldLight, 1);
  graphics.fillCircle(table.x, table.y - 32, 7);

  for (const dx of [-58, 58]) {
    graphics.fillStyle(PALETTE.cream, 1);
    graphics.fillEllipse(table.x + dx, table.y + 17, 32, 24);
    graphics.lineStyle(4, PALETTE.roseDark, 0.9);
    graphics.strokeCircle(table.x + dx + Math.sign(dx) * 14, table.y + 17, 8);
  }
}

function renderSofa(scene: Phaser.Scene): void {
  const sofa = COTTAGE_INTERIOR_MAP.furnitureLayout.sofa;
  const left = sofa.x - sofa.width / 2;
  const top = sofa.y - sofa.height / 2;

  addFloorShadow(scene, sofa.x, sofa.y + 62, sofa.width + 45, 72, 0.12);

  const graphics = scene.add.graphics().setDepth(6);
  graphics.fillStyle(PALETTE.sageDark, 1);
  graphics.fillRoundedRect(left - 7, top - 30, sofa.width + 14, sofa.height + 42, 32);
  graphics.fillStyle(PALETTE.sage, 1);
  graphics.fillRoundedRect(left + 10, top - 20, sofa.width - 20, 92, 28);
  graphics.fillStyle(0xa8cbbb, 1);
  graphics.fillRoundedRect(left + 29, sofa.y - 8, sofa.width - 58, 74, 24);

  graphics.lineStyle(3, PALETTE.sageDark, 0.42);
  graphics.lineBetween(sofa.x, sofa.y - 3, sofa.x, sofa.y + 52);
  graphics.fillStyle(PALETTE.sageDark, 1);
  graphics.fillRoundedRect(left - 20, sofa.y - 25, 46, 96, 20);
  graphics.fillRoundedRect(left + sofa.width - 26, sofa.y - 25, 46, 96, 20);
  graphics.fillRect(left + 16, sofa.y + 57, 12, 37);
  graphics.fillRect(left + sofa.width - 28, sofa.y + 57, 12, 37);

  graphics.fillStyle(PALETTE.goldLight, 1);
  graphics.fillRoundedRect(sofa.x - 104, sofa.y - 24, 67, 54, 16);
  graphics.fillStyle(PALETTE.lavender, 1);
  graphics.fillRoundedRect(sofa.x + 37, sofa.y - 25, 69, 56, 17);
  graphics.lineStyle(2, PALETTE.cream, 0.7);
  graphics.lineBetween(sofa.x - 94, sofa.y + 1, sofa.x - 47, sofa.y - 15);
  graphics.lineBetween(sofa.x + 50, sofa.y - 12, sofa.x + 93, sofa.y + 2);
}

function renderTreasureShelf(scene: Phaser.Scene): void {
  const shelf = COTTAGE_INTERIOR_MAP.furnitureLayout.treasureShelf;
  const left = shelf.x - shelf.width / 2;
  const top = shelf.y - shelf.height / 2;
  const graphics = scene.add.graphics().setDepth(6);

  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(left - 13, top - 52, shelf.width + 26, shelf.height + 70, 16);
  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(left, top - 40, shelf.width, shelf.height + 44, 12);
  graphics.fillStyle(0x795647, 0.72);
  graphics.fillRoundedRect(left + 13, top - 27, shelf.width - 26, shelf.height + 18, 9);

  graphics.fillStyle(PALETTE.timberLight, 1);
  graphics.fillRoundedRect(left - 18, top + 3, shelf.width + 36, 17, 7);
  graphics.fillRoundedRect(left - 18, top + 43, shelf.width + 36, 17, 7);
  graphics.fillStyle(PALETTE.gold, 0.85);
  graphics.fillCircle(left + 18, top + 70, 6);
  graphics.fillCircle(left + shelf.width - 18, top + 70, 6);

  graphics.fillStyle(PALETTE.cream, 0.88);
  graphics.fillRoundedRect(left + 22, top - 15, 27, 42, 5);
  graphics.fillStyle(PALETTE.rose, 0.9);
  graphics.fillRoundedRect(left + 53, top - 7, 22, 34, 5);
  graphics.fillStyle(PALETTE.sage, 0.9);
  graphics.fillRoundedRect(left + 79, top - 11, 25, 38, 5);

  drawCrescent(
    graphics,
    shelf.x + 65,
    top + 25,
    12,
    PALETTE.goldLight,
    0x795647,
  );
}

function renderWonderbookNook(scene: Phaser.Scene, position: MapPoint): void {
  scene.add.ellipse(position.x, position.y + 30, 210, 118, PALETTE.lavender, 0.16).setDepth(3);
  scene.add.ellipse(position.x, position.y + 26, 154, 82, PALETTE.goldLight, 0.08).setDepth(4);

  const graphics = scene.add.graphics().setDepth(5);
  graphics.fillStyle(PALETTE.timberDark, 1);
  graphics.fillRoundedRect(position.x - 61, position.y + 28, 122, 36, 13);
  graphics.fillStyle(PALETTE.timber, 1);
  graphics.fillRoundedRect(position.x - 50, position.y + 18, 100, 31, 11);
  graphics.fillStyle(PALETTE.gold, 0.72);
  graphics.fillCircle(position.x - 37, position.y + 33, 4);
  graphics.fillCircle(position.x + 37, position.y + 33, 4);
}

function renderExitGap(scene: Phaser.Scene): void {
  const door = COTTAGE_INTERIOR_MAP.furnitureLayout.door;
  const shell = COTTAGE_INTERIOR_MAP.roomShell;
  const openingWidth = door.width + 18;

  scene.add
    .rectangle(door.x, shell.bottom, openingWidth, 28, PALETTE.roomOutside, 1)
    .setName('cottage-exit-gap')
    .setDepth(6);
  scene.add.ellipse(door.x, shell.bottom + 20, door.width + 10, 44, PALETTE.skyLight, 0.22).setDepth(4);

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

export function renderCottageWonderbookNook(scene: Phaser.Scene, position: MapPoint): void {
  renderWonderbookNook(scene, position);
}
