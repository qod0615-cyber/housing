import { Room, Furniture } from '../types/floorplan';

/**
 * Snaps angle to nearest 0, 90, 180, 270 if within threshold.
 */
export function getSnappedAngle(
  rawAngle: number,
  thresholdDeg: number = 8
): { angle: number; isSnapped: boolean; snapTarget: number | null } {
  // Normalize angle to [0, 360)
  let normalized = rawAngle % 360;
  if (normalized < 0) normalized += 360;

  const snapTargets = [0, 90, 180, 270, 360];

  for (const target of snapTargets) {
    const diff = Math.abs(normalized - target);
    if (diff <= thresholdDeg) {
      const finalAngle = (target === 360 ? 0 : target);
      return { angle: finalAngle, isSnapped: true, snapTarget: finalAngle };
    }
  }

  return { angle: Math.round(normalized), isSnapped: false, snapTarget: null };
}

/**
 * Format centimeters to readable text (e.g. 360cm or 3.6m)
 */
export function formatUnit(cmValue: number, unit: 'cm' | 'm' = 'cm'): string {
  if (unit === 'm') {
    return `${(cmValue / 100).toFixed(2)}m`;
  }
  return `${Math.round(cmValue)}cm`;
}

/**
 * Grid snap calculation for coordinates
 */
export function snapToGridValue(val: number, gridSize: number): number {
  if (gridSize <= 0) return val;
  return Math.round(val / gridSize) * gridSize;
}

/**
 * Compute effective wall thickness for top, right, bottom, left of a room
 */
export function getRoomWallThickness(room: Room, defaultThickness: number = 15): { top: number; right: number; bottom: number; left: number } {
  const base = room.wallThickness ?? defaultThickness;
  return {
    top: room.wallThicknesses?.top ?? base,
    right: room.wallThicknesses?.right ?? base,
    bottom: room.wallThicknesses?.bottom ?? base,
    left: room.wallThicknesses?.left ?? base,
  };
}

/**
 * Compute Axis-Aligned Bounding Box (AABB) of an item rotated by angleDeg around its center
 */
export function getRotatedAABB(
  x: number,
  y: number,
  w: number,
  h: number,
  angleDeg: number = 0
): { minX: number; maxX: number; minY: number; maxY: number } {
  if (!angleDeg || angleDeg % 360 === 0) {
    return { minX: x, maxX: x + w, minY: y, maxY: y + h };
  }

  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const cx = x + w / 2;
  const cy = y + h / 2;

  // Unrotated corners relative to center
  const corners = [
    { dx: -w / 2, dy: -h / 2 },
    { dx: w / 2, dy: -h / 2 },
    { dx: w / 2, dy: h / 2 },
    { dx: -w / 2, dy: h / 2 },
  ];

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const c of corners) {
    const rx = cx + (c.dx * cos - c.dy * sin);
    const ry = cy + (c.dx * sin + c.dy * cos);
    minX = Math.min(minX, rx);
    maxX = Math.max(maxX, rx);
    minY = Math.min(minY, ry);
    maxY = Math.max(maxY, ry);
  }

  return { minX, maxX, minY, maxY };
}

/**
 * Wall snap calculation for items when dragging near room inner walls.
 * Preserves the item's rotation and snaps rotated AABB outer edges to room inner walls.
 */
export function findWallSnap(
  rawX: number,
  rawY: number,
  itemW: number,
  itemH: number,
  rotationDeg: number = 0,
  rooms: Room[],
  threshold: number = 25
): { snappedX: number; snappedY: number; isSnapped: boolean; wallName?: string } {
  let snappedX = rawX;
  let snappedY = rawY;
  let isXSnapped = false;
  let isYSnapped = false;
  let closestXDist = Infinity;
  let closestYDist = Infinity;
  let xWallName = '';
  let yWallName = '';

  const itemCX = rawX + itemW / 2;
  const itemCY = rawY + itemH / 2;
  const aabb = getRotatedAABB(rawX, rawY, itemW, itemH, rotationDeg);

  for (const room of rooms) {
    const margin = 50;
    const inXRange = itemCX >= room.x - margin && itemCX <= room.x + room.w + margin;
    const inYRange = itemCY >= room.y - margin && itemCY <= room.y + room.h + margin;

    // Check Left & Right Inner Walls if within room's Y range
    if (inYRange) {
      // 1. Left Inner Wall (x = room.x)
      const distLeft = Math.abs(aabb.minX - room.x);
      if (distLeft <= threshold && distLeft < closestXDist) {
        closestXDist = distLeft;
        snappedX = rawX + (room.x - aabb.minX);
        isXSnapped = true;
        xWallName = `${room.name} 왼쪽 벽`;
      }
      // 2. Right Inner Wall (x = room.x + room.w)
      const distRight = Math.abs(aabb.maxX - (room.x + room.w));
      if (distRight <= threshold && distRight < closestXDist) {
        closestXDist = distRight;
        snappedX = rawX + ((room.x + room.w) - aabb.maxX);
        isXSnapped = true;
        xWallName = `${room.name} 오른쪽 벽`;
      }
    }

    // Check Top & Bottom Inner Walls if within room's X range
    if (inXRange) {
      // 3. Top Inner Wall (y = room.y)
      const distTop = Math.abs(aabb.minY - room.y);
      if (distTop <= threshold && distTop < closestYDist) {
        closestYDist = distTop;
        snappedY = rawY + (room.y - aabb.minY);
        isYSnapped = true;
        yWallName = `${room.name} 위쪽 벽`;
      }
      // 4. Bottom Inner Wall (y = room.y + room.h)
      const distBottom = Math.abs(aabb.maxY - (room.y + room.h));
      if (distBottom <= threshold && distBottom < closestYDist) {
        closestYDist = distBottom;
        snappedY = rawY + ((room.y + room.h) - aabb.maxY);
        isYSnapped = true;
        yWallName = `${room.name} 아래쪽 벽`;
      }
    }
  }

  const isSnapped = isXSnapped || isYSnapped;
  const wallNames = [xWallName, yWallName].filter(Boolean).join(' & ');

  return {
    snappedX,
    snappedY,
    isSnapped,
    wallName: isSnapped ? wallNames : undefined,
  };
}

/**
 * Compute bounding box of all rooms to center canvas view
 */
export function getBlueprintBounds(rooms: Room[], items: Furniture[]) {
  if (rooms.length === 0 && items.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 800, width: 800, height: 800 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  rooms.forEach((r) => {
    const wt = getRoomWallThickness(r);
    minX = Math.min(minX, r.x - wt.left);
    minY = Math.min(minY, r.y - wt.top);
    maxX = Math.max(maxX, r.x + r.w + wt.right);
    maxY = Math.max(maxY, r.h + r.y + wt.bottom);
  });

  items.forEach((i) => {
    minX = Math.min(minX, i.x);
    minY = Math.min(minY, i.y);
    maxX = Math.max(maxX, i.x + i.w);
    maxY = Math.max(maxY, i.y + i.h);
  });

  const width = Math.max(600, maxX - minX);
  const height = Math.max(600, maxY - minY);

  return { minX, minY, maxX, maxY, width, height };
}
