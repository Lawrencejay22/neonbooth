import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { composeCard } from '../lib/compose';
import { PRINT_SIZES } from '../lib/options';

const FinalView = ({ photos, edit, onDone, onEdit }) => {
  const canvasRef = useRef(null);
  const [toast, setToast] = useState('');
  const [ready, setReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  // Print
  const [showPrint, setShowPrint] = useState(false);
  const [printSize, setPrintSize] = useState('4x6');
  const [copies, setCopies] = useState(1);
  const [printImage, setPrintImage] = useState('');

  // QR + photo detail
  const [qrUrl, setQrUrl] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [detailImg, setDetailImg] = useState('');

  useEffect(() => {
    if (canvasRef.current && photos.length > 0) {
      composeCard(canvasRef.current, photos, edit).then(() => setReady(true));
    }
  }, [photos, edit]);

  // Build the QR for the uploaded link whenever it changes
  useEffect(() => {
    if (!uploadedUrl) { setQrUrl(''); return; }
    QRCode.toDataURL(uploadedUrl, {
      width: 260,
      margin: 1,
      color: { dark: '#1b1030', light: '#ffffff' },
    }).then(setQrUrl).catch(() => setQrUrl(''));
  }, [uploadedUrl]);

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

  // Cloud upload uses imgbb so the resulting link opens on ANY device — no
  // local server required. Get a free key at https://api.imgbb.com/ and set
  // VITE_IMGBB_KEY in your .env file. If you already run your own upload
  // backend, set VITE_API_URL and it's used instead.
  const handleUpload = async () => {
    setIsUploading(true);
    setToast('☁️ Uploading...');
    try {
      const blob = await canvasToBlob();
      const apiUrl = import.meta.env.VITE_API_URL;
      const imgbbKey = import.meta.env.VITE_IMGBB_KEY;

      let shareUrl;

      if (apiUrl) {
        // Custom backend, if configured
        const formData = new FormData();
        formData.append('photo', blob, 'neon-booth.png');
        const res = await fetch(`${apiUrl}/api/upload`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        shareUrl = data.imageUrl;
      } else if (imgbbKey) {
        const formData = new FormData();
        formData.append('image', blob, 'neon-booth.png');
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data?.error?.message || 'Upload failed');
        // url_viewer is a nice landing page that opens cleanly on any device;
        // data.url is the direct image file if you'd rather link that instead.
        shareUrl = data.data.url_viewer;
      } else {
        throw new Error(
          'No upload destination configured. Get a free key at https://api.imgbb.com/ and set VITE_IMGBB_KEY in your .env file (or set VITE_API_URL to use your own backend).'
        );
      }

      setUploadedUrl(shareUrl);
      showToast('☁️ Uploaded! QR code is ready below.');
    } catch (err) {
      console.error(err);
      showToast(`⚠️ ${err.message || 'Upload failed'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // ---------- Print ----------
  const openPrint = () => {
    setPrintImage(canvasRef.current.toDataURL('image/png'));
    setShowPrint(true);
  };

  // Grabs a fresh render, closes the dialog and fires the browser print —
  // with the @page rules in index.css the sheet comes out at exactly the
  // selected size, copies included.
  const doPrint = () => {
    setPrintImage(canvasRef.current.toDataURL('image/png'));
    setShowPrint(false);
    setTimeout(() => window.print(), 120);
  };

  // ---------- Photo detail (QR click) ----------
  const openDetail = () => {
    setDetailImg(canvasRef.current.toDataURL('image/png'));
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).then(
      () => showToast('📋 Link copied!'),
      () => showToast('⚠️ Could not copy link')
    );
  };

  const handleDetailShare = async () => {
    const url = uploadedUrl || window.location.href;
    const text = 'Our Neon Booth photo! 📸';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Neon Booth', text, url });
        showToast('🚀 Shared!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    copyLink(url);
  };

  return (
    <div className="view-container">
      <h2 className="view-title">Your <span className="grad">final shot</span> ✨</h2>
      <p className="view-sub">Download it, print it, or share it straight to your friends & your favorite couple chat.</p>

      <div className="final-wrap">
        <div className="final-stage glass-panel">
          {photos.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', padding: 40 }}>Nothing to show yet — capture some photos first!</p>
          ) : (
            <canvas ref={canvasRef} />
          )}
        </div>

        {ready && (
          <div className="final-actions" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
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
              <button className="btn btn-gold btn-lg" onClick={handleUpload} disabled={isUploading}>
                ☁️ {isUploading ? 'Uploading...' : 'Upload to Cloud'}
              </button>
              <button className="btn btn-green btn-lg" onClick={openPrint}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Print
              </button>
            </div>

            {uploadedUrl && (
              <div style={{ marginTop: 20, padding: 18, background: 'var(--glass)', borderRadius: 12, border: '1px solid var(--stroke)', width: '100%', maxWidth: 520, textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 6 }}>Your photo is live at:</p>
                <a href={uploadedUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--cyan)', fontWeight: 600, wordBreak: 'break-all' }}>
                  {uploadedUrl}
                </a>
                <div style={{ marginTop: 10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => copyLink(uploadedUrl)}>📋 Copy Link</button>
                </div>

                {qrUrl && (
                  <button className="qr-tile" style={{ margin: '16px auto 0' }} onClick={openDetail} title="View photo details">
                    <img src={qrUrl} alt="QR code — tap for photo details" />
                    <span>Tap the QR to view photo details</span>
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={handleCopy}>📋 Copy</button>
              <button className="btn btn-gold" onClick={onEdit}>← Edit more</button>
              <button className="btn btn-green" onClick={onDone}>Done ✓</button>
            </div>
          </div>
        )}
      </div>

      {/* ---------- Print dialog ---------- */}
      {showPrint && (
        <div className="modal-overlay" onClick={() => setShowPrint(false)}>
          <div className="modal-card glass-panel print-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Print your photo 🖨️</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPrint(false)}>✕</button>
            </div>
            <p className="hint-text" style={{ marginTop: 0, marginBottom: 18, textAlign: 'center' }}>
              Pick a paper size and hit Print — the print dialog opens with your photo fitted to the sheet.
            </p>

            <div className="print-size-grid">
              {PRINT_SIZES.map((s) => (
                <button
                  key={s.id}
                  className={`print-size-card ${printSize === s.id ? 'active' : ''}`}
                  onClick={() => setPrintSize(s.id)}
                >
                  <span className={`print-size-shape shape-${s.id}`} />
                  <b>{s.label}</b>
                  <small>{s.desc}</small>
                </button>
              ))}
            </div>

            <div className="print-copies">
              <span>Copies</span>
              <div className="copies-stepper">
                <button onClick={() => setCopies((c) => Math.max(1, c - 1))} aria-label="Fewer copies">−</button>
                <b>{copies}</b>
                <button onClick={() => setCopies((c) => Math.min(6, c + 1))} aria-label="More copies">+</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={doPrint}>🖨 Print now</button>
              <button className="btn btn-ghost btn-lg" onClick={() => setShowPrint(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Photo detail (QR) dialog ---------- */}
      {showDetail && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal-card glass-panel detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Photo details 📸</h2>
              <button className="btn btn-ghost btn-sm" onClick={closeDetail}>✕</button>
            </div>
            <div className="detail-body">
              <img className="detail-photo" src={detailImg} alt="Final photo" />
              <div className="detail-side">
                {qrUrl && (
                  <button className="qr-tile" onClick={() => window.open(uploadedUrl, '_blank')} title="Open the link">
                    <img src={qrUrl} alt="QR code" />
                    <span>Scan to open on any phone</span>
                  </button>
                )}
                <p className="hint-text" style={{ textAlign: 'center' }}>
                  Anyone who scans this code gets this exact photo — perfect next to the printer at your booth.
                </p>
                <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                  <button className="btn btn-primary btn-lg" onClick={handleDetailShare}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                    </svg>
                    Share
                  </button>
                  <button className="btn btn-ghost btn-lg" onClick={closeDetail}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="share-toast">{toast}</div>}

      {/* Off-screen sheets the browser actually prints (portal keeps it
          outside .app-wrapper so the print CSS can hide the app) */}
      {createPortal(
        <div className={`print-area page-${printSize}`}>
          {printImage &&
            Array.from({ length: copies }).map((_, i) => (
              <div className="print-sheet" key={i}>
                <img src={printImage} alt="" />
              </div>
            ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default FinalView;
