import React from 'react';
import { getPresets } from '../utils/geometry';

export default function PresetToolbar({ activePreset, onSelectPreset }) {
  const presets = getPresets();

  return (
    <div className="side-card">
      <div className="card-title">
        <span>⚡</span>
        <span>Quick Triangle Presets</span>
      </div>

      <div className="presets-grid">
        {presets.map((preset) => {
          const isActive = activePreset === preset.id;
          return (
            <button
              key={preset.id}
              className={`preset-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPreset(preset)}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-name">{preset.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
