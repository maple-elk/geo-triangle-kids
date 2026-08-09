import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Navbar from './components/Navbar';
import TriangleCanvas from './components/TriangleCanvas';
import AngleStatsPanel from './components/AngleStatsPanel';
import AngleProofWidget from './components/AngleProofWidget';
import PresetToolbar from './components/PresetToolbar';
import ChallengeMode from './components/ChallengeMode';
import SlingshotLauncherCard from './components/SlingshotLauncherCard';
import KidsGuideModal from './components/KidsGuideModal';
import { getTriangleAngles, getSideLengths, getPresets } from './utils/geometry';
import { playPopSound, playSnapSound } from './utils/audio';

// Parse URL hash or query params for deep linking
function getTabFromUrl() {
  if (typeof window === 'undefined') return 'triangle';
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();

  if (
    hash.includes('gravity') ||
    hash.includes('space') ||
    hash.includes('slingshot') ||
    search.includes('gravity')
  ) {
    return 'gravity';
  }
  return 'triangle';
}

export default function App() {
  const [activeTab, setActiveTab] = useState(() => getTabFromUrl());

  const initialPresets = useMemo(() => getPresets(), []);
  const [points, setPoints] = useState(initialPresets[0].points); // Default to Equilateral
  const [activePreset, setActivePreset] = useState('equilateral');

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [snapGrid, setSnapGrid] = useState(false);
  const [showSideLengths, setShowSideLengths] = useState(true);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fullscreen API toggle handler
  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // Listen to native browser fullscreen change events (e.g. user hits ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Sync state with URL hash changes (deep links & browser Back/Forward buttons)
  useEffect(() => {
    const handleUrlChange = () => {
      const tab = getTabFromUrl();
      setActiveTab(tab);
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  // Change tab and update URL hash for shareable deep links
  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      playSnapSound(soundEnabled);
      window.location.hash = tab === 'gravity' ? '#gravity' : '#triangle';
    },
    [soundEnabled]
  );

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
    setActivePreset(null);
    playPopSound(soundEnabled);
  };

  const handleSelectPreset = (preset) => {
    setPoints(preset.points);
    setActivePreset(preset.id);
    playSnapSound(soundEnabled);
  };

  return (
    <div className={`app-container ${isFullscreen ? 'is-fullscreen' : ''}`}>
      {/* Header Bar with Module Tabs */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={handleTabChange}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        snapGrid={snapGrid}
        onToggleSnapGrid={() => {
          setSnapGrid((v) => !v);
          playSnapSound(soundEnabled);
        }}
        showSideLengths={showSideLengths}
        onToggleSideLengths={() => setShowSideLengths((v) => !v)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onOpenHelp={() => setShowHelpModal(true)}
      />

      {/* Module 1: Triangle Geometry Explorer */}
      {activeTab === 'triangle' && (
        <main className="main-layout">
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

          <div className="sidebar-column">
            <AngleStatsPanel angles={angles} sides={sides} />
            <AngleProofWidget angles={angles} />
            <PresetToolbar
              activePreset={activePreset}
              onSelectPreset={handleSelectPreset}
            />
          </div>
        </main>
      )}

      {/* Module 2: Space Gravity Slingshot Launcher */}
      {activeTab === 'gravity' && (
        <main style={{ flex: 1 }}>
          <SlingshotLauncherCard />
        </main>
      )}

      {/* Help Modal */}
      <KidsGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}
