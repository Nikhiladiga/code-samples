import TypesenseInstantsearchAdapter from 'typesense-instantsearch-adapter';
import { environment } from '../../environments/environment';

export const typesenseInstantSearchAdapter = new TypesenseInstantsearchAdapter({
  server: {
    apiKey: environment.typesense.apiKey,
    nodes: [
      {
        host: environment.typesense.host,
        port: environment.typesense.port,
        protocol: environment.typesense.protocol,
      },
    ],
  },
  additionalSearchParameters: {
    query_by: 'title,authors',
    query_by_weights: '4,2',
    num_typos: 1,
    sort_by: 'ratings_count:desc',
  },
});
