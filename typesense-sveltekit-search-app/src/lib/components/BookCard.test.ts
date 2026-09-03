import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import BookCard from './BookCard.svelte';

afterEach(cleanup);

describe('BookCard', () => {
  it('shows the same book details as the Solid card', () => {
		render(BookCard, {
			props: {
				book: {
					id: '1',
					title: "Harry Potter and the Philosopher's Stone",
					authors: ['J.K. Rowling'],
					publication_year: 1997,
					average_rating: 4.4,
					image_url: 'https://example.com/book.jpg',
					ratings_count: 4602479
				}
			}
		});

		expect(screen.getByAltText("Cover of Harry Potter and the Philosopher's Stone")).toBeTruthy();
		expect(screen.getByText('J.K. Rowling')).toBeTruthy();
		expect(screen.getByText('4.4 (4,602,479 ratings)')).toBeTruthy();
		expect(screen.getByText('Published: 1997')).toBeTruthy();
    expect(document.body.textContent).not.toContain('☆');
  });

  it('omits the cover region when a book has no image', () => {
    const { container } = render(BookCard, {
      props: {
        book: {
          id: '2',
          title: 'A Book Without a Cover',
          authors: ['Example Author'],
          publication_year: 2020,
          average_rating: 4,
          image_url: '',
          ratings_count: 10
        }
      }
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.bookImageContainer')).toBeNull();
  });
});
