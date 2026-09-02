import type {
  AmbientSafetyProfile,
  ResidentPlacementDefinition,
  ResidentStoryAnchorDefinition,
  SmallWorldInteractionDefinition,
  SupportingResidentDefinition,
} from './AmbientPopulationTypes';

interface Point {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

function pointInsideRectangle(point: Point, rectangle: Rectangle, padding = 0): boolean {
  return (
    point.x >= rectangle.x - rectangle.width / 2 - padding &&
    point.x <= rectangle.x + rectangle.width / 2 + padding &&
    point.y >= rectangle.y - rectangle.height / 2 - padding &&
    point.y <= rectangle.y + rectangle.height / 2 + padding
  );
}

function orientation(a: Point, b: Point, c: Point): number {
  return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return (
    b.x <= Math.max(a.x, c.x) &&
    b.x >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) &&
    b.y >= Math.min(a.y, c.y)
  );
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const o1 = orientation(a, b, c);
  const o2 = orientation(a, b, d);
  const o3 = orientation(c, d, a);
  const o4 = orientation(c, d, b);

  if (o1 * o2 < 0 && o3 * o4 < 0) {
    return true;
  }
  const epsilon = 0.0001;
  if (Math.abs(o1) <= epsilon && onSegment(a, c, b)) return true;
  if (Math.abs(o2) <= epsilon && onSegment(a, d, b)) return true;
  if (Math.abs(o3) <= epsilon && onSegment(c, a, d)) return true;
  if (Math.abs(o4) <= epsilon && onSegment(c, b, d)) return true;
  return false;
}

export function segmentCrossesRectangle(
  start: Point,
  end: Point,
  rectangle: Rectangle,
  padding = 0,
): boolean {
  if (
    pointInsideRectangle(start, rectangle, padding) ||
    pointInsideRectangle(end, rectangle, padding)
  ) {
    return true;
  }

  const left = rectangle.x - rectangle.width / 2 - padding;
  const right = rectangle.x + rectangle.width / 2 + padding;
  const top = rectangle.y - rectangle.height / 2 - padding;
  const bottom = rectangle.y + rectangle.height / 2 + padding;
  const corners = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ] as const;

  return corners.some((corner, index) =>
    segmentsIntersect(start, end, corner, corners[(index + 1) % corners.length] ?? corners[0]),
  );
}

function pointIsSafe(point: Point, profile: AmbientSafetyProfile, padding = 20): boolean {
  if (
    point.x < profile.margin ||
    point.y < profile.margin ||
    point.x > profile.width - profile.margin ||
    point.y > profile.height - profile.margin
  ) {
    return false;
  }
  if (profile.blockers.some((blocker) => pointInsideRectangle(point, blocker, padding))) {
    return false;
  }
  if (
    profile.forbiddenPoints?.some(
      (forbidden) =>
        Math.hypot(point.x - forbidden.position.x, point.y - forbidden.position.y) <
        forbidden.radius + padding,
    )
  ) {
    return false;
  }
  return true;
}

export function validateAmbientPopulationContent(
  residents: readonly SupportingResidentDefinition[],
  placements: readonly ResidentPlacementDefinition[],
  interactions: readonly SmallWorldInteractionDefinition[],
  profiles: readonly AmbientSafetyProfile[],
  anchors: readonly ResidentStoryAnchorDefinition[] = [],
): string[] {
  const issues: string[] = [];
  const residentIds = new Set<string>();
  const placementIds = new Set<string>();
  const anchorIds = new Set<string>();
  const interactionIds = new Set<string>();
  const waypointIds = new Set<string>();
  const talkVariantIds = new Set<string>();
  const profileByScene = new Map(profiles.map((profile) => [profile.sceneKey, profile]));

  for (const resident of residents) {
    if (residentIds.has(resident.id)) {
      issues.push(`Duplicate resident id: ${resident.id}`);
    }
    residentIds.add(resident.id);
    if (!resident.name.trim() || !resident.role.trim()) {
      issues.push(`${resident.id} requires a readable name and role`);
    }
    if (resident.talk.lines.length < 2) {
      issues.push(`${resident.id} should have changing ambient dialogue`);
    }
    for (const variant of resident.talk.variants ?? []) {
      if (talkVariantIds.has(variant.id)) {
        issues.push(`Duplicate resident talk variant id: ${variant.id}`);
      }
      talkVariantIds.add(variant.id);
      if (variant.lines.length === 0) {
        issues.push(`${variant.id} requires at least one talk line`);
      }
    }
  }

  for (const placement of placements) {
    if (placementIds.has(placement.id)) {
      issues.push(`Duplicate resident placement id: ${placement.id}`);
    }
    placementIds.add(placement.id);
    if (!residentIds.has(placement.residentId)) {
      issues.push(`${placement.id} references unknown resident ${placement.residentId}`);
    }
    if (placement.waypoints.length === 0) {
      issues.push(`${placement.id} requires at least one authored safe waypoint`);
      continue;
    }
    if (placement.interactionRadius < 96) {
      issues.push(`${placement.id} interaction radius is too small for touch-safe play`);
    }
    if (placement.speedPxPerSecond < 20 || placement.speedPxPerSecond > 220) {
      issues.push(`${placement.id} has an unsafe resident movement speed`);
    }

    const profile = profileByScene.get(placement.sceneKey);
    if (!profile) {
      issues.push(`${placement.id} has no safety profile for ${placement.sceneKey}`);
      continue;
    }

    for (const waypoint of placement.waypoints) {
      if (waypointIds.has(waypoint.id)) {
        issues.push(`Duplicate resident waypoint id: ${waypoint.id}`);
      }
      waypointIds.add(waypoint.id);
      if (!pointIsSafe(waypoint, profile)) {
        issues.push(`${placement.id} waypoint ${waypoint.id} is outside authored safe ground`);
      }
    }

    for (let index = 1; index < placement.waypoints.length; index += 1) {
      const start = placement.waypoints[index - 1];
      const end = placement.waypoints[index];
      if (!start || !end) continue;
      const blocker = profile.blockers.find((candidate) =>
        segmentCrossesRectangle(start, end, candidate, 18),
      );
      if (blocker) {
        issues.push(`${placement.id} route crosses blocker ${blocker.id}`);
      }
    }
  }

  for (const anchor of anchors) {
    if (anchorIds.has(anchor.id)) {
      issues.push(`Duplicate resident story anchor id: ${anchor.id}`);
    }
    anchorIds.add(anchor.id);
    if (!residentIds.has(anchor.residentId)) {
      issues.push(`${anchor.id} references unknown resident ${anchor.residentId}`);
    }
    if (anchor.interactionRadius < 96) {
      issues.push(`${anchor.id} interaction radius is too small for touch-safe play`);
    }
    const profile = profileByScene.get(anchor.sceneKey);
    if (!profile) {
      issues.push(`${anchor.id} has no safety profile for ${anchor.sceneKey}`);
    } else if (!pointIsSafe(anchor.position, profile, 8)) {
      issues.push(`${anchor.id} is not on authored safe anchor ground`);
    }
  }

  for (const interaction of interactions) {
    if (interactionIds.has(interaction.id)) {
      issues.push(`Duplicate world interaction id: ${interaction.id}`);
    }
    interactionIds.add(interaction.id);
    if (interaction.interactionRadius < 96) {
      issues.push(`${interaction.id} interaction radius is too small for touch-safe play`);
    }
    const profile = profileByScene.get(interaction.sceneKey);
    if (!profile) {
      issues.push(`${interaction.id} has no safety profile for ${interaction.sceneKey}`);
    } else if (!pointIsSafe(interaction.position, profile, 8)) {
      issues.push(`${interaction.id} is not on authored safe interaction ground`);
    }
    if (!interaction.actionLabel.trim() || !interaction.feedback.trim()) {
      issues.push(`${interaction.id} requires child-readable action and feedback text`);
    }
  }

  return issues;
}
