import React from 'react';
import { LAYOUTS, LAYOUT_CATEGORIES } from '../lib/options';

// Renders a mini schematic preview of each layout
const LayoutMini = ({ layout }) => {
  const { canvas, rects } = layout;
  const ar = canvas.w / canvas.h;
  const w = ar >= 1 ? 110 : Math.max(52, 110 * ar);
  const h = ar >= 1 ? Math.max(52, 110 / ar) : 110;
  return (
    <div className="layout-mini" style={{ width: w + 12, height: h + 12, position: 'relative', display: 'block' }}>
      {rects.map((r, i) => (
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

const LayoutView = ({ onSelectLayout, currentLayout }) => (
  <div className="view-container">
    <h2 className="view-title">Pick your <span className="grad">template</span></h2>
    <p className="view-sub">
      {Object.keys(LAYOUTS).length} templates in {LAYOUT_CATEGORIES.length} collections — switch later in the editor without losing anything.
    </p>

    {LAYOUT_CATEGORIES.map((cat) => {
      const items = Object.values(LAYOUTS).filter((l) => l.cat === cat.id);
      if (items.length === 0) return null;
      return (
        <div key={cat.id} className="layout-cat-block">
          <div className="cat-header cat-header-lg">
            <span className="cat-icon">{cat.icon}</span>
            {cat.label}
            <span className="cat-count">{items.length}</span>
          </div>
          <div className="layout-grid">
            {items.map((layout) => (
              <div
                key={layout.id}
                className={`layout-card glass-panel ${currentLayout === layout.id ? 'selected' : ''}`}
                onClick={() => onSelectLayout(layout.id)}
              >
                <LayoutMini layout={layout} />
                <div>
                  <h4>{layout.name}</h4>
                  <p>{layout.desc} · {layout.slots} photo{layout.slots > 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

export default LayoutView;
