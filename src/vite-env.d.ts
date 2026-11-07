/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_EVOLYN_API_URL?: string;
  readonly VITE_MAX_FILE_SIZE_MB?: string;
  readonly VITE_MULTIPART_FIELD_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
