/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional override for the API base path. The Calil app key is NOT a client
  // env var — it is injected server-side by the Worker / dev proxy. See calilApiConfig.ts.
  readonly VITE_CALIL_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
