/**
 * Geometry Utility Functions for Triangle Calculation and Visualization
 */

// Calculate Euclidean distance between two points
export function distance(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Calculate interior angle at vertex V formed by arms V->P1 and V->P2 in degrees
export function calculateAngle(V, P1, P2) {
  const v1 = { x: P1.x - V.x, y: P1.y - V.y };
  const v2 = { x: P2.x - V.x, y: P2.y - V.y };

  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  const dot = v1.x * v2.x + v1.y * v2.y;
  // Clamp dot product to avoid NaN from floating point precision issues
  const cosTheta = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  const rad = Math.acos(cosTheta);
  const deg = (rad * 180) / Math.PI;

  return deg;
}

// Calculate all 3 internal angles guaranteed to sum to 180 degrees
export function getTriangleAngles(A, B, C) {
  let rawA = calculateAngle(A, B, C);
  let rawB = calculateAngle(B, A, C);
  let rawC = calculateAngle(C, A, B);

  // Normalize floating point sum to 180.0
  const sum = rawA + rawB + rawC;
  if (sum > 0) {
    rawA = (rawA / sum) * 180;
    rawB = (rawB / sum) * 180;
    rawC = 180 - rawA - rawB;
  }

  return {
    angleA: Math.round(rawA * 10) / 10,
    angleB: Math.round(rawB * 10) / 10,
    angleC: Math.round(rawC * 10) / 10,
    rawA,
    rawB,
    rawC,
  };
}

// Calculate side lengths
export function getSideLengths(A, B, C) {
  return {
    a: Math.round(distance(B, C)), // Side opposite to A
    b: Math.round(distance(A, C)), // Side opposite to B
    c: Math.round(distance(A, B)), // Side opposite to C
  };
}

// Classify triangle by angle types
export function classifyByAngles(angleA, angleB, angleC) {
  const TOLERANCE = 0.5;
  if (
    Math.abs(angleA - 90) <= TOLERANCE ||
    Math.abs(angleB - 90) <= TOLERANCE ||
    Math.abs(angleC - 90) <= TOLERANCE
  ) {
    return { name: 'Right Triangle', icon: '📐', description: 'Has one 90° square corner!' };
  }
  if (angleA > 90.5 || angleB > 90.5 || angleC > 90.5) {
    return { name: 'Obtuse Triangle', icon: '🛏️', description: 'Has one wide angle (> 90°)' };
  }
  return { name: 'Acute Triangle', icon: '⚡', description: 'All three angles are sharp (< 90°)' };
}

// Classify triangle by side lengths
export function classifyBySides(a, b, c) {
  const maxSide = Math.max(a, b, c);
  const TOLERANCE = maxSide * 0.05; // 5% tolerance for equilateral / isosceles

  const ab = Math.abs(a - b) <= TOLERANCE;
  const bc = Math.abs(b - c) <= TOLERANCE;
  const ac = Math.abs(a - c) <= TOLERANCE;

  if (ab && bc && ac) {
    return { name: 'Equilateral', badge: '3 Equal Sides', color: '#10b981' };
  }
  if (ab || bc || ac) {
    return { name: 'Isosceles', badge: '2 Equal Sides', color: '#8b5cf6' };
  }
  return { name: 'Scalene', badge: 'All Different Sides', color: '#f59e0b' };
}

// Snap point to grid
export function snapToGrid(point, gridSize = 20) {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

// Generate SVG path string for internal angle arc
export function getAngleArcPath(V, P1, P2, radius = 38) {
  // Angle of V -> P1
  const ang1 = Math.atan2(P1.y - V.y, P1.x - V.x);
  // Angle of V -> P2
  const ang2 = Math.atan2(P2.y - V.y, P2.x - V.x);

  // Compute sweep direction (interior angle <= 180 deg)
  let diff = ang2 - ang1;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  const startAngle = ang1;
  const endAngle = ang1 + diff;

  const startX = V.x + radius * Math.cos(startAngle);
  const startY = V.y + radius * Math.sin(startAngle);
  const endX = V.x + radius * Math.cos(endAngle);
  const endY = V.y + radius * Math.sin(endAngle);

  const sweepFlag = diff > 0 ? 1 : 0;
  const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;

  return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
}

// Calculate angle arc label offset position
export function getAngleLabelPosition(V, P1, P2, distanceOffset = 62) {
  const ang1 = Math.atan2(P1.y - V.y, P1.x - V.x);
  const ang2 = Math.atan2(P2.y - V.y, P2.x - V.x);

  let diff = ang2 - ang1;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  const midAngle = ang1 + diff / 2;

  return {
    x: V.x + distanceOffset * Math.cos(midAngle),
    y: V.y + distanceOffset * Math.sin(midAngle),
  };
}

// Preset Triangle Configurations
export function getPresets(width = 700, height = 460) {
  const cx = width / 2;
  const cy = height / 2;

  return [
    {
      id: 'equilateral',
      label: 'Equilateral',
      subtitle: '60° + 60° + 60°',
      icon: '🔺',
      points: {
        A: { x: cx, y: cy - 140 },
        B: { x: cx - 140, y: cy + 100 },
        C: { x: cx + 140, y: cy + 100 },
      },
    },
    {
      id: 'right',
      label: 'Right Triangle',
      subtitle: '90° Square Corner',
      icon: '📐',
      points: {
        A: { x: cx - 140, y: cy - 110 },
        B: { x: cx - 140, y: cy + 110 },
        C: { x: cx + 140, y: cy + 110 },
      },
    },
    {
      id: 'isosceles',
      label: 'Isosceles',
      subtitle: '2 Equal Angles',
      icon: '🎪',
      points: {
        A: { x: cx, y: cy - 150 },
        B: { x: cx - 110, y: cy + 110 },
        C: { x: cx + 110, y: cy + 110 },
      },
    },
    {
      id: 'obtuse',
      label: 'Obtuse Triangle',
      subtitle: 'Wide Angle > 90°',
      icon: '🛏️',
      points: {
        A: { x: cx - 190, y: cy - 20 },
        B: { x: cx - 50, y: cy + 110 },
        C: { x: cx + 180, y: cy + 110 },
      },
    },
    {
      id: 'sharp',
      label: 'Acute Triangle',
      subtitle: 'All Angles < 90°',
      icon: '⚡',
      points: {
        A: { x: cx - 20, y: cy - 140 },
        B: { x: cx - 150, y: cy + 90 },
        C: { x: cx + 130, y: cy + 120 },
      },
    },
  ];
}
