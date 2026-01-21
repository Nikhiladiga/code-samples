import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

export const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: import.meta.env.PUBLIC_TYPESENSE_API_KEY || "xyz",
    nodes: [
      {
        host: import.meta.env.PUBLIC_TYPESENSE_HOST || "localhost",
        port: Number(import.meta.env.PUBLIC_TYPESENSE_PORT) || 8108,
        protocol: import.meta.env.PUBLIC_TYPESENSE_PROTOCOL || "http",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "title,authors",
  },
});
