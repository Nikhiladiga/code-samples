// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss"],
  runtimeConfig: {
    public: {
      typesense: {
        apiKey: process.env.NUXT_PUBLIC_TYPESENSE_API_KEY || "1234",
        host: process.env.NUXT_PUBLIC_TYPESENSE_HOST || "localhost",
        port: parseInt(process.env.NUXT_PUBLIC_TYPESENSE_PORT || "8108"),
        protocol: process.env.NUXT_PUBLIC_TYPESENSE_PROTOCOL || "http",
        index: process.env.NUXT_PUBLIC_TYPESENSE_INDEX || "books",
      },
    },
  },
});
