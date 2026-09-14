import { describe, expect, it } from 'vitest';
import { SUPPORTING_RESIDENT_ART_LAYOUT } from './SupportingResidentArt';

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
});
