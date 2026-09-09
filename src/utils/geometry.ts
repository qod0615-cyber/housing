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
 * Features Coordinated 2-Wall Corner Snap to prevent jitter at room corners.
 */
export function findWallSnap(
  rawX: number,
  rawY: number,
  itemW: number,
  itemH: number,
  rotationDeg: number = 0,
  rooms: Room[],
  threshold: number = 15
): { snappedX: number; snappedY: number; isSnapped: boolean; wallName?: string; wallDirection?: 'top' | 'right' | 'bottom' | 'left' | 'corner' } {
  let snappedX = rawX;
  let snappedY = rawY;
  let isXSnapped = false;
  let isYSnapped = false;
  let closestXDist = Infinity;
  let closestYDist = Infinity;
  let xWallName = '';
  let yWallName = '';
  let wallDir: 'top' | 'right' | 'bottom' | 'left' | 'corner' | undefined = undefined;

  const itemCX = rawX + itemW / 2;
  const itemCY = rawY + itemH / 2;
  const aabb = getRotatedAABB(rawX, rawY, itemW, itemH, rotationDeg);

  for (const room of rooms) {
    const margin = 60;
    const inXRange = itemCX >= room.x - margin && itemCX <= room.x + room.w + margin;
    const inYRange = itemCY >= room.y - margin && itemCY <= room.y + room.h + margin;

    if (!inXRange && !inYRange) continue;

    const distLeft = Math.abs(aabb.minX - room.x);
    const distRight = Math.abs(aabb.maxX - (room.x + room.w));
    const distTop = Math.abs(aabb.minY - room.y);
    const distBottom = Math.abs(aabb.maxY - (room.y + room.h));

    // 1. Check Left & Right Inner Walls if item is within room Y range
    if (inYRange) {
      if (distLeft <= threshold && distLeft < closestXDist) {
        closestXDist = distLeft;
        snappedX = rawX + (room.x - aabb.minX);
        isXSnapped = true;
        xWallName = `${room.name} 왼쪽 벽`;
        wallDir = 'left';
      }
      if (distRight <= threshold && distRight < closestXDist) {
        closestXDist = distRight;
        snappedX = rawX + ((room.x + room.w) - aabb.maxX);
        isXSnapped = true;
        xWallName = `${room.name} 오른쪽 벽`;
        wallDir = 'right';
      }
    }

    // 2. Check Top & Bottom Inner Walls if item is within room X range
    if (inXRange) {
      if (distTop <= threshold && distTop < closestYDist) {
        closestYDist = distTop;
        snappedY = rawY + (room.y - aabb.minY);
        isYSnapped = true;
        yWallName = `${room.name} 위쪽 벽`;
        wallDir = 'top';
      }
      if (distBottom <= threshold && distBottom < closestYDist) {
        closestYDist = distBottom;
        snappedY = rawY + ((room.y + room.h) - aabb.maxY);
        isYSnapped = true;
        yWallName = `${room.name} 아래쪽 벽`;
        wallDir = 'bottom';
      }
    }
  }

  const isSnapped = isXSnapped || isYSnapped;
  const isCorner = isXSnapped && isYSnapped;
  const finalWallDir = isCorner ? 'corner' : wallDir;
  
  let wallLabel = '';
  if (isCorner) {
    wallLabel = `${xWallName} & ${yWallName} (구석 코너)`;
  } else if (isXSnapped) {
    wallLabel = xWallName;
  } else if (isYSnapped) {
    wallLabel = yWallName;
  }

  return {
    snappedX,
    snappedY,
    isSnapped,
    wallName: isSnapped ? wallLabel : undefined,
    wallDirection: finalWallDir,
  };
}

/**
 * Snap item edges to adjacent furniture items (Snap-to-Furniture)
 */
export function findFurnitureSnap(
  rawX: number,
  rawY: number,
  currentItem: Furniture,
  allItems: Furniture[],
  threshold: number = 15
): { snappedX: number; snappedY: number; isSnapped: boolean; targetItemName?: string } {
  let snappedX = rawX;
  let snappedY = rawY;
  let isSnapped = false;
  let targetItemName = '';
  let closestDist = Infinity;

  const currentAABB = getRotatedAABB(rawX, rawY, currentItem.w, currentItem.h, currentItem.rotation);
  const currentW = currentAABB.maxX - currentAABB.minX;
  const currentH = currentAABB.maxY - currentAABB.minY;

  for (const other of allItems) {
    if (other.id === currentItem.id) continue;

    const otherAABB = getRotatedAABB(other.x, other.y, other.w, other.h, other.rotation);

    const inYOverlap = !(currentAABB.maxY < otherAABB.minY || currentAABB.minY > otherAABB.maxY);
    const inXOverlap = !(currentAABB.maxX < otherAABB.minX || currentAABB.minX > otherAABB.maxX);

    // 1. Attach to Other Item's Left Edge
    if (inYOverlap) {
      const distRightToLeft = Math.abs(currentAABB.maxX - otherAABB.minX);
      if (distRightToLeft <= threshold && distRightToLeft < closestDist) {
        closestDist = distRightToLeft;
        snappedX = rawX + (otherAABB.minX - currentAABB.maxX);
        isSnapped = true;
        targetItemName = `${other.name} 왼쪽 밀착`;
      }
      // Attach to Other Item's Right Edge
      const distLeftToRight = Math.abs(currentAABB.minX - otherAABB.maxX);
      if (distLeftToRight <= threshold && distLeftToRight < closestDist) {
        closestDist = distLeftToRight;
        snappedX = rawX + (otherAABB.maxX - currentAABB.minX);
        isSnapped = true;
        targetItemName = `${other.name} 오른쪽 밀착`;
      }
    }

    // 2. Attach to Other Item's Top Edge
    if (inXOverlap) {
      const distBottomToTop = Math.abs(currentAABB.maxY - otherAABB.minY);
      if (distBottomToTop <= threshold && distBottomToTop < closestDist) {
        closestDist = distBottomToTop;
        snappedY = rawY + (otherAABB.minY - currentAABB.maxY);
        isSnapped = true;
        targetItemName = `${other.name} 상단 밀착`;
      }
      // Attach to Other Item's Bottom Edge
      const distTopToBottom = Math.abs(currentAABB.minY - otherAABB.maxY);
      if (distTopToBottom <= threshold && distTopToBottom < closestDist) {
        closestDist = distTopToBottom;
        snappedY = rawY + (otherAABB.maxY - currentAABB.minY);
        isSnapped = true;
        targetItemName = `${other.name} 하단 밀착`;
      }
    }
  }

  return { snappedX, snappedY, isSnapped, targetItemName: isSnapped ? targetItemName : undefined };
}

/**
 * Detect overlapping collisions between standard floor furniture items.
 * Wall fixtures (sockets, LAN ports, doors, windows) are embedded on walls and excluded from floor collisions.
 */
export function getCollidingItemIds(items: Furniture[]): Set<string> {
  const collidingIds = new Set<string>();

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const itemA = items[i];
      const itemB = items[j];

      // Exclude wall fixtures from floor furniture collisions
      if (itemA.type !== 'furniture' || itemB.type !== 'furniture') {
        continue;
      }

      const aabbA = getRotatedAABB(itemA.x, itemA.y, itemA.w, itemA.h, itemA.rotation);
      const aabbB = getRotatedAABB(itemB.x, itemB.y, itemB.w, itemB.h, itemB.rotation);

      // Check AABB overlap (with 2cm tolerance margin)
      const margin = 2;
      const overlapsX = aabbA.minX < aabbB.maxX - margin && aabbA.maxX > aabbB.minX + margin;
      const overlapsY = aabbA.minY < aabbB.maxY - margin && aabbA.maxY > aabbB.minY + margin;

      if (overlapsX && overlapsY) {
        collidingIds.add(itemA.id);
        collidingIds.add(itemB.id);
      }
    }
  }

  return collidingIds;
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
