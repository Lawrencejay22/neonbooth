import React from 'react';

const features = [
  {
    icon: '📸',
    title: 'Dual Camera Mode',
    desc: 'Use two cameras at once — perfect for couples, besties, or front + back cam collages.',
  },
  {
    icon: '🎞️',
    title: '12 Templates',
    desc: 'Classic strips, mega strips, grids, collages, polaroids, duo splits, story format and more — switch anytime without losing shots.',
  },
  {
    icon: '🎨',
    title: 'Frames & Backdrops',
    desc: '60+ frames & backdrops organized by color — neon glows, film strips, emoji borders, hearts, confetti, bokeh and 70+ stickers.',
  },
  {
    icon: '🚀',
    title: 'Share Instantly',
    desc: 'Download in HD or share straight to friends and couples via the native share sheet.',
  },
];

const HomeView = ({ onStart, onChooseLayout }) => (
  <div className="view-container" style={{ paddingTop: '4vh' }}>
    <div className="hero-badge"><span className="dot" /> Online Photo Booth</div>

    <h1 className="hero-title">
      Strike a pose.<br />
      <span className="grad">Make it unforgettable.</span>
    </h1>

    <p className="hero-sub">
      Neon Booth turns your browser into a full photo booth — dual cameras, live filters,
      cute frames, stickers and instant sharing. No app install, no sign-up.
    </p>

    <div className="hero-cta">
      <button className="btn btn-primary btn-lg" onClick={onStart}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        Start Shooting
      </button>
      <button className="btn btn-ghost btn-lg" onClick={onChooseLayout}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
        Browse Layouts
      </button>
    </div>

    <div className="feature-grid">
      {features.map((f) => (
        <div key={f.title} className="feature-card glass-panel">
          <div className="feature-icon"><span style={{ fontSize: '1.4rem' }}>{f.icon}</span></div>
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default HomeView;
