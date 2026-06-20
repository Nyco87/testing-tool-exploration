import { label } from 'allure-js-commons';
import { test, expect } from '@playwright/test';

test('GET /chart/0 retourne le top chart', async ({ request }) => {
  await label('AS_ID', 'API-chart-CHT-001');
  const response = await request.get('/chart/0');
  expect(response.ok()).toBeTruthy();

  const body = await response.json();
  expect(body).toHaveProperty('tracks');
  expect(body.tracks.data).toBeInstanceOf(Array);
  expect(body.tracks.data.length).toBeGreaterThan(0);
});
