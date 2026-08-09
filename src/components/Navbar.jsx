import React from 'react';
import { Volume2, VolumeX, Grid, Ruler, HelpCircle } from 'lucide-react';

export default function Navbar({
  soundEnabled,
  onToggleSound,
  snapGrid,
  onToggleSnapGrid,
  showSideLengths,
  onToggleSideLengths,
  onOpenHelp,
}) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-logo">🔺</div>
        <div>
          <div className="brand-title">GeoTriangle Kids</div>
          <div className="brand-subtitle">Interactive Geometry & Angle Explorer</div>
        </div>
      </div>

      <div className="nav-controls">
        <button
          className={`btn-icon ${snapGrid ? 'active' : ''}`}
          onClick={onToggleSnapGrid}
          title="Toggle Grid Snapping"
        >
          <Grid size={18} />
          <span>{snapGrid ? 'Grid Snap: ON' : 'Grid Snap'}</span>
        </button>

        <button
          className={`btn-icon ${showSideLengths ? 'active' : ''}`}
          onClick={onToggleSideLengths}
          title="Toggle Side Length Display"
        >
          <Ruler size={18} />
          <span>{showSideLengths ? 'Lengths: ON' : 'Lengths'}</span>
        </button>

        <button
          className={`btn-icon ${soundEnabled ? 'active' : ''}`}
          onClick={onToggleSound}
          title="Toggle Sound Effects"
        >
          {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{soundEnabled ? 'Audio: ON' : 'Mute'}</span>
        </button>

        <button className="btn-icon" onClick={onOpenHelp} title="Geometry Help & Guide">
          <HelpCircle size={18} />
          <span>Guide</span>
        </button>
      </div>
    </header>
  );
}
