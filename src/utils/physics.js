/**
 * 2D Gravitational Physics Engine & Level Generator for Space Slingshot
 */

export const DEFAULT_G = 400; // Default Gravitational Constant

// Generate random level layout with planets, target, and randomized spaceship position
export function generateRandomLevel(width = 960, height = 600, config = {}) {
  const target = {
    x: width - 100,
    y: Math.floor(90 + Math.random() * (height - 180)),
    radius: 24,
  };

  const countSetting = config.planetCount || 'auto';
  const numPlanets =
    countSetting === 'auto'
      ? 2 + Math.floor(Math.random() * 2)
      : Math.max(1, Math.min(5, Number(countSetting)));

  const massMult = config.massMult ? Number(config.massMult) : 1.0;
  const planets = [];

  const planetColors = [
    { fill: '#ec4899', glow: 'rgba(236, 72, 153, 0.35)', name: 'Magenta Prime' },
    { fill: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.35)', name: 'Aetheria' },
    { fill: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)', name: 'Neptuna' },
    { fill: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)', name: 'Helios Jr' },
    { fill: '#10b981', glow: 'rgba(16, 185, 129, 0.35)', name: 'Verdant' },
  ];

  // Generate planets
  for (let i = 0; i < numPlanets; i++) {
    let px, py, radius, mass, overlap;
    let attempts = 0;

    do {
      overlap = false;
      px = 240 + Math.random() * (width - 440);
      py = 80 + Math.random() * (height - 160);
      radius = 28 + Math.floor(Math.random() * 36);
      mass = Math.round(radius * (1.2 + Math.random() * 1.5) * massMult);

      if (Math.hypot(px - target.x, py - target.y) < radius + 90) overlap = true;

      for (const p of planets) {
        if (Math.hypot(px - p.x, py - p.y) < radius + p.radius + 60) {
          overlap = true;
          break;
        }
      }
      attempts++;
    } while (overlap && attempts < 120);

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

  // Generate random spaceship position (guaranteed no overlap with planets or target)
  let sx, sy, shipOverlap;
  let shipAttempts = 0;
  do {
    shipOverlap = false;
    sx = 70 + Math.random() * 180; // Left sector
    sy = 70 + Math.random() * (height - 140);

    if (Math.hypot(sx - target.x, sy - target.y) < 140) shipOverlap = true;

    for (const p of planets) {
      if (Math.hypot(sx - p.x, sy - p.y) < p.radius + 70) {
        shipOverlap = true;
        break;
      }
    }
    shipAttempts++;
  } while (shipOverlap && shipAttempts < 150);

  const ship = { x: sx, y: sy };

  return { ship, target, planets };
}

// Calculate gravitational acceleration at position (x, y) from all planets
export function calculateGravitationalAccel(x, y, planets, gravityG = DEFAULT_G) {
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
    const accel = (gravityG * p.mass) / Math.max(distSq, 400);

    ax += accel * (dx / dist);
    ay += accel * (dy / dist);
  }

  return { ax, ay };
}

// Step physics forward by dt seconds (tuned for cinematic, readable speed)
export function updateProjectilePhysics(pos, vel, planets, dt = 0.016, gravityG = DEFAULT_G) {
  const { ax, ay } = calculateGravitationalAccel(pos.x, pos.y, planets, gravityG);

  const SPEED_FACTOR = 0.55;

  const nVel = {
    x: vel.x + ax * dt * 35 * SPEED_FACTOR,
    y: vel.y + ay * dt * 35 * SPEED_FACTOR,
  };

  const nPos = {
    x: pos.x + nVel.x * dt * 35 * SPEED_FACTOR,
    y: pos.y + nVel.y * dt * 35 * SPEED_FACTOR,
  };

  return { pos: nPos, vel: nVel, accel: { ax, ay } };
}

// Check collisions: 'target', 'planet', 'out_of_bounds', or 'none'
export function checkCollisions(pos, target, planets, width = 960, height = 600) {
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

  // Check out of bounds (expanded padding to 650px for deep space long orbits)
  if (pos.x < -650 || pos.x > width + 650 || pos.y < -650 || pos.y > height + 650) {
    return 'out_of_bounds';
  }

  return 'none';
}
