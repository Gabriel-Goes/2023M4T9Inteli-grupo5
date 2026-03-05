/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_IPT_DEVICE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
