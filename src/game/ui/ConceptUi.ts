import Phaser from 'phaser';
import { UI_COLOURS } from './uiTheme';

export type ConceptIcon =
  | 'map'
  | 'bag'
  | 'book'
  | 'settings'
  | 'shimmer'
  | 'location'
  | 'talk'
  | 'enter'
  | 'start'
  | 'inspect'
  | 'use'
  | 'buy'
  | 'interact'
  | 'gallop'
  | 'hint';

export const CONCEPT_UI = {
  cream: UI_COLOURS.cream,
  creamHighlight: 0xfffffa,
  purple: 0xb96ae8,
  purpleLight: 0xd89af4,
  purpleStrong: 0x8a48bd,
  purpleDeep: 0x5c2d82,
  lavenderLine: 0xc99be0,
  gold: 0xffc85c,
  goldLight: 0xffe69e,
  goldStrong: 0xc98527,
  goldDeep: 0x7d4f20,
  ink: 0x4b2b66,
  softInk: 0x6b4a78,
  shadow: 0x2f1d43,
  white: 0xffffff,
} as const;

export function createFixedGraphics(
  scene: Phaser.Scene,
  name: string,
  depth: number,
): Phaser.GameObjects.Graphics {
  return scene.add.graphics().setName(name).setScrollFactor(0).setDepth(depth);
}

export function drawRoundedPanel(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: number,
  stroke = CONCEPT_UI.lavenderLine,
  lineWidth = 4,
  alpha = 0.98,
): void {
  graphics.fillStyle(fill, alpha);
  graphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, radius);
  graphics.lineStyle(lineWidth, stroke, 1);
  graphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, radius);
}

export function drawPanelShadow(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  offsetX = 6,
  offsetY = 7,
  alpha = 0.2,
): void {
  graphics.fillStyle(CONCEPT_UI.shadow, alpha);
  graphics.fillRoundedRect(
    x - width / 2 + offsetX,
    y - height / 2 + offsetY,
    width,
    height,
    radius,
  );
}

export function drawGlossyCircle(
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  variant: 'purple' | 'gold',
): void {
  const fill = variant === 'gold' ? CONCEPT_UI.gold : CONCEPT_UI.purple;
  const light = variant === 'gold' ? CONCEPT_UI.goldLight : CONCEPT_UI.purpleLight;
  const stroke = variant === 'gold' ? CONCEPT_UI.goldStrong : CONCEPT_UI.purpleStrong;
  graphics.fillStyle(CONCEPT_UI.shadow, 0.23);
  graphics.fillCircle(x + 6, y + 8, radius + 3);
  graphics.fillStyle(CONCEPT_UI.creamHighlight, 0.92);
  graphics.fillCircle(x, y, radius + 5);
  graphics.lineStyle(4, stroke, 0.95);
  graphics.strokeCircle(x, y, radius + 5);
  graphics.fillStyle(fill, 1);
  graphics.fillCircle(x, y, radius);
  graphics.lineStyle(4, stroke, 1);
  graphics.strokeCircle(x, y, radius);
  graphics.fillStyle(light, 0.5);
  graphics.fillEllipse(x, y - radius * 0.35, radius * 1.35, radius * 0.52);
}

export function drawConceptIcon(
  graphics: Phaser.GameObjects.Graphics,
  icon: ConceptIcon,
  x: number,
  y: number,
  scale = 1,
  colour = CONCEPT_UI.purpleDeep,
): void {
  graphics.clear();
  graphics.lineStyle(Math.max(2, 3 * scale), colour, 1);
  graphics.fillStyle(colour, 1);

  switch (icon) {
    case 'map': {
      const w = 33 * scale;
      const h = 25 * scale;
      graphics.fillStyle(CONCEPT_UI.goldLight, 0.7);
      graphics.fillRoundedRect(x - w / 2, y - h / 2, w, h, 3 * scale);
      graphics.lineStyle(2.6 * scale, colour, 1);
      graphics.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 3 * scale);
      graphics.lineBetween(x - w / 6, y - h / 2 + 2, x - w / 8, y + h / 2 - 2);
      graphics.lineBetween(x + w / 6, y - h / 2 + 2, x + w / 8, y + h / 2 - 2);
      graphics.lineBetween(x - w / 8, y, x + w / 8, y - 5 * scale);
      break;
    }
    case 'bag': {
      const w = 31 * scale;
      const h = 24 * scale;
      graphics.fillStyle(0xc98658, 1);
      graphics.fillRoundedRect(x - w / 2, y - h / 2 + 4 * scale, w, h, 6 * scale);
      graphics.lineStyle(2.5 * scale, 0x75405e, 1);
      graphics.strokeRoundedRect(x - w / 2, y - h / 2 + 4 * scale, w, h, 6 * scale);
      graphics.strokeCircle(x, y - h / 2 + 5 * scale, 7 * scale);
      graphics.lineBetween(x, y - 2 * scale, x, y + 9 * scale);
      break;
    }
    case 'book': {
      const w = 34 * scale;
      const h = 25 * scale;
      graphics.fillStyle(CONCEPT_UI.purple, 1);
      graphics.fillRoundedRect(x - w / 2, y - h / 2, w, h, 4 * scale);
      graphics.lineStyle(2.5 * scale, CONCEPT_UI.purpleDeep, 1);
      graphics.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 4 * scale);
      graphics.lineBetween(x, y - h / 2 + 2, x, y + h / 2 - 2);
      graphics.lineStyle(1.8 * scale, CONCEPT_UI.white, 0.9);
      graphics.lineBetween(x - 11 * scale, y - 5 * scale, x - 4 * scale, y - 2 * scale);
      graphics.lineBetween(x + 4 * scale, y - 2 * scale, x + 11 * scale, y - 5 * scale);
      break;
    }
    case 'settings': {
      graphics.lineStyle(4 * scale, colour, 1);
      graphics.strokeCircle(x, y, 8 * scale);
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        const x1 = x + Math.cos(angle) * 11 * scale;
        const y1 = y + Math.sin(angle) * 11 * scale;
        const x2 = x + Math.cos(angle) * 16 * scale;
        const y2 = y + Math.sin(angle) * 16 * scale;
        graphics.lineBetween(x1, y1, x2, y2);
      }
      graphics.fillStyle(colour, 1);
      graphics.fillCircle(x, y, 3.2 * scale);
      break;
    }
    case 'shimmer':
    case 'hint': {
      const r = (icon === 'hint' ? 11 : 13) * scale;
      graphics.beginPath();
      graphics.moveTo(x, y - r);
      graphics.lineTo(x + r * 0.32, y - r * 0.32);
      graphics.lineTo(x + r, y);
      graphics.lineTo(x + r * 0.32, y + r * 0.32);
      graphics.lineTo(x, y + r);
      graphics.lineTo(x - r * 0.32, y + r * 0.32);
      graphics.lineTo(x - r, y);
      graphics.lineTo(x - r * 0.32, y - r * 0.32);
      graphics.closePath();
      graphics.fillPath();
      break;
    }
    case 'location': {
      graphics.fillStyle(0x8d76cb, 1);
      graphics.fillTriangle(
        x - 19 * scale,
        y + 10 * scale,
        x - 3 * scale,
        y - 11 * scale,
        x + 9 * scale,
        y + 10 * scale,
      );
      graphics.fillStyle(0x6c54a7, 1);
      graphics.fillTriangle(
        x - 1 * scale,
        y + 10 * scale,
        x + 10 * scale,
        y - 7 * scale,
        x + 21 * scale,
        y + 10 * scale,
      );
      graphics.fillStyle(CONCEPT_UI.white, 0.88);
      graphics.fillTriangle(
        x - 9 * scale,
        y - 3 * scale,
        x - 3 * scale,
        y - 11 * scale,
        x + 2 * scale,
        y - 2 * scale,
      );
      break;
    }
    case 'talk': {
      graphics.fillStyle(CONCEPT_UI.white, 0.96);
      graphics.fillRoundedRect(x - 20 * scale, y - 13 * scale, 40 * scale, 25 * scale, 10 * scale);
      graphics.fillTriangle(
        x - 5 * scale,
        y + 9 * scale,
        x + 3 * scale,
        y + 19 * scale,
        x + 8 * scale,
        y + 9 * scale,
      );
      graphics.fillStyle(CONCEPT_UI.purpleDeep, 0.9);
      graphics.fillCircle(x - 9 * scale, y, 2.4 * scale);
      graphics.fillCircle(x, y, 2.4 * scale);
      graphics.fillCircle(x + 9 * scale, y, 2.4 * scale);
      break;
    }
    case 'enter': {
      graphics.lineStyle(4 * scale, CONCEPT_UI.white, 1);
      graphics.strokeRoundedRect(x - 14 * scale, y - 16 * scale, 25 * scale, 32 * scale, 3 * scale);
      graphics.lineBetween(x - 2 * scale, y, x + 18 * scale, y);
      graphics.lineBetween(x + 18 * scale, y, x + 10 * scale, y - 7 * scale);
      graphics.lineBetween(x + 18 * scale, y, x + 10 * scale, y + 7 * scale);
      break;
    }
    case 'start': {
      graphics.fillStyle(CONCEPT_UI.white, 0.96);
      graphics.fillTriangle(
        x - 10 * scale,
        y - 15 * scale,
        x - 10 * scale,
        y + 15 * scale,
        x + 16 * scale,
        y,
      );
      break;
    }
    case 'inspect': {
      graphics.lineStyle(4 * scale, CONCEPT_UI.white, 1);
      graphics.strokeCircle(x - 4 * scale, y - 3 * scale, 11 * scale);
      graphics.lineBetween(x + 4 * scale, y + 6 * scale, x + 16 * scale, y + 18 * scale);
      break;
    }
    case 'buy': {
      graphics.lineStyle(3.5 * scale, CONCEPT_UI.white, 1);
      graphics.strokeRoundedRect(x - 16 * scale, y - 8 * scale, 29 * scale, 20 * scale, 4 * scale);
      graphics.lineBetween(x - 20 * scale, y - 15 * scale, x - 14 * scale, y - 8 * scale);
      graphics.fillStyle(CONCEPT_UI.white, 1);
      graphics.fillCircle(x - 8 * scale, y + 16 * scale, 3 * scale);
      graphics.fillCircle(x + 9 * scale, y + 16 * scale, 3 * scale);
      break;
    }
    case 'gallop': {
      graphics.lineStyle(3 * scale, colour, 1);
      graphics.strokeCircle(x + 3 * scale, y - 4 * scale, 8 * scale);
      graphics.lineBetween(x - 12 * scale, y + 4 * scale, x + 4 * scale, y + 4 * scale);
      graphics.lineBetween(x - 8 * scale, y + 4 * scale, x - 15 * scale, y + 13 * scale);
      graphics.lineBetween(x + 1 * scale, y + 4 * scale, x + 9 * scale, y + 13 * scale);
      graphics.lineBetween(x - 13 * scale, y - 4 * scale, x - 23 * scale, y - 4 * scale);
      graphics.lineBetween(x - 13 * scale, y + 2 * scale, x - 25 * scale, y + 2 * scale);
      break;
    }
    case 'use':
    case 'interact': {
      graphics.lineStyle(3.5 * scale, CONCEPT_UI.white, 1);
      graphics.strokeCircle(x, y, 15 * scale);
      graphics.fillStyle(CONCEPT_UI.white, 1);
      graphics.fillCircle(x, y, 4 * scale);
      graphics.lineBetween(x, y - 12 * scale, x, y - 20 * scale);
      graphics.lineBetween(x + 10 * scale, y - 8 * scale, x + 16 * scale, y - 14 * scale);
      graphics.lineBetween(x - 10 * scale, y - 8 * scale, x - 16 * scale, y - 14 * scale);
      break;
    }
  }
}
