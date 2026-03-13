import TypesenseInstantSearchAdapter from "typesense-instantsearch-adapter";

const getPort = (envPort: string | undefined): number => {
  if (!envPort) return 8108;
  const parsed = Number(envPort);
  return isNaN(parsed) ? 8108 : parsed;
};

export const typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: import.meta.env.PUBLIC_TYPESENSE_API_KEY || "xyz",
    nodes: [
      {
        host: import.meta.env.PUBLIC_TYPESENSE_HOST || "localhost",
        port: getPort(import.meta.env.PUBLIC_TYPESENSE_PORT),
        protocol: import.meta.env.PUBLIC_TYPESENSE_PROTOCOL || "http",
      },
    ],
  },
  additionalSearchParameters: {
    query_by: "title,authors",
    query_by_weights: "4,2",
    num_typos: 1,
    sort_by: "ratings_count:desc",
  },
});

export const searchClient = typesenseInstantsearchAdapter.searchClient;
export const INDEX_NAME = import.meta.env.PUBLIC_TYPESENSE_INDEX || "books";
