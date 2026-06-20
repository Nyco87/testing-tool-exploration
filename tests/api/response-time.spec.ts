import {test, expect} from '@playwright/test';
import { SearchResponse, Artist, Album } from '../../helpers/types';

const MAX_RESPONSE_TIME_MS = 300;

test(`Response time for endpoint /search is below ${MAX_RESPONSE_TIME_MS}ms`, 
    async ({request}) => {

        const start = Date.now();
        const response = await request.get('/search', {
            params: { q: 'Mylène Farmer' }
        });
        const duration = Date.now() - start;
        console.log(`Duration: ${duration}ms`);

        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
   
        const body: SearchResponse = await response.json();
        expect(body.data).toBeInstanceOf(Array);
        expect(body.data.length).toBeGreaterThan(0);

        expect(duration).toBeLessThan(MAX_RESPONSE_TIME_MS);


})

/**
 * == Prompt Claude Sonnet 4.6 ==
 * Je construis une suite de tests API en TypeScript avec Playwright pour tester
 * l'API publique Deezer (https://developers.deezer.com/api).
 * Je teste le temps de réponses de différents endpoint de l'API. 
 * A partir de l'exemple fournis, propose un test pour l'endpoint /artist avec 
 * l'artiste Hans Zimmer (id: 1935) et un autre test pour l'endpoint /album avec 
 * l'album Thirukkural (id: 6287633) qui a 1330 tracks. 
 * Utilise les ressources disponibles sur le site de l'api mais aussi 
 * des schémas et types dans helpers.
 */

test(`Response time for endpoint /artist is below ${MAX_RESPONSE_TIME_MS}ms`, async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/artist/1935');
    const duration = Date.now() - start;
    console.log(`Duration: ${duration}ms`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body: Artist = await response.json();
    expect(body.id).toBe(1935);
    expect(body.name).toBe('Hans Zimmer');

    expect(duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
});

test(`Response time for endpoint /album is below ${MAX_RESPONSE_TIME_MS}ms`, async ({ request }) => {
    const start = Date.now();
    const response = await request.get('/album/6287633');
    const duration = Date.now() - start;
    console.log(`Duration: ${duration}ms`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body: Album = await response.json();
    expect(body.id).toBe(6287633);
    expect(body.title).toBeDefined();
    expect(body.tracks.data).toBeInstanceOf(Array);
    expect(body.tracks.data.length).toBe(25); // pagination

    expect(duration).toBeLessThan(MAX_RESPONSE_TIME_MS);
});