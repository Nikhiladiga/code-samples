import {
	PUBLIC_TYPESENSE_API_KEY,
	PUBLIC_TYPESENSE_HOST,
	PUBLIC_TYPESENSE_PORT,
	PUBLIC_TYPESENSE_PROTOCOL
} from '$env/static/public';
import TypesenseInstantsearchAdapter from 'typesense-instantsearch-adapter';

export const typesenseInstantSearchAdapter = new TypesenseInstantsearchAdapter({
	server: {
    apiKey: PUBLIC_TYPESENSE_API_KEY || 'xyz',
		nodes: [
			{
				host: PUBLIC_TYPESENSE_HOST || 'localhost',
				port: parseInt(PUBLIC_TYPESENSE_PORT || '8108'),
				protocol: PUBLIC_TYPESENSE_PROTOCOL || 'http'
			}
		]
	},
	additionalSearchParameters: {
		query_by: 'title,authors'
	}
});
