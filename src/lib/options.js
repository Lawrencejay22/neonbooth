// ============================================================================
//  NEON BOOTH — TEMPLATES, FRAMES & BACKDROPS
//  Everything is organized by color family / category so users can find the
//  styles they love fast. Rendering lives in compose.js.
// ============================================================================

// ---------- Layout Templates ----------
// Each layout defines canvas aspect + photo slot rects in relative (0-1) coords.
// rect: { x, y, w, h } as fractions of canvas width/height.
// cat: 'strips' | 'grids' | 'singles' | 'wide'
export const LAYOUTS = {
  // ===== Classic Strips =====
  strip3: {
    id: 'strip3', name: 'Photo Strip', desc: 'Classic 3-shot strip', slots: 3, cat: 'strips',
    canvas: { w: 700, h: 1400 }, pad: 46, gap: 30, captionH: 150,
    rects: [
      { x: 0.066, y: 0.033, w: 0.868, h: 0.271 },
      { x: 0.066, y: 0.326, w: 0.868, h: 0.271 },
      { x: 0.066, y: 0.619, w: 0.868, h: 0.271 },
    ],
  },
  strip4: {
    id: 'strip4', name: 'Strip ×4', desc: 'Four-shot booth strip', slots: 4, cat: 'strips',
    canvas: { w: 700, h: 1700 }, pad: 46, gap: 28, captionH: 140,
    rects: [
      { x: 0.066, y: 0.027, w: 0.868, h: 0.212 },
      { x: 0.066, y: 0.256, w: 0.868, h: 0.212 },
      { x: 0.066, y: 0.485, w: 0.868, h: 0.212 },
      { x: 0.066, y: 0.714, w: 0.868, h: 0.212 },
    ],
  },
  strip6: {
    id: 'strip6', name: 'Mega Strip', desc: 'Six-shot tall strip', slots: 6, cat: 'strips',
    canvas: { w: 700, h: 2200 }, pad: 46, gap: 26, captionH: 130,
    rects: [
      { x: 0.066, y: 0.021, w: 0.868, h: 0.143 },
      { x: 0.066, y: 0.180, w: 0.868, h: 0.143 },
      { x: 0.066, y: 0.339, w: 0.868, h: 0.143 },
      { x: 0.066, y: 0.498, w: 0.868, h: 0.143 },
      { x: 0.066, y: 0.657, w: 0.868, h: 0.143 },
      { x: 0.066, y: 0.816, w: 0.868, h: 0.143 },
    ],
  },
  // ===== Grids & Collages =====
  grid: {
    id: 'grid', name: 'Grid 2×2', desc: 'Square 4-photo collage', slots: 4, cat: 'grids',
    canvas: { w: 1200, h: 1200 }, pad: 50, gap: 30, captionH: 130,
    rects: [
      { x: 0.042, y: 0.042, w: 0.445, h: 0.40 },
      { x: 0.513, y: 0.042, w: 0.445, h: 0.40 },
      { x: 0.042, y: 0.467, w: 0.445, h: 0.40 },
      { x: 0.513, y: 0.467, w: 0.445, h: 0.40 },
    ],
  },
  grid6: {
    id: 'grid6', name: 'Grid 2×3', desc: 'Six-photo story grid', slots: 6, cat: 'grids',
    canvas: { w: 1200, h: 1600 }, pad: 50, gap: 28, captionH: 130,
    rects: [
      { x: 0.042, y: 0.031, w: 0.445, h: 0.272 },
      { x: 0.513, y: 0.031, w: 0.445, h: 0.272 },
      { x: 0.042, y: 0.328, w: 0.445, h: 0.272 },
      { x: 0.513, y: 0.328, w: 0.445, h: 0.272 },
      { x: 0.042, y: 0.625, w: 0.445, h: 0.272 },
      { x: 0.513, y: 0.625, w: 0.445, h: 0.272 },
    ],
  },
  collage: {
    id: 'collage', name: 'Mix Collage', desc: 'One hero + two minis', slots: 3, cat: 'grids',
    canvas: { w: 1200, h: 1200 }, pad: 50, gap: 28, captionH: 120,
    rects: [
      { x: 0.042, y: 0.042, w: 0.60, h: 0.845 },
      { x: 0.667, y: 0.042, w: 0.291, h: 0.410 },
      { x: 0.667, y: 0.477, w: 0.291, h: 0.410 },
    ],
  },
  // ===== Singles & Retro =====
  polaroid: {
    id: 'polaroid', name: 'Polaroid', desc: 'Retro single frame', slots: 1, cat: 'singles',
    canvas: { w: 900, h: 1080 }, pad: 55, gap: 0, captionH: 190,
    rects: [{ x: 0.061, y: 0.051, w: 0.878, h: 0.66 }],
  },
  single: {
    id: 'single', name: 'Big Single', desc: 'One hero shot', slots: 1, cat: 'singles',
    canvas: { w: 1200, h: 1000 }, pad: 50, gap: 0, captionH: 140,
    rects: [{ x: 0.042, y: 0.05, w: 0.916, h: 0.76 }],
  },
  twin: {
    id: 'twin', name: 'Twin Stack', desc: 'Two stacked shots', slots: 2, cat: 'singles',
    canvas: { w: 900, h: 1400 }, pad: 50, gap: 30, captionH: 140,
    rects: [
      { x: 0.056, y: 0.036, w: 0.888, h: 0.415 },
      { x: 0.056, y: 0.487, w: 0.888, h: 0.415 },
    ],
  },
  // ===== Wide & Story =====
  duo: {
    id: 'duo', name: 'Duo Split', desc: 'Two-cam side by side', slots: 2, cat: 'wide',
    canvas: { w: 1400, h: 900 }, pad: 46, gap: 30, captionH: 120,
    rects: [
      { x: 0.033, y: 0.051, w: 0.452, h: 0.79 },
      { x: 0.515, y: 0.051, w: 0.452, h: 0.79 },
    ],
  },
  trio: {
    id: 'trio', name: 'Trio Row', desc: 'Three across, wide', slots: 3, cat: 'wide',
    canvas: { w: 1800, h: 800 }, pad: 46, gap: 28, captionH: 110,
    rects: [
      { x: 0.026, y: 0.063, w: 0.305, h: 0.80 },
      { x: 0.348, y: 0.063, w: 0.305, h: 0.80 },
      { x: 0.670, y: 0.063, w: 0.305, h: 0.80 },
    ],
  },
  story: {
    id: 'story', name: 'Story 9:16', desc: 'Vertical story format', slots: 2, cat: 'wide',
    canvas: { w: 900, h: 1600 }, pad: 50, gap: 30, captionH: 150,
    rects: [
      { x: 0.056, y: 0.031, w: 0.888, h: 0.40 },
      { x: 0.056, y: 0.469, w: 0.888, h: 0.40 },
    ],
  },
};

// Layout picker grouping (order matters)
export const LAYOUT_CATEGORIES = [
  { id: 'strips', label: 'Classic Strips', icon: '🎞️' },
  { id: 'grids', label: 'Grids & Collages', icon: '▦' },
  { id: 'singles', label: 'Singles & Retro', icon: '📸' },
  { id: 'wide', label: 'Wide & Story', icon: '🖼️' },
];

// ---------- Frames (border drawn around whole canvas) ----------
// Organized by color family via `cat`. Types: none | solid | gradient | emoji | film
// | double | dashed | glow | corners
export const FRAMES = [
  // ===== Essentials =====
  { id: 'none', name: 'None', type: 'none', cat: 'basic' },
  { id: 'white', name: 'Clean White', type: 'solid', color: '#ffffff', width: 26, cat: 'basic' },
  { id: 'black', name: 'Midnight', type: 'solid', color: '#14101f', width: 26, cat: 'basic' },
  { id: 'cream', name: 'Soft Cream', type: 'solid', color: '#fdf6ec', width: 26, cat: 'basic' },
  { id: 'double-white', name: 'Double White', type: 'double', color: '#ffffff', width: 22, cat: 'basic' },
  { id: 'double-black', name: 'Double Black', type: 'double', color: '#14101f', width: 22, cat: 'basic' },
  { id: 'corners-white', name: 'Corner Marks', type: 'corners', color: '#ffffff', width: 10, cat: 'basic' },
  { id: 'film', name: 'Film Strip', type: 'film', width: 34, cat: 'basic' },

  // ===== Pink & Love =====
  { id: 'pink', name: 'Hot Pink', type: 'solid', color: '#ff4d8d', width: 24, cat: 'pink' },
  { id: 'rose', name: 'Rose Dust', type: 'solid', color: '#fb7185', width: 24, cat: 'pink' },
  { id: 'blush-frame', name: 'Blush', type: 'solid', color: '#ffd9e3', width: 26, cat: 'pink' },
  { id: 'neon', name: 'Neon Glow', type: 'gradient', colors: ['#ff4d8d', '#a855f7', '#22d3ee'], width: 22, cat: 'pink' },
  { id: 'glow-pink', name: 'Pink Neon Glow', type: 'glow', color: '#ff4d8d', width: 14, cat: 'pink' },
  { id: 'heart', name: 'Love Border', type: 'emoji', emoji: '💗', width: 30, cat: 'pink' },
  { id: 'heart-red', name: 'Red Hearts', type: 'emoji', emoji: '❤️', width: 30, cat: 'pink' },

  // ===== Purple & Dreamy =====
  { id: 'purple', name: 'Ultra Violet', type: 'solid', color: '#a855f7', width: 24, cat: 'purple' },
  { id: 'lavender', name: 'Lavender', type: 'solid', color: '#c4b5fd', width: 26, cat: 'purple' },
  { id: 'dream', name: 'Dream Haze', type: 'gradient', colors: ['#c084fc', '#f0abfc', '#fbcfe8'], width: 22, cat: 'purple' },
  { id: 'glow-purple', name: 'Purple Neon Glow', type: 'glow', color: '#a855f7', width: 14, cat: 'purple' },
  { id: 'sparkle', name: 'Sparkle', type: 'emoji', emoji: '✨', width: 30, cat: 'purple' },
  { id: 'butterfly', name: 'Butterfly', type: 'emoji', emoji: '🦋', width: 30, cat: 'purple' },

  // ===== Blue & Cyan =====
  { id: 'cyan', name: 'Electric Cyan', type: 'solid', color: '#22d3ee', width: 24, cat: 'blue' },
  { id: 'navy', name: 'Deep Navy', type: 'solid', color: '#1e3a8a', width: 26, cat: 'blue' },
  { id: 'ocean', name: 'Ocean', type: 'gradient', colors: ['#22d3ee', '#3b82f6', '#a855f7'], width: 22, cat: 'blue' },
  { id: 'ice', name: 'Ice Blue', type: 'gradient', colors: ['#e0f2fe', '#7dd3fc', '#38bdf8'], width: 22, cat: 'blue' },
  { id: 'glow-cyan', name: 'Cyan Neon Glow', type: 'glow', color: '#22d3ee', width: 14, cat: 'blue' },
  { id: 'dashed-cyan', name: 'Dashed Cyan', type: 'dashed', color: '#22d3ee', width: 8, cat: 'blue' },

  // ===== Gold & Warm =====
  { id: 'gold', name: 'Golden Hour', type: 'solid', color: '#fbbf24', width: 24, cat: 'gold' },
  { id: 'peach', name: 'Peach', type: 'solid', color: '#fdba74', width: 26, cat: 'gold' },
  { id: 'sunset', name: 'Sunset', type: 'gradient', colors: ['#fbbf24', '#fb7185', '#a855f7'], width: 22, cat: 'gold' },
  { id: 'fire', name: 'Fire Fade', type: 'gradient', colors: ['#f97316', '#ef4444', '#be123c'], width: 22, cat: 'gold' },
  { id: 'star', name: 'Star Border', type: 'emoji', emoji: '⭐', width: 30, cat: 'gold' },
  { id: 'corners-gold', name: 'Gold Corners', type: 'corners', color: '#fbbf24', width: 10, cat: 'gold' },

  // ===== Green & Fresh =====
  { id: 'mint-frame', name: 'Mint', type: 'solid', color: '#6ee7b7', width: 26, cat: 'green' },
  { id: 'forest', name: 'Forest', type: 'solid', color: '#166534', width: 26, cat: 'green' },
  { id: 'lime-pop', name: 'Lime Pop', type: 'gradient', colors: ['#a3e635', '#34d399', '#22d3ee'], width: 22, cat: 'green' },
  { id: 'flower', name: 'Flower Power', type: 'emoji', emoji: '🌸', width: 30, cat: 'green' },
  { id: 'dashed-white', name: 'Dashed White', type: 'dashed', color: '#ffffff', width: 8, cat: 'green' },

  // ===== Trendy & Bold =====
  { id: 'holo', name: 'Holographic', type: 'holo', width: 24, cat: 'trendy' },
  { id: 'chrome', name: 'Chrome', type: 'chrome', width: 24, cat: 'trendy' },
  { id: 'gold-foil', name: 'Gold Foil', type: 'chrome', chromeColors: ['#fff7cc', '#fbbf24', '#92400e', '#fde68a', '#fff7cc'], width: 24, cat: 'trendy' },
  { id: 'rainbow', name: 'Rainbow Pop', type: 'gradient', colors: ['#ff4d8d', '#fbbf24', '#34d399', '#22d3ee', '#a855f7'], width: 24, cat: 'trendy' },
  { id: 'vapor', name: 'Vaporwave', type: 'gradient', colors: ['#ff77e9', '#7afcff', '#8c52ff'], width: 24, cat: 'trendy' },
  { id: 'glow-white', name: 'White Hot Glow', type: 'glow', color: '#ffffff', width: 14, cat: 'trendy' },
  { id: 'y2k', name: 'Y2K Disc', type: 'emoji', emoji: '💿', width: 30, cat: 'trendy' },
  { id: 'glitch', name: 'Glitch', type: 'dashed', color: '#ff4d8d', width: 10, cat: 'trendy' },
];

// Frame picker grouping (order matters)
export const FRAME_CATEGORIES = [
  { id: 'basic', label: 'Essentials', icon: '⬜' },
  { id: 'pink', label: 'Pink & Love', icon: '💗' },
  { id: 'purple', label: 'Purple & Dreamy', icon: '💜' },
  { id: 'blue', label: 'Blue & Cyan', icon: '💙' },
  { id: 'gold', label: 'Gold & Warm', icon: '💛' },
  { id: 'green', label: 'Green & Fresh', icon: '💚' },
  { id: 'trendy', label: 'Trendy & Bold', icon: '🌈' },
];

// ---------- Backgrounds / Backdrops (fills canvas behind photos) ----------
// Organized by color family via `cat`. Types: solid | gradient | pattern
// Pattern flags: grid | stars | hearts | confetti | checker | stripes | bokeh
// `dark: true` tells the caption renderer to use light text.
export const BACKGROUNDS = [
  // ===== Neutrals =====
  { id: 'cream', name: 'Cream', type: 'solid', color: '#fdf6ec', cat: 'neutral' },
  { id: 'white', name: 'Pure White', type: 'solid', color: '#ffffff', cat: 'neutral' },
  { id: 'ink', name: 'Ink Black', type: 'solid', color: '#14101f', cat: 'neutral', dark: true },
  { id: 'charcoal', name: 'Charcoal', type: 'solid', color: '#26232e', cat: 'neutral', dark: true },
  { id: 'gridpat', name: 'Graph Paper', type: 'pattern', base: '#f8fafc', dot: '#cbd5e1', grid: true, cat: 'neutral' },
  { id: 'checker', name: 'Checkerboard', type: 'pattern', base: '#ffffff', dot: '#e2e8f0', checker: true, cat: 'neutral' },

  // ===== Pink & Romance =====
  { id: 'blush', name: 'Blush', type: 'solid', color: '#ffd9e3', cat: 'pink' },
  { id: 'rose-garden', name: 'Rose Garden', type: 'gradient', colors: ['#ffe4e6', '#fda4af', '#fb7185'], cat: 'pink' },
  { id: 'candy', name: 'Candy', type: 'gradient', colors: ['#fbcfe8', '#f0abfc', '#c4b5fd'], cat: 'pink' },
  { id: 'hearts', name: 'Floating Hearts', type: 'pattern', base: '#fff1f2', dot: '#fb7185', hearts: true, cat: 'pink' },
  { id: 'neon', name: 'Neon Nights', type: 'gradient', colors: ['#2b0a3d', '#7c2d92', '#ff4d8d'], cat: 'pink', dark: true },

  // ===== Purple & Night =====
  { id: 'lavender-bg', name: 'Lavender Mist', type: 'gradient', colors: ['#ede9fe', '#c4b5fd', '#a78bfa'], cat: 'purple' },
  { id: 'galaxy', name: 'Galaxy', type: 'gradient', colors: ['#0f0c29', '#302b63', '#8e2de2'], cat: 'purple', dark: true },
  { id: 'stars', name: 'Starry Night', type: 'pattern', base: '#1e1b4b', dot: '#fde68a', stars: true, cat: 'purple', dark: true },
  { id: 'bokeh-purple', name: 'Purple Bokeh', type: 'pattern', base: '#2e1065', dot: '#c084fc', bokeh: true, cat: 'purple', dark: true },

  // ===== Blue & Ocean =====
  { id: 'ocean', name: 'Ocean Breeze', type: 'gradient', colors: ['#a5f3fc', '#38bdf8', '#818cf8'], cat: 'blue' },
  { id: 'sky', name: 'Clear Sky', type: 'gradient', colors: ['#e0f2fe', '#bae6fd', '#7dd3fc'], cat: 'blue' },
  { id: 'deep-sea', name: 'Deep Sea', type: 'gradient', colors: ['#082f49', '#0c4a6e', '#0369a1'], cat: 'blue', dark: true },
  { id: 'stripes-blue', name: 'Beach Stripes', type: 'pattern', base: '#f0f9ff', dot: '#7dd3fc', stripes: true, cat: 'blue' },

  // ===== Gold & Sunset =====
  { id: 'sunset', name: 'Sunset Pop', type: 'gradient', colors: ['#fde68a', '#fb7185', '#c084fc'], cat: 'gold' },
  { id: 'peach-cream', name: 'Peach Cream', type: 'gradient', colors: ['#ffedd5', '#fed7aa', '#fdba74'], cat: 'gold' },
  { id: 'golden-glow', name: 'Golden Glow', type: 'gradient', colors: ['#fef3c7', '#fcd34d', '#f59e0b'], cat: 'gold' },
  { id: 'confetti', name: 'Confetti Party', type: 'pattern', base: '#fffbeb', dot: '#f59e0b', confetti: true, cat: 'gold' },

  // ===== Green & Fresh =====
  { id: 'mint', name: 'Mint Fresh', type: 'gradient', colors: ['#d1fae5', '#6ee7b7', '#22d3ee'], cat: 'green' },
  { id: 'sage', name: 'Sage', type: 'solid', color: '#d9e8d4', cat: 'green' },
  { id: 'forest-bg', name: 'Forest Deep', type: 'gradient', colors: ['#052e16', '#14532d', '#166534'], cat: 'green', dark: true },
  { id: 'dots', name: 'Party Dots', type: 'pattern', base: '#fff7ed', dot: '#fb7185', cat: 'green' },
  { id: 'dots-mint', name: 'Mint Dots', type: 'pattern', base: '#ecfdf5', dot: '#34d399', cat: 'green' },

  // ===== Trendy & Bold =====
  { id: 'holo-bg', name: 'Holographic Dream', type: 'gradient', colors: ['#ff9a9e', '#fad0c4', '#fbc2eb', '#a6c1ee', '#84fab0'], cat: 'trendy' },
  { id: 'vapor-bg', name: 'Vaporwave', type: 'gradient', colors: ['#2b0a3d', '#ff77e9', '#7afcff'], cat: 'trendy', dark: true },
  { id: 'chrome-bg', name: 'Chrome Shine', type: 'gradient', colors: ['#e5e7eb', '#f9fafb', '#9ca3af', '#f9fafb'], cat: 'trendy' },
  { id: 'acid', name: 'Acid Pop', type: 'gradient', colors: ['#d9f99d', '#4ade80', '#22d3ee'], cat: 'trendy' },
];

// Backdrop picker grouping (order matters)
export const BACKGROUND_CATEGORIES = [
  { id: 'neutral', label: 'Neutrals', icon: '🤍' },
  { id: 'pink', label: 'Pink & Romance', icon: '🩷' },
  { id: 'purple', label: 'Purple & Night', icon: '💜' },
  { id: 'blue', label: 'Blue & Ocean', icon: '💙' },
  { id: 'gold', label: 'Gold & Sunset', icon: '💛' },
  { id: 'green', label: 'Green & Fresh', icon: '💚' },
  { id: 'trendy', label: 'Trendy & Bold', icon: '🌈' },
];

// ---------- Stickers (grouped by mood) ----------
export const STICKER_GROUPS = [
  {
    id: 'love', label: 'Love', icon: '❤️',
    items: ['❤️', '💖', '💕', '💘', '💝', '💗', '😍', '🥰', '😘', '💋', '💑', '💍'],
  },
  {
    id: 'party', label: 'Party', icon: '🎉',
    items: ['🎉', '🎊', '🎈', '🎂', '🥂', '🍾', '🎁', '🪩', '🎵', '🎶', '🔥', '💯'],
  },
  {
    id: 'cute', label: 'Cute', icon: '🌸',
    items: ['🌸', '🌺', '🌷', '🦋', '🐝', '🍓', '🍒', '🍉', '🦄', '🎀', '🧸', '💎'],
  },
  {
    id: 'vibes', label: 'Vibes', icon: '✨',
    items: ['🌟', '⭐', '✨', '💫', '🌈', '☀️', '🌙', '☁️', '⚡', '👑', '🕶️', '😎'],
  },
  {
    id: 'animals', label: 'Animals', icon: '🐱',
    items: ['🐱', '🐶', '🐼', '🐰', '🦊', '🐻', '🐨', '🦁', '🐸', '🐥', '🦆', '🐢'],
  },
  {
    id: 'food', label: 'Snacks', icon: '🧁',
    items: ['🍩', '🧁', '🍭', '🍬', '🍦', '🍰', '🍪', '🥤', '🧋', '🍕', '🌮', '🍿'],
  },
];

// Flat list (backwards compatible)
export const STICKERS = STICKER_GROUPS.flatMap((g) => g.items);

// ---------- Live camera filters ----------
export const FILTERS = [
  { id: 'none', name: 'Normal', css: 'none' },
  { id: 'bw', name: 'B&W', css: 'grayscale(1) contrast(1.1)' },
  { id: 'sepia', name: 'Retro', css: 'sepia(0.7) contrast(1.05)' },
  { id: 'warm', name: 'Warm', css: 'sepia(0.3) saturate(1.4) hue-rotate(-10deg)' },
  { id: 'cool', name: 'Cool', css: 'saturate(1.2) hue-rotate(15deg) brightness(1.05)' },
  { id: 'vivid', name: 'Vivid', css: 'saturate(1.8) contrast(1.15)' },
  { id: 'dream', name: 'Dreamy', css: 'brightness(1.1) saturate(1.3) blur(0.4px) hue-rotate(-8deg)' },
  { id: 'fade', name: 'Faded', css: 'contrast(0.85) brightness(1.1) saturate(0.8)' },
  { id: 'noir', name: 'Noir', css: 'grayscale(1) contrast(1.4) brightness(0.95)' },
  { id: 'blush-cam', name: 'Blush', css: 'saturate(1.3) hue-rotate(-15deg) brightness(1.08)' },
  { id: 'golden-cam', name: 'Golden', css: 'sepia(0.45) saturate(1.5) contrast(1.05) brightness(1.05)' },
  { id: 'arctic', name: 'Arctic', css: 'saturate(0.9) hue-rotate(25deg) brightness(1.12) contrast(0.95)' },
];

export const DEFAULT_EDIT = {
  layout: 'strip3',
  frame: 'white',
  background: 'cream',
  stickers: [], // { id, emoji, x, y, size } in relative coords
  caption: '',
};
