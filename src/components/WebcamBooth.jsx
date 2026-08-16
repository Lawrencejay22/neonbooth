import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FILTERS } from '../lib/options';

// A single live camera feed with its own device picker
const CamFeed = ({ videoRef, stream, label, devices, selectedDeviceId, onSelectDevice, countdown, flashing, filterCss }) => (
  <div className="cam-feed">
    <video
      ref={(el) => {
        if (videoRef) videoRef.current = el;
        if (el && stream && el.srcObject !== stream) el.srcObject = stream;
      }}
      autoPlay playsInline muted
      style={{ filter: filterCss }}
    />
    <div className="cam-label"><span className="rec" />{label}</div>
    {devices.length > 1 && (
      <select
        className="cam-select"
        value={selectedDeviceId || ''}
        onChange={(e) => onSelectDevice(e.target.value)}
        title="Choose camera for this feed"
      >
        {devices.map((d, i) => (
          <option key={d.deviceId || i} value={d.deviceId}>
            {d.label || `Camera ${i + 1}`}
          </option>
        ))}
      </select>
    )}
    {flashing && <div className="cam-flash" />}
    {countdown !== null && countdown > 0 && <div className="cam-countdown">{countdown}</div>}
  </div>
);

const WebcamBooth = ({ onCapture, dualMode }) => {
  const videoRefs = [useRef(null), useRef(null)];
  const canvasRef = useRef(null);
  const streamsRef = useRef([null, null]);

  const [devices, setDevices] = useState([]);
  const [deviceIds, setDeviceIds] = useState([null, null]); // per-feed deviceId
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [flashing, setFlashing] = useState(false);
  const [filter, setFilter] = useState('none');
  const [streams, setStreams] = useState([null, null]);
  const [, forceTick] = useState(0);

  const filterCss = (FILTERS.find((f) => f.id === filter) || FILTERS[0]).css;
  const feedCount = dualMode ? 2 : 1;

  // Enumerate cameras (after permission, labels become available)
  const refreshDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      const vids = all.filter((d) => d.kind === 'videoinput');
      setDevices(vids);
      return vids;
    } catch {
      return [];
    }
  }, []);

  const startFeed = useCallback(async (index, vids, options = {}) => {
    try {
      if (streamsRef.current[index]) {
        streamsRef.current[index].getTracks().forEach((t) => t.stop());
      }
      
      // If we only have 1 camera and we want dual mode, clone the first stream to avoid black screen
      if (options.cloneFromIndex !== undefined && streamsRef.current[options.cloneFromIndex]) {
        const clone = streamsRef.current[options.cloneFromIndex].clone();
        streamsRef.current[index] = clone;
        setStreams((prev) => { const n = [...prev]; n[index] = clone; return n; });
        if (videoRefs[index].current) videoRefs[index].current.srcObject = clone;
        
        const track = clone.getVideoTracks()[0];
        const settings = track?.getSettings?.();
        if (settings?.deviceId) {
          setDeviceIds((prev) => { const n = [...prev]; n[index] = settings.deviceId; return n; });
        }
        return clone;
      }

      const videoConstraints = { width: { ideal: 1280 }, height: { ideal: 960 } };
      if (options.deviceId) {
        videoConstraints.deviceId = { exact: options.deviceId };
      } else if (options.facingMode) {
        videoConstraints.facingMode = { ideal: options.facingMode };
      } else {
        videoConstraints.facingMode = { ideal: 'user' };
      }

      const constraints = {
        video: videoConstraints,
        audio: false,
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamsRef.current[index] = stream;
      setStreams((prev) => { const n = [...prev]; n[index] = stream; return n; });
      if (videoRefs[index].current) videoRefs[index].current.srcObject = stream;

      // Track which physical device we got
      const track = stream.getVideoTracks()[0];
      const settings = track?.getSettings?.();
      if (settings?.deviceId) {
        setDeviceIds((prev) => { const n = [...prev]; n[index] = settings.deviceId; return n; });
      }
      setError('');
      return stream;
    } catch (err) {
      console.error(`Camera feed ${index} error:`, err);
      setError('Camera access denied or unavailable. Please allow camera permission and retry.');
      return null;
    }
  }, []);

  // Boot: get permission + devices, then start feeds
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        tempStream.getTracks().forEach(t => t.stop());
      } catch (err) {
        if (!cancelled) setError('Camera access denied or unavailable. Please allow camera permission and retry.');
        return;
      }
      if (cancelled) return;

      const vids = await refreshDevices();
      if (cancelled || vids.length === 0) return;

      // Assign distinct devices per feed when possible
      const front = vids.find(v => v.label.toLowerCase().includes('front') || v.label.toLowerCase().includes('user')) || vids[0];
      await startFeed(0, vids, { deviceId: front.deviceId });

      if (feedCount === 2) {
        let back = vids.find(v => v.label.toLowerCase().includes('back') || v.label.toLowerCase().includes('environment') || v.label.toLowerCase().includes('rear'));
        if (!back && vids.length > 1) {
          back = vids.find(v => v.deviceId !== front.deviceId);
        }
        
        if (back) {
          await startFeed(1, vids, { deviceId: back.deviceId });
        } else if (vids.length === 1) {
          // If there's only 1 camera on the device, clone it to avoid double usage errors
          await startFeed(1, vids, { cloneFromIndex: 0 });
        } else {
          // Fallback to requesting the environment camera explicitly
          await startFeed(1, vids, { facingMode: 'environment' });
        }
      }
    })();
    return () => {
      cancelled = true;
      streamsRef.current.forEach((s) => s?.getTracks().forEach((t) => t.stop()));
      streamsRef.current = [null, null];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedCount]);

  const handleSelectDevice = (index, deviceId) => {
    setDeviceIds((prev) => { const n = [...prev]; n[index] = deviceId; return n; });
    startFeed(index, devices, { deviceId });
  };

  const swapCameras = () => {
    if (devices.length < 2) return;
    setDeviceIds((prev) => {
      if (feedCount === 2) {
        const next = [prev[1] || devices[1]?.deviceId, prev[0] || devices[0]?.deviceId];
        startFeed(0, devices, { deviceId: next[0] });
        startFeed(1, devices, { deviceId: next[1] });
        return next;
      } else {
        const currentIndex = devices.findIndex(d => d.deviceId === prev[0]);
        const nextIndex = (currentIndex >= 0 ? currentIndex + 1 : 1) % devices.length;
        const nextId = devices[nextIndex].deviceId;
        startFeed(0, devices, { deviceId: nextId });
        return [nextId, prev[1]];
      }
    });
    forceTick((t) => t + 1);
  };

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (dualMode && streamsRef.current[0] && streamsRef.current[1]) {
      // Side-by-side dual capture
      const v0 = videoRefs[0].current, v1 = videoRefs[1].current;
      if (!v0 || !v1 || !v0.videoWidth || !v1.videoWidth) return;
      const h = Math.max(v0.videoHeight, v1.videoHeight);
      const w0 = v0.videoWidth * (h / v0.videoHeight);
      const w1 = v1.videoWidth * (h / v1.videoHeight);
      canvas.width = w0 + w1;
      canvas.height = h;
      ctx.filter = filterCss;
      // mirror each half
      ctx.save(); ctx.translate(w0, 0); ctx.scale(-1, 1); ctx.drawImage(v0, 0, 0, w0, h); ctx.restore();
      ctx.save(); ctx.translate(w0 + w1, 0); ctx.scale(-1, 1); ctx.drawImage(v1, w0, 0, w1, h); ctx.restore();
      ctx.filter = 'none';
    } else {
      const video = videoRefs[0].current;
      if (!video || !video.videoWidth) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.filter = filterCss;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    }

    onCapture(canvas.toDataURL('image/jpeg', 0.92));
    setFlashing(true);
    setTimeout(() => setFlashing(false), 260);
  }, [dualMode, filterCss, onCapture]);

  const triggerCountdown = () => { if (countdown === null) setCountdown(3); };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(t);
    }
    capturePhoto();
    setCountdown(null);
  }, [countdown, capturePhoto]);

  if (error) {
    return (
      <div className="glass-panel" style={{ padding: '50px 30px', textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: '3rem', marginBottom: 14 }}>📷</div>
        <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Camera unavailable</h3>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', maxWidth: 420, margin: '0 auto 20px' }}>{error}</p>
        <button className="btn btn-primary" onClick={() => { setError(''); startFeed(0, devices, deviceIds[0]); }}>
          Retry Camera
        </button>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      <div className={`dual-grid ${dualMode ? 'dual' : ''}`}>
        {Array.from({ length: feedCount }).map((_, i) => (
          <CamFeed
            key={i}
            videoRef={videoRefs[i]}
            stream={streams[i]}
            label={dualMode ? `CAM ${i + 1}` : 'LIVE'}
            devices={devices}
            selectedDeviceId={deviceIds[i]}
            onSelectDevice={(id) => handleSelectDevice(i, id)}
            countdown={countdown}
            flashing={flashing}
            filterCss={filterCss}
          />
        ))}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Filters */}
      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? 'active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.name}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {devices.length > 1 && (
          <button className="btn btn-ghost btn-sm" onClick={swapCameras} title="Swap / switch cameras">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 4v5h-5" /><path d="M20 9l-4.5-4.5A9 9 0 0 0 3.5 12" />
              <path d="M4 20v-5h5" /><path d="M4 15l4.5 4.5A9 9 0 0 0 20.5 12" />
            </svg>
            Switch
          </button>
        )}
        <button className="shutter-btn" onClick={triggerCountdown} disabled={countdown !== null} title="Capture (3s timer)">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>
        <div style={{ width: 90 }} />
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: -6 }}>
        {dualMode ? 'Both cameras capture together in one shot' : 'Tap the shutter — 3 second timer'}
      </p>
    </div>
  );
};

export default WebcamBooth;
