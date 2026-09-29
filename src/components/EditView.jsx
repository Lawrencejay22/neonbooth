import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  LAYOUTS, LAYOUT_CATEGORIES,
  FRAMES, FRAME_CATEGORIES,
  BACKGROUNDS, BACKGROUND_CATEGORIES,
  STICKER_GROUPS,
} from '../lib/options';
import { composeCard, photoPlan, photoAtPoint, coverCrop, loadImage, MIN_ZOOM, MAX_ZOOM } from '../lib/compose';

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

// User-imported frame/backdrop designs with import + remove controls
const CustomDesignSection = ({ title, items, selectedId, onPick, onImport, onRemove, hint }) => (
  <div className="cat-section">
    <div className="cat-header">
      <span className="cat-icon">🪄</span>
      {title}
      <button className="btn btn-ghost btn-sm design-import-btn" onClick={onImport}>＋ Import design</button>
    </div>
    {items.length > 0 ? (
      <div className="swatch-grid">
        {items.map((it) => (
          <div
            key={it.id}
            className={`swatch ${selectedId === it.id ? 'selected' : ''}`}
            title={it.name}
            onClick={() => onPick(it.id)}
          >
            <img src={it.src} alt={it.name} className="design-thumb" />
            <button
              className="design-remove"
              title="Remove design"
              onClick={(e) => { e.stopPropagation(); onRemove(it.id); }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    ) : (
      <p className="hint-text" style={{ marginTop: 0 }}>{hint}</p>
    )}
  </div>
);

const EditView = ({ photos, edit, setEdit, onSave, onBack, onSwitchPhotos }) => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const frameFileRef = useRef(null);
  const bgFileRef = useRef(null);
  const [tab, setTab] = useState('frame');
  const [dragging, setDragging] = useState(null);
  const [selectedSticker, setSelectedSticker] = useState(null);
  const [stickerGroup, setStickerGroup] = useState(STICKER_GROUPS[0].id);
  const [toast, setToast] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [draggingPhoto, setDraggingPhoto] = useState(false);
  const photoDrag = useRef(null);
  const imgSizes = useRef({});

  const activePhoto = selectedPhoto !== null && selectedPhoto < photos.length ? selectedPhoto : null;

  const render = useCallback(() => {
    if (canvasRef.current && photos.length > 0) {
      composeCard(canvasRef.current, photos, edit, { selectedPhoto: activePhoto });
    }
  }, [photos, edit, activePhoto]);

  useEffect(() => { render(); }, [render]);

  // Pan limits depend on each shot's real pixel size; the renderer caches these
  // already, so pulling them here is cheap and keeps dragging from overshooting.
  useEffect(() => {
    photos.forEach((p, i) => {
      if (imgSizes.current[i]) return;
      loadImage(p).then((img) => { imgSizes.current[i] = { w: img.width, h: img.height }; }).catch(() => {});
    });
  }, [photos]);

  const update = (patch) => setEdit((prev) => ({ ...prev, ...patch }));

  const updatePhotoAdjust = (index, patch) => setEdit((prev) => {
    const cur = (prev.photoAdjust || {})[index] || {};
    return { ...prev, photoAdjust: { ...prev.photoAdjust, [index]: { ...cur, ...patch } } };
  });

  const resetPhoto = (index) => setEdit((prev) => {
    const next = { ...prev.photoAdjust };
    delete next[index];
    return { ...prev, photoAdjust: next };
  });

  // The frame a shot is actually drawn in, so the arrow buttons can slide it
  // against the same limits the drag gesture uses.
  const tileOf = (index) => {
    let found = null;
    photoPlan(photos, edit).slots.forEach((s) => {
      s.tiles.forEach((t) => { if (!found && t.index === index) found = t; });
    });
    return found;
  };

  const NUDGE = 0.05;
  const nudgePhoto = (axis, delta) => {
    if (activePhoto === null) return;
    const tile = tileOf(activePhoto);
    if (!tile) return;
    const size = imgSizes.current[activePhoto];
    setEdit((prev) => {
      const cur = (prev.photoAdjust || {})[activePhoto] || {};
      // coverCrop reports its limits as { x, y } while the stored keys are dx/dy.
      const limKey = axis === 'dx' ? 'x' : 'y';
      const max = size ? coverCrop(size.w, size.h, tile.w, tile.h, cur).lim[limKey] : 1;
      const v = Math.min(max, Math.max(-max, (cur[axis] || 0) + delta));
      return { ...prev, photoAdjust: { ...prev.photoAdjust, [activePhoto]: { ...cur, [axis]: v } } };
    });
  };

  // How far the selected shot can still slide on each axis. A frame wider than
  // the photo has no horizontal room at all, so those arrows say so instead of
  // looking broken.
  const slideRoom = (() => {
    if (activePhoto === null) return { x: 0, y: 0 };
    const tile = tileOf(activePhoto);
    const size = imgSizes.current[activePhoto];
    if (!tile || !size) return { x: 1, y: 1 };
    return coverCrop(size.w, size.h, tile.w, tile.h, (edit.photoAdjust || {})[activePhoto] || {}).lim;
  })();

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

  // Import user designs — kind: 'frame' | 'background'
  const importDesign = (kind) => async (e) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    if (files.length === 0) {
      showToast('⚠️ Please choose an image file (PNG or JPG)');
      return;
    }
    try {
      const loaded = await Promise.all(files.map(readFile));
      const items = loaded.map((src, i) => ({
        id: `custom-${Date.now()}-${i}`,
        name: files[i].name.replace(/\.[^.]+$/, ''),
        src,
        type: 'image',
      }));
      const listKey = kind === 'frame' ? 'customFrames' : 'customBackgrounds';
      const pickKey = kind === 'frame' ? 'frame' : 'background';
      update({
        [listKey]: [...(edit[listKey] || []), ...items],
        [pickKey]: items[0].id,
      });
      showToast(`✅ Design imported — your ${kind === 'frame' ? 'frame' : 'backdrop'} updated!`);
    } catch {
      showToast('⚠️ Could not read that file');
    }
  };

  const pickLayout = (layoutId) => update({ layout: layoutId });

  const removeDesign = (kind, id) => {
    const listKey = kind === 'frame' ? 'customFrames' : 'customBackgrounds';
    const pickKey = kind === 'frame' ? 'frame' : 'background';
    const fallback = kind === 'frame' ? 'white' : 'cream';
    const patch = { [listKey]: (edit[listKey] || []).filter((it) => it.id !== id) };
    if (edit[pickKey] === id) patch[pickKey] = fallback;
    update(patch);
  };

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

  const canvasPx = (e) => {
    const canvas = canvasRef.current;
    const p = canvasPos(e);
    return { x: p.x * canvas.width, y: p.y * canvas.height };
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
    if (hit) {
      setDragging(hit);
      setSelectedSticker(hit);
      setSelectedPhoto(null);
      return;
    }
    const px = canvasPx(e);
    const tile = photoAtPoint(photoPlan(photos, edit), px.x, px.y);
    if (!tile) {
      setSelectedPhoto(null);
      return;
    }
    const adj = (edit.photoAdjust || {})[tile.index] || {};
    const size = imgSizes.current[tile.index];
    photoDrag.current = {
      index: tile.index,
      x: px.x,
      y: px.y,
      w: tile.w,
      h: tile.h,
      dx: adj.dx || 0,
      dy: adj.dy || 0,
      lim: size ? coverCrop(size.w, size.h, tile.w, tile.h, adj).lim : null,
    };
    setDraggingPhoto(true);
    setSelectedPhoto(tile.index);
    setSelectedSticker(null);
  };

  const onPointerMove = (e) => {
    const drag = photoDrag.current;
    if (drag) {
      e.preventDefault();
      const px = canvasPx(e);
      const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
      let dx = drag.dx + (px.x - drag.x) / drag.w;
      let dy = drag.dy + (px.y - drag.y) / drag.h;
      if (drag.lim) {
        dx = clamp(dx, -drag.lim.x, drag.lim.x);
        dy = clamp(dy, -drag.lim.y, drag.lim.y);
      }
      updatePhotoAdjust(drag.index, { dx, dy });
      return;
    }
    if (!dragging) return;
    e.preventDefault();
    const pos = canvasPos(e);
    update({
      stickers: edit.stickers.map((s) =>
        s.id === dragging ? { ...s, x: Math.min(0.97, Math.max(0.03, pos.x)), y: Math.min(0.97, Math.max(0.03, pos.y)) } : s
      ),
    });
  };

  const onPointerUp = () => {
    photoDrag.current = null;
    setDragging(null);
    setDraggingPhoto(false);
  };

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
      <p className="view-sub">Frames, stickers, backdrops and captions — everything updates live. Tap a photo to slide or zoom it inside its frame.</p>

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
              style={{ cursor: dragging || draggingPhoto ? 'grabbing' : 'grab', touchAction: 'none' }}
            />
          )}
          {activePhoto !== null && (
            <div className="photo-adjust">
              <b>Shot {activePhoto + 1}</b>
              <span className="photo-adjust-hint">Drag or use the arrows to slide it · Switch place to trade shots</span>
              <div className="photo-adjust-tools">
                <span>Slide</span>
                <span className="nudge-pad">
                  <button className="btn btn-ghost btn-sm" onClick={() => nudgePhoto('dy', -NUDGE)} disabled={slideRoom.y <= 0} title={slideRoom.y <= 0 ? 'This frame already shows the full height' : 'Slide up'}>↑</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => nudgePhoto('dx', -NUDGE)} disabled={slideRoom.x <= 0} title={slideRoom.x <= 0 ? 'This frame already shows the full width' : 'Slide left'}>←</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => nudgePhoto('dy', NUDGE)} disabled={slideRoom.y <= 0} title={slideRoom.y <= 0 ? 'This frame already shows the full height' : 'Slide down'}>↓</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => nudgePhoto('dx', NUDGE)} disabled={slideRoom.x <= 0} title={slideRoom.x <= 0 ? 'This frame already shows the full width' : 'Slide right'}>→</button>
                </span>
                <span>Zoom</span>
                <input
                  type="range"
                  min={MIN_ZOOM}
                  max={MAX_ZOOM}
                  step="0.05"
                  value={(edit.photoAdjust || {})[activePhoto]?.zoom || MIN_ZOOM}
                  onChange={(e) => updatePhotoAdjust(activePhoto, { zoom: Number(e.target.value) })}
                />
                {photos.length > 1 && (
                  <select
                    className="photo-switch"
                    value=""
                    onChange={(e) => { if (e.target.value !== '') onSwitchPhotos(activePhoto, Number(e.target.value)); }}
                  >
                    <option value="">Switch place…</option>
                    {photos.map((_, i) => (
                      <option key={i} value={i} disabled={i === activePhoto}>with Shot {i + 1}</option>
                    ))}
                  </select>
                )}
                <button className="btn btn-ghost btn-sm" onClick={() => resetPhoto(activePhoto)}>Reset</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPhoto(null)}>Done</button>
              </div>
            </div>
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
                            onClick={() => pickLayout(l.id)}
                          >
                            {l.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <p className="hint-text">Every template holds all your shots — when there are more photos than frames, the extras tile neatly inside them.</p>
              </>
            )}

            {tab === 'frame' && (
              <>
                <CustomDesignSection
                  title="Your frame designs"
                  items={edit.customFrames || []}
                  selectedId={edit.frame}
                  onPick={(id) => update({ frame: id })}
                  onImport={() => frameFileRef.current?.click()}
                  onRemove={(id) => removeDesign('frame', id)}
                  hint="Import your own frame art (PNG/JPG). The border of your image becomes the frame."
                />
                {FRAME_CATEGORIES.map((cat) => (
                  <SwatchSection
                    key={cat.id}
                    cat={cat}
                    items={FRAMES.filter((f) => f.cat === cat.id)}
                    selectedId={edit.frame}
                    onPick={(id) => update({ frame: id })}
                  />
                ))}
                <p className="hint-text">Selected: <b>{FRAMES.find((f) => f.id === edit.frame)?.name || (edit.customFrames || []).find((f) => f.id === edit.frame)?.name || 'Custom'}</b></p>

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
                <CustomDesignSection
                  title="Your backdrops"
                  items={edit.customBackgrounds || []}
                  selectedId={edit.background}
                  onPick={(id) => update({ background: id })}
                  onImport={() => bgFileRef.current?.click()}
                  onRemove={(id) => removeDesign('background', id)}
                  hint="Import your own backdrop image — it fills the canvas behind your photos."
                />
                {BACKGROUND_CATEGORIES.map((cat) => (
                  <SwatchSection
                    key={cat.id}
                    cat={cat}
                    items={BACKGROUNDS.filter((b) => b.cat === cat.id)}
                    selectedId={edit.background}
                    onPick={(id) => update({ background: id })}
                  />
                ))}
                <p className="hint-text">Selected: <b>{BACKGROUNDS.find((b) => b.id === edit.background)?.name || (edit.customBackgrounds || []).find((b) => b.id === edit.background)?.name || 'Custom'}</b></p>
              </>
            )}
          </div>
        </div>
      </div>

      <input ref={frameFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={importDesign('frame')} />
      <input ref={bgFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={importDesign('background')} />
      {toast && <div className="share-toast">{toast}</div>}

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
