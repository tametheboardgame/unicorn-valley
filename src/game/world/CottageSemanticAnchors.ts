import type { MapPoint } from './MapTraversal';

export const COTTAGE_SEMANTIC_ANCHOR_IDS = {
  door: 'cottage.door',
  wonderbook: 'cottage.wonderbook',
  eggNest: 'cottage.egg-nest',
  visitorWillow: 'cottage.visitor.willow',
  visitorNova: 'cottage.visitor.nova',
  storyDisplayOne: 'cottage.story-display.1',
  storyDisplayTwo: 'cottage.story-display.2',
  storyDisplayThree: 'cottage.story-display.3',
  storyDisplayFour: 'cottage.story-display.4',
  storyDisplayFive: 'cottage.story-display.5',
  portalBay: 'cottage.portal-bay',
} as const;

export type CottageSemanticAnchorId =
  (typeof COTTAGE_SEMANTIC_ANCHOR_IDS)[keyof typeof COTTAGE_SEMANTIC_ANCHOR_IDS];

export interface CottageSemanticAnchor {
  id: CottageSemanticAnchorId;
  position: MapPoint;
  interactionPosition?: MapPoint;
  purpose: 'navigation' | 'system' | 'visitor' | 'story' | 'future-story' | 'future-portal';
}

/**
 * Canonical authored world points for systems that need stable cottage locations.
 *
 * H2.0 intentionally preserves the current room layout. H2.1 may move these points as
 * the room shell is rebuilt, but consumers should continue to bind by anchor id rather
 * than copying coordinates into content or presentation code.
 */
export const COTTAGE_SEMANTIC_ANCHORS = {
  [COTTAGE_SEMANTIC_ANCHOR_IDS.door]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.door,
    position: { x: 900, y: 1110 },
    interactionPosition: { x: 900, y: 1010 },
    purpose: 'navigation',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook,
    position: { x: 1490, y: 910 },
    interactionPosition: { x: 1335, y: 910 },
    purpose: 'system',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest,
    position: { x: 620, y: 930 },
    interactionPosition: { x: 720, y: 910 },
    purpose: 'story',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.visitorWillow]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.visitorWillow,
    position: { x: 650, y: 470 },
    purpose: 'visitor',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.visitorNova]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.visitorNova,
    position: { x: 1180, y: 470 },
    purpose: 'visitor',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayOne]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayOne,
    position: { x: 760, y: 930 },
    purpose: 'future-story',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayTwo]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayTwo,
    position: { x: 900, y: 930 },
    purpose: 'future-story',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayThree]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayThree,
    position: { x: 1060, y: 930 },
    purpose: 'future-story',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFour]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFour,
    position: { x: 1380, y: 560 },
    purpose: 'future-story',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFive]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFive,
    position: { x: 560, y: 500 },
    purpose: 'future-story',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay,
    position: { x: 1510, y: 720 },
    purpose: 'future-portal',
  },
} as const satisfies Record<CottageSemanticAnchorId, CottageSemanticAnchor>;

export function resolveCottageSemanticAnchor(anchorId: string): CottageSemanticAnchor {
  const anchor = (COTTAGE_SEMANTIC_ANCHORS as Record<string, CottageSemanticAnchor>)[anchorId];
  if (!anchor) {
    throw new Error(`Unknown cottage semantic anchor: ${anchorId}`);
  }
  return anchor;
}
