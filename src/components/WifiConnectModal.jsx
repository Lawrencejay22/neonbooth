import React, { useState } from 'react';
import { WIFI_MODES, WIFI_PRESETS, modeMeta, checkStreamUrl } from '../lib/wireless';

const REFRESH_OPTIONS = [
  { ms: 300, label: '3 times a second' },
  { ms: 500, label: '2 times a second' },
  { ms: 1000, label: 'Once a second' },
  { ms: 2000, label: 'Every 2 seconds' },
  { ms: 5000, label: 'Every 5 seconds' },
];

const WifiConnectModal = ({ initial, onCancel, onConnect }) => {
  const [presetId, setPresetId] = useState(initial ? null : 'generic');
  const [mode, setMode] = useState(initial?.mode || 'mjpeg');
  const [url, setUrl] = useState(initial?.url || '');
  const [interval, setIntervalMs] = useState(initial?.interval || 500);
  const [mirror, setMirror] = useState(initial?.mirror ?? false);
  const [error, setError] = useState('');

  const applyPreset = (p) => {
    setPresetId(p.id);
    setMode(p.mode);
    setUrl(p.url);
    setError('');
  };

  const submit = () => {
    const checked = checkStreamUrl(url, mode);
    if (checked.error) {
      setError(checked.error);
      return;
    }
    onConnect({ mode, url: checked.url, interval, mirror });
  };

  const placeholder = (WIFI_PRESETS.find((p) => p.id === presetId) || {}).placeholder || 'http://192.168.1.50:8080/video';

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card glass-panel wifi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Connect a wireless camera 🛜</h2>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕</button>
        </div>

        <p className="hint-text" style={{ marginTop: 0, marginBottom: 16 }}>
          Your camera has to be on the same network as this machine. Paste the address it streams from and
          Neon Booth shows it live, then the shutter shoots straight from it.
        </p>

        <div className="wifi-presets">
          {WIFI_PRESETS.map((p) => (
            <button
              key={p.id}
              className={`filter-chip ${presetId === p.id ? 'active' : ''}`}
              onClick={() => applyPreset(p)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="wifi-field">
          <span>Stream URL</span>
          <input
            className="wifi-url"
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            placeholder={placeholder}
            spellCheck={false}
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="wifi-field">
          <span>Frame source</span>
          <div className="wifi-modes">
            {WIFI_MODES.map((m) => (
              <button
                key={m.id}
                className={`filter-chip ${mode === m.id ? 'active' : ''}`}
                onClick={() => { setMode(m.id); setError(''); }}
              >
                {m.name}
              </button>
            ))}
          </div>
          <p className="hint-text">{modeMeta(mode).hint}</p>
        </div>

        {mode === 'snapshot' && (
          <div className="wifi-field">
            <span>Refresh</span>
            <select className="wifi-select" value={interval} onChange={(e) => setIntervalMs(Number(e.target.value))}>
              {REFRESH_OPTIONS.map((o) => (
                <option key={o.ms} value={o.ms}>{o.label}</option>
              ))}
            </select>
          </div>
        )}

        <label className="wifi-check">
          <input type="checkbox" checked={mirror} onChange={(e) => setMirror(e.target.checked)} />
          Mirror the image (for a camera facing you like a selfie cam)
        </label>

        {error && <div className="wifi-error">⚠️ {error}</div>}

        <div className="wifi-help">
          <b>Good to know</b>
          <ul>
            <li>Phones work great: IP Webcam and DroidCam both expose an MJPEG address while the app is running.</li>
            <li>Canon / Sony / Nikon / Fujifilm Wi-Fi is locked to their own apps. Plug those in over USB instead and pick them from the camera list.</li>
            <li>RTSP cameras need a tiny MJPEG or WebSocket bridge — paste the bridge address here.</li>
            <li>If the camera does not allow the browser to read its pixels, the preview still shows but shots cannot be taken; WebSocket frames always work.</li>
          </ul>
        </div>

        <div className="wifi-actions">
          {initial && (
            <button className="btn btn-red btn-sm" onClick={() => onConnect(null)}>
              Disconnect
            </button>
          )}
          <button className="btn btn-primary" onClick={submit}>🛜 Connect</button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default WifiConnectModal;
