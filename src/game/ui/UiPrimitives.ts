import type Phaser from 'phaser';
import { cssColourToPhaser, UI_DESIGN_TOKENS } from './UiDesignSystem';

export interface UiPanelStyle {
  fill?: number;
  stroke?: number;
  lineWidth?: number;
  radius?: number;
  alpha?: number;
}

export interface UiPanelShadowStyle {
  colour?: number;
  offsetX?: number;
  offsetY?: number;
  alpha?: number;
}

export function drawUiPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  style: UiPanelStyle = {},
): void {
  const radius = style.radius ?? UI_DESIGN_TOKENS.radius.panelPx;
  const fill = style.fill ?? cssColourToPhaser(UI_DESIGN_TOKENS.colour.cream);
  const stroke = style.stroke ?? cssColourToPhaser(UI_DESIGN_TOKENS.colour.conceptLavenderLine);
  const lineWidth = style.lineWidth ?? UI_DESIGN_TOKENS.border.strongPx;
  const alpha = style.alpha ?? 0.98;

  graphics.fillStyle(fill, alpha);
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  graphics.lineStyle(lineWidth, stroke, 1);
  graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
}

export function drawUiPanelShadow(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number = UI_DESIGN_TOKENS.radius.panelPx,
  style: UiPanelShadowStyle = {},
): void {
  graphics.fillStyle(
    style.colour ?? cssColourToPhaser(UI_DESIGN_TOKENS.colour.conceptShadow),
    style.alpha ?? 0.2,
  );
  graphics.fillRoundedRect(
    x - width / 2 + (style.offsetX ?? UI_DESIGN_TOKENS.shadow.offsetXPx),
    y - height / 2 + (style.offsetY ?? UI_DESIGN_TOKENS.shadow.offsetYPx),
    width,
    height,
    radius,
  );
}

export function createUiText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  style: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, text, {
    color: UI_DESIGN_TOKENS.colour.ink,
    fontFamily: UI_DESIGN_TOKENS.typography.family,
    fontSize: `${UI_DESIGN_TOKENS.typography.bodyPx}px`,
    ...style,
  });
}

export function createUiActionHitTarget(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  name: string,
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(
      x,
      y,
      Math.max(width, UI_DESIGN_TOKENS.control.minimumTouchTargetPx),
      Math.max(height, UI_DESIGN_TOKENS.control.minimumTouchTargetPx),
      0xffffff,
      0.001,
    )
    .setName(name)
    .setInteractive({ useHandCursor: true });
}
