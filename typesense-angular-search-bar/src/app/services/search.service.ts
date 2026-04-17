import { Injectable, OnDestroy } from '@angular/core';
import instantsearch from 'instantsearch.js';
import { typesenseInstantSearchAdapter } from '../lib/instantsearch-adapter';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SearchService implements OnDestroy {
  readonly searchInstance = instantsearch({
    indexName: environment.typesense.index,
    searchClient: typesenseInstantSearchAdapter.searchClient,
  });

  constructor() {
    this.searchInstance.start();
  }

  ngOnDestroy(): void {
    this.searchInstance.dispose();
  }
}
