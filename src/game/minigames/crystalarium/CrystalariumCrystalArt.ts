import Phaser from 'phaser';
import {
  CRYSTAL_TIER_NAMES,
  type CrystalFamily,
  type CrystalPiece,
} from './CrystalariumOpeningRules';

/**
 * One deterministic faceted crystal illustration system for canvas and native
 * portrait controls. Artwork is generated on demand by the lazy Crystalarium
 * module rather than adding eighteen raster files to the startup bundle.
 */
type Point = readonly [number, number];
interface Facet {
  points: readonly Point[];
  fill: string;
  opacity?: number;
  outlined?: boolean;
}
interface Palette {
  base: string;
  shadow: string;
  light: string;
  glint: string;
  outline: string;
}
const PALETTES: Record<CrystalFamily, Palette> = {
  low: {
    base: '#548fcf',
    shadow: '#245a9e',
    light: '#b3ecff',
    glint: '#f4fcff',
    outline: '#d3f4ff',
  },
  bright: {
    base: '#32bfb4',
    shadow: '#137b87',
    light: '#c4fff1',
    glint: '#fffbcd',
    outline: '#cefff9',
  },
  bell: {
    base: '#a886df',
    shadow: '#6e4bb4',
    light: '#efd5ff',
    glint: '#fff6ff',
    outline: '#f4dbff',
  },
};
const BODY: Record<CrystalFamily, readonly Point[]> = {
  low: [
    [12, 25],
    [40, 11],
    [68, 25],
    [62, 68],
    [40, 82],
    [18, 68],
  ],
  bright: [
    [25, 22],
    [40, 5],
    [55, 22],
    [64, 73],
    [40, 83],
    [16, 73],
  ],
  bell: [
    [21, 29],
    [40, 7],
    [59, 29],
    [63, 68],
    [40, 81],
    [17, 68],
  ],
};
function facets(piece: CrystalPiece): readonly Facet[] {
  const palette = PALETTES[piece.family];
  const [left, tip, right, lowerRight, bottom, lowerLeft] = BODY[piece.family];
  const tier = piece.tier;
  const result: Facet[] = [];
  // Silhouettes must increase visibly: second tip, side buds, twin flank,
  // crown and a six-spire formation. Add behind the central crystal body.
  if (tier >= 1) {
    result.push({
      points: [
        [49, 43],
        [61, 17],
        [72, 25],
        [63, 58],
      ],
      fill: palette.light,
      opacity: 0.94,
      outlined: true,
    });
  }
  if (tier >= 2) {
    result.push({
      points: [
        [7, 63],
        [10, 23],
        [22, 38],
        [29, 78],
      ],
      fill: palette.shadow,
      outlined: true,
    });
  }
  if (tier >= 3) {
    result.push({
      points: [
        [56, 72],
        [68, 20],
        [79, 46],
        [74, 78],
      ],
      fill: palette.light,
      outlined: true,
    });
  }
  if (tier >= 4) {
    result.push({
      points: [
        [21, 38],
        [19, 10],
        [32, 22],
        [40, 2],
        [49, 22],
        [61, 9],
        [60, 41],
      ],
      fill: palette.base,
      outlined: true,
    });
  }
  if (tier >= 5) {
    result.push({
      points: [
        [12, 63],
        [5, 5],
        [26, 28],
        [34, 65],
      ],
      fill: palette.light,
      outlined: true,
    });
    result.push({
      points: [
        [49, 66],
        [63, 5],
        [75, 15],
        [69, 77],
      ],
      fill: palette.shadow,
      outlined: true,
    });
  }
  result.push({ points: BODY[piece.family], fill: palette.base });
  result.push({
    points: [left, tip, [40, 39], [34, 70], lowerLeft],
    fill: palette.light,
    opacity: 0.86,
  });
  result.push({
    points: [tip, right, lowerRight, bottom, [40, 39]],
    fill: palette.shadow,
    opacity: 0.78,
  });
  result.push({
    points: [[40, 39], bottom, lowerLeft, [34, 70]],
    fill: palette.base,
    opacity: 0.64,
  });
  if (tier >= 1) {
    result.push({
      points: [
        [31, 27],
        [40, 13],
        [45, 29],
        [39, 43],
      ],
      fill: palette.glint,
      opacity: 0.8,
    });
  }
  if (tier >= 3) {
    result.push({
      points: [
        [48, 43],
        [55, 35],
        [55, 57],
        [44, 68],
      ],
      fill: palette.light,
      opacity: 0.7,
    });
  }
  if (piece.family === 'bell') {
    result.push({
      points: [
        [10, 55],
        [21, 28],
        [30, 54],
        [24, 76],
      ],
      fill: palette.light,
      opacity: 0.93,
    });
    result.push({
      points: [
        [53, 66],
        [60, 26],
        [73, 54],
        [64, 78],
      ],
      fill: palette.shadow,
      opacity: 0.83,
    });
  }
  if (piece.family === 'bright') {
    result.push({
      points: [
        [36, 12],
        [40, 5],
        [44, 12],
        [42, 65],
      ],
      fill: palette.glint,
      opacity: 0.72,
    });
  }
  if (tier >= 4) {
    result.push({
      points: [
        [37, 5],
        [40, 0],
        [43, 5],
        [40, 11],
      ],
      fill: palette.glint,
    });
  }
  return result;
}
export function crystalArtworkId(piece: CrystalPiece): string {
  return piece.family + '-tier-' + piece.tier;
}
export function createCrystalArtElement(piece: CrystalPiece): SVGSVGElement {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 80 88');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'crystalarium-art');
  svg.dataset.crystalArt = crystalArtworkId(piece);
  const palette = PALETTES[piece.family];
  for (const facet of facets(piece)) {
    const polygon = document.createElementNS(svgNS, 'polygon');
    polygon.setAttribute('points', facet.points.map(([x, y]) => x + ',' + y).join(' '));
    polygon.setAttribute('fill', facet.fill);
    if (facet.opacity !== undefined) polygon.setAttribute('opacity', String(facet.opacity));
    if (facet.outlined) {
      polygon.setAttribute('stroke', palette.outline);
      polygon.setAttribute('stroke-width', '1.7');
      polygon.setAttribute('stroke-linejoin', 'round');
    }
    svg.append(polygon);
  }
  const rim = document.createElementNS(svgNS, 'polygon');
  rim.setAttribute('points', BODY[piece.family].map(([x, y]) => x + ',' + y).join(' '));
  rim.setAttribute('fill', 'none');
  rim.setAttribute('stroke', palette.outline);
  rim.setAttribute('stroke-width', '2');
  svg.append(rim);
  svg.setAttribute('data-crystal-title', CRYSTAL_TIER_NAMES[piece.tier]);
  return svg;
}
export function paintCrystalArt(
  graphics: Phaser.GameObjects.Graphics,
  piece: CrystalPiece,
  x: number,
  y: number,
  scale = 0.6,
): void {
  for (const facet of facets(piece)) {
    const colour = Number.parseInt(facet.fill.slice(1), 16);
    graphics.fillStyle(colour, facet.opacity ?? 1);
    const points = facet.points.map(
      ([px, py]) => new Phaser.Math.Vector2(x + (px - 40) * scale, y + (py - 44) * scale),
    );
    graphics.fillPoints(points, true);
    if (facet.outlined) {
      graphics.lineStyle(1.6, Number.parseInt(PALETTES[piece.family].outline.slice(1), 16), 0.95);
      graphics.strokePoints(points, true);
    }
  }
  graphics.lineStyle(1.5, Number.parseInt(PALETTES[piece.family].outline.slice(1), 16), 0.95);
  graphics.strokePoints(
    BODY[piece.family].map(
      ([px, py]) => new Phaser.Math.Vector2(x + (px - 40) * scale, y + (py - 44) * scale),
    ),
    true,
  );
}
