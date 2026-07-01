import { PUBLIC_TYPESENSE_INDEX } from '$env/static/public';
import { typesenseInstantSearchAdapter } from '$lib/instantSearchAdapter';
import instantsearch from 'instantsearch.js';
import connectHits from 'instantsearch.js/es/connectors/hits/connectHits';
import connectSearchBox from 'instantsearch.js/es/connectors/search-box/connectSearchBox';
import type { Book } from './types';

export class SearchService {
  hits = $state<Book[]>([]);
  query = $state('');
  loading = $state(false);
  hasSearched = $state(false);

  private searchInstance: any;
  private searchBoxWidget: any;
  private hitsWidget: any;
  private refineFn: (val: string) => void = () => {};

  constructor() {
    if (typeof window !== 'undefined') {
      this.searchInstance = instantsearch({
        indexName: PUBLIC_TYPESENSE_INDEX || 'books',
        searchClient: typesenseInstantSearchAdapter.searchClient,
        future: {
          preserveSharedStateOnUnmount: true,
        },
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

    this.searchBoxWidget = searchBoxConnector({});
    this.hitsWidget = hitsConnector({});

    this.searchInstance.addWidgets([this.searchBoxWidget, this.hitsWidget]);

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
