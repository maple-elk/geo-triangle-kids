import React from 'react';
import { classifyByAngles, classifyBySides } from '../utils/geometry';

export default function AngleStatsPanel({ angles, sides }) {
  const { angleA, angleB, angleC } = angles;
  const { a, b, c } = sides;

  const angleClass = classifyByAngles(angleA, angleB, angleC);
  const sideClass = classifyBySides(a, b, c);

  // Percentages for the 180 degree sum bar
  const pctA = (angleA / 180) * 100;
  const pctB = (angleB / 180) * 100;
  const pctC = (angleC / 180) * 100;

  const totalSum = Math.round((angleA + angleB + angleC) * 10) / 10;

  return (
    <div className="side-card">
      <div className="card-title">
        <span>📊</span>
        <span>Angle Calculations & Stats</span>
      </div>

      {/* Angle Badges */}
      <div className="angles-grid">
        <div className="angle-badge corner-a">
          <div className="angle-label" style={{ color: 'var(--color-corner-a)' }}>
            Corner A
          </div>
          <div className="angle-val">{angleA}°</div>
        </div>

        <div className="angle-badge corner-b">
          <div className="angle-label" style={{ color: 'var(--color-corner-b)' }}>
            Corner B
          </div>
          <div className="angle-val">{angleB}°</div>
        </div>

        <div className="angle-badge corner-c">
          <div className="angle-label" style={{ color: 'var(--color-corner-c)' }}>
            Corner C
          </div>
          <div className="angle-val">{angleC}°</div>
        </div>
      </div>

      {/* 180 Degree Sum Proof Bar */}
      <div className="sum-card">
        <div className="sum-header">
          <span>Angle Sum Equation</span>
          <span style={{ color: '#38bdf8', fontWeight: '700' }}>
            {angleA}° + {angleB}° + {angleC}° = {totalSum}°
          </span>
        </div>

        <div className="sum-bar-container">
          <div
            className="sum-bar-segment"
            style={{ width: `${pctA}%`, background: 'var(--color-corner-a)' }}
            title={`Corner A: ${angleA}°`}
          />
          <div
            className="sum-bar-segment"
            style={{ width: `${pctB}%`, background: 'var(--color-corner-b)' }}
            title={`Corner B: ${angleB}°`}
          />
          <div
            className="sum-bar-segment"
            style={{ width: `${pctC}%`, background: 'var(--color-corner-c)' }}
            title={`Corner C: ${angleC}°`}
          />
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
          ✨ Every triangle's internal angles ALWAYS add up to exactly 180°!
        </div>
      </div>

      {/* Triangle Classification */}
      <div className="classification-box">
        <div className="class-info">
          <div className="class-title">
            {angleClass.name} • {sideClass.name}
          </div>
          <div className="class-desc">{angleClass.description}</div>
        </div>
        <div className="class-icon">{angleClass.icon}</div>
      </div>
    </div>
  );
}
