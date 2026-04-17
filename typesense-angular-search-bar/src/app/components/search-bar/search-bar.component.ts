import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import connectSearchBox from 'instantsearch.js/es/connectors/search-box/connectSearchBox';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.css',
})
export class SearchBarComponent implements OnInit, OnDestroy {
  query = '';
  private refineFn: (value: string) => void = () => {};
  private widget: ReturnType<ReturnType<typeof connectSearchBox>> | null = null;

  constructor(
    private searchService: SearchService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    const searchBoxConnector = connectSearchBox((renderOptions) => {
      this.ngZone.run(() => {
        this.query = renderOptions.query;
        this.refineFn = renderOptions.refine;
      });
    });
    this.widget = searchBoxConnector({});
    this.searchService.searchInstance.addWidgets([this.widget]);
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.refineFn(value);
  }

  onReset(): void {
    this.refineFn('');
  }

  ngOnDestroy(): void {
    if (this.widget) {
      this.searchService.searchInstance.removeWidgets([this.widget]);
    }
  }
}
