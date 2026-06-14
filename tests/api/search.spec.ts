import { test, expect } from '@playwright/test';

test('GET /search?q=daftpunk retourne un status 200 et un tableau data non vide', async ({
  request,
}) => {
  const response = await request.get('/search', {
    params: { q: 'daftpunk' },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  expect(body.data).toBeInstanceOf(Array);
  expect(body.data.length).toBeGreaterThan(0);
});

test('GET /search?q=daftpunk retourne des objets avec les champs id, title, artist', async ({
  request,
}) => {
  const response = await request.get('/search', {
    params: { q: 'daftpunk' },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  const firstResult = body.data[0];

  expect(firstResult).toHaveProperty('id');
  expect(firstResult).toHaveProperty('title');
  expect(firstResult).toHaveProperty('artist');
});

test('GET /search?q=zzzzinexistant retourne un status 200 avec un tableau data vide', async ({
  request,
}) => {
  const response = await request.get('/search', {
    params: { q: 'zzzzinexistant' },
  });

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  expect(body.data).toBeInstanceOf(Array);
  expect(body.data).toHaveLength(0);
});
