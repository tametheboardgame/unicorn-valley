import { describe, expect, it } from 'vitest';
import { calculateCanvasDomOverlayStyle } from './CanvasDomOverlayBridge';

describe('calculateCanvasDomOverlayStyle', () => {
  it('maps logical canvas coordinates into host-relative CSS coordinates', () => {
    expect(
      calculateCanvasDomOverlayStyle(
        { left: 110, top: 70, width: 640, height: 360 },
        { left: 10, top: 20, width: 900, height: 600 },
        { x: 400, y: 200, width: 490, height: 44 },
      ),
    ).toEqual({ left: 300, top: 150, width: 245, height: 44 });
  });

  it('preserves explicit minimum CSS dimensions at small canvas scales', () => {
    expect(
      calculateCanvasDomOverlayStyle(
        { left: 0, top: 0, width: 320, height: 180 },
        { left: 0, top: 0, width: 320, height: 180 },
        {
          x: 395,
          y: 250,
          width: 490,
          height: 44,
          minCssWidth: 260,
          minCssHeight: 44,
        },
      ),
    ).toEqual({ left: 98.75, top: 62.5, width: 260, height: 44 });
  });

  it('hides placements outside their logical clipping region', () => {
    expect(
      calculateCanvasDomOverlayStyle(
        { left: 0, top: 0, width: 1280, height: 720 },
        { left: 0, top: 0, width: 1280, height: 720 },
        {
          x: 100,
          y: 600,
          width: 200,
          height: 44,
          clip: { left: 0, top: 145, right: 1280, bottom: 565 },
        },
      ),
    ).toBeNull();
  });
});
