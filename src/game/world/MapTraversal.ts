export interface MapPoint {
  x: number;
  y: number;
}

export interface CollisionRectangle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TraversalMapDefinition {
  width: number;
  height: number;
  margin: number;
  playerSpawn: MapPoint;
  colliders: readonly CollisionRectangle[];
}

export interface TraversalTarget {
  id: string;
  position: MapPoint;
}

export function isPointInsideWalkableBounds(
  map: TraversalMapDefinition,
  point: MapPoint,
  clearance = 0,
): boolean {
  return (
    point.x >= map.margin + clearance &&
    point.x <= map.width - map.margin - clearance &&
    point.y >= map.margin + clearance &&
    point.y <= map.height - map.margin - clearance
  );
}

export function isPointBlocked(
  point: MapPoint,
  colliders: readonly CollisionRectangle[],
  clearance = 0,
): boolean {
  return colliders.some((collider) => {
    const halfWidth = collider.width / 2 + clearance;
    const halfHeight = collider.height / 2 + clearance;
    return (
      point.x >= collider.x - halfWidth &&
      point.x <= collider.x + halfWidth &&
      point.y >= collider.y - halfHeight &&
      point.y <= collider.y + halfHeight
    );
  });
}

function cellKey(column: number, row: number): string {
  return `${column}:${row}`;
}

export function findUnreachableTargets(
  map: TraversalMapDefinition,
  targets: readonly TraversalTarget[],
  cellSize = 40,
  clearance = 42,
): string[] {
  const minX = map.margin + clearance;
  const maxX = map.width - map.margin - clearance;
  const minY = map.margin + clearance;
  const maxY = map.height - map.margin - clearance;
  const columns = Math.floor((maxX - minX) / cellSize) + 1;
  const rows = Math.floor((maxY - minY) / cellSize) + 1;

  const toCell = (point: MapPoint): { column: number; row: number } => ({
    column: Math.max(0, Math.min(columns - 1, Math.round((point.x - minX) / cellSize))),
    row: Math.max(0, Math.min(rows - 1, Math.round((point.y - minY) / cellSize))),
  });

  const toPoint = (column: number, row: number): MapPoint => ({
    x: minX + column * cellSize,
    y: minY + row * cellSize,
  });

  const isWalkableCell = (column: number, row: number): boolean => {
    if (column < 0 || row < 0 || column >= columns || row >= rows) {
      return false;
    }

    const point = toPoint(column, row);
    return (
      isPointInsideWalkableBounds(map, point, clearance) &&
      !isPointBlocked(point, map.colliders, clearance)
    );
  };

  const start = toCell(map.playerSpawn);
  if (!isWalkableCell(start.column, start.row)) {
    return targets.map((target) => target.id);
  }

  const queue = [start];
  let queueIndex = 0;
  const visited = new Set<string>([cellKey(start.column, start.row)]);
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as const;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;

    for (const [columnDelta, rowDelta] of directions) {
      const column = current.column + columnDelta;
      const row = current.row + rowDelta;
      const key = cellKey(column, row);

      if (visited.has(key) || !isWalkableCell(column, row)) {
        continue;
      }

      visited.add(key);
      queue.push({ column, row });
    }
  }

  const targetTolerance = cellSize * 1.6;
  return targets
    .filter((target) => {
      const nearestCell = toCell(target.position);
      const candidates = [
        nearestCell,
        { column: nearestCell.column + 1, row: nearestCell.row },
        { column: nearestCell.column - 1, row: nearestCell.row },
        { column: nearestCell.column, row: nearestCell.row + 1 },
        { column: nearestCell.column, row: nearestCell.row - 1 },
      ];

      return !candidates.some((candidate) => {
        if (!visited.has(cellKey(candidate.column, candidate.row))) {
          return false;
        }

        const candidatePoint = toPoint(candidate.column, candidate.row);
        return (
          Math.hypot(candidatePoint.x - target.position.x, candidatePoint.y - target.position.y) <=
          targetTolerance
        );
      });
    })
    .map((target) => target.id);
}
