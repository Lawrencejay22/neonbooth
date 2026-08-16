import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  LAYOUTS, LAYOUT_CATEGORIES,
  FRAMES, FRAME_CATEGORIES,
  BACKGROUNDS, BACKGROUND_CATEGORIES,
  STICKER_GROUPS,
} from '../lib/options';
import { composeCard } from '../lib/compose';

const TABS = [
  { id: 'layout', label: 'Layout', icon: '▦' },
  { id: 'frame', label: 'Frame', icon: '🖼️' },
  { id: 'stickers', label: 'Stickers', icon: '✨' },
  { id: 'background', label: 'Backdrop', icon: '🎨' },
];

const swatchStyle = (item) => {
  if (item.type === 'gradient') return { background: `linear-gradient(135deg, ${item.colors.join(', ')})` };
  if (item.type === 'emoji') return { background: '#2a2140', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  if (item.type === 'film') return { background: 'repeating-linear-gradient(90deg,#14101f 0 8px,#fff 8px 12px)' };
  if (item.type === 'double') return { background: '#2a2140', boxShadow: `inset 0 0 0 3px ${item.color}, inset 0 0 0 6px #2a2140, inset 0 0 0 8px ${item.color}` };
  if (item.type === 'dashed') return { background: '#2a2140', border: `2px dashed ${item.color}` };
  if (item.type === 'glow') return { background: '#14101f', boxShadow: `inset 0 0 0 2px ${item.color}, inset 0 0 12px ${item.color}` };
  if (item.type === 'corners') return { background: '#2a2140', boxShadow: `inset 3px 3px 0 -1px ${item.color}, inset -3px 3px 0 -1px ${item.color}, inset 3px -3px 0 -1px ${item.color}, inset -3px -3px 0 -1px ${item.color}` };
  if (item.type === 'pattern') {
    if (item.checker) return { background: `repeating-conic-gradient(${item.dot} 0% 25%, ${item.base} 0% 50%) 0 0 / 14px 14px` };
    if (item.stripes) return { background: `repeating-linear-gradient(45deg, ${item.base} 0 8px, ${item.dot} 8px 12px)` };
    if (item.grid) return { background: `linear-gradient(${item.dot} 1px, transparent 1px), linear-gradient(90deg, ${item.dot} 1px, transparent 1px), ${item.base}`, backgroundSize: '8px 8px' };
    if (item.stars || item.bokeh || item.hearts || item.confetti) return { background: `radial-gradient(circle at 30% 30%, ${item.dot}55 2px, transparent 3px), radial-gradient(circle at 70% 60%, ${item.dot}88 2px, transparent 3px), radial-gradient(circle at 45% 80%, ${item.dot}44 2px, transparent 3px), ${item.base}` };
    return { background: `radial-gradient(${item.dot} 2.5px, transparent 3px), ${item.base}`, backgroundSize: '12px 12px' };
  }
  if (item.type === 'chrome') return { background: `linear-gradient(135deg, ${(item.chromeColors || ['#e5e7eb', '#9ca3af', '#f9fafb', '#6b7280']).join(', ')})` };
  if (item.type === 'holo') return { background: 'linear-gradient(135deg, #ff77e9, #7afcff, #a3ff8c, #fffb7a, #ff9d7a)' };
  if (item.type === 'none') return { background: 'transparent' };
  return { background: item.color };
};

// Renders a categorized swatch section
const SwatchSection = ({ cat, items, selectedId, onPick, labelKey = 'name' }) => {
  if (items.length === 0) return null;
  return (
    <div className="cat-section">
      <div className="cat-header">
        <span className="cat-icon">{cat.icon}</span>
        {cat.label}
        <span className="cat-count">{items.length}</span>
      </div>
      <div className="swatch-grid">
        {items.map((f) => (
          <div
            key={f.id}
            className={`swatch ${selectedId === f.id ? 'selected' : ''}`}
            style={swatchStyle(f)}
            title={f[labelKey]}
            onClick={() => onPick(f.id)}
          >
            {f.type === 'emoji' ? f.emoji : f.type === 'none' ? '🚫' : ''}
          </div>
        ))}
      </div>
    </div>
  );
};

const EditView = ({ photos, edit, setEdit, onSave, onBack }) => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const [tab, setTab] = useState('frame');
  const [dragging, setDragging] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickerGroup, setStickerGroup] = useState(STICKER_GROUPS[0].id);

  const render = useCallback(() => {
    if (canvasRef.current && photos.length > 0) {
      composeCard(canvasRef.current, photos, edit);
    }
  }, [photos, edit]);

  useEffect(() => { render(); }, [render]);

  const update = (patch) => setEdit((prev) => ({ ...prev, ...patch }));

  // --- Sticker add / drag / delete ---
  const addSticker = (emoji) => {
    const s = {
      id: Date.now() + Math.random(),
      emoji,
      x: 0.5 + (Math.random() - 0.5) * 0.3,
      y: 0.5 + (Math.random() - 0.5) * 0.3,
      size: 54,
    };
    update({ stickers: [...edit.stickers, s] });
    setSelectedSticker(s.id);
  };

  const canvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX);
    const cy = (e.touches ? e.touches[0].clientY : e.clientY);
    return {
      x: (cx - rect.left) / rect.width,
      y: (cy - rect.top) / rect.height,
    };
  };

  const hitSticker = (pos) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    // iterate top-most first
    for (let i = edit.stickers.length - 1; i >= 0; i--) {
      const s = edit.stickers[i];
      const sx = s.x, sy = s.y;
      const tolX = (s.size * 0.7) / canvas.width;
      const tolY = (s.size * 0.7) / canvas.height;
      if (Math.abs(pos.x - sx) < tolX && Math.abs(pos.y - sy) < tolY) return s.id;
    }
    return null;
  };

  const onPointerDown = (e) => {
    const pos = canvasPos(e);
    const hit = hitSticker(pos);
    if (hit) { setDragging(hit); setSelectedSticker(hit); }
    else setSelectedSticker(null);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    e.preventDefault();
    const pos = canvasPos(e);
    update({
      stickers: edit.stickers.map((s) =>
        s.id === dragging ? { ...s, x: Math.min(0.97, Math.max(0.03, pos.x)), y: Math.min(0.97, Math.max(0.03, pos.y)) } : s
      ),
    });
  };

  const onPointerUp = () => setDragging(null);

  const removeSelectedSticker = () => {
    if (!selectedSticker) return;
    update({ stickers: edit.stickers.filter((s) => s.id !== selectedSticker) });
    setSelectedSticker(null);
  };

  const resizeSelectedSticker = (delta) => {
    if (!selectedSticker) return;
    update({
      stickers: edit.stickers.map((s) =>
        s.id === selectedSticker ? { ...s, size: Math.min(160, Math.max(24, s.size + delta)) } : s
      ),
    });
  };

  const activeStickerGroup = STICKER_GROUPS.find((g) => g.id === stickerGroup) || STICKER_GROUPS[0];

  return (
    <div className="view-container" style={{ maxWidth: 1180 }}>
      <h2 className="view-title">Decorate your <span className="grad">masterpiece</span></h2>
      <p className="view-sub">Frames, stickers, backdrops and captions — everything updates live.</p>

      <div className="editor-wrap">
        {/* Live preview */}
        <div className="preview-stage glass-panel" ref={stageRef}>
          {photos.length === 0 ? (
            <p style={{ color: 'var(--text-dim)' }}>No photos yet — go capture some first! 📸</p>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={onPointerDown}
              onMouseMove={onPointerMove}
              onMouseUp={onPointerUp}
              onMouseLeave={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchMove={onPointerMove}
              onTouchEnd={onPointerUp}
              style={{ cursor: dragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            />
          )}
        </div>

        {/* Editor panel */}
        <div className="editor-panel glass-panel">
          <div className="editor-tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`editor-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                <span style={{ fontSize: '1.05rem' }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          <div className="editor-body">
            {tab === 'layout' && (
              <>
                {LAYOUT_CATEGORIES.map((cat) => {
                  const items = Object.values(LAYOUTS).filter((l) => l.cat === cat.id);
                  if (items.length === 0) return null;
                  return (
                    <div className="cat-section" key={cat.id}>
                      <div className="cat-header">
                        <span className="cat-icon">{cat.icon}</span>
                        {cat.label}
                        <span className="cat-count">{items.length}</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {items.map((l) => (
                          <button
                            key={l.id}
                            className={`filter-chip ${edit.layout === l.id ? 'active' : ''}`}
                            style={{ borderRadius: 12, padding: '12px 8px' }}
                            onClick={() => update({ layout: l.id })}
                          >
                            {l.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="hint-text">Layouts use your first {LAYOUTS[edit.layout].slots} photo(s). Extra shots stay saved in your gallery.</p>
              </>
            )}

            {tab === 'frame' && (
              <>
                {FRAME_CATEGORIES.map((cat) => (
                  <SwatchSection
                    key={cat.id}
                    cat={cat}
                    items={FRAMES.filter((f) => f.cat === cat.id)}
                    selectedId={edit.frame}
                    onPick={(id) => update({ frame: id })}
                  />
                ))}
                <p className="hint-text">Selected: <b>{FRAMES.find((f) => f.id === edit.frame)?.name}</b></p>

                <h5>Caption</h5>
                <input
                  className="caption-input"
                  placeholder="Write something sweet…"
                  value={edit.caption}
                  maxLength={40}
                  onChange={(e) => update({ caption: e.target.value })}
                />
              </>
            )}

            {tab === 'stickers' && (
              <>
                <h5>Pick a mood</h5>
                <div className="filter-row" style={{ justifyContent: 'flex-start', marginBottom: 12 }}>
                  {STICKER_GROUPS.map((g) => (
                    <button
                      key={g.id}
                      className={`filter-chip ${stickerGroup === g.id ? 'active' : ''}`}
                      onClick={() => setStickerGroup(g.id)}
                    >
                      {g.icon} {g.label}
                    </button>
                  ))}
                </div>
                <h5>Tap to add · drag on photo to move</h5>
                <div className="sticker-grid">
                  {activeStickerGroup.items.map((s) => (
                    <button key={s} className="sticker-btn" onClick={() => addSticker(s)}>{s}</button>
                  ))}
                </div>
                {selectedSticker && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => resizeSelectedSticker(10)}>A+</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => resizeSelectedSticker(-10)}>A−</button>
                    <button className="btn btn-red btn-sm" onClick={removeSelectedSticker}>Delete</button>
                  </div>
                )}
                {edit.stickers.length > 0 && (
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => update({ stickers: [] })}>
                    Clear all stickers ({edit.stickers.length})
                  </button>
                )}
                <p className="hint-text">Tip: click a sticker on the photo to select it, drag to reposition.</p>
              </>
            )}

            {tab === 'background' && (
              <>
                {BACKGROUND_CATEGORIES.map((cat) => (
                  <SwatchSection
                    key={cat.id}
                    cat={cat}
                    items={BACKGROUNDS.filter((b) => b.cat === cat.id)}
                    selectedId={edit.background}
                    onPick={(id) => update({ background: id })}
                  />
                ))}
                <p className="hint-text">Selected: <b>{BACKGROUNDS.find((b) => b.id === edit.background)?.name}</b></p>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 26, flexWrap: 'wrap', justifyContent: 'center' }}>
        <button className="btn btn-ghost" onClick={onBack}>← Retake</button>
        <button className="btn btn-green btn-lg" onClick={onSave} disabled={photos.length === 0}>
          Looks perfect →
        </button>
      </div>
    </div>
  );
};

export default EditView;
