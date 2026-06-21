/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Optional override for the API base path. The Calil app key is NOT a client
  // env var — it is injected server-side by the Worker / dev proxy. See calilApiConfig.ts.
  readonly VITE_CALIL_BASE_URL?: string;
  // Optional override for the OpenBD API base path. See openBdApiConfig.ts.
  readonly VITE_OPENBD_BASE_URL?: string;
  // Amazon associate (affiliate) tag. Public value embedded in outbound links.
  // Unset locally → normal links; injected at production build. See amazonAffiliate.ts.
  readonly VITE_AMAZON_ASSOCIATE_TAG?: string;
  // Google OAuth client ID (public; GIS needs no client secret). See authConfig.ts.
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  // Dev-only auth mock toggle ("true"). Gated by import.meta.env.DEV. See authConfig.ts.
  readonly VITE_AUTH_MOCK?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
