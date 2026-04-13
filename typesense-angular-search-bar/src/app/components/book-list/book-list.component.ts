import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import connectHits from 'instantsearch.js/es/connectors/hits/connectHits';
import { SearchService } from '../../services/search.service';
import { BookCardComponent } from '../book-card/book-card.component';
import { Book } from '../../types/book';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [BookCardComponent],
  templateUrl: './book-list.component.html',
  styleUrl: './book-list.component.css',
})
export class BookListComponent implements OnInit, OnDestroy {
  hits: Book[] = [];
  hasSearched = false;
  private widget: ReturnType<ReturnType<typeof connectHits>> | null = null;

  constructor(
    private searchService: SearchService,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    const hitsConnector = connectHits((renderOptions) => {
      this.ngZone.run(() => {
        this.hits = renderOptions.hits as unknown as Book[];
        this.hasSearched = true;
      });
    });
    this.widget = hitsConnector({});
    this.searchService.searchInstance.addWidgets([this.widget]);
  }

  ngOnDestroy(): void {
    if (this.widget) {
      this.searchService.searchInstance.removeWidgets([this.widget]);
    }
  }
}
