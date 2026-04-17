import { Component } from '@angular/core';
import { HeadingComponent } from './components/heading/heading.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { BookListComponent } from './components/book-list/book-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeadingComponent, SearchBarComponent, BookListComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {}
