import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  generateRandomLevel,
  updateProjectilePhysics,
  calculateGravitationalAccel,
  checkCollisions,
  DEFAULT_G,
} from '../utils/physics';
import { playPopSound, playSnapSound, playVictorySound } from '../utils/audio';
import { Play, RotateCcw, Compass, Zap, Eye, EyeOff, Sliders, Activity, Magnet, Target } from 'lucide-react';

export default function SpaceGravityGame({ soundEnabled }) {
  const svgRef = useRef(null);

  // Customization Settings
  const [planetCount, setPlanetCount] = useState('auto'); // 'auto' | 1..5
  const [gravityG, setGravityG] = useState(DEFAULT_G); // 100..1000
  const [massMult, setMassMult] = useState(1.0); // 0.5..2.0
  const [autoNextOnTarget, setAutoNextOnTarget] = useState(true);

  // Visual Overlays
  const [showGravityGradients, setShowGravityGradients] = useState(true);
  const [showGravityVectors, setShowGravityVectors] = useState(true);

  // Level & Physics State (Spacious 960x600 canvas)
  const [level, setLevel] = useState(() =>
    generateRandomLevel(960, 600, { planetCount: 'auto', massMult: 1.0 })
  );
  const [angle, setAngle] = useState(335); // Degrees (0 to 360)
  const [power, setPower] = useState(55); // Magnitude (10 to 100)

  const [isDraggingAim, setIsDraggingAim] = useState(false);

  // Trajectory trail history
  const [pastTrails, setPastTrails] = useState([]);
  const [showAllPastTrails, setShowAllPastTrails] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [projectilePos, setProjectilePos] = useState(null);
  const [projectileVel, setProjectileVel] = useState(null);
  const [projectileAccel, setProjectileAccel] = useState({ ax: 0, ay: 0 });
  const [trail, setTrail] = useState([]);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'flying' | 'hit_target' | 'hit_planet' | 'out'
  const [score, setScore] = useState(0);

  const animRef = useRef(null);
  const autoNextTimerRef = useRef(null);
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });

  const { ship, target, planets } = level;

  // Generate new level with current customization settings
  const handleNewLevel = useCallback(
    (customConfig) => {
      const cfg = customConfig || { planetCount, massMult };
      setLevel(generateRandomLevel(960, 600, cfg));
      setIsSimulating(false);
      setProjectilePos(null);
      setProjectileVel(null);
      setProjectileAccel({ ax: 0, ay: 0 });
      setTrail([]);
      setPastTrails([]);
      setGameStatus('idle');
      playSnapSound(soundEnabled);
    },
    [planetCount, massMult, soundEnabled]
  );

  // Convert screen pointer event to SVG space coordinates
  const getSVGCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  // Update angle and power from pointer position
  const updateAimFromPointer = (e) => {
    if (isSimulating) return;
    const coords = getSVGCoordinates(e);
    const dx = coords.x - ship.x;
    const dy = coords.y - ship.y;

    const rad = Math.atan2(dy, dx);
    const deg = Math.round(((rad * 180) / Math.PI + 360) % 360);

    const dist = Math.hypot(dx, dy);
    const newPower = Math.max(10, Math.min(100, Math.round(dist / 1.7)));

    setAngle(deg);
    setPower(newPower);
  };

  const handlePointerDown = (e) => {
    if (isSimulating) return;
    setIsDraggingAim(true);
    e.target.setPointerCapture(e.pointerId);
    updateAimFromPointer(e);
  };

  const handlePointerMove = (e) => {
    if (isDraggingAim && !isSimulating) {
      updateAimFromPointer(e);
    }
  };

  const handlePointerUp = (e) => {
    if (isDraggingAim) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setIsDraggingAim(false);
    }
  };

  // Launch projectile
  const handleLaunch = useCallback(() => {
    if (isSimulating) return;

    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
    }

    playPopSound(soundEnabled);

    const rad = (angle * Math.PI) / 180;
    const initialVel = {
      x: (power / 4.8) * Math.cos(rad),
      y: (power / 4.8) * Math.sin(rad),
    };

    posRef.current = { x: ship.x, y: ship.y };
    velRef.current = initialVel;

    setProjectilePos({ x: ship.x, y: ship.y });
    setProjectileVel(initialVel);
    setTrail([{ x: ship.x, y: ship.y }]);
    setIsSimulating(true);
    setGameStatus('flying');
  }, [isSimulating, angle, power, ship, soundEnabled]);

  // Keyboard controls: Arrow Keys for angle & power, Spacebar to launch!
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isSimulating) return;

      const step = e.shiftKey ? 5 : 1;

      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setAngle((prev) => (prev - step + 360) % 360);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setAngle((prev) => (prev + step) % 360);
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setPower((prev) => Math.min(100, prev + step));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setPower((prev) => Math.max(10, prev - step));
      } else if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleLaunch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleLaunch, isSimulating]);

  // Save full completed shot trail to history
  const finalizeShot = useCallback(
    (status, finalTrail) => {
      setIsSimulating(false);
      setGameStatus(status);

      if (finalTrail.length > 1) {
        setPastTrails((prev) => [
          ...prev,
          {
            id: Date.now(),
            points: finalTrail,
            status,
          },
        ]);
      }

      // Auto-generate new planets when target is achieved
      if (status === 'hit_target' && autoNextOnTarget) {
        autoNextTimerRef.current = setTimeout(() => {
          handleNewLevel();
        }, 1400);
      }
    },
    [autoNextOnTarget, handleNewLevel]
  );

  // Physics Animation Loop
  useEffect(() => {
    if (!isSimulating) return;

    let localTrail = [{ x: posRef.current.x, y: posRef.current.y }];

    const loop = () => {
      const result = updateProjectilePhysics(
        posRef.current,
        velRef.current,
        planets,
        0.016,
        gravityG
      );

      posRef.current = result.pos;
      velRef.current = result.vel;

      setProjectilePos(result.pos);
      setProjectileVel(result.vel);
      setProjectileAccel(result.accel);

      // Keep ENTIRE trajectory line for long travel shots
      localTrail.push({ x: result.pos.x, y: result.pos.y });
      setTrail([...localTrail]);

      const collision = checkCollisions(result.pos, target, planets, 960, 600);

      if (collision === 'target') {
        finalizeShot('hit_target', localTrail);
        setScore((s) => s + 100);
        playVictorySound(soundEnabled);
        try {
          confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
        } catch (e) {}
        return;
      }

      if (collision === 'planet') {
        finalizeShot('hit_planet', localTrail);
        playSnapSound(soundEnabled);
        return;
      }

      if (collision === 'out_of_bounds') {
        finalizeShot('out', localTrail);
        return;
      }

      // Max steps safeguard (3500 steps ≈ 60 seconds of long orbit travel)
      if (localTrail.length > 3500) {
        finalizeShot('out', localTrail);
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSimulating, planets, target, gravityG, finalizeShot, soundEnabled]);

  // Aiming vector end point in SVG
  const rad = (angle * Math.PI) / 180;
  const aimLength = power * 1.7;
  const aimVectorEnd = {
    x: ship.x + aimLength * Math.cos(rad),
    y: ship.y + aimLength * Math.sin(rad),
  };

  // Live Telemetry Calculations
  const currentPos = projectilePos || ship;
  const targetDist = Math.round(
    Math.hypot(currentPos.x - target.x, currentPos.y - target.y)
  );

  const currentSpeed = projectileVel
    ? Math.round(Math.hypot(projectileVel.x, projectileVel.y) * 10) / 10
    : 0;

  const currentHeading = projectileVel
    ? Math.round(
        ((Math.atan2(projectileVel.y, projectileVel.x) * 180) / Math.PI + 360) % 360
      )
    : angle;

  // Calculate live net gravity pull vector on projectile
  const netAccel = isSimulating
    ? projectileAccel
    : calculateGravitationalAccel(ship.x, ship.y, planets, gravityG);

  const netAccelMag = Math.hypot(netAccel.ax, netAccel.ay);
  const netAccelAngle = Math.atan2(netAccel.ay, netAccel.ax);
  const gravityVectorLength = Math.min(80, Math.max(16, netAccelMag * 12));
  const gravityVectorEnd = {
    x: currentPos.x + gravityVectorLength * Math.cos(netAccelAngle),
    y: currentPos.y + gravityVectorLength * Math.sin(netAccelAngle),
  };

  // Compute trails to display (either all or last 3 with fading opacities)
  const displayedPastTrails = showAllPastTrails
    ? pastTrails.map((t) => ({ ...t, opacity: 0.45 }))
    : pastTrails.slice(-3).map((t, idx, arr) => {
        const distFromNewest = arr.length - 1 - idx;
        const opacities = [0.7, 0.4, 0.18];
        return {
          ...t,
          opacity: opacities[distFromNewest] || 0.18,
        };
      });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Canvas Card */}
      <div className="canvas-card">
        <div className="canvas-header">
          <div className="canvas-title-group">
            <span style={{ fontSize: '1.4rem' }}>🚀</span>
            <span className="canvas-title">Gravity Slingshot Launcher</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {pastTrails.length > 0 && (
              <button
                className={`btn-icon ${showAllPastTrails ? 'active' : ''}`}
                onClick={() => setShowAllPastTrails((v) => !v)}
                title="Toggle showing all past shot trails"
              >
                {showAllPastTrails ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>
                  {showAllPastTrails
                    ? `Showing All (${pastTrails.length})`
                    : 'Show All Past Shots'}
                </span>
              </button>
            )}

            <div className="help-tip">
              <span>⌨️ ◀▶ Angle • ▲▼ Power • [Space] Shoot</span>
            </div>
          </div>
        </div>

        <svg
          ref={svgRef}
          className="svg-viewport space-viewport"
          viewBox="0 0 960 600"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <defs>
            <radialGradient id="spaceBg" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Dynamic Planet Gravity Field Radial Gradients */}
            {planets.map((planet) => (
              <radialGradient key={planet.id} id={`gravGrad_${planet.id}`}>
                <stop offset="0%" stopColor={planet.fill} stopOpacity="0.45" />
                <stop offset="50%" stopColor={planet.fill} stopOpacity="0.18" />
                <stop offset="100%" stopColor={planet.fill} stopOpacity="0.0" />
              </radialGradient>
            ))}

            <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="targetGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="12" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Space Backdrop */}
          <rect width="960" height="600" fill="url(#spaceBg)" />

          {/* Optional Planet Gravity Field Soft Colored Gradients */}
          {showGravityGradients &&
            planets.map((planet) => (
              <circle
                key={`grad_${planet.id}`}
                cx={planet.x}
                cy={planet.y}
                r={planet.radius * 2.9}
                fill={`url(#gravGrad_${planet.id})`}
                style={{ pointerEvents: 'none' }}
              />
            ))}

          {/* Faded Historical Past Shot Trails */}
          {displayedPastTrails.map((past) => (
            <polyline
              key={past.id}
              points={past.points.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={
                past.status === 'hit_target'
                  ? '#4ade80'
                  : past.status === 'hit_planet'
                  ? '#f87171'
                  : '#cbd5e1'
              }
              strokeWidth="2"
              strokeDasharray="4 3"
              strokeLinecap="round"
              opacity={past.opacity}
            />
          ))}

          {/* Planets with Gravity Fields */}
          {planets.map((planet) => (
            <g key={planet.id}>
              <circle
                cx={planet.x}
                cy={planet.y}
                r={planet.radius * 2.6}
                fill="none"
                stroke={planet.fill}
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.35"
              />

              <circle
                cx={planet.x}
                cy={planet.y}
                r={planet.radius}
                fill={planet.fill}
                filter="url(#planetGlow)"
              />
              <circle
                cx={planet.x - planet.radius * 0.3}
                cy={planet.y - planet.radius * 0.3}
                r={planet.radius * 0.4}
                fill="rgba(255, 255, 255, 0.25)"
              />

              <text
                x={planet.x}
                y={planet.y + planet.radius + 16}
                textAnchor="middle"
                fill="rgba(241, 245, 249, 0.75)"
                fontSize="11"
                fontWeight="600"
              >
                M = {planet.mass}
              </text>
            </g>
          ))}

          {/* Target Station / Portal */}
          <g transform={`translate(${target.x}, ${target.y})`}>
            <circle
              r={target.radius + 10}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="6 6"
              opacity="0.7"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0"
                to="360"
                dur="10s"
                repeatCount="indefinite"
              />
            </circle>
            <circle
              r={target.radius}
              fill="rgba(56, 189, 248, 0.35)"
              stroke="#38bdf8"
              strokeWidth="3"
              filter="url(#targetGlow)"
            />
            <text textAnchor="middle" dy="5" fontSize="16">
              🎯
            </text>
          </g>

          {/* Interactive Aiming Vector Line & Drag Handle */}
          {!isSimulating && (
            <g>
              <line
                x1={ship.x}
                y1={ship.y}
                x2={aimVectorEnd.x}
                y2={aimVectorEnd.y}
                stroke="#fbbf24"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />

              <g
                onPointerDown={handlePointerDown}
                style={{ cursor: isDraggingAim ? 'grabbing' : 'grab' }}
              >
                <circle
                  cx={aimVectorEnd.x}
                  cy={aimVectorEnd.y}
                  r="20"
                  fill="rgba(251, 191, 36, 0.25)"
                  className="handle-pulse"
                />
                <circle
                  cx={aimVectorEnd.x}
                  cy={aimVectorEnd.y}
                  r="10"
                  fill="#fbbf24"
                  stroke="#ffffff"
                  strokeWidth="3"
                />
              </g>
            </g>
          )}

          {/* Spaceship Handle */}
          <g
            transform={`translate(${ship.x}, ${ship.y})`}
            onPointerDown={handlePointerDown}
            style={{ cursor: isDraggingAim ? 'grabbing' : 'grab' }}
          >
            <circle r="22" fill="rgba(99, 102, 241, 0.3)" />
            <circle r="15" fill="#6366f1" stroke="#ffffff" strokeWidth="2.5" />
            <text textAnchor="middle" dy="5" fontSize="14" style={{ pointerEvents: 'none' }}>
              🚀
            </text>
          </g>

          {/* Active Projectile Complete Trail Line */}
          {trail.length > 1 && (
            <polyline
              points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.95"
            />
          )}

          {/* Net Gravity Force Pull Vector Arrow on Projectile */}
          {showGravityVectors && (isSimulating || netAccelMag > 0.05) && (
            <g style={{ pointerEvents: 'none' }}>
              <line
                x1={currentPos.x}
                y1={currentPos.y}
                x2={gravityVectorEnd.x}
                y2={gravityVectorEnd.y}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={gravityVectorEnd.x}
                cy={gravityVectorEnd.y}
                r="4"
                fill="#38bdf8"
              />
              <text
                x={gravityVectorEnd.x + 8}
                y={gravityVectorEnd.y + 4}
                fill="#38bdf8"
                fontSize="11"
                fontWeight="700"
              >
                Fg
              </text>
            </g>
          )}

          {/* Flying Projectile Orb */}
          {projectilePos && (
            <circle
              cx={projectilePos.x}
              cy={projectilePos.y}
              r="7"
              fill="#ffe4e6"
              stroke="#f43f5e"
              strokeWidth="3"
              filter="url(#planetGlow)"
            />
          )}

          {/* Top-Right HUD Badge: Distance to Target */}
          <g transform="translate(730, 20)" style={{ pointerEvents: 'none' }}>
            <rect
              x="0"
              y="0"
              width="210"
              height="36"
              rx="10"
              fill="rgba(15, 23, 42, 0.85)"
              stroke="rgba(56, 189, 248, 0.4)"
              strokeWidth="1.5"
            />
            <text
              x="14"
              y="23"
              fill="#38bdf8"
              fontSize="12"
              fontWeight="700"
              fontFamily="Outfit"
            >
              🎯 Target Distance: {targetDist} px
            </text>
          </g>
        </svg>
      </div>

      {/* Control Panel & Physics Customization Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Launch Math Controls */}
        <div className="side-card">
          <div className="card-title">
            <Compass size={20} color="var(--color-accent-gold)" />
            <span>Launch Controls</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontWeight: '600',
                }}
              >
                <span>Launch Angle (θ) [◀ ▶]</span>
                <span style={{ color: 'var(--color-corner-a)' }}>{angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                disabled={isSimulating}
                onChange={(e) => setAngle(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-corner-a)' }}
              />
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontWeight: '600',
                }}
              >
                <span>Launch Power (|v|) [▲ ▼]</span>
                <span style={{ color: 'var(--color-corner-c)' }}>
                  {power} Speed
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={power}
                disabled={isSimulating}
                onChange={(e) => setPower(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-corner-c)' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleLaunch}
                disabled={isSimulating}
              >
                <Play size={18} />
                <span>Launch! [Space]</span>
              </button>

              <button
                className="btn-icon"
                onClick={() => handleNewLevel()}
                title="Generate Random Planet System"
              >
                <RotateCcw size={18} />
                <span>New Orbit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Projectile Telemetry HUD */}
        <div className="side-card">
          <div className="card-title">
            <Activity size={20} color="#4ade80" />
            <span>Live Projectile Telemetry</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="sum-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Speed (|v|)</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#4ade80' }}>
                {currentSpeed} px/s
              </div>
            </div>

            <div className="sum-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Target Distance</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#38bdf8' }}>
                {targetDist} px
              </div>
            </div>

            <div className="sum-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Flight Path Points</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fbbf24' }}>
                {trail.length} pts
              </div>
            </div>

            <div className="sum-card" style={{ padding: '12px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Travel Heading</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#ff5e7e' }}>
                {currentHeading}°
              </div>
            </div>
          </div>
        </div>

        {/* Physics & Overlay Controls */}
        <div className="side-card">
          <div className="card-title">
            <Sliders size={20} color="var(--color-accent-purple)" />
            <span>Universe & Overlay Toggles</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Visual Overlay Toggles */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={showGravityGradients}
                  onChange={(e) => setShowGravityGradients(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#8b5cf6' }}
                />
                <span>Show Planet Gravity Field Gradients 🌈</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={showGravityVectors}
                  onChange={(e) => setShowGravityVectors(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#38bdf8' }}
                />
                <span>Show Net Gravity Force Pull Vector (Fg) 🧲</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.85rem',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={autoNextOnTarget}
                  onChange={(e) => setAutoNextOnTarget(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                <span>Auto-generate new planets on Target Hit 🎯</span>
              </label>
            </div>

            {/* Planet Count */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                }}
              >
                <span>Planet Count</span>
                <span style={{ color: '#c7d2fe' }}>
                  {planetCount === 'auto' ? 'Random (2-3)' : `${planetCount} Planets`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['auto', 1, 2, 3, 4, 5].map((cnt) => (
                  <button
                    key={cnt}
                    className={`preset-btn ${planetCount === cnt ? 'active' : ''}`}
                    style={{ flex: 1, padding: '6px 4px', fontSize: '0.78rem' }}
                    onClick={() => {
                      setPlanetCount(cnt);
                      handleNewLevel({ planetCount: cnt, massMult });
                    }}
                  >
                    {cnt === 'auto' ? 'Auto' : `${cnt}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Gravity Strength G */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                }}
              >
                <span>Gravity Constant (G)</span>
                <span style={{ color: '#38bdf8' }}>{gravityG}</span>
              </div>
              <input
                type="range"
                min="100"
                max="1000"
                step="50"
                value={gravityG}
                onChange={(e) => setGravityG(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
