import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConstants';

export const DEFAULT_SAFE_UI_MARGIN = 48;

export interface UiBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ContainedCanvasSize {
  width: number;
  height: number;
  scale: number;
}

export function getSafeUiBounds(
  logicalWidth: number = GAME_WIDTH,
  logicalHeight: number = GAME_HEIGHT,
  margin: number = DEFAULT_SAFE_UI_MARGIN,
): UiBounds {
  const safeMargin = Math.max(0, Math.min(margin, logicalWidth / 2, logicalHeight / 2));

  return {
    x: safeMargin,
    y: safeMargin,
    width: logicalWidth - safeMargin * 2,
    height: logicalHeight - safeMargin * 2,
  };
}

export function calculateContainedCanvasSize(
  containerWidth: number,
  containerHeight: number,
  logicalWidth: number = GAME_WIDTH,
  logicalHeight: number = GAME_HEIGHT,
): ContainedCanvasSize {
  if (containerWidth <= 0 || containerHeight <= 0 || logicalWidth <= 0 || logicalHeight <= 0) {
    return { width: 0, height: 0, scale: 0 };
  }

  const scale = Math.min(containerWidth / logicalWidth, containerHeight / logicalHeight);

  return {
    width: logicalWidth * scale,
    height: logicalHeight * scale,
    scale,
  };
}
