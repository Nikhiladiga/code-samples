interface ImportMetaEnv {
  readonly PUBLIC_TYPESENSE_API_KEY: string;
  readonly PUBLIC_TYPESENSE_HOST: string;
  readonly PUBLIC_TYPESENSE_PORT: number;
  readonly PUBLIC_TYPESENSE_PROTOCOL: string;
  readonly PUBLIC_TYPESENSE_COLLECTION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
