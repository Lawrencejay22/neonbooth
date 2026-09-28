import React, { useEffect, useRef, useState } from 'react';
import { timedUrl, hostOf, frameSize } from '../lib/wireless';

// MJPEG plays straight into an <img>; snapshot polling and WebSocket frames
// are painted into a canvas instead, because re-assigning an <img> src blanks
// the preview between frames.
const WirelessFeed = ({ config, frameRef, filterCss, countdown, flashing, onStatus, label, resLabel }) => {
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('connecting');
  const [error, setError] = useState('');
  const [readable, setReadable] = useState(true);
  const [reloadTick, setReloadTick] = useState(0);

  const isMjpeg = config.mode === 'mjpeg';

  useEffect(() => {
    frameRef.current = (isMjpeg ? imgRef : canvasRef).current;
  });

  useEffect(() => {
    const size = phase === 'live' ? frameSize((isMjpeg ? imgRef : canvasRef).current) : null;
    onStatus({ phase, readable, res: size ? `${size.w}×${size.h}` : null });
  }, [phase, readable, isMjpeg, onStatus]);

  useEffect(() => {
    let cancelled = false;
    let timer = null;
    let sock = null;
    let objUrl = null;
    // A camera that sends no CORS headers still displays fine, so the first
    // attempt is made readable-but-strict and falls back to a plain preview.
    let cors = true;
    let failed = false;

    setPhase('connecting');
    setError('');

    const fail = (msg) => {
      if (cancelled || failed) return;
      failed = true;
      setError(msg);
      setPhase('error');
    };

    const loader = new Image();
    const img = imgRef.current;

    const paint = () => {
      const canvas = canvasRef.current;
      if (cancelled || !canvas) return;
      const w = loader.naturalWidth;
      const h = loader.naturalHeight;
      if (!w || !h) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const ctx = canvas.getContext('2d');
      ctx.drawImage(loader, 0, 0, w, h);
      setPhase('live');
    };

    const nextFrame = () => {
      loader.src = timedUrl(config.url);
    };

    loader.onload = paint;
    loader.onerror = () => {
      if (cancelled) return;
      // A junk frame from a live socket is not a connection failure.
      if (config.mode === 'ws') return;
      if (cors) {
        cors = false;
        setReadable(false);
        loader.crossOrigin = null;
        nextFrame();
        return;
      }
      fail(`Could not load ${hostOf(config.url)}. Check the camera is on this network and the URL answers in a new tab.`);
    };

    if (isMjpeg) {
      if (!img) return () => { cancelled = true; };
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (!cancelled) setPhase('live');
      };
      img.onerror = () => {
        if (cancelled) return;
        if (cors) {
          cors = false;
          setReadable(false);
          img.removeAttribute('crossorigin');
          img.src = config.url;
          return;
        }
        fail(`Could not open ${hostOf(config.url)}. MJPEG needs the camera own live-stream URL, usually on its own HTTP port.`);
      };
      img.src = config.url;
    } else if (config.mode === 'snapshot') {
      loader.crossOrigin = 'anonymous';
      nextFrame();
      timer = setInterval(nextFrame, config.interval);
    } else {
      try {
        sock = new WebSocket(config.url);
      } catch {
        fail('That WebSocket URL could not be opened.');
        return () => { cancelled = true; };
      }
      sock.binaryType = 'arraybuffer';
      let opened = false;
      sock.onopen = () => {
        opened = true;
      };
      sock.onmessage = (ev) => {
        if (cancelled) return;
        let src = null;
        let owned = null;
        if (ev.data instanceof ArrayBuffer) {
          owned = URL.createObjectURL(new Blob([ev.data], { type: 'image/jpeg' }));
          src = owned;
        } else if (ev.data instanceof Blob) {
          owned = URL.createObjectURL(ev.data);
          src = owned;
        } else if (typeof ev.data === 'string') {
          src = ev.data.startsWith('data:') ? ev.data : `data:image/jpeg;base64,${ev.data}`;
        }
        if (!src) return;
        if (objUrl) URL.revokeObjectURL(objUrl);
        objUrl = owned;
        loader.src = src;
      };
      sock.onclose = () => {
        fail(opened ? 'The camera closed the WebSocket connection.' : `Could not reach ${hostOf(config.url)} over WebSocket. Is the bridge running?`);
      };
      sock.onerror = () => {
        fail(`Could not reach ${hostOf(config.url)} over WebSocket. Is the bridge running?`);
      };
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (sock) {
        sock.onmessage = sock.onopen = sock.onclose = sock.onerror = null;
        try {
          sock.close();
        } catch {
          /* already gone */
        }
      }
      if (objUrl) URL.revokeObjectURL(objUrl);
      loader.onload = loader.onerror = null;
      if (isMjpeg && img) img.src = 'data:,';
    };
  }, [config, isMjpeg, reloadTick]);

  const retry = () => setReloadTick((t) => t + 1);
  const frameClass = `wifi-frame ${config.mirror ? 'mirrored' : ''}`;

  return (
    <div className="cam-feed cam-feed-wireless">
      <img
        ref={imgRef}
        alt=""
        className={frameClass}
        style={{ filter: filterCss, opacity: isMjpeg && phase !== 'error' ? 1 : 0 }}
      />
      <canvas
        ref={canvasRef}
        className={frameClass}
        style={{ filter: filterCss, opacity: !isMjpeg && phase !== 'error' ? 1 : 0 }}
      />

      {phase !== 'live' && (
        <div className="cam-feed-empty">
          <span style={{ fontSize: '1.6rem' }}>{phase === 'error' ? '📡' : '🛜'}</span>
          <span>{phase === 'error' ? error : `Connecting to ${hostOf(config.url)}…`}</span>
          {phase === 'error' && (
            <button className="btn btn-ghost btn-sm" onClick={retry} style={{ marginTop: 12 }}>
              Retry stream
            </button>
          )}
        </div>
      )}

      <div className="cam-label">
        <span className="rec" />
        {label || 'WIFI'} · {hostOf(config.url)}{resLabel ? ` · ${resLabel}` : ''}
      </div>

      {flashing && <div className="cam-flash" />}
      {countdown !== null && countdown > 0 && <div className="cam-countdown">{countdown}</div>}
    </div>
  );
};

export default WirelessFeed;
