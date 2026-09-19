import { describe, expect, it } from 'vitest';
import { COTTAGE_INTERIOR_MAP } from './CottageInteriorMap';
import {
  COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS,
  COTTAGE_FUTURE_STORY_ANCHOR_IDS,
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
        COTTAGE_SEMANTIC_ANCHOR_IDS.sleep,
        COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest,
        COTTAGE_SEMANTIC_ANCHOR_IDS.visitorWillow,
        COTTAGE_SEMANTIC_ANCHOR_IDS.visitorNova,
        COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay,
      ]),
    );
  });

  it('reserves five future story sockets plus the egg nest and future portal', () => {
    expect(COTTAGE_FUTURE_STORY_ANCHOR_IDS).toHaveLength(5);
    expect(COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS).toEqual([
      COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest,
      ...COTTAGE_FUTURE_STORY_ANCHOR_IDS,
      COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay,
    ]);

    for (const anchorId of COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS) {
      const anchor = resolveCottageSemanticAnchor(anchorId);
      expect(anchor.reservation?.width, anchorId).toBeGreaterThan(0);
      expect(anchor.reservation?.height, anchorId).toBeGreaterThan(0);
    }
  });

  it('keeps visitor definitions on visitor-purpose semantic anchors', () => {
    expect(resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.visitorWillow).purpose).toBe(
      'visitor',
    );
    expect(resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.visitorNova).purpose).toBe(
      'visitor',
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

  it('binds sleep to the canonical bed-centre trigger', () => {
    expect(resolveCottageSemanticAnchor(COTTAGE_SEMANTIC_ANCHOR_IDS.sleep).position).toEqual(
      COTTAGE_INTERIOR_MAP.sleepLayout.trigger,
    );
  });

  it('fails loudly when a system asks for an unknown cottage anchor', () => {
    expect(() => resolveCottageSemanticAnchor('cottage.missing')).toThrow(
      'Unknown cottage semantic anchor: cottage.missing',
    );
  });
});
