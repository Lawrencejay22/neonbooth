import React, { useState } from 'react';
import HomeView from './components/HomeView';
import CameraView from './components/CameraView';
import LayoutView from './components/LayoutView';
import EditView from './components/EditView';
import FinalView from './components/FinalView';
import Gallery from './components/Gallery';
import { DEFAULT_EDIT } from './lib/options';

const STEPS = [
  { id: 'camera', label: 'Capture', num: 1 },
  { id: 'layout', label: 'Layout', num: 2 },
  { id: 'edit', label: 'Decorate', num: 3 },
  { id: 'final', label: 'Share', num: 4 },
];

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [photos, setPhotos] = useState([]);
  const [edit, setEdit] = useState(DEFAULT_EDIT);
  const [dualMode, setDualMode] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const goHome = () => setCurrentView('home');
  const goCamera = () => setCurrentView('camera');
  const goLayout = () => setCurrentView('layout');
  const goEdit = () => setCurrentView('edit');
  const goFinal = () => setCurrentView('final');

  const handleCapture = (photoDataUrl) => {
    setPhotos((prev) => (prev.length >= 6 ? prev : [...prev, photoDataUrl]));
  };
  const handleRemove = (index) => setPhotos((prev) => prev.filter((_, i) => i !== index));
  const handleClearAll = () => setPhotos([]);

  const handleSelectLayout = (layoutId) => {
    setEdit((prev) => ({ ...prev, layout: layoutId }));
    if (photos.length > 0) goEdit();
    else goCamera();
  };

  const handleStepClick = (stepId) => {
    if (stepId === 'camera') goCamera();
    else if (photos.length === 0) goCamera();
    else setCurrentView(stepId);
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView onStart={goCamera} onChooseLayout={goLayout} />;
      case 'camera':
        return (
          <CameraView
            onCapture={handleCapture}
            photos={photos}
            onRemove={handleRemove}
            onNext={goLayout}
            dualMode={dualMode}
            setDualMode={setDualMode}
          />
        );
      case 'layout':
        return <LayoutView onSelectLayout={handleSelectLayout} currentLayout={edit.layout} />;
      case 'edit':
        return <EditView photos={photos} edit={edit} setEdit={setEdit} onSave={goFinal} onBack={goCamera} />;
      case 'final':
        return <FinalView photos={photos} edit={edit} onDone={goHome} onEdit={goEdit} />;
      default:
        return <HomeView onStart={goCamera} onChooseLayout={goLayout} />;
    }
  };

  return (
    <div className="app-wrapper">
      {/* Ambient background */}
      <div className="bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <header className="app-header">
        <div className="header-title" onClick={goHome}>
          <span className="logo-dot">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </span>
          Neon Booth
        </div>

        <nav className="header-nav">
          {STEPS.map((s) => (
            <span
              key={s.id}
              className={`nav-link ${currentView === s.id ? 'active' : ''}`}
              onClick={() => handleStepClick(s.id)}
            >
              <span className="nav-step-num">{s.num}</span>
              {s.label}
            </span>
          ))}
        </nav>

        <div className="header-actions">
          <button className="pill-btn" onClick={() => setShowGallery(true)}>
            🎞️ Gallery
            {photos.length > 0 && (
              <span style={{ background: 'var(--grad-btn)', borderRadius: 99, padding: '1px 8px', fontSize: '0.7rem' }}>
                {photos.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="main-content">{renderView()}</main>

      <footer className="app-footer">
        Made with 💜 in <b>Neon Booth</b> — capture · decorate · share with your people
      </footer>

      {showGallery && (
        <Gallery
          photos={photos}
          onRemove={handleRemove}
          onClearAll={handleClearAll}
          onClose={() => setShowGallery(false)}
        />
      )}
    </div>
  );
}

export default App;
