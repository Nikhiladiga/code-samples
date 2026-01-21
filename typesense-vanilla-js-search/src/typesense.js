import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

export const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: import.meta.env.VITE_TYPESENSE_API_KEY || "xyz",
    nodes: [
      {
        host: import.meta.env.VITE_TYPESENSE_HOST || "localhost",
        port: Number(import.meta.env.VITE_TYPESENSE_PORT) || 8108,
        protocol: import.meta.env.VITE_TYPESENSE_PROTOCOL || "http",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "title,authors",
  },
});
