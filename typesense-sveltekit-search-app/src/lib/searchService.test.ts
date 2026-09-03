import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/static/public', () => ({
	PUBLIC_TYPESENSE_API_KEY: 'xyz',
	PUBLIC_TYPESENSE_HOST: 'localhost',
	PUBLIC_TYPESENSE_PORT: '8108',
	PUBLIC_TYPESENSE_PROTOCOL: 'http',
	PUBLIC_TYPESENSE_INDEX: 'not-books'
}));

import { SearchService } from './searchService.svelte';
import { typesenseInstantSearchAdapter } from './instantSearchAdapter';

describe('SearchService', () => {
	it('uses the same books index as the Solid app', () => {
		const service = new SearchService();
		const searchInstance = service as unknown as {
			searchInstance: { mainIndex: { getIndexName: () => string } };
		};

		expect(searchInstance.searchInstance.mainIndex.getIndexName()).toBe('books');
	});

	it('requests the same 12 results per page as the Solid app', () => {
		typesenseInstantSearchAdapter.searchClient.search = async () => ({
			results: [
				{
					hits: [],
					index: 'books',
					nbHits: 0,
					page: 0,
					nbPages: 0,
					hitsPerPage: 20,
					processingTimeMS: 0,
					query: '',
					params: '',
					exhaustiveNbHits: true,
					exhaustiveFacetsCount: true
				}
			]
		});

		const service = new SearchService();
		service.start();
		const searchInstance = service as unknown as {
			searchInstance: { mainIndex: { getHelper: () => { state: { hitsPerPage?: number } } } };
		};

		expect(searchInstance.searchInstance.mainIndex.getHelper().state.hitsPerPage).toBe(12);
		service.destroy();
	});

	it('exposes the total result count reported by InstantSearch', async () => {
		typesenseInstantSearchAdapter.searchClient.search = async () => ({
			results: [
				{
					hits: [],
					index: 'books',
					nbHits: 32,
					page: 0,
					nbPages: 3,
					hitsPerPage: 12,
					processingTimeMS: 1,
					query: 'Harry',
					params: 'query=Harry',
					exhaustiveNbHits: true,
					exhaustiveFacetsCount: true
				}
			]
		});

		const service = new SearchService();
		service.start();

		await vi.waitFor(() => expect(service.nbHits).toBe(32));
		service.destroy();
	});
});
