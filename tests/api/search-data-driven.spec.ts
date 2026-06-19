import { test, expect } from '@playwright/test';
import { SearchResponse, DeezerError } from '../../helpers/types';
import { SearchResponseSchema } from '../../helpers/schemas';
import searchCases from '../../fixtures/search-cases.json';
import aiSearchCase from '../../fixtures/ai-generated-search-cases.json' 
import { step } from 'allure-js-commons';

const searchData = [...searchCases, ...aiSearchCase]

searchData.forEach (({ query, minResults}) => {
    test(`GET /search?q="${query}" retourne un status 200 avec ${minResults} résultats`, 
    async ({ request}) => {
        const response = await request.get('/search', {
            params: { q: query },
        });

        await step(`Vérifier le statut 200`, async () => {
            expect(response.status()).toBe(200);
        });

        await step('Vérifier que la réponse est un json', async () => {
            expect(response.headers()['content-type']).toContain('application/json');
        })

        const body: SearchResponse = await response.json();

        await step('Vérifier le schéma de la réponse est correct', async () => {
            const result = SearchResponseSchema.safeParse(body);
            expect(result.success).toBe(true);
        })

        await step(`Vérifier que le nombre de résultat est supérieur à ${minResults}`, async () => {
            expect(body.data.length).toBeGreaterThanOrEqual(minResults);
        })
        
        if (minResults > 0) {
            await step('Vérifier la présence d\'un id et d\'un titre dans le premier résultat', async () => {
                expect(body.data[0].id).toBeDefined();
                expect(body.data[0].title).toBeDefined();
            })
        }
    }
    )});

    test('GET /search?q="" retourne une erreur 500 avec ParameterException', 
        async ({ request }) => {
          const response = await request.get('/search', {
            params: { q: '' },
          });
      
          await step(`Vérifier le statut 200`, async () => {
                expect(response.status()).toBe(200);
          });      


          const body: DeezerError = await response.json();

          const errorType = 'ParameterException';
          const errorMessage = 'empty parameter';

          await step(`Vérifier que le type d'erreur est "${errorType}"`, async () => {
            expect(body.error.type).toBe(errorType);
          })
          await step(`Vérifier que le message d'erreur est "${errorMessage}"`, async () => {
            expect(body.error.message).toBe(errorMessage);
          })
          await step(`Vérifier que le code erreur est 500`, async () => {
            expect(body.error.code).toBe(500);
        })
      });