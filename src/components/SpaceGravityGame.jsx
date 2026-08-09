import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  generateRandomLevel,
  updateProjectilePhysics,
  checkCollisions,
} from '../utils/physics';
import { playPopSound, playSnapSound, playVictorySound } from '../utils/audio';
import { Play, RotateCcw, Compass, Zap } from 'lucide-react';

export default function SpaceGravityGame({ soundEnabled }) {
  const svgRef = useRef(null);
  const [level, setLevel] = useState(() => generateRandomLevel(760, 480));
  const [angle, setAngle] = useState(335); // Degrees (0 to 360)
  const [power, setPower] = useState(55); // Magnitude (10 to 100)

  const [isDraggingAim, setIsDraggingAim] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [projectilePos, setProjectilePos] = useState(null);
  const [trail, setTrail] = useState([]);
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle' | 'flying' | 'hit_target' | 'hit_planet' | 'out'
  const [score, setScore] = useState(0);

  const animRef = useRef(null);
  const velRef = useRef({ x: 0, y: 0 });
  const posRef = useRef({ x: 0, y: 0 });

  const { ship, target, planets } = level;

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
    // Map distance (20px to 180px) to power range (10 to 100)
    const newPower = Math.max(10, Math.min(100, Math.round(dist / 1.7)));

    setAngle(deg);
    setPower(newPower);
    playPopSound(soundEnabled);
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

  // Generate new level
  const handleNewLevel = useCallback(() => {
    setLevel(generateRandomLevel(760, 480));
    setIsSimulating(false);
    setProjectilePos(null);
    setTrail([]);
    setGameStatus('idle');
    playSnapSound(soundEnabled);
  }, [soundEnabled]);

  // Launch projectile
  const handleLaunch = () => {
    if (isSimulating) return;

    playPopSound(soundEnabled);

    const rad = (angle * Math.PI) / 180;
    // Tuned speed for pleasant, readable travel
    const initialVel = {
      x: (power / 4.8) * Math.cos(rad),
      y: (power / 4.8) * Math.sin(rad),
    };

    posRef.current = { x: ship.x, y: ship.y };
    velRef.current = initialVel;

    setProjectilePos({ x: ship.x, y: ship.y });
    setTrail([{ x: ship.x, y: ship.y }]);
    setIsSimulating(true);
    setGameStatus('flying');
  };

  // Physics Loop
  useEffect(() => {
    if (!isSimulating) return;

    let localTrail = [{ x: posRef.current.x, y: posRef.current.y }];

    const loop = () => {
      const result = updateProjectilePhysics(
        posRef.current,
        velRef.current,
        planets,
        0.016
      );

      posRef.current = result.pos;
      velRef.current = result.vel;

      setProjectilePos(result.pos);

      localTrail.push({ x: result.pos.x, y: result.pos.y });
      if (localTrail.length > 120) localTrail.shift();
      setTrail([...localTrail]);

      const collision = checkCollisions(result.pos, target, planets, 760, 480);

      if (collision === 'target') {
        setIsSimulating(false);
        setGameStatus('hit_target');
        setScore((s) => s + 100);
        playVictorySound(soundEnabled);
        try {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
        return;
      }

      if (collision === 'planet') {
        setIsSimulating(false);
        setGameStatus('hit_planet');
        playSnapSound(soundEnabled);
        return;
      }

      if (collision === 'out_of_bounds') {
        setIsSimulating(false);
        setGameStatus('out');
        return;
      }

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSimulating, planets, target, soundEnabled]);

  // Aiming vector end point in SVG
  const rad = (angle * Math.PI) / 180;
  const aimLength = power * 1.7;
  const aimVectorEnd = {
    x: ship.x + aimLength * Math.cos(rad),
    y: ship.y + aimLength * Math.sin(rad),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Canvas Card */}
      <div className="canvas-card">
        <div className="canvas-header">
          <div className="canvas-title-group">
            <span style={{ fontSize: '1.4rem' }}>🚀</span>
            <span className="canvas-title">Gravity Slingshot Launcher</span>
          </div>
          <div className="help-tip">
            <span>👇 Click & drag directly on the spaceship or vector handle to aim!</span>
          </div>
        </div>

        <svg
          ref={svgRef}
          className="svg-viewport"
          viewBox="0 0 760 480"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ touchAction: 'none' }}
        >
          <defs>
            <radialGradient id="spaceBg" cx="50%" cy="50%" r="75%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

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
          <rect width="760" height="480" fill="url(#spaceBg)" />

          {/* Planets with Gravity Fields */}
          {planets.map((planet) => (
            <g key={planet.id}>
              {/* Gravity Well Field Ring */}
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

              {/* Planet Body */}
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

              {/* Mass Label */}
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
              {/* Slingshot Vector Arrow */}
              <line
                x1={ship.x}
                y1={ship.y}
                x2={aimVectorEnd.x}
                y2={aimVectorEnd.y}
                stroke="#fbbf24"
                strokeWidth="3.5"
                strokeDasharray="6 4"
              />

              {/* Interactive Handle Ring */}
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

          {/* Spaceship Handle (Also Draggable!) */}
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

          {/* Projectile Trail Line */}
          {trail.length > 1 && (
            <polyline
              points={trail.map((p) => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.85"
            />
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
        </svg>
      </div>

      {/* Control Panel Grid */}
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
            <span>Launch Controls (Angle & Power)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Angle Slider */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontWeight: '600',
                }}
              >
                <span>Launch Angle (θ)</span>
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

            {/* Power Magnitude Slider */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                  fontWeight: '600',
                }}
              >
                <span>Launch Power (|v|)</span>
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

            {/* Launch & Reset Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={handleLaunch}
                disabled={isSimulating}
              >
                <Play size={18} />
                <span>Launch!</span>
              </button>

              <button
                className="btn-icon"
                onClick={handleNewLevel}
                title="Generate Random Planet System"
              >
                <RotateCcw size={18} />
                <span>New Orbit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Physics & Game Status Panel */}
        <div className="side-card">
          <div className="card-title">
            <Zap size={20} color="#38bdf8" />
            <span>Gravitational Slingshot Status</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'rgba(15, 23, 42, 0.7)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span>Total Score</span>
              <span
                style={{
                  fontFamily: 'Fredoka',
                  fontSize: '1.4rem',
                  color: 'var(--color-accent-gold)',
                }}
              >
                {score} pts
              </span>
            </div>

            {gameStatus === 'hit_target' && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  color: '#4ade80',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: '700',
                }}
              >
                🎯 PERFECT ORBIT HIT! Target Reached!
              </div>
            )}

            {gameStatus === 'hit_planet' && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#fca5a5',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                💥 Crashed into Planet Gravity Field! Adjust angle & launch power!
              </div>
            )}

            {gameStatus === 'out' && (
              <div
                style={{
                  background: 'rgba(245, 158, 11, 0.2)',
                  border: '1px solid #f59e0b',
                  color: '#fef08a',
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: '600',
                }}
              >
                🌌 Flew out of solar system! Decrease power or aim closer!
              </div>
            )}

            <div
              style={{
                fontSize: '0.82rem',
                color: 'var(--color-text-muted)',
                lineHeight: '1.4',
              }}
            >
              💡 <strong>Mouse Controls:</strong> Click & drag directly on the yellow aim handle knob or spaceship to rotate angle and stretch launch power!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
