import Phaser from 'phaser';

export const UI_FONT = 'Trebuchet MS, Segoe UI, system-ui, sans-serif';

export const UI_COLOURS = {
  ink: '#4f3a5d',
  softInk: '#6f5a79',
  mutedInk: '#8d7193',
  cream: 0xfffbef,
  creamText: '#fffaf1',
  lavender: 0xead8f3,
  lavenderStrong: 0xc192d5,
  lavenderDark: 0x76518a,
  gold: 0xffe6a6,
  goldStrong: 0xd6b35f,
  blush: 0xffdbe8,
  mint: 0xdff1df,
  shadow: 0x4b3658,
  white: 0xffffff,
} as const;

export function createUiShadow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth: number,
  alpha = 0.18,
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(x + 7, y + 8, width, height, UI_COLOURS.shadow, alpha)
    .setScrollFactor(0)
    .setDepth(depth);
}

export function applyButtonHover(
  button: Phaser.GameObjects.Rectangle,
  idleFill: number,
  hoverFill: number,
): void {
  button.on('pointerover', () => button.setFillStyle(hoverFill, 1));
  button.on('pointerout', () => button.setFillStyle(idleFill, 1));
}
