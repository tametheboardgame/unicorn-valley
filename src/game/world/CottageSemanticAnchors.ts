import type { MapPoint } from './MapTraversal';

export const COTTAGE_SEMANTIC_ANCHOR_IDS = {
  door: 'cottage.door',
  wonderbook: 'cottage.wonderbook',
  sleep: 'cottage.sleep',
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

export interface CottageAnchorReservation {
  width: number;
  height: number;
}

export interface CottageSemanticAnchor {
  id: CottageSemanticAnchorId;
  position: MapPoint;
  interactionPosition?: MapPoint;
  purpose: 'navigation' | 'system' | 'visitor' | 'story' | 'future-story' | 'future-portal';
  reservation?: CottageAnchorReservation;
}

export const COTTAGE_FUTURE_STORY_ANCHOR_IDS = [
  COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayOne,
  COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayTwo,
  COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayThree,
  COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFour,
  COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFive,
] as const satisfies readonly CottageSemanticAnchorId[];

export const COTTAGE_FUTURE_EXPANSION_ANCHOR_IDS = [
  ...COTTAGE_FUTURE_STORY_ANCHOR_IDS,
  COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay,
] as const satisfies readonly CottageSemanticAnchorId[];

export const COTTAGE_DECORATION_PROTECTED_ANCHOR_IDS = [
  COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest,
  ...COTTAGE_FUTURE_EXPANSION_ANCHOR_IDS,
] as const satisfies readonly CottageSemanticAnchorId[];

/**
 * Canonical authored world points for systems that need stable cottage locations.
 *
 * H2.9 keeps story ownership here as the one coordinate source. The reservation attached to story
 * anchors describes floor capacity that ordinary player-decoration slots must not consume.
 */
export const COTTAGE_SEMANTIC_ANCHORS = {
  [COTTAGE_SEMANTIC_ANCHOR_IDS.door]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.door,
    position: { x: 750, y: 955 },
    interactionPosition: { x: 750, y: 875 },
    purpose: 'navigation',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.wonderbook,
    position: { x: 1260, y: 870 },
    interactionPosition: { x: 1125, y: 870 },
    purpose: 'system',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.sleep]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.sleep,
    position: { x: 315, y: 700 },
    purpose: 'system',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.eggNest,
    position: { x: 420, y: 900 },
    interactionPosition: { x: 520, y: 885 },
    purpose: 'story',
    reservation: { width: 200, height: 180 },
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.visitorWillow]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.visitorWillow,
    position: { x: 545, y: 600 },
    purpose: 'visitor',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.visitorNova]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.visitorNova,
    position: { x: 990, y: 570 },
    purpose: 'visitor',
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayOne]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayOne,
    position: { x: 590, y: 890 },
    purpose: 'future-story',
    reservation: { width: 120, height: 120 },
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayTwo]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayTwo,
    position: { x: 900, y: 900 },
    purpose: 'future-story',
    reservation: { width: 120, height: 120 },
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayThree]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayThree,
    position: { x: 380, y: 500 },
    purpose: 'future-story',
    reservation: { width: 120, height: 120 },
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFour]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFour,
    position: { x: 540, y: 470 },
    purpose: 'future-story',
    reservation: { width: 120, height: 120 },
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFive]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.storyDisplayFive,
    position: { x: 970, y: 450 },
    purpose: 'future-story',
    reservation: { width: 120, height: 120 },
  },
  [COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay]: {
    id: COTTAGE_SEMANTIC_ANCHOR_IDS.portalBay,
    position: { x: 1280, y: 530 },
    purpose: 'future-portal',
    reservation: { width: 200, height: 190 },
  },
} as const satisfies Record<CottageSemanticAnchorId, CottageSemanticAnchor>;

export function resolveCottageSemanticAnchor(anchorId: string): CottageSemanticAnchor {
  const anchor = (COTTAGE_SEMANTIC_ANCHORS as Record<string, CottageSemanticAnchor>)[anchorId];
  if (!anchor) {
    throw new Error(`Unknown cottage semantic anchor: ${anchorId}`);
  }
  return anchor;
}
