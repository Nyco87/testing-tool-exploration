import { test, expect } from '@playwright/test';

test('GET /artist/27 (Daft Punk) retourne status 200 avec les champs id, name, picture, nb_album, nb_fan', async ({
  request,
}) => {
  const response = await request.get('/artist/27');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();

  expect(body).toHaveProperty('id');
  expect(body).toHaveProperty('name');
  expect(body).toHaveProperty('picture');
  expect(body).toHaveProperty('nb_album');
  expect(body).toHaveProperty('nb_fan');
});

test('GET /artist/27 retourne un nb_fan supérieur à 0', async ({ request }) => {
  const response = await request.get('/artist/27');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  expect(body.nb_fan).toBeGreaterThan(0);
});

test('GET /artist/999999999 retourne status 200 avec un champ error contenant un message', async ({
  request,
}) => {
  const response = await request.get('/artist/999999999');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  expect(body).toHaveProperty('error');
  expect(body.error).toHaveProperty('message');
  expect(body.error.message).toBeTruthy();
});
