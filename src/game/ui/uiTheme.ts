import Phaser from 'phaser';
import { cssColourToPhaser, UI_DESIGN_TOKENS } from './UiDesignSystem';

export const UI_FONT = UI_DESIGN_TOKENS.typography.family;
export const UI_MIN_TOUCH_TARGET = UI_DESIGN_TOKENS.control.minimumTouchTargetPx;

export const UI_COLOURS = {
  ink: UI_DESIGN_TOKENS.colour.ink,
  softInk: UI_DESIGN_TOKENS.colour.softInk,
  mutedInk: UI_DESIGN_TOKENS.colour.mutedInk,
  cream: cssColourToPhaser(UI_DESIGN_TOKENS.colour.cream),
  creamText: UI_DESIGN_TOKENS.colour.creamText,
  parchment: cssColourToPhaser(UI_DESIGN_TOKENS.colour.parchment),
  parchmentStrong: cssColourToPhaser(UI_DESIGN_TOKENS.colour.parchmentStrong),
  lavender: cssColourToPhaser(UI_DESIGN_TOKENS.colour.lavender),
  lavenderStrong: cssColourToPhaser(UI_DESIGN_TOKENS.colour.lavenderStrong),
  lavenderDark: cssColourToPhaser(UI_DESIGN_TOKENS.colour.lavenderDark),
  ribbon: cssColourToPhaser(UI_DESIGN_TOKENS.colour.ribbon),
  ribbonStrong: cssColourToPhaser(UI_DESIGN_TOKENS.colour.ribbonStrong),
  gold: cssColourToPhaser(UI_DESIGN_TOKENS.colour.gold),
  goldStrong: cssColourToPhaser(UI_DESIGN_TOKENS.colour.goldStrong),
  blush: cssColourToPhaser(UI_DESIGN_TOKENS.colour.blush),
  blushStrong: cssColourToPhaser(UI_DESIGN_TOKENS.colour.blushStrong),
  mint: cssColourToPhaser(UI_DESIGN_TOKENS.colour.mint),
  mintStrong: cssColourToPhaser(UI_DESIGN_TOKENS.colour.mintStrong),
  focus: cssColourToPhaser(UI_DESIGN_TOKENS.colour.focus),
  shadow: cssColourToPhaser(UI_DESIGN_TOKENS.colour.shadow),
  white: cssColourToPhaser(UI_DESIGN_TOKENS.colour.white),
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
    .rectangle(
      x + UI_DESIGN_TOKENS.shadow.offsetXPx + 1,
      y + UI_DESIGN_TOKENS.shadow.offsetYPx + 1,
      width,
      height,
      UI_COLOURS.shadow,
      alpha,
    )
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
    button
      .setFillStyle(hoverFill, 1)
      .setStrokeStyle(UI_DESIGN_TOKENS.border.strongPx, UI_COLOURS.focus, 1),
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
    .setStrokeStyle(
      UI_DESIGN_TOKENS.border.strongPx,
      selected ? UI_COLOURS.goldStrong : UI_COLOURS.lavenderStrong,
      1,
    )
    .setAlpha(1);
}

export function setButtonEnabled(button: Phaser.GameObjects.Rectangle, enabled: boolean): void {
  if (enabled) {
    button.setAlpha(1).setInteractive({ useHandCursor: true });
  } else {
    button.setAlpha(0.42).disableInteractive();
  }
}
