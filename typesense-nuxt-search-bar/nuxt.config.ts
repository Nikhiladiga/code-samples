// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-07-15",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      typesense: {
        apiKey: process.env.NUXT_PUBLIC_TYPESENSE_API_KEY || "xyz",
        host: process.env.NUXT_PUBLIC_TYPESENSE_HOST || "localhost",
        port: parseInt(process.env.NUXT_PUBLIC_TYPESENSE_PORT || "8108", 10),
        protocol: process.env.NUXT_PUBLIC_TYPESENSE_PROTOCOL || "http",
        index: process.env.NUXT_PUBLIC_TYPESENSE_INDEX || "books",
      },
    },
  },
});
