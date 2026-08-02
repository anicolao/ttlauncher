export type Edge = 'north' | 'east' | 'south' | 'west';

export interface RingPosition {
  angle: number;
  xPercent: number;
  yPercent: number;
  rotation: number;
  edge: Edge;
}

export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function ringPosition(index: number, count: number, ringAngle = 0): RingPosition {
  const safeCount = Math.max(1, count);
  const angle = normalizeAngle(-90 + (index * 360) / safeCount + ringAngle);
  const radians = (angle * Math.PI) / 180;
  return {
    angle,
    xPercent: 50 + Math.cos(radians) * 35.5,
    yPercent: 50 + Math.sin(radians) * 31,
    rotation: normalizeSignedAngle(90 - angle),
    edge: nearestEdge(angle)
  };
}

export function nearestEdge(angle: number): Edge {
  const normalized = normalizeAngle(angle);
  if (normalized >= 315 || normalized < 45) return 'east';
  if (normalized < 135) return 'south';
  if (normalized < 225) return 'west';
  return 'north';
}

export function angleFromPoint(x: number, y: number, centerX: number, centerY: number): number {
  return (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI;
}

export function shortestAngleDelta(from: number, to: number): number {
  return ((to - from + 540) % 360) - 180;
}

function normalizeSignedAngle(angle: number): number {
  const normalized = normalizeAngle(angle);
  return normalized > 180 ? normalized - 360 : normalized;
}
