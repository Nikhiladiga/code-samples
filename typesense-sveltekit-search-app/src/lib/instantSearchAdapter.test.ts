import { describe, expect, it, vi } from 'vitest';

vi.mock('$env/static/public', () => ({
  PUBLIC_TYPESENSE_API_KEY: '',
  PUBLIC_TYPESENSE_HOST: '',
  PUBLIC_TYPESENSE_PORT: '',
  PUBLIC_TYPESENSE_PROTOCOL: ''
}));

import { typesenseInstantSearchAdapter } from './instantSearchAdapter';

describe('Typesense search configuration', () => {
  it('searches title and authors without additional ranking overrides', () => {
    const adapter = typesenseInstantSearchAdapter as unknown as {
      configuration: { additionalSearchParameters: Record<string, unknown> };
    };

    expect(adapter.configuration.additionalSearchParameters).toEqual({
			query_by: 'title,authors',
			preset: '',
			sort_by: '',
			highlight_full_fields: 'title,authors'
    });
  });

  it('uses the same fallback API key as the Solid app', () => {
    const adapter = typesenseInstantSearchAdapter as unknown as {
      configuration: { server: { apiKey: string } };
    };

    expect(adapter.configuration.server.apiKey).toBe('xyz');
  });
});
