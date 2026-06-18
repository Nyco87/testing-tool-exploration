import { test, expect } from '@playwright/test';
import { SearchResponse, DeezerError } from '../../helpers/types';
import { SearchResponseSchema } from '../../helpers/schemas';
import searchData from '../../fixtures/search-cases.json'; 

searchData.forEach (({ query, minResults}) => {
    test(`GET /search?q="${query}" retourne un status 200 avec ${minResults} résultats`, 
    async ({ request}) => {
        const response = await request.get('/search', {
            params: { q: query },
        });

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');

        const body: SearchResponse = await response.json();
        const result = SearchResponseSchema.safeParse(body);
        expect(result.success).toBe(true);
        expect(body.data.length).toBeGreaterThanOrEqual(minResults);
        if (minResults > 0) {
            expect(body.data[0].id).toBeDefined();
            expect(body.data[0].title).toBeDefined();
        }
    }
    )});

    test('GET /search?q="" retourne une erreur 500 avec ParameterException', 
        async ({ request }) => {
          const response = await request.get('/search', {
            params: { q: '' },
          });
      
          expect(response.status()).toBe(200);
      
          const body: DeezerError = await response.json();
          expect(body.error.type).toBe('ParameterException');
          expect(body.error.message).toBe('empty parameter');
          expect(body.error.code).toBe(500);
      });