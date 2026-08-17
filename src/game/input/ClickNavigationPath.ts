import type { MapPoint, TraversalMapDefinition } from '../world/MapTraversal';
import { isPointBlocked, isPointInsideWalkableBounds } from '../world/MapTraversal';

interface GridCell {
  column: number;
  row: number;
}

interface OpenCell extends GridCell {
  score: number;
}

export interface ClickNavigationOptions {
  cellSize?: number;
  clearance?: number;
}

const DEFAULT_CELL_SIZE = 36;
const DEFAULT_CLEARANCE = 38;
const MAX_NEAREST_CELL_RADIUS = 10;

function cellKey(cell: GridCell): string {
  return `${cell.column}:${cell.row}`;
}

function parseCellKey(key: string): GridCell {
  const [column, row] = key.split(':').map(Number);
  return { column, row };
}

function distanceBetweenCells(left: GridCell, right: GridCell): number {
  return Math.hypot(left.column - right.column, left.row - right.row);
}

export function findClickNavigationPath(
  map: TraversalMapDefinition,
  start: MapPoint,
  requestedTarget: MapPoint,
  options: ClickNavigationOptions = {},
): MapPoint[] {
  const cellSize = options.cellSize ?? DEFAULT_CELL_SIZE;
  const clearance = options.clearance ?? DEFAULT_CLEARANCE;
  const minX = map.margin + clearance;
  const maxX = map.width - map.margin - clearance;
  const minY = map.margin + clearance;
  const maxY = map.height - map.margin - clearance;

  if (minX > maxX || minY > maxY) {
    return [];
  }

  const columns = Math.floor((maxX - minX) / cellSize) + 1;
  const rows = Math.floor((maxY - minY) / cellSize) + 1;

  const toCell = (point: MapPoint): GridCell => ({
    column: Math.max(0, Math.min(columns - 1, Math.round((point.x - minX) / cellSize))),
    row: Math.max(0, Math.min(rows - 1, Math.round((point.y - minY) / cellSize))),
  });

  const toPoint = (cell: GridCell): MapPoint => ({
    x: minX + cell.column * cellSize,
    y: minY + cell.row * cellSize,
  });

  const isWalkable = (cell: GridCell): boolean => {
    if (cell.column < 0 || cell.row < 0 || cell.column >= columns || cell.row >= rows) {
      return false;
    }

    const point = toPoint(cell);
    return (
      isPointInsideWalkableBounds(map, point, clearance) &&
      !isPointBlocked(point, map.colliders, clearance)
    );
  };

  const findNearestWalkable = (origin: GridCell): GridCell | null => {
    if (isWalkable(origin)) {
      return origin;
    }

    for (let radius = 1; radius <= MAX_NEAREST_CELL_RADIUS; radius += 1) {
      const candidates: GridCell[] = [];
      for (let offset = -radius; offset <= radius; offset += 1) {
        candidates.push(
          { column: origin.column + offset, row: origin.row - radius },
          { column: origin.column + offset, row: origin.row + radius },
          { column: origin.column - radius, row: origin.row + offset },
          { column: origin.column + radius, row: origin.row + offset },
        );
      }

      const walkable = candidates
        .filter(isWalkable)
        .sort((left, right) => distanceBetweenCells(left, origin) - distanceBetweenCells(right, origin));
      if (walkable[0]) {
        return walkable[0];
      }
    }

    return null;
  };

  const startCell = findNearestWalkable(toCell(start));
  const targetCell = findNearestWalkable(toCell(requestedTarget));
  if (!startCell || !targetCell) {
    return [];
  }

  const startKey = cellKey(startCell);
  const targetKey = cellKey(targetCell);
  if (startKey === targetKey) {
    return [toPoint(targetCell)];
  }

  const open: OpenCell[] = [
    {
      ...startCell,
      score: distanceBetweenCells(startCell, targetCell),
    },
  ];
  const openKeys = new Set<string>([startKey]);
  const closedKeys = new Set<string>();
  const cameFrom = new Map<string, string>();
  const costFromStart = new Map<string, number>([[startKey, 0]]);
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ] as const;

  while (open.length > 0) {
    open.sort((left, right) => left.score - right.score);
    const current = open.shift();
    if (!current) {
      break;
    }

    const currentCell: GridCell = { column: current.column, row: current.row };
    const currentKey = cellKey(currentCell);
    openKeys.delete(currentKey);

    if (currentKey === targetKey) {
      const cellPath: GridCell[] = [targetCell];
      let walkKey = targetKey;
      while (walkKey !== startKey) {
        const previousKey = cameFrom.get(walkKey);
        if (!previousKey) {
          return [];
        }
        cellPath.push(parseCellKey(previousKey));
        walkKey = previousKey;
      }
      cellPath.reverse();

      const points = cellPath.slice(1).map(toPoint);
      const targetIsWalkable =
        isPointInsideWalkableBounds(map, requestedTarget, clearance) &&
        !isPointBlocked(requestedTarget, map.colliders, clearance);
      if (targetIsWalkable) {
        points.push({ ...requestedTarget });
      }
      return points;
    }

    closedKeys.add(currentKey);
    const currentCost = costFromStart.get(currentKey) ?? Number.POSITIVE_INFINITY;

    for (const [columnDelta, rowDelta] of directions) {
      const neighbour: GridCell = {
        column: currentCell.column + columnDelta,
        row: currentCell.row + rowDelta,
      };
      if (!isWalkable(neighbour)) {
        continue;
      }

      if (columnDelta !== 0 && rowDelta !== 0) {
        const horizontal = { column: currentCell.column + columnDelta, row: currentCell.row };
        const vertical = { column: currentCell.column, row: currentCell.row + rowDelta };
        if (!isWalkable(horizontal) || !isWalkable(vertical)) {
          continue;
        }
      }

      const neighbourKey = cellKey(neighbour);
      if (closedKeys.has(neighbourKey)) {
        continue;
      }

      const stepCost = columnDelta === 0 || rowDelta === 0 ? 1 : Math.SQRT2;
      const nextCost = currentCost + stepCost;
      if (nextCost >= (costFromStart.get(neighbourKey) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }

      cameFrom.set(neighbourKey, currentKey);
      costFromStart.set(neighbourKey, nextCost);
      const score = nextCost + distanceBetweenCells(neighbour, targetCell);
      if (openKeys.has(neighbourKey)) {
        const existing = open.find(
          (candidate) => candidate.column === neighbour.column && candidate.row === neighbour.row,
        );
        if (existing) {
          existing.score = score;
        }
      } else {
        open.push({ ...neighbour, score });
        openKeys.add(neighbourKey);
      }
    }
  }

  return [];
}
