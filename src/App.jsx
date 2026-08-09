import React, { useState, useMemo } from 'react';
import Navbar from './components/Navbar';
import TriangleCanvas from './components/TriangleCanvas';
import AngleStatsPanel from './components/AngleStatsPanel';
import AngleProofWidget from './components/AngleProofWidget';
import PresetToolbar from './components/PresetToolbar';
import ChallengeMode from './components/ChallengeMode';
import KidsGuideModal from './components/KidsGuideModal';
import { getTriangleAngles, getSideLengths, getPresets } from './utils/geometry';
import { playPopSound, playSnapSound } from './utils/audio';

export default function App() {
  const initialPresets = useMemo(() => getPresets(), []);
  const [points, setPoints] = useState(initialPresets[0].points); // Default to Equilateral
  const [activePreset, setActivePreset] = useState('equilateral');

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snapGrid, setSnapGrid] = useState(false);
  const [showSideLengths, setShowSideLengths] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Compute angles & sides on every point update
  const angles = useMemo(() => {
    return getTriangleAngles(points.A, points.B, points.C);
  }, [points]);

  const sides = useMemo(() => {
    return getSideLengths(points.A, points.B, points.C);
  }, [points]);

  const handlePointChange = (handleKey, newPos) => {
    setPoints((prev) => ({
      ...prev,
      [handleKey]: newPos,
    }));
    setActivePreset(null); // Custom positioning
    playPopSound(soundEnabled);
  };

  const handleSelectPreset = (preset) => {
    setPoints(preset.points);
    setActivePreset(preset.id);
    playSnapSound(soundEnabled);
  };

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Navbar
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        snapGrid={snapGrid}
        onToggleSnapGrid={() => {
          setSnapGrid((v) => !v);
          playSnapSound(soundEnabled);
        }}
        showSideLengths={showSideLengths}
        onToggleSideLengths={() => setShowSideLengths((v) => !v)}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Main Grid Workspace */}
      <main className="main-layout">
        {/* Left Column: Interactive Canvas & Challenges */}
        <div className="workspace-column">
          <TriangleCanvas
            points={points}
            angles={angles}
            sides={sides}
            onPointChange={handlePointChange}
            showGrid={true}
            showSideLengths={showSideLengths}
            showAngleArcs={true}
            snapGrid={snapGrid}
            soundEnabled={soundEnabled}
          />

          <ChallengeMode angles={angles} soundEnabled={soundEnabled} />
        </div>

        {/* Right Column: Angle HUD, 180° Proof, Presets */}
        <div className="sidebar-column">
          <AngleStatsPanel angles={angles} sides={sides} />
          <AngleProofWidget angles={angles} />
          <PresetToolbar
            activePreset={activePreset}
            onSelectPreset={handleSelectPreset}
          />
        </div>
      </main>

      {/* Help Modal */}
      <KidsGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
