import { describe, expect, it } from 'vitest';
import { COTTAGE_INTERIOR_MAP } from './CottageInteriorMap';
import {
  COTTAGE_SEMANTIC_ANCHORS,
  COTTAGE_SEMANTIC_ANCHOR_IDS,
  resolveCottageSemanticAnchor,
} from './CottageSemanticAnchors';

describe('CottageSemanticAnchors', () => {
  it('provides stable anchors for current and future cottage systems', () => {
    expect(Object.keys(COTTAGE_SEMANTIC_ANCHORS)).toEqual(
      expect.arrayContaining([
        COTTAGE_SEMANTIC_ANCHOR_IDS.door,
        COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook,
        COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest,
        COTTAGE_SEMANTIC_ANCHOR_IDS.visitorWillow,
        COTTAGE_SEMANTIC_ANCHOR_IDS.visitorNova,
        COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay,
      ]),
    );
  });

  it('keeps every authored anchor within the cottage world bounds', () => {
    for (const anchor of Object.values(COTTAGE_SEMANTIC_ANCHORS)) {
      expect(anchor.position.x, anchor.id).toBeGreaterThanOrEqual(COTTAGE_INTERIOR_MAP.margin);
      expect(anchor.position.x, anchor.id).toBeLessThanOrEqual(
        COTTAGE_INTERIOR_MAP.width - COTTAGE_INTERIOR_MAP.margin,
      );
      expect(anchor.position.y, anchor.id).toBeGreaterThanOrEqual(COTTAGE_INTERIOR_MAP.margin);
      expect(anchor.position.y, anchor.id).toBeLessThanOrEqual(
        COTTAGE_INTERIOR_MAP.height - COTTAGE_INTERIOR_MAP.margin,
      );
    }
  });

  it('fails loudly when a system asks for an unknown cottage anchor', () => {
    expect(() => resolveCottageSemanticAnchor('cottage.missing')).toThrow(
      'Unknown cottage semantic anchor: cottage.missing',
    );
  });
});
