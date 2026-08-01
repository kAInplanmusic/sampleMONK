const DEFAULT_PRODUCTION_API_ORIGIN = 'https://audio-backend-293043362808.europe-west1.run.app';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const browserHostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalHost = ['localhost', '127.0.0.1', '0.0.0.0'].includes(browserHostname);

const resolveOrigin = (configuredValue: string | undefined, localDefault: string, productionDefault: string | null) => {
  if (configuredValue) return trimTrailingSlash(configuredValue);
  if (isLocalHost) return localDefault;
  return productionDefault;
};

export const API_ORIGIN = resolveOrigin(
  import.meta.env.VITE_API_BASE_URL,
  'http://localhost:8000',
  DEFAULT_PRODUCTION_API_ORIGIN,
);

export const API_BASE_URL = API_ORIGIN ? `${API_ORIGIN}/api` : '/api';

export const SOCKET_IO_SIGNALING_URL = resolveOrigin(
  import.meta.env.VITE_SOCKET_IO_SIGNALING_URL,
  'http://localhost:3001',
  null,
);

export const SIGNALING_WS_URL = resolveOrigin(
  import.meta.env.VITE_SIGNALING_WS_URL,
  'ws://localhost:8080',
  null,
);

export const SIGNALING_HTTP_URL = resolveOrigin(
  import.meta.env.VITE_SIGNALING_HTTP_URL,
  'http://localhost:8001',
  null,
);

export const SIGNALING_TRANSPORT_URL = resolveOrigin(
  import.meta.env.VITE_SIGNALING_TRANSPORT_URL,
  'https://localhost:8002/webrtc-signaling',
  null,
);
