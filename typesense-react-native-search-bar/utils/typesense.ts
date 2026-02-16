import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: process.env.EXPO_PUBLIC_TYPESENSE_API_KEY || "xyz",
    nodes: [
      {
        host: process.env.EXPO_PUBLIC_TYPESENSE_HOST || "localhost",
        port: Number(process.env.EXPO_PUBLIC_TYPESENSE_PORT) || 8108,
        protocol: process.env.EXPO_PUBLIC_TYPESENSE_PROTOCOL || "http",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "title,authors",
  },
});

export const searchClient = typesenseInstantsearchAdapter.searchClient;
