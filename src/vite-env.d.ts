/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_SOCKET_IO_SIGNALING_URL?: string;
  readonly VITE_SIGNALING_WS_URL?: string;
  readonly VITE_SIGNALING_HTTP_URL?: string;
  readonly VITE_SIGNALING_TRANSPORT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
