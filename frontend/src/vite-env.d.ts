/// <reference types="vite/client" />

/** Constantes injetadas no build pelo `define` do vite.config.ts. */
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
