import TypesenseInstantsearchAdapter from "typesense-instantsearch-adapter";

export const createTypesenseAdapter = (config: {
  apiKey: string;
  host: string;
  port: number;
  protocol: string;
}) => {
  return new TypesenseInstantsearchAdapter({
    server: {
      apiKey: config.apiKey,
      nodes: [
        {
          host: config.host,
          port: config.port,
          protocol: config.protocol,
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
};
