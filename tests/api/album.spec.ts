import { label } from 'allure-js-commons';
import { test, expect } from '@playwright/test';
import { Album } from '../../helpers/types';

test('GET /album/302127 (discovery) retourne status 200 avec les champs title, nb_tracks', 
    async ({ request }) => {
    await label('AS_ID', 'API-album-ALB-001');
    const response = await request.get('/album/302127');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');

    const body: Album = await response.json();

    expect(body.id).toBeDefined();
    expect(body.title).toBe('Discovery');
    expect(body.nb_tracks).toBe(14);
    expect(body.tracks.data.length).toBe(14);
});