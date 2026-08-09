/**
 * 2D Gravitational Physics Engine & Level Generator for Space Slingshot
 */

export const G = 400; // Gravitational constant for fun arcade physics

// Generate random level layout with planets and target
export function generateRandomLevel(width = 800, height = 500) {
  const ship = { x: 90, y: height / 2 };
  const target = {
    x: width - 90,
    y: Math.floor(100 + Math.random() * (height - 200)),
    radius: 22,
  };

  const numPlanets = 2 + Math.floor(Math.random() * 2); // 2 to 3 planets
  const planets = [];

  const planetColors = [
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.35)', name: 'Magenta Prime' },
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.35)', name: 'Aetheria' },
    { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)', name: 'Neptuna' },
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', name: 'Helios Jr' },
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', name: 'Verdant' },
  ];

  for (let i = 0; i < numPlanets; i++) {
    let px, py, radius, mass, overlap;
    let attempts = 0;

    do {
      overlap = false;
      px = 220 + Math.random() * (width - 440);
      py = 80 + Math.random() * (height - 160);
      radius = 24 + Math.floor(Math.random() * 32); // Radius 24-56
      mass = Math.round(radius * (1.2 + Math.random() * 1.5)); // Mass scales with size & density

      // Ensure no overlap with ship, target, or existing planets
      if (Math.hypot(px - ship.x, py - ship.y) < radius + 80) overlap = true;
      if (Math.hypot(px - target.x, py - target.y) < radius + 80) overlap = true;

      for (const p of planets) {
        if (Math.hypot(px - p.x, py - p.y) < radius + p.radius + 60) {
          overlap = true;
          break;
        }
      }
      attempts++;
    } while (overlap && attempts < 100);

    const theme = planetColors[i % planetColors.length];

    planets.push({
      id: i + 1,
      x: px,
      y: py,
      radius,
      mass,
      fill: theme.fill,
      glow: theme.glow,
      name: theme.name,
    });
  }

  return { ship, target, planets };
}

// Calculate gravitational acceleration at position (x, y) from all planets
export function calculateGravitationalAccel(x, y, planets) {
  let ax = 0;
  let ay = 0;

  for (const p of planets) {
    const dx = p.x - x;
    const dy = p.y - y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    // Prevent singularity near center
    if (dist < p.radius * 0.5) continue;

    // Force = G * mass / distSq
    const accel = (G * p.mass) / Math.max(distSq, 400);

    ax += accel * (dx / dist);
    ay += accel * (dy / dist);
  }

  return { ax, ay };
}

// Step physics forward by dt seconds
export function updateProjectilePhysics(pos, vel, planets, dt = 0.016) {
  const { ax, ay } = calculateGravitationalAccel(pos.x, pos.y, planets);

  const nVel = {
    x: vel.x + ax * dt * 60,
    y: vel.y + ay * dt * 60,
  };

  const nPos = {
    x: pos.x + nVel.x * dt * 60,
    y: pos.y + nVel.y * dt * 60,
  };

  return { pos: nPos, vel: nVel, accel: { ax, ay } };
}

// Check collisions: 'planet', 'target', 'out_of_bounds', or 'none'
export function checkCollisions(pos, target, planets, width = 800, height = 500) {
  // Check target hit
  if (Math.hypot(pos.x - target.x, pos.y - target.y) <= target.radius + 6) {
    return 'target';
  }

  // Check planet hits
  for (const p of planets) {
    if (Math.hypot(pos.x - p.x, pos.y - p.y) <= p.radius + 5) {
      return 'planet';
    }
  }

  // Check out of bounds
  if (pos.x < -100 || pos.x > width + 100 || pos.y < -100 || pos.y > height + 100) {
    return 'out_of_bounds';
  }

  return 'none';
}
