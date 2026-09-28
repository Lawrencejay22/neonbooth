import { LAYOUTS, FRAMES, BACKGROUNDS } from './options';

const imageCache = new Map();

export function loadImage(src) {
  if (imageCache.has(src)) return Promise.resolve(imageCache.get(src));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { imageCache.set(src, img); resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

// Deterministic pseudo-random so patterns look identical on every re-render
function seededRand(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function drawStar(ctx, cx, cy, spikes, outerR, innerR) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR); rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR); rot += step;
  }
  ctx.closePath();
  ctx.fill();
}

function drawHeart(ctx, cx, cy, size) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.9);
  ctx.bezierCurveTo(cx - s * 1.4, cy - s * 0.2, cx - s * 0.7, cy - s * 1.2, cx, cy - s * 0.4);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.2, cx + s * 1.4, cy - s * 0.2, cx, cy + s * 0.9);
  ctx.closePath();
  ctx.fill();
}

function drawBackground(ctx, bg, W, H) {
  if (!bg) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H); return; }
  if (bg.type === 'solid') {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, W, H);
  } else if (bg.type === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    bg.colors.forEach((c, i) => g.addColorStop(i / (bg.colors.length - 1), c));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else if (bg.type === 'pattern') {
    ctx.fillStyle = bg.base;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = bg.dot;

    if (bg.grid) {
      ctx.strokeStyle = bg.dot; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.7;
      const step = 60;
      for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
    } else if (bg.stars) {
      const step = 90;
      for (let y = step / 2; y < H; y += step) {
        for (let x = step / 2; x < W; x += step) {
          const jx = x + (Math.sin(x * 7 + y * 3) * 22);
          const jy = y + (Math.cos(x * 3 + y * 5) * 22);
          drawStar(ctx, jx, jy, 5, 7, 3);
        }
      }
    } else if (bg.hearts) {
      const step = 110;
      ctx.globalAlpha = 0.5;
      for (let y = step / 2; y < H; y += step) {
        for (let x = step / 2; x < W; x += step) {
          const off = (Math.round(y / step) % 2) * (step / 2);
          const jx = x + off + Math.sin(x * 5 + y) * 14;
          const jy = y + Math.cos(x + y * 4) * 14;
          drawHeart(ctx, jx, jy, 26);
        }
      }
      ctx.globalAlpha = 1;
    } else if (bg.confetti) {
      const rand = seededRand(42);
      const palette = ['#f59e0b', '#fb7185', '#a855f7', '#22d3ee', '#34d399', '#fbbf24'];
      ctx.globalAlpha = 0.85;
      for (let i = 0; i < 140; i++) {
        const x = rand() * W, y = rand() * H;
        const w = 8 + rand() * 10, h = 4 + rand() * 6;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rand() * Math.PI * 2);
        ctx.fillStyle = palette[Math.floor(rand() * palette.length)];
        ctx.fillRect(-w / 2, -h / 2, w, h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    } else if (bg.checker) {
      const size = 56;
      ctx.globalAlpha = 0.9;
      for (let y = 0, row = 0; y < H; y += size, row++) {
        for (let x = 0, col = 0; x < W; x += size, col++) {
          if ((row + col) % 2 === 0) ctx.fillRect(x, y, size, size);
        }
      }
      ctx.globalAlpha = 1;
    } else if (bg.stripes) {
      const step = 72;
      ctx.globalAlpha = 0.55;
      for (let x = -H; x < W + H; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + H, H);
        ctx.lineTo(x + H + step / 2, H);
        ctx.lineTo(x + step / 2, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (bg.bokeh) {
      const rand = seededRand(7);
      for (let i = 0; i < 46; i++) {
        const x = rand() * W, y = rand() * H, r = 14 + rand() * 52;
        ctx.globalAlpha = 0.08 + rand() * 0.16;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else {
      // default polka dots
      const step = 70;
      ctx.globalAlpha = 0.55;
      for (let y = step / 2; y < H; y += step) {
        for (let x = step / 2; x < W; x += step) {
          const off = (Math.round(y / step) % 2) * (step / 2);
          ctx.beginPath();
          ctx.arc(x + off, y, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
  }
}

// Renders an imported design as a border frame using a 9-slice of the
// image's outer edges, so the design keeps its look on any canvas size.
function drawImageFrame(ctx, img, W, H) {
  const w = Math.max(24, Math.round(Math.min(W, H) * 0.07));
  const iw = img.width, ih = img.height;
  const ew = Math.max(1, Math.round(iw * 0.14));
  const eh = Math.max(1, Math.round(ih * 0.14));
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  // corners
  ctx.drawImage(img, 0, 0, ew, eh, 0, 0, w, w);
  ctx.drawImage(img, iw - ew, 0, ew, eh, W - w, 0, w, w);
  ctx.drawImage(img, 0, ih - eh, ew, eh, 0, H - w, w, w);
  ctx.drawImage(img, iw - ew, ih - eh, ew, eh, W - w, H - w, w, w);
  // edges (stretched between corners)
  ctx.drawImage(img, ew, 0, iw - ew * 2, eh, w, 0, W - w * 2, w);
  ctx.drawImage(img, ew, ih - eh, iw - ew * 2, eh, w, H - w, W - w * 2, w);
  ctx.drawImage(img, 0, eh, ew, ih - eh * 2, 0, w, w, H - w * 2);
  ctx.drawImage(img, iw - ew, eh, ew, ih - eh * 2, W - w, w, w, H - w * 2);
  ctx.restore();
}

function drawFrame(ctx, frame, W, H) {
  if (!frame || frame.type === 'none') return;
  const w = frame.width;

  if (frame.type === 'solid') {
    ctx.strokeStyle = frame.color; ctx.lineWidth = w * 2;
    ctx.strokeRect(0, 0, W, H);
  } else if (frame.type === 'gradient') {
    const g = ctx.createLinearGradient(0, 0, W, H);
    frame.colors.forEach((c, i) => g.addColorStop(i / (frame.colors.length - 1), c));
    ctx.strokeStyle = g; ctx.lineWidth = w * 2;
    ctx.strokeRect(0, 0, W, H);
  } else if (frame.type === 'double') {
    // outer thick + inner thin line
    ctx.strokeStyle = frame.color;
    ctx.lineWidth = w;
    ctx.strokeRect(w / 2, w / 2, W - w, H - w);
    ctx.lineWidth = Math.max(3, w * 0.22);
    ctx.strokeRect(w * 1.9, w * 1.9, W - w * 3.8, H - w * 3.8);
  } else if (frame.type === 'dashed') {
    ctx.strokeStyle = frame.color;
    ctx.lineWidth = w;
    ctx.setLineDash([w * 4, w * 2.4]);
    ctx.strokeRect(w * 2, w * 2, W - w * 4, H - w * 4);
    ctx.setLineDash([]);
  } else if (frame.type === 'glow') {
    // neon tube: layered strokes with shadow
    ctx.save();
    ctx.strokeStyle = frame.color;
    ctx.shadowColor = frame.color;
    ctx.shadowBlur = w * 2.2;
    ctx.lineWidth = w;
    for (let i = 0; i < 3; i++) ctx.strokeRect(w * 1.6, w * 1.6, W - w * 3.2, H - w * 3.2);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = Math.max(2, w * 0.3);
    ctx.strokeRect(w * 1.6, w * 1.6, W - w * 3.2, H - w * 3.2);
    ctx.restore();
  } else if (frame.type === 'corners') {
    // photo-studio corner marks
    const len = Math.min(W, H) * 0.09;
    const m = w * 2.2;
    ctx.strokeStyle = frame.color;
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    const corners = [
      [m, m, 1, 1], [W - m, m, -1, 1],
      [m, H - m, 1, -1], [W - m, H - m, -1, -1],
    ];
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * len, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * len);
      ctx.stroke();
    });
  } else if (frame.type === 'emoji') {
    const size = w * 1.6;
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const step = size * 1.15;
    for (let x = step / 2; x < W; x += step) {
      ctx.fillText(frame.emoji, x, size * 0.7);
      ctx.fillText(frame.emoji, x, H - size * 0.7);
    }
    for (let y = step / 2; y < H; y += step) {
      ctx.fillText(frame.emoji, size * 0.7, y);
      ctx.fillText(frame.emoji, W - size * 0.7, y);
    }
  } else if (frame.type === 'chrome') {
    const colors = frame.chromeColors || ['#e5e7eb', '#9ca3af', '#f9fafb', '#6b7280', '#e5e7eb'];
    const g = ctx.createLinearGradient(0, 0, W, H);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    ctx.strokeStyle = g;
    ctx.lineWidth = w * 1.8;
    ctx.strokeRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = Math.max(2, w * 0.22);
    ctx.strokeRect(w * 0.9, w * 0.9, W - w * 1.8, H - w * 1.8);
  } else if (frame.type === 'holo') {
    const colors = ['#ff77e9', '#7afcff', '#a3ff8c', '#fffb7a', '#ff9d7a', '#ff77e9'];
    const g = ctx.createLinearGradient(0, 0, W, H);
    colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
    ctx.save();
    ctx.strokeStyle = g;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = w * 1.3;
    ctx.lineWidth = w * 1.6;
    ctx.strokeRect(w * 0.8, w * 0.8, W - w * 1.6, H - w * 1.6);
    ctx.restore();
  } else if (frame.type === 'film') {
    ctx.fillStyle = '#14101f';
    ctx.fillRect(0, 0, W, w); ctx.fillRect(0, H - w, W, w);
    ctx.fillStyle = '#ffffff';
    const hole = w * 0.42, step = hole * 2.4;
    for (let x = step / 2; x < W; x += step) {
      ctx.fillRect(x - hole / 2, w / 2 - hole / 2, hole, hole);
      ctx.fillRect(x - hole / 2, H - w / 2 - hole / 2, hole, hole);
    }
  }
}

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Cover-fit crop window for a photo shown inside a w×h frame, including the
// pan/zoom the user dialled in. Pan is expressed in fractions of the frame
// (1 = one full frame width) so the editor can clamp drags with the same math
// the renderer uses — otherwise the two disagree and photos drift.
export function coverCrop(iw, ih, w, h, adj = {}) {
  const ir = iw / ih;
  const r = w / h;
  let cw, ch;
  if (ir > r) { ch = ih; cw = ch * r; }
  else { cw = iw; ch = cw / r; }
  const z = clamp(adj.zoom || MIN_ZOOM, MIN_ZOOM, MAX_ZOOM);
  const sw = cw / z;
  const sh = ch / z;
  const lim = { x: (iw - sw) / (2 * sw), y: (ih - sh) / (2 * sh) };
  const dx = clamp(adj.dx || 0, -lim.x, lim.x);
  const dy = clamp(adj.dy || 0, -lim.y, lim.y);
  return {
    sx: (iw - sw) / 2 - dx * sw,
    sy: (ih - sh) / 2 - dy * sh,
    sw, sh, dx, dy, lim,
  };
}

function drawPhotoCover(ctx, img, x, y, w, h, adj) {
  const c = coverCrop(img.width, img.height, w, h, adj);
  ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, x, y, w, h);
}

// How many photos each slot holds when `count` photos share `slots` slots:
// extras spread one-per-slot from the top so tiles stay as square as possible.
export function slotPhotoCounts(count, slots) {
  const base = Math.floor(count / slots);
  const rem = count % slots;
  return Array.from({ length: slots }, (_, i) => base + (i < rem ? 1 : 0));
}

// Split a slot rect into k non-overlapping tile rects (white gaps between).
// Column count is chosen so the tiles come out as close to square as possible,
// which keeps faces large however many shots share a frame.
export function tileRects(k, x, y, w, h) {
  if (k <= 1) return [{ x, y, w, h }];
  const g = Math.max(6, Math.min(10, Math.round(Math.min(w, h) * 0.02)));
  let best = null;
  for (let cols = 1; cols <= k; cols++) {
    const rows = Math.ceil(k / cols);
    const tw = (w - g * (cols - 1)) / cols;
    const th = (h - g * (rows - 1)) / rows;
    if (tw <= 0 || th <= 0) continue;
    const score = Math.abs(Math.log(tw / th));
    if (!best || score < best.score) best = { cols, tw, th, score };
  }
  const { cols, tw, th } = best;
  const rects = [];
  for (let i = 0; i < k; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const inRow = Math.min(cols, k - row * cols);
    const off = ((cols - inRow) * (tw + g)) / 2; // centre a short final row
    rects.push({ x: x + col * (tw + g) + off, y: y + row * (th + g), w: tw, h: th });
  }
  return rects;
}

// Where every photo actually gets drawn, in canvas pixels. Both the renderer and
// the editor's drag hit-testing read this, so grabbing a photo always matches
// the photo you see — including tiles inside a shared frame and tilted strips.
export function photoPlan(photos, edit) {
  const layout = LAYOUTS[edit.layout] || LAYOUTS.strip3;
  const { w: W, h: H } = layout.canvas;
  const counts = slotPhotoCounts(photos.length, layout.slots);
  const slots = [];
  let cursor = 0;
  counts.forEach((k, i) => {
    const r = layout.rects[i];
    if (!r || k === 0) { cursor += k; return; }
    const x = r.x * W, y = r.y * H, w = r.w * W, h = r.h * H;
    const rect = { x, y, w, h, rot: r.rot || 0, px: (r.px ?? r.x + r.w / 2) * W, py: (r.py ?? r.y + r.h / 2) * H };
    const tiles = tileRects(k, x, y, w, h).map((t, j) => ({ ...t, index: cursor + j }));
    slots.push({ rect, tiles });
    cursor += k;
  });
  return { layout, W, H, slots };
}

// Which photo sits under a canvas-pixel point, or null. Accounts for the tilt
// double-strip layouts put on their frames.
export function photoAtPoint(plan, atX, atY) {
  for (const { rect, tiles } of plan.slots) {
    let qx = atX, qy = atY;
    if (rect.rot) {
      const cx = rect.px, cy = rect.py;
      const a = (-rect.rot * Math.PI) / 180;
      const cos = Math.cos(a), sin = Math.sin(a);
      qx = cx + (atX - cx) * cos - (atY - cy) * sin;
      qy = cy + (atX - cx) * sin + (atY - cy) * cos;
    }
    for (const t of tiles) {
      if (qx >= t.x && qx <= t.x + t.w && qy >= t.y && qy <= t.y + t.h) return t;
    }
  }
  return null;
}

// Two-up booth strips: every group is its own paper card — white sheet, optional
// dark header block and a footer caption strip — tilted by `rot` degrees.
function drawGroups(ctx, groups, W, H, caption) {
  groups.forEach((g) => {
    const w = g.w * W, h = g.h * H;
    ctx.save();
    ctx.translate(g.x * W + w / 2, g.y * H + h / 2);
    ctx.rotate(((g.rot || 0) * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.shadowColor = 'transparent';
    if (g.header) {
      ctx.fillStyle = '#2b2130';
      ctx.fillRect(w * 0.07, h * 0.045, w * 0.86, h * 0.075);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w * 0.18, h * 0.9);
    ctx.lineTo(w * 0.82, h * 0.9);
    ctx.stroke();
    if (caption) {
      ctx.font = `600 ${Math.round(h * 0.028)}px Caveat, cursive`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#3d2f3f';
      ctx.fillText(caption, w / 2, h * 0.945);
    }
    ctx.restore();
  });
}

/**
 * Compose the final photo card onto a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} photos - dataURLs
 * @param {object} edit - { layout, frame, background, stickers, photoAdjust, caption }
 * @param {object} [opts] - preview-only extras: { selectedPhoto } draws the selection outline
 */
export async function composeCard(canvas, photos, edit, opts = {}) {
  const frame = FRAMES.find((f) => f.id === edit.frame)
    || (edit.customFrames || []).find((f) => f.id === edit.frame);
  const bg = BACKGROUNDS.find((b) => b.id === edit.background)
    || (edit.customBackgrounds || []).find((b) => b.id === edit.background);
  const plan = photoPlan(photos, edit);
  const { layout, W, H } = plan;

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. background
  if (bg && bg.src) {
    try {
      const bgImg = await loadImage(bg.src);
      drawPhotoCover(ctx, bgImg, 0, 0, W, H);
    } catch {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
    }
  } else {
    drawBackground(ctx, bg, W, H);
  }

  // 2. photos — every capture lands in the chosen layout; when a session has
  // more shots than slots, the extras tile inside their slot.
  const grouped = !!layout.groups;
  if (grouped) drawGroups(ctx, layout.groups, W, H, edit.caption);
  const imgs = await Promise.all(photos.map((p) => loadImage(p)));
  plan.slots.forEach(({ rect, tiles }) => {
    ctx.save();
    if (rect.rot) {
      ctx.translate(rect.px, rect.py);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-rect.px, -rect.py);
    }
    if (!grouped) {
      // white inner border around each photo slot
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rect.x - 8, rect.y - 8, rect.w + 16, rect.h + 16);
      ctx.restore();
    }
    tiles.forEach((t) => {
      const img = imgs[t.index];
      if (!img) return;
      drawPhotoCover(ctx, img, t.x, t.y, t.w, t.h, (edit.photoAdjust || {})[t.index]);
      if (opts.selectedPhoto === t.index) {
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 5;
        ctx.setLineDash([16, 11]);
        ctx.strokeRect(t.x + 2.5, t.y + 2.5, t.w - 5, t.h - 5);
        ctx.setLineDash([]);
      }
    });
    ctx.restore();
  });

  // 3. caption (grouped layouts print it inside each strip instead)
  if (edit.caption && !grouped) {
    ctx.font = `600 ${Math.round(H * 0.038)}px Caveat, cursive`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = bg && bg.dark ? '#ffffff' : '#3d2f3f';
    ctx.fillText(edit.caption, W / 2, H - layout.captionH / 2 - 6);
  }

  // 4. stickers
  (edit.stickers || []).forEach((s) => {
    ctx.font = `${s.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.emoji, s.x * W, s.y * H);
  });

  // 5. frame on top
  if (frame && frame.src) {
    try {
      const frameImg = await loadImage(frame.src);
      drawImageFrame(ctx, frameImg, W, H);
    } catch { /* imported frame unreadable — skip */ }
  } else {
    drawFrame(ctx, frame, W, H);
  }

  return canvas;
}
