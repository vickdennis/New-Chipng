/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FLUTTERWAVE_PUBLIC_KEY: string
  readonly NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
