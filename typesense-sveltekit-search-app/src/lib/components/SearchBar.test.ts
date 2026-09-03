import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import SearchBar from './SearchBar.svelte';

afterEach(cleanup);

describe('SearchBar', () => {
	it('matches the Solid search box controls and placeholder', () => {
		render(SearchBar, {
			props: {
				searchService: {
					query: 'Harry',
					refine: () => undefined
				}
			}
		});

		const input = screen.getByPlaceholderText('Search by title or author...') as HTMLInputElement;

		expect(input.value).toBe('Harry');
		expect(screen.queryByRole('button')).toBeNull();
	});
});
