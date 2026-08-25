import Phaser from 'phaser';

export const UI_FONT = 'Trebuchet MS, Segoe UI, system-ui, sans-serif';
export const UI_MIN_TOUCH_TARGET = 48;

export const UI_COLOURS = {
  ink: '#4f3a5d',
  softInk: '#6f5a79',
  mutedInk: '#8d7193',
  cream: 0xfffbef,
  creamText: '#fffaf1',
  parchment: 0xfff4dc,
  parchmentStrong: 0xf1ddbc,
  lavender: 0xead8f3,
  lavenderStrong: 0xc192d5,
  lavenderDark: 0x76518a,
  ribbon: 0xd9b5e7,
  ribbonStrong: 0xb97dcc,
  gold: 0xffe6a6,
  goldStrong: 0xd6b35f,
  blush: 0xffdbe8,
  blushStrong: 0xe99ab7,
  mint: 0xdff1df,
  mintStrong: 0x90c89a,
  focus: 0x7d5a92,
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
  const idleStroke = button.strokeColor;
  const idleStrokeAlpha = button.strokeAlpha;
  const idleLineWidth = button.lineWidth;

  button.on('pointerover', () =>
    button.setFillStyle(hoverFill, 1).setStrokeStyle(4, UI_COLOURS.focus, 1),
  );
  button.on('pointerout', () =>
    button.setFillStyle(idleFill, 1).setStrokeStyle(idleLineWidth, idleStroke, idleStrokeAlpha),
  );
  button.on('pointerdown', () => button.setAlpha(0.86));
  button.on('pointerup', () => button.setAlpha(1));
}

export function setButtonSelected(
  button: Phaser.GameObjects.Rectangle,
  selected: boolean,
  idleFill = UI_COLOURS.lavender,
): void {
  button
    .setFillStyle(selected ? UI_COLOURS.gold : idleFill, 1)
    .setStrokeStyle(4, selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong, 1)
    .setAlpha(1);
}

export function setButtonEnabled(button: Phaser.GameObjects.Rectangle, enabled: boolean): void {
  if (enabled) {
    button.setAlpha(1).setInteractive({ useHandCursor: true });
  } else {
    button.setAlpha(0.42).disableInteractive();
  }
}
