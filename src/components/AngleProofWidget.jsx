import React from 'react';

export default function AngleProofWidget({ angles }) {
  const { angleA, angleB, angleC } = angles;

  // Render Semicircle visualizer where angles A, B, C span [0, 180] degrees
  const radA = (angleA * Math.PI) / 180;
  const radB = (angleB * Math.PI) / 180;
  const radC = (angleC * Math.PI) / 180;

  const R = 80;
  const CX = 140;
  const CY = 100;

  // Arc 1 (Corner A): from angle 0 to radA (Note SVG angles: 0 is right, counterclockwise/clockwise)
  // Let's sweep from 180 deg (left) to 0 deg (right)
  // Start at 180 deg: x = CX - R, y = CY
  // A ends at 180 - angleA
  const angleA_end = Math.PI - radA;
  const ax = CX + R * Math.cos(angleA_end);
  const ay = CY - R * Math.sin(angleA_end);

  // B ends at angleA_end - radB
  const angleB_end = angleA_end - radB;
  const bx = CX + R * Math.cos(angleB_end);
  const by = CY - R * Math.sin(angleB_end);

  // C ends at 0 deg: x = CX + R, y = CY

  const pathA = `M ${CX} ${CY} L ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${ax} ${ay} Z`;
  const pathB = `M ${CX} ${CY} L ${ax} ${ay} A ${R} ${R} 0 0 1 ${bx} ${by} Z`;
  const pathC = `M ${CX} ${CY} L ${bx} ${by} A ${R} ${R} 0 0 1 ${CX + R} ${CY} Z`;

  return (
    <div className="side-card">
      <div className="card-title">
        <span>🌈</span>
        <span>Straight Line Proof (180°)</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <svg width="280" height="120" viewBox="0 0 280 120">
          {/* Baseline (Straight line 180 deg) */}
          <line
            x1="20"
            y1="100"
            x2="260"
            y2="100"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
            strokeDasharray="4 4"
          />

          {/* Angle Slices */}
          <path fill="var(--color-corner-a)" opacity="0.85" d={pathA} />
          <path fill="var(--color-corner-b)" opacity="0.85" d={pathB} />
          <path fill="var(--color-corner-c)" opacity="0.85" d={pathC} />

          {/* Semicircle Outline */}
          <path
            d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.4)"
            strokeWidth="2"
          />

          {/* Labels */}
          <text x={CX - R - 15} y={CY + 15} fill="var(--color-text-muted)" fontSize="11" fontWeight="600">
            0°
          </text>
          <text x={CX + R + 5} y={CY + 15} fill="var(--color-text-muted)" fontSize="11" fontWeight="600">
            180°
          </text>
        </svg>

        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          Notice how Corners A, B, and C fit together to form a perfect flat 180° line!
        </p>
      </div>
    </div>
  );
}
