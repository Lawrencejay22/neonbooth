import React from 'react';
import WebcamBooth from './WebcamBooth';
import { MAX_PHOTOS } from '../lib/options';

const CameraView = ({ onCapture, photos, onRemove, onNext, dualMode, setDualMode, autoMoving }) => (
  <div className="view-container">
    <h2 className="view-title">Capture your <span className="grad">moments</span></h2>
    <p className="view-sub">
      Works with your webcam, DSLR or mirrorless — connect it by USB and it appears in the camera list,
      or hit 🛜 Connect to pull a live stream from a Wi-Fi camera.
      Take up to {MAX_PHOTOS} shots — pick the best ones next.
    </p>

    {/* Single / Dual mode toggle */}
    <div className="mode-toggle" style={{ marginTop: 22 }}>
      <button className={!dualMode ? 'active' : ''} onClick={() => setDualMode(false)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        Single Cam
      </button>
      <button className={dualMode ? 'active' : ''} onClick={() => setDualMode(true)}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
        </svg>
        Dual Cam 💑
      </button>
    </div>

    <div className="stage-card glass-panel">
      <WebcamBooth onCapture={onCapture} dualMode={dualMode} setDualMode={setDualMode} />
    </div>

    {/* Captured slots */}
    <div className="photo-slots">
      {Array.from({ length: MAX_PHOTOS }).map((_, i) => {
        const photo = photos[i];
        return (
          <div key={i} className={`photo-slot ${photo ? 'filled' : ''}`}>
            {photo ? (
              <>
                <img src={photo} alt={`Shot ${i + 1}`} />
                <button className="slot-del" onClick={() => onRemove(i)} title="Delete shot">✕</button>
              </>
            ) : (
              <>
                <span className="slot-num">{i + 1}</span>
                <span className="slot-txt">EMPTY</span>
              </>
            )}
          </div>
        );
      })}
    </div>

    <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 12 }}>
      Every template holds all your shots — extras tile neatly inside the frames.
    </p>

    {autoMoving && (
      <div className="share-toast">✨ Layout full — moving your {photos.length} photo{photos.length > 1 ? 's' : ''} into the layout…</div>
    )}

    {photos.length > 0 && (
      <button className="btn btn-green btn-lg" style={{ marginTop: 28 }} onClick={onNext}>
        Continue with {photos.length} photo{photos.length > 1 ? 's' : ''} →
      </button>
    )}
  </div>
);

export default CameraView;
