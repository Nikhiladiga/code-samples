import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";

export const typesenseInstantSearchAdapter = new TypesenseInstantsearchAdapter({
  server: {
    apiKey: process.env.NEXT_PUBLIC_TYPESENSE_API_KEY || "1234",
    nodes: [
      {
        host: process.env.NEXT_PUBLIC_TYPESENSE_HOST || "localhost",
        port: parseInt(process.env.NEXT_PUBLIC_TYPESENSE_PORT || "8108"),
        protocol: process.env.NEXT_PUBLIC_TYPESENSE_PROTOCOL || "http",
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
