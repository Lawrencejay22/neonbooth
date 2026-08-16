import React, { useRef, useEffect, useState } from 'react';
import { composeCard } from '../lib/compose';

const FinalView = ({ photos, edit, onDone, onEdit }) => {
  const canvasRef = useRef(null);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (canvasRef.current && photos.length > 0) {
      composeCard(canvasRef.current, photos, edit).then(() => setReady(true));
    }
  }, [photos, edit]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2600);
  };

  const canvasToBlob = () =>
    new Promise((res) => canvasRef.current.toBlob(res, 'image/png', 0.95));

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = canvasRef.current.toDataURL('image/png');
    a.download = `neon-booth-${Date.now()}.png`;
    a.click();
    showToast('📥 Downloaded in HD!');
  };

  const handleShare = async () => {
    try {
      const blob = await canvasToBlob();
      const file = new File([blob], 'neon-booth.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Neon Booth',
          text: 'Check out our photo booth pic! 📸💕',
        });
        showToast('🚀 Shared!');
      } else if (navigator.share) {
        await navigator.share({ title: 'Neon Booth', text: 'Check out our photo booth pic! 📸💕' });
        showToast('🚀 Shared!');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('📋 Image copied — paste it anywhere to share!');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        try {
          const blob = await canvasToBlob();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          showToast('📋 Image copied — paste it anywhere to share!');
        } catch {
          showToast('⚠️ Sharing not supported — use Download instead');
        }
      }
    }
  };

  const handleCopy = async () => {
    try {
      const blob = await canvasToBlob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      showToast('📋 Copied to clipboard!');
    } catch {
      showToast('⚠️ Copy not supported in this browser');
    }
  };

  return (
    <div className="view-container">
      <h2 className="view-title">Your <span className="grad">final shot</span> ✨</h2>
      <p className="view-sub">Download it, or share it straight to your friends & your favorite couple chat.</p>

      <div className="final-wrap">
        <div className="final-stage glass-panel">
          {photos.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', padding: 40 }}>Nothing to show yet — capture some photos first!</p>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>

        {ready && (
          <div className="final-actions">
            <button className="btn btn-primary btn-lg" onClick={handleShare}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
            <button className="btn btn-cyan btn-lg" onClick={handleDownload}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download HD
            </button>
            <button className="btn btn-ghost" onClick={handleCopy}>📋 Copy</button>
            <button className="btn btn-gold" onClick={onEdit}>← Edit more</button>
            <button className="btn btn-green" onClick={onDone}>Done ✓</button>
          </div>
        )}
      </div>

      {toast && <div className="share-toast">{toast}</div>}
    </div>
  );
};

export default FinalView;
