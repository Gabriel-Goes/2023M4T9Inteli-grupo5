/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OFFICIAL_WS_BASE_URL?: string;
  readonly VITE_LOCAL_PROXY_WS_BASE_URL?: string;
  readonly VITE_IPT_WS_BASE_URL?: string;
  readonly VITE_IPT_DEVICE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
