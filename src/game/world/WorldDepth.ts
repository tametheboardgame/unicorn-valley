const WORLD_DEPTH_BASE = 20;
const WORLD_DEPTH_Y_SCALE = 0.02;

export const WORLD_SORTABLE_DEPTH_FLOOR = 4;
export const WORLD_UI_DEPTH_FLOOR = 100;

export function worldDepthForY(y: number, offset = 0): number {
  return WORLD_DEPTH_BASE + Math.max(0, y) * WORLD_DEPTH_Y_SCALE + offset;
}

export function isWorldDepthSortable(currentDepth: number): boolean {
  return currentDepth >= WORLD_SORTABLE_DEPTH_FLOOR && currentDepth < WORLD_UI_DEPTH_FLOOR;
}
