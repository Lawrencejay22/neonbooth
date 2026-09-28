// A browser can only reach a wireless camera through something that behaves
// like an image request — these are the three shapes that actually work.
export const WIFI_MODES = [
  {
    id: 'mjpeg',
    name: 'MJPEG stream',
    hint: 'One live URL that keeps pushing frames. ESP32-CAM: http://192.168.4.1:8080/video · IP Webcam (Android): http://<phone-ip>:8080/mjpegfeed · DroidCam: http://<phone-ip>:4740/video',
  },
  {
    id: 'snapshot',
    name: 'Snapshot refresh',
    hint: 'A single JPEG URL that gets re-fetched a few times a second. ESP32-CAM: http://<camera-ip>:8080/photo?width=1920&height=1080 · most IP cams: /snapshot.jpg',
  },
  {
    id: 'ws',
    name: 'WebSocket frames',
    hint: 'A ws:// or wss:// socket that sends one JPEG per message. Use it when the camera sits behind a bridge, or when it will not send CORS headers.',
  },
];

export const WIFI_PRESETS = [
  { id: 'generic', name: 'Generic MJPEG', mode: 'mjpeg', url: '', placeholder: 'http://192.168.1.50:8080/video' },
  { id: 'esp32', name: 'ESP32-CAM', mode: 'mjpeg', url: 'http://192.168.4.1:8080/video' },
  { id: 'ipwebcam', name: 'IP Webcam', mode: 'mjpeg', url: 'http://192.168.1.20:8080/mjpegfeed' },
  { id: 'droidcam', name: 'DroidCam', mode: 'mjpeg', url: 'http://192.168.1.20:4740/video' },
  { id: 'snapshot', name: 'Snapshot URL', mode: 'snapshot', url: 'http://192.168.1.50:8080/snapshot.jpg' },
  { id: 'ws', name: 'WebSocket bridge', mode: 'ws', url: 'ws://192.168.1.50:8765' },
];

export const modeMeta = (modeId) => WIFI_MODES.find((m) => m.id === modeId) || WIFI_MODES[0];

// Cache-busting query so a snapshot URL is really re-requested each tick.
export const timedUrl = (url) => `${url}${url.includes('?') ? '&' : '?'}_nb${Date.now()}`;

export const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

// A feed source can be a <video>, an <img> or a <canvas>, and each one reports
// its pixel size through a different property.
export const frameSize = (el) => {
  if (!el) return null;
  const w = el.videoWidth || el.naturalWidth || el.width || 0;
  const h = el.videoHeight || el.naturalHeight || el.height || 0;
  return w && h ? { w, h } : null;
};

export const checkStreamUrl = (raw, mode) => {
  const url = (raw || '').trim();
  if (!url) return { error: mode === 'ws' ? 'Paste the WebSocket URL of your camera bridge.' : 'Paste your camera stream URL.' };

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { error: 'That is not a valid URL - include http:// or ws:// and the camera address.' };
  }

  const ok =
    mode === 'ws'
      ? parsed.protocol === 'ws:' || parsed.protocol === 'wss:'
      : parsed.protocol === 'http:' || parsed.protocol === 'https:';
  if (!ok) {
    return {
      error:
        mode === 'ws'
          ? 'WebSocket frames need a ws:// or wss:// URL.'
          : 'Live streams and snapshots need an http:// or https:// URL.',
    };
  }

  if (parsed.protocol === 'http:' && window.location.protocol === 'https:') {
    return {
      error:
        'Neon Booth is open over https, and browsers refuse to load an http camera stream from an https page. ' +
        'Open it at http://localhost:5173 (or your machine LAN address) while shooting.',
    };
  }

  return { url };
};

// The booth lives only while the capture view is mounted; remembering the last
// config in the module means returning from the editor rejoins the same camera.
let lastConfig = null;

export const rememberWifi = (config) => {
  lastConfig = config;
};

export const recallWifi = () => lastConfig;
