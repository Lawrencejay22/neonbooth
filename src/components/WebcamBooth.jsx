import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { FILTERS } from '../lib/options';
import WirelessFeed from './WirelessFeed';
import WifiConnectModal from './WifiConnectModal';
import { hostOf, frameSize, recallWifi, rememberWifi } from '../lib/wireless';


const RES_IDEAL = { width: { ideal: 3840 }, height: { ideal: 2160 } };

// A single live camera feed with its own device picker
const CamFeed = ({ videoRef, stream, label, resLabel, devices, selectedDeviceId, onSelectDevice, countdown, flashing, filterCss, placeholder }) => {
  const localRef = useRef(null);

  // Keep the parent's ref pointed at the actual <video> node
  useEffect(() => {
    videoRef.current = localRef.current;
  });

  
  useEffect(() => {
    if (localRef.current && localRef.current.srcObject !== (stream || null)) {
      localRef.current.srcObject = stream || null;
    }
  }, [stream]);

  return (
    <div className="cam-feed">
      <video ref={localRef} autoPlay playsInline muted style={{ filter: filterCss }} />
      {!stream && (
        <div className="cam-feed-empty">
          <span style={{ fontSize: '1.6rem' }}>📷</span>
          <span>{placeholder || 'Starting camera…'}</span>
        </div>
      )}
      <div className="cam-label"><span className="rec" />{label}{resLabel ? ` · ${resLabel}` : ''}</div>
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
};

const WebcamBooth = ({ onCapture, dualMode, setDualMode }) => {
  const refA = useRef(null);
  const refB = useRef(null);
  const videoRefs = useMemo(() => [refA, refB], [refA, refB]);
  const canvasRef = useRef(null);
  const wifiFrameRef = useRef(null);
  const streamsRef = useRef([null, null]);

  const [devices, setDevices] = useState([]);
  const [deviceIds, setDeviceIds] = useState([null, null]); // per-feed deviceId
  const [error, setError] = useState(''); // fatal: primary camera is down
  const [warning, setWarning] = useState(''); // non-fatal: secondary camera issue
  const [countdown, setCountdown] = useState(null);
  const [flashing, setFlashing] = useState(false);
  const [filter, setFilter] = useState('none');
  const [streams, setStreams] = useState([null, null]);
  const [res, setRes] = useState([null, null]);
  const [wifi, setWifi] = useState(recallWifi); // { mode, url, interval, mirror }
  const [showWifi, setShowWifi] = useState(false);
  const [wifiStatus, setWifiStatus] = useState({ phase: 'connecting', readable: true });
  const [, forceTick] = useState(0);

  const filterCss = (FILTERS.find((f) => f.id === filter) || FILTERS[0]).css;
  const feedCount = dualMode ? 2 : 1;

  const handleWifiStatus = useCallback((s) => {
    setWifiStatus((prev) => (prev.phase === s.phase && prev.readable === s.readable ? prev : s));
  }, []);

  // A stream can display perfectly while the camera refuses to hand its pixels
  // back to the page, which quietly breaks the shutter — say so up front.
  useEffect(() => {
    if (wifi && wifiStatus.phase === 'live' && !wifiStatus.readable) {
      setWarning('This stream shows on screen, but the camera will not let the browser read its pixels, so shots cannot be taken. Switch to WebSocket frames mode, or connect the camera by USB.');
    }
  }, [wifi, wifiStatus]);

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

  // isPrimary controls how failures are reported: a primary (feed 0) failure
  // is fatal and shows the full error screen; a secondary (feed 1) failure
  // is just a warning and must never take down an already-working feed 0.
  const startFeed = useCallback(async (index, options = {}) => {
    const isPrimary = index === 0;
    try {
      const otherIndex = index === 0 ? 1 : 0;
      const otherStream = streamsRef.current[otherIndex];
      const otherDeviceId = otherStream?.getVideoTracks()[0]?.getSettings?.()?.deviceId;

      if (streamsRef.current[index]) {
        // Only stop tracks if they aren't being shared with the other feed
        if (streamsRef.current[index] !== otherStream) {
          streamsRef.current[index].getTracks().forEach((t) => t.stop());
        }
      }

      const applyStream = (streamToApply) => {
        streamsRef.current[index] = streamToApply;
        setStreams((prev) => { const n = [...prev]; n[index] = streamToApply; return n; });

        const track = streamToApply.getVideoTracks()[0];
        const settings = track?.getSettings?.();
        if (settings?.deviceId) {
          setDeviceIds((prev) => { const n = [...prev]; n[index] = settings.deviceId; return n; });
        }
        setRes((prev) => {
          const n = [...prev];
          n[index] = settings?.width && settings?.height ? `${settings.width}×${settings.height}` : null;
          return n;
        });
        if (isPrimary) setError('');
        else setWarning('');
        return streamToApply;
      };

      // Intercept explicit requests to use the same device, or clone requests
      if (options.cloneFromIndex !== undefined || (options.deviceId && options.deviceId === otherDeviceId)) {
        const sourceStream = streamsRef.current[options.cloneFromIndex !== undefined ? options.cloneFromIndex : otherIndex];
        if (sourceStream) {
          return applyStream(sourceStream);
        }
      }

      let videoConstraints = { ...RES_IDEAL };
      if (options.deviceId) {
        videoConstraints = { deviceId: { exact: options.deviceId }, ...RES_IDEAL };
      } else if (options.facingMode) {
        videoConstraints = { facingMode: { ideal: options.facingMode }, ...RES_IDEAL };
      }

      let constraints = { video: videoConstraints, audio: false };
      let stream;

      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        // If the user didn't explicitly deny permission, and it's the primary feed,
        // aggressively fall back to the most basic video constraints possible.
        // This helps desktop devices that might reject specific constraints.
        if (isPrimary && err.name !== 'NotAllowedError' && err.name !== 'SecurityError') {
          console.warn(`Camera request failed (${err.name}), retrying with basic constraints...`);
          try {
            constraints = { video: true, audio: false };
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (fallbackErr) {
            throw fallbackErr;
          }
        } else {
          throw err;
        }
      }

      // If the browser returned a stream for the same physical device already in use:
      const newSettings = stream.getVideoTracks()[0]?.getSettings?.();
      if (newSettings?.deviceId && newSettings.deviceId === otherDeviceId && otherStream) {
        // Stop this redundant hardware stream to avoid hardware lock/black screen
        stream.getTracks().forEach((t) => t.stop());
        return applyStream(otherStream);
      }

      return applyStream(stream);
    } catch (err) {
      console.error(`Camera feed ${index} error:`, err);
      if (isPrimary) {
        setError(`Camera access error: ${err.name} - ${err.message}. Please check permissions or if another app is using it.`);
      } else {
        // Never let a second-camera failure kill an already-working first feed.
        // Fall back to single-cam mode gracefully and just let the user know.
        setWarning('Only one camera could be accessed — switched back to single cam.');
        setDualMode?.(false);
      }
      return null;
    }
  }, [setDualMode]);

  // Manage camera streams based on dualMode without unnecessary teardown
  useEffect(() => {
    let cancelled = false;

    const setupCameras = async () => {
      if (error) return; // Don't try to setup if the primary camera is in an error state

      // 1. The wireless stream owns feed 0 when connected, so free the webcam;
      //    otherwise make sure feed 0 is running.
      if (wifi) {
        const primary = streamsRef.current[0];
        if (primary) {
          if (primary !== streamsRef.current[1]) primary.getTracks().forEach((t) => t.stop());
          streamsRef.current[0] = null;
          setStreams((prev) => { const n = [...prev]; n[0] = null; return n; });
          setDeviceIds((prev) => { const n = [...prev]; n[0] = null; return n; });
          setRes((prev) => { const n = [...prev]; n[0] = null; return n; });
        }
      } else if (!streamsRef.current[0]) {
        const firstStream = await startFeed(0, { facingMode: 'user' });
        if (cancelled || !firstStream) return;
      }

      // 2. We now have permission, refresh devices
      const vids = await refreshDevices();
      if (cancelled) return;
      const feed0Id = streamsRef.current[0]?.getVideoTracks()[0]?.getSettings?.()?.deviceId;

      // 3. Manage feed 1 based on dualMode
      if (dualMode) {
        if (!streamsRef.current[1]) {
          let back = vids.find((v) => /back|environment|rear/i.test(v.label));
          if (!back && vids.length > 1) back = vids.find((v) => v.deviceId !== feed0Id);

          if (back) {
            await startFeed(1, { deviceId: back.deviceId });
          } else if (vids.length <= 1) {
            await startFeed(1, { cloneFromIndex: 0 });
          } else {
            await startFeed(1, { facingMode: 'environment' });
          }
        }
      } else if (streamsRef.current[1]) {
        if (streamsRef.current[1] !== streamsRef.current[0]) {
          streamsRef.current[1].getTracks().forEach((t) => t.stop());
        }
        streamsRef.current[1] = null;
        setStreams((prev) => { const n = [...prev]; n[1] = null; return n; });
        setDeviceIds((prev) => { const n = [...prev]; n[1] = null; return n; });
        setWarning('');
      }
    };

    setupCameras();

    return () => {
      cancelled = true;
    };
  }, [dualMode, refreshDevices, startFeed, error, wifi]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      const uniqueStreams = new Set(streamsRef.current.filter(Boolean));
      uniqueStreams.forEach((s) => s.getTracks().forEach((t) => t.stop()));
      streamsRef.current = [null, null];
    };
  }, []);

  const handleSelectDevice = (index, deviceId) => {
    setDeviceIds((prev) => { const n = [...prev]; n[index] = deviceId; return n; });
    startFeed(index, { deviceId });
  };

  const swapCameras = () => {
    if (devices.length < 2) return;
    setDeviceIds((prev) => {
      if (feedCount === 2) {
        const next = [prev[1] || devices[1]?.deviceId, prev[0] || devices[0]?.deviceId];
        startFeed(0, { deviceId: next[0] });
        startFeed(1, { deviceId: next[1] });
        return next;
      } else {
        const currentIndex = devices.findIndex((d) => d.deviceId === prev[0]);
        const nextIndex = (currentIndex >= 0 ? currentIndex + 1 : 1) % devices.length;
        const nextId = devices[nextIndex].deviceId;
        startFeed(0, { deviceId: nextId });
        return [nextId, prev[1]];
      }
    });
    forceTick((t) => t + 1);
  };

  const handleConnectWifi = (config) => {
    setShowWifi(false);
    setWifiStatus({ phase: 'connecting', readable: true });
    setWarning('');
    rememberWifi(config);
    if (!config) {
      setWifi(null);
      return;
    }
    setError('');
    setWifi(config);
  };

  const capturePhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const src0 = wifi ? wifiFrameRef.current : videoRefs[0].current;
    const mirror0 = wifi ? wifi.mirror : true;
    const size0 = frameSize(src0);
    const size1 = frameSize(videoRefs[1].current);

    const blit = (el, x, y, w, h, mirror) => {
      ctx.save();
      ctx.translate(x, y);
      if (mirror) {
        ctx.translate(w, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(el, 0, 0, w, h);
      ctx.restore();
    };

    if (dualMode && size0 && size1) {
      // Side-by-side dual capture
      const h = Math.max(size0.h, size1.h);
      const w0 = size0.w * (h / size0.h);
      const w1 = size1.w * (h / size1.h);
      canvas.width = w0 + w1;
      canvas.height = h;
      ctx.filter = filterCss;
      blit(src0, 0, 0, w0, h, mirror0);
      blit(videoRefs[1].current, w0, 0, w1, h, true);
    } else if (size0) {
      canvas.width = size0.w;
      canvas.height = size0.h;
      ctx.filter = filterCss;
      blit(src0, 0, 0, size0.w, size0.h, mirror0);
    } else if (wifi) {
      setWarning('The wireless stream has not delivered a frame yet — give it a second.');
      return;
    } else {
      return;
    }
    ctx.filter = 'none';

    let dataUrl;
    try {
      dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    } catch {
      setWarning('That camera does not allow its pixels to be read back, so the shot could not be saved. WebSocket frames mode always works, or connect the camera by USB.');
      return;
    }

    onCapture(dataUrl);
    setFlashing(true);
    setTimeout(() => setFlashing(false), 260);
  }, [dualMode, filterCss, onCapture, wifi, videoRefs]);

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
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setError('')}>
            Retry Camera
          </button>
          <button className="btn btn-ghost" onClick={() => setShowWifi(true)}>
            🛜 Connect Wi-Fi camera
          </button>
        </div>
        {showWifi && <WifiConnectModal initial={wifi} onCancel={() => setShowWifi(false)} onConnect={handleConnectWifi} />}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
      {warning && <div className="cam-warning">⚠️ {warning}</div>}

      <div className={`dual-grid ${dualMode ? 'dual' : ''}`}>
        {Array.from({ length: feedCount }).map((_, i) => {
          if (i === 0 && wifi) {
            return (
              <WirelessFeed
                key={`wifi-${wifi.mode}-${wifi.url}`}
                config={wifi}
                frameRef={wifiFrameRef}
                filterCss={filterCss}
                countdown={countdown}
                flashing={flashing}
                onStatus={handleWifiStatus}
                label={dualMode ? 'CAM 1 · WIFI' : 'WIFI'}
                resLabel={wifiStatus.res}
              />
            );
          }
          return (
            <CamFeed
              key={i}
              videoRef={videoRefs[i]}
              stream={streams[i]}
              label={dualMode ? `CAM ${i + 1}` : 'LIVE'}
              resLabel={res[i]}
              devices={devices}
              selectedDeviceId={deviceIds[i]}
              onSelectDevice={(id) => handleSelectDevice(i, id)}
              countdown={countdown}
              flashing={flashing}
              filterCss={filterCss}
              placeholder={i === 1 ? 'Connecting second camera…' : 'Starting camera…'}
            />
          );
        })}
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
      <div className="cam-controls">
        <div className="cam-controls-side">
          {devices.length > 1 && !wifi && (
            <button className="btn btn-ghost btn-sm" onClick={swapCameras} title="Swap / switch cameras">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 4v5h-5" /><path d="M20 9l-4.5-4.5A9 9 0 0 0 3.5 12" />
                <path d="M4 20v-5h5" /><path d="M4 15l4.5 4.5A9 9 0 0 0 20.5 12" />
              </svg>
              Switch
            </button>
          )}
        </div>
        <button className="shutter-btn" onClick={triggerCountdown} disabled={countdown !== null} title="Capture (3s timer)">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </button>
        <div className="cam-controls-side right">
          <button
            className={`btn btn-sm ${wifi ? 'btn-cyan' : 'btn-ghost'}`}
            onClick={() => setShowWifi(true)}
            title={wifi ? `Wireless camera: ${wifi.url}` : 'Connect a Wi-Fi / wireless camera'}
          >
            🛜 <span className="wifi-host">{wifi ? hostOf(wifi.url) : 'Connect'}</span>
          </button>
        </div>
      </div>
      <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: -6 }}>
        {wifi
          ? 'Shooting from your wireless camera — hit the shutter for a 3 second timer'
          : dualMode
            ? 'Both cameras capture together in one shot'
            : 'Tap the shutter — 3 second timer'}
      </p>

      {showWifi && <WifiConnectModal initial={wifi} onCancel={() => setShowWifi(false)} onConnect={handleConnectWifi} />}
    </div>
  );
};

export default WebcamBooth;
