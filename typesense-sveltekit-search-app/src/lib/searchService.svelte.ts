import { typesenseInstantSearchAdapter } from '$lib/instantSearchAdapter';
import instantsearch from 'instantsearch.js';
import connectHits from 'instantsearch.js/es/connectors/hits/connectHits';
import connectSearchBox from 'instantsearch.js/es/connectors/search-box/connectSearchBox';
import connectStats from 'instantsearch.js/es/connectors/stats/connectStats';
import { configure } from 'instantsearch.js/es/widgets';
import type { Book } from './types';

export class SearchService {
	hits = $state<Book[]>([]);
	query = $state('');
	loading = $state(false);
	hasSearched = $state(false);
	nbHits = $state(0);

	private searchInstance: any;
	private searchBoxWidget: any;
	private hitsWidget: any;
	private statsWidget: any;
	private refineFn: (val: string) => void = () => {};

	constructor() {
		if (typeof window !== 'undefined') {
			this.searchInstance = instantsearch({
				indexName: 'books',
				searchClient: typesenseInstantSearchAdapter.searchClient,
				future: {
					preserveSharedStateOnUnmount: true
				}
			});
		}
	}

	start() {
		if (typeof window === 'undefined' || !this.searchInstance) return;

		const searchBoxConnector = connectSearchBox((renderOptions) => {
			this.query = renderOptions.query;
			this.refineFn = renderOptions.refine;
		});

		const hitsConnector = connectHits((renderOptions) => {
			this.hits = renderOptions.hits as unknown as Book[];
			this.hasSearched = true;
		});

		const statsConnector = connectStats((renderOptions) => {
			this.nbHits = renderOptions.nbHits;
		});

		this.searchBoxWidget = searchBoxConnector({});
		this.hitsWidget = hitsConnector({});
		this.statsWidget = statsConnector({});

		this.searchInstance.addWidgets([
			configure({ hitsPerPage: 12 }),
			this.searchBoxWidget,
			this.statsWidget,
			this.hitsWidget
		]);

		this.searchInstance.on('render', () => {
			const status = this.searchInstance.status;
			const helperLoading = this.searchInstance.helper?.state?.loading;
			this.loading = status === 'loading' || status === 'stalled' || !!helperLoading;
		});

		this.searchInstance.start();
	}

	refine(value: string) {
		if (typeof window !== 'undefined' && this.refineFn) {
			this.refineFn(value);
		}
	}

	destroy() {
		if (typeof window !== 'undefined' && this.searchInstance) {
			this.searchInstance.dispose();
		}
	}
}
