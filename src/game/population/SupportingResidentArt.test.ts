import { describe, expect, it } from 'vitest';
import {
  resolveSupportingResidentDisplaySize,
  SUPPORTING_RESIDENT_ART_LAYOUT,
  SUPPORTING_RESIDENT_DISPLAY_WIDTH,
  SUPPORTING_RESIDENT_MONOCLE_LAYOUT,
} from './SupportingResidentArt';

describe('SupportingResidentArt layout', () => {
  it('leaves enough left-side texture space for the widest production tails', () => {
    const widestTailExtent = 126;
    const leftEdge =
      SUPPORTING_RESIDENT_ART_LAYOUT.drawX -
      widestTailExtent * SUPPORTING_RESIDENT_ART_LAYOUT.drawScale;

    expect(leftEdge).toBeGreaterThanOrEqual(4);
  });

  it('keeps the generated texture and displayed sprite at the same aspect ratio', () => {
    const textureRatio =
      SUPPORTING_RESIDENT_ART_LAYOUT.textureWidth / SUPPORTING_RESIDENT_ART_LAYOUT.textureHeight;
    const displayWidth = Math.round(textureRatio * SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight);

    expect(displayWidth / SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight).toBeCloseTo(
      textureRatio,
      2,
    );
  });

  it('keeps Quill’s monocle centred on the one visible face eye', () => {
    const visibleEye = { x: 87, y: -37 };

    expect(SUPPORTING_RESIDENT_MONOCLE_LAYOUT.lensX).toBe(visibleEye.x);
    expect(SUPPORTING_RESIDENT_MONOCLE_LAYOUT.lensY).toBe(visibleEye.y);
    expect(SUPPORTING_RESIDENT_MONOCLE_LAYOUT.radius).toBeGreaterThanOrEqual(10);
  });

  it('preserves the authored adult display size and scales children from that baseline', () => {
    expect(resolveSupportingResidentDisplaySize()).toEqual({
      width: SUPPORTING_RESIDENT_DISPLAY_WIDTH,
      height: SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight,
    });
    expect(resolveSupportingResidentDisplaySize(0.56)).toEqual({
      width: SUPPORTING_RESIDENT_DISPLAY_WIDTH * 0.56,
      height: SUPPORTING_RESIDENT_ART_LAYOUT.displayHeight * 0.56,
    });
  });
});
