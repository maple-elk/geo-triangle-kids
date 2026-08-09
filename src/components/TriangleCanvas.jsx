import React, { useRef, useState } from 'react';
import {
  getAngleArcPath,
  getAngleLabelPosition,
  snapToGrid,
} from '../utils/geometry';

export default function TriangleCanvas({
  points,
  angles,
  sides,
  onPointChange,
  showGrid = true,
  showSideLengths = true,
  showAngleArcs = true,
  snapGrid = false,
  soundEnabled = true,
  onDragStart,
  onDragEnd,
}) {
  const svgRef = useRef(null);
  const [activeHandle, setActiveHandle] = useState(null);

  // Convert client pointer event (mouse/touch) to SVG coordinates
  const getSVGCoordinates = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
    
    // Clamp to canvas padding bounds (padding = 24px)
    const clampedX = Math.max(30, Math.min(730, transformed.x));
    const clampedY = Math.max(30, Math.min(450, transformed.y));

    return { x: clampedX, y: clampedY };
  };

  const handlePointerDown = (handleKey) => (e) => {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    setActiveHandle(handleKey);
    if (onDragStart) onDragStart(handleKey);
  };

  const handlePointerMove = (e) => {
    if (!activeHandle) return;
    e.preventDefault();
    let coords = getSVGCoordinates(e);
    if (snapGrid) {
      coords = snapToGrid(coords, 20);
    }
    onPointChange(activeHandle, coords);
  };

  const handlePointerUp = (e) => {
    if (activeHandle) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch (err) {}
      setActiveHandle(null);
      if (onDragEnd) onDragEnd();
    }
  };

  const { A, B, C } = points;

  // Arc paths
  const arcA = getAngleArcPath(A, B, C, 40);
  const arcB = getAngleArcPath(B, A, C, 40);
  const arcC = getAngleArcPath(C, A, B, 40);

  // Label offsets
  const labelPosA = getAngleLabelPosition(A, B, C, 64);
  const labelPosB = getAngleLabelPosition(B, A, C, 64);
  const labelPosC = getAngleLabelPosition(C, A, B, 64);

  // Side length midpoint label positions
  const midAB = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
  const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
  const midCA = { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 };

  return (
    <div className="canvas-card">
      <div className="canvas-header">
        <div className="canvas-title-group">
          <span className="canvas-title">Interactive Geometry Canvas</span>
        </div>
        <div className="help-tip">
          <span>👇 Drag any colored corner handle to reshape the triangle!</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="svg-viewport"
        viewBox="0 0 760 480"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <defs>
          {/* Background Grid Pattern */}
          <pattern
            id="gridPattern"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          </pattern>

          {/* Glow Filters */}
          <filter id="glowA" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowB" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowC" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Optional Grid Backdrop */}
        {showGrid && <rect width="760" height="480" fill="url(#gridPattern)" />}

        {/* Triangle Filled Polygon */}
        <polygon
          points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`}
          fill="rgba(99, 102, 241, 0.12)"
          stroke="rgba(199, 210, 254, 0.7)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Angle Arcs */}
        {showAngleArcs && (
          <g className="angle-arcs">
            <path
              d={arcA}
              fill="rgba(255, 94, 126, 0.25)"
              stroke="var(--color-corner-a)"
              strokeWidth="3"
            />
            <path
              d={arcB}
              fill="rgba(16, 185, 129, 0.25)"
              stroke="var(--color-corner-b)"
              strokeWidth="3"
            />
            <path
              d={arcC}
              fill="rgba(6, 182, 212, 0.25)"
              stroke="var(--color-corner-c)"
              strokeWidth="3"
            />
          </g>
        )}

        {/* Corner Angle Degree Floating Labels */}
        <g className="angle-labels" style={{ pointerEvents: 'none' }}>
          <g transform={`translate(${labelPosA.x}, ${labelPosA.y})`}>
            <rect
              x="-28"
              y="-14"
              width="56"
              height="28"
              rx="8"
              fill="var(--color-corner-a)"
              opacity="0.95"
            />
            <text
              textAnchor="middle"
              dy="5"
              fill="#ffffff"
              fontSize="13"
              fontWeight="700"
              fontFamily="Fredoka"
            >
              {angles.angleA}°
            </text>
          </g>

          <g transform={`translate(${labelPosB.x}, ${labelPosB.y})`}>
            <rect
              x="-28"
              y="-14"
              width="56"
              height="28"
              rx="8"
              fill="var(--color-corner-b)"
              opacity="0.95"
            />
            <text
              textAnchor="middle"
              dy="5"
              fill="#ffffff"
              fontSize="13"
              fontWeight="700"
              fontFamily="Fredoka"
            >
              {angles.angleB}°
            </text>
          </g>

          <g transform={`translate(${labelPosC.x}, ${labelPosC.y})`}>
            <rect
              x="-28"
              y="-14"
              width="56"
              height="28"
              rx="8"
              fill="var(--color-corner-c)"
              opacity="0.95"
            />
            <text
              textAnchor="middle"
              dy="5"
              fill="#ffffff"
              fontSize="13"
              fontWeight="700"
              fontFamily="Fredoka"
            >
              {angles.angleC}°
            </text>
          </g>
        </g>

        {/* Side Length Measurements */}
        {showSideLengths && (
          <g className="side-labels" style={{ pointerEvents: 'none' }}>
            <g transform={`translate(${midAB.x}, ${midAB.y})`}>
              <rect
                x="-30"
                y="-12"
                width="60"
                height="24"
                rx="6"
                fill="rgba(15, 23, 42, 0.85)"
                stroke="rgba(255, 255, 255, 0.2)"
              />
              <text
                textAnchor="middle"
                dy="4"
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="600"
              >
                c = {sides.c}px
              </text>
            </g>

            <g transform={`translate(${midBC.x}, ${midBC.y})`}>
              <rect
                x="-30"
                y="-12"
                width="60"
                height="24"
                rx="6"
                fill="rgba(15, 23, 42, 0.85)"
                stroke="rgba(255, 255, 255, 0.2)"
              />
              <text
                textAnchor="middle"
                dy="4"
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="600"
              >
                a = {sides.a}px
              </text>
            </g>

            <g transform={`translate(${midCA.x}, ${midCA.y})`}>
              <rect
                x="-30"
                y="-12"
                width="60"
                height="24"
                rx="6"
                fill="rgba(15, 23, 42, 0.85)"
                stroke="rgba(255, 255, 255, 0.2)"
              />
              <text
                textAnchor="middle"
                dy="4"
                fill="#cbd5e1"
                fontSize="11"
                fontWeight="600"
              >
                b = {sides.b}px
              </text>
            </g>
          </g>
        )}

        {/* Draggable Vertex Corner Handles */}

        {/* Corner A */}
        <g
          className={`vertex-handle ${activeHandle === 'A' ? 'dragging' : ''}`}
          onPointerDown={handlePointerDown('A')}
        >
          <circle
            cx={A.x}
            cy={A.y}
            r="28"
            fill="var(--color-corner-a-glow)"
            className="handle-pulse"
          />
          <circle
            cx={A.x}
            cy={A.y}
            r="16"
            fill="var(--color-corner-a)"
            stroke="#ffffff"
            strokeWidth="3.5"
            filter="url(#glowA)"
          />
          <text
            x={A.x}
            y={A.y}
            textAnchor="middle"
            dy="5"
            fill="#ffffff"
            fontSize="14"
            fontWeight="800"
            fontFamily="Fredoka"
            style={{ pointerEvents: 'none' }}
          >
            A
          </text>
        </g>

        {/* Corner B */}
        <g
          className={`vertex-handle ${activeHandle === 'B' ? 'dragging' : ''}`}
          onPointerDown={handlePointerDown('B')}
        >
          <circle
            cx={B.x}
            cy={B.y}
            r="28"
            fill="var(--color-corner-b-glow)"
            className="handle-pulse"
          />
          <circle
            cx={B.x}
            cy={B.y}
            r="16"
            fill="var(--color-corner-b)"
            stroke="#ffffff"
            strokeWidth="3.5"
            filter="url(#glowB)"
          />
          <text
            x={B.x}
            y={B.y}
            textAnchor="middle"
            dy="5"
            fill="#ffffff"
            fontSize="14"
            fontWeight="800"
            fontFamily="Fredoka"
            style={{ pointerEvents: 'none' }}
          >
            B
          </text>
        </g>

        {/* Corner C */}
        <g
          className={`vertex-handle ${activeHandle === 'C' ? 'dragging' : ''}`}
          onPointerDown={handlePointerDown('C')}
        >
          <circle
            cx={C.x}
            cy={C.y}
            r="28"
            fill="var(--color-corner-c-glow)"
            className="handle-pulse"
          />
          <circle
            cx={C.x}
            cy={C.y}
            r="16"
            fill="var(--color-corner-c)"
            stroke="#ffffff"
            strokeWidth="3.5"
            filter="url(#glowC)"
          />
          <text
            x={C.x}
            y={C.y}
            textAnchor="middle"
            dy="5"
            fill="#ffffff"
            fontSize="14"
            fontWeight="800"
            fontFamily="Fredoka"
            style={{ pointerEvents: 'none' }}
          >
            C
          </text>
        </g>
      </svg>
    </div>
  );
}
