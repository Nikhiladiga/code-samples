import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import BookList from './BookList.svelte';

afterEach(cleanup);

const book = {
	id: '1',
	title: "Harry Potter and the Philosopher's Stone",
	authors: ['J.K. Rowling'],
	publication_year: 1997,
	average_rating: 4.4,
	image_url: 'https://example.com/book.jpg',
	ratings_count: 4602479
};

describe('BookList', () => {
	it('shows the Solid loading state instead of stale results', () => {
		render(BookList, {
			props: {
				searchService: {
          hits: [book],
          loading: true,
          hasSearched: true,
          nbHits: 1
				}
			}
		});

		expect(screen.getByText('Searching...')).toBeTruthy();
		expect(screen.queryByText(book.title)).toBeNull();
	});

	it('shows the result count alongside completed search results', () => {
		render(BookList, {
			props: {
				searchService: {
          hits: [book],
          loading: false,
          hasSearched: true,
          nbHits: 32
				}
			}
		});

		expect(screen.getByText('32 results found')).toBeTruthy();
		expect(screen.getByText(book.title)).toBeTruthy();
	});

	it('shows the same completed empty state as the Solid app', () => {
		render(BookList, {
			props: {
				searchService: {
          hits: [],
          loading: false,
          hasSearched: true,
          nbHits: 0
				}
			}
		});

		expect(screen.getByRole('heading', { name: 'No books found' })).toBeTruthy();
		expect(screen.getByText('Try adjusting your search or try different keywords.')).toBeTruthy();
	});
});
