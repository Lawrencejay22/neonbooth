import React, { useRef, useState } from 'react';
import { LAYOUTS, LAYOUT_CATEGORIES, MAX_PHOTOS } from '../lib/options';

// Renders a mini schematic preview of each layout
const LayoutMini = ({ layout }) => {
  const { canvas, rects, groups } = layout;
  const ar = canvas.w / canvas.h;
  const w = ar >= 1 ? 110 : Math.max(52, 110 * ar);
  const h = ar >= 1 ? Math.max(52, 110 / ar) : 110;
  return (
    <div
      className={`layout-mini ${groups ? 'layout-mini-strips' : ''}`}
      style={{ width: w + 12, height: h + 12, position: 'relative', display: 'block' }}
    >
      {groups
        ? groups.map((g, gi) => (
            <div
              key={gi}
              className="layout-mini-strip"
              style={{
                position: 'absolute',
                left: `${g.x * 100}%`, top: `${g.y * 100}%`,
                width: `${g.w * 100}%`, height: `${g.h * 100}%`,
                transform: g.rot ? `rotate(${g.rot}deg)` : undefined,
              }}
            >
              {g.header && <div className="mbh" />}
              {g.frames.map((f, i) => (
                <div
                  key={i}
                  className="mb"
                  style={{
                    position: 'absolute',
                    left: `${f.x * 100}%`, top: `${f.y * 100}%`,
                    width: `${f.w * 100}%`, height: `${f.h * 100}%`,
                  }}
                />
              ))}
            </div>
          ))
        : rects.map((r, i) => (
            <div
              key={i}
              className="mb"
              style={{
                position: 'absolute',
                left: `${r.x * 100}%`, top: `${r.y * 100}%`,
                width: `${r.w * 100}%`, height: `${r.h * 100}%`,
              }}
            />
          ))}
    </div>
  );
};

const LayoutView = ({ onSelectLayout, currentLayout, onImport, photosCount }) => {
  const fileRef = useRef(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const readFile = (file) =>
    new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(file);
    });

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (files.length === 0) return;

    const room = Math.max(0, MAX_PHOTOS - photosCount);
    if (room === 0) {
      showToast(`🎞️ Gallery is full (${MAX_PHOTOS} max) — remove shots first`);
      return;
    }

    try {
      const urls = await Promise.all(files.map(readFile));
      onImport(urls);
      const added = Math.min(room, urls.length);
      showToast(`✅ ${added} photo${added > 1 ? 's' : ''} imported — now pick a template!`);
    } catch {
      showToast('⚠️ Could not read those files');
    }
  };

  return (
    <div className="view-container">
      <h2 className="view-title">Pick your <span className="grad">template</span></h2>
      <p className="view-sub">
        {Object.keys(LAYOUTS).length} templates in {LAYOUT_CATEGORIES.length} collections — switch later in the editor without losing anything.
      </p>

      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-cyan" onClick={() => fileRef.current?.click()}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Import Photos
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFiles}
        />
        {photosCount > 0 && (
          <span className="hero-badge" style={{ marginBottom: 0 }}>
            <span className="dot" /> {photosCount} photo{photosCount > 1 ? 's' : ''} ready
          </span>
        )}
      </div>

      <div className="layout-grid">
        {LAYOUT_CATEGORIES.flatMap((cat) => {
          const items = Object.values(LAYOUTS).filter((l) => l.cat === cat.id);
          if (items.length === 0) return [];
          return [
            <div key={cat.id} className="layout-cat-row">
              <span className="cat-icon">{cat.icon}</span>
              {cat.label}
              <span className="cat-count">{items.length}</span>
            </div>,
            ...items.map((layout) => (
              <div
                key={layout.id}
                className={`layout-card glass-panel ${currentLayout === layout.id ? 'selected' : ''}`}
                onClick={() => onSelectLayout(layout.id)}
              >
                <LayoutMini layout={layout} />
                <div className="layout-card-info">
                  <h4>{layout.name}</h4>
                  <p>{layout.desc} · {layout.slots} photo{layout.slots > 1 ? 's' : ''}</p>
                </div>
              </div>
            )),
          ];
        })}
      </div>

      {toast && <div className="share-toast">{toast}</div>}
    </div>
  );
};

export default LayoutView;
