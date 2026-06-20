import { label } from 'allure-js-commons';
import { test, expect } from '@playwright/test';
import { SearchResponse, Track } from '../../helpers/types';

test('GET /search?q=daftpunk retourne un status 200 et un tableau data non vide', async ({
  request,
}) => {
  await label('AS_ID', 'API-search-SCH-003');
  const response = await request.get('/search', {
    params: { q: 'daftpunk' },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body: SearchResponse = await response.json();
  expect(body.data).toBeInstanceOf(Array);
  expect(body.data.length).toBeGreaterThan(0);
});

test('GET /search?q=daftpunk retourne des objets avec les champs id, title, artist', async ({
  request,
}) => {
  await label('AS_ID', 'API-search-SCH-002');
  const response = await request.get('/search', {
    params: { q: 'daftpunk' },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body: SearchResponse = await response.json();
  const firstResult: Track = body.data[0];

  expect(firstResult.id).toBeDefined();
  expect(firstResult.title).toBeDefined();
  expect(firstResult.artist).toBeDefined();
});

test('GET /search?q=zzzzinexistant retourne un status 200 avec un tableau data vide', async ({
  request,
}) => {
  await label('AS_ID', 'API-search-SCH-001');
  const response = await request.get('/search', {
    params: { q: 'zzzzinexistant' },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body: SearchResponse = await response.json();
  expect(body.data).toBeInstanceOf(Array);
  expect(body.data).toHaveLength(0);
});
