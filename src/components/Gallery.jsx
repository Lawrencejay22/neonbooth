import React from 'react';

const Gallery = ({ photos, onRemove, onClearAll, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()}>
      <div className="modal-head">
        <h2>Your Shots <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem', fontWeight: 500 }}>({photos.length})</span></h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {photos.length > 0 && (
            <button className="btn btn-red btn-sm" onClick={onClearAll}>Clear all</button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="empty-gallery">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎞️</div>
          <p>No shots yet. Hit the camera and capture some memories!</p>
        </div>
      ) : (
        <div className="gallery-grid">
          {photos.map((photo, i) => (
            <div key={i} className="gallery-item">
              <img src={photo} alt={`Shot ${i + 1}`} />
              <div className="gallery-item-bar">
                <a href={photo} download={`neon-booth-shot-${i + 1}.jpg`} className="btn btn-cyan btn-sm" style={{ flex: 1 }}>
                  ⬇ Save
                </a>
                <button className="btn btn-red btn-sm" onClick={() => onRemove(i)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

export default Gallery;
