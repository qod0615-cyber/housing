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
    const wt = r.wallThickness || 15;
    minX = Math.min(minX, r.x - wt);
    minY = Math.min(minY, r.y - wt);
    maxX = Math.max(maxX, r.x + r.w + wt);
    maxY = Math.max(maxY, r.y + r.h + wt);
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
