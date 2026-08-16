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

// cover-fit draw
function drawPhotoCover(ctx, img, x, y, w, h) {
  const ir = img.width / img.height;
  const r = w / h;
  let sw, sh, sx, sy;
  if (ir > r) { sh = img.height; sw = sh * r; sx = (img.width - sw) / 2; sy = 0; }
  else { sw = img.width; sh = sw / r; sx = 0; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * Compose the final photo card onto a canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {string[]} photos - dataURLs
 * @param {object} edit - { layout, frame, background, stickers, caption }
 */
export async function composeCard(canvas, photos, edit) {
  const layout = LAYOUTS[edit.layout] || LAYOUTS.strip3;
  const frame = FRAMES.find((f) => f.id === edit.frame);
  const bg = BACKGROUNDS.find((b) => b.id === edit.background);
  const { w: W, h: H } = layout.canvas;

  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 1. background
  drawBackground(ctx, bg, W, H);

  // 2. photos
  const imgs = await Promise.all(photos.slice(0, layout.slots).map((p) => loadImage(p)));
  imgs.forEach((img, i) => {
    const r = layout.rects[i];
    if (!r) return;
    const x = r.x * W, y = r.y * H, w = r.w * W, h = r.h * H;
    // white inner border around each photo
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    ctx.restore();
    drawPhotoCover(ctx, img, x, y, w, h);
  });

  // 3. caption
  if (edit.caption) {
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
  drawFrame(ctx, frame, W, H);

  return canvas;
}
