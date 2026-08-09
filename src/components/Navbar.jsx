import React from 'react';
import { Volume2, VolumeX, Grid, Ruler, HelpCircle, Maximize, Minimize } from 'lucide-react';

export default function Navbar({
  activeTab,
  onChangeTab,
  soundEnabled,
  onToggleSound,
  snapGrid,
  onToggleSnapGrid,
  showSideLengths,
  onToggleSideLengths,
  isFullscreen,
  onToggleFullscreen,
  onOpenHelp,
}) {
  return (
    <header className="navbar">
      <div className="brand">
        <div className="brand-logo">Math</div>
        <div>
          <div className="brand-title">GeoMath Explorer</div>
          <div className="brand-subtitle">Interactive Geometry & Physics Playground</div>
        </div>
      </div>

      {/* Module Tabs */}
      <div style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button
          className={`btn-icon ${activeTab === 'triangle' ? 'active' : ''}`}
          onClick={() => onChangeTab('triangle')}
        >
          <span>🔺 Triangle Geometry</span>
        </button>
        <button
          className={`btn-icon ${activeTab === 'gravity' ? 'active' : ''}`}
          onClick={() => onChangeTab('gravity')}
        >
          <span>🚀 Gravity Slingshot</span>
        </button>
      </div>

      <div className="nav-controls">
        {activeTab === 'triangle' && (
          <>
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
          </>
        )}

        <button
          className={`btn-icon ${isFullscreen ? 'active' : ''}`}
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen Mode' : 'Enter Single-Screen Fullscreen Mode'}
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
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
