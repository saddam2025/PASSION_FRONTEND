/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_PROXY_TARGET: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_MEDIA_BASE_URL: string;
  /** Public Meta Pixel identifier; valid identifiers contain 8–20 digits. */
  readonly VITE_META_PIXEL_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}


