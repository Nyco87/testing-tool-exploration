import { label } from 'allure-js-commons';
import { test, expect } from '@playwright/test';
import { DeezerTrackDetailSchema } from '../../helpers/schemas';
import type { DeezerTrackDetail } from '../../helpers/types';

/**
 * GitHub Copilot generated test.
 * Modèle: MAI-Code-1 Flash
 * Prompt: 
 * "Je construis une suite de tests API en TypeScript avec 
 * Playwright pour tester l'API publique Deezer (https://developers.deezer.com/api).
 * Dans le fichier tests/api/track.spec.ts crée un test 
 * GET /track/1255632982 retourne des objets avec les champs 
 * id, title, artist, album, duration, release_date, preview et 
 * vérifie qu'ils sont correctes.
 * Utilise request fixture de Playwright, pas fetch natif.
 * Ajoute un expect sur le Content-Type application/json.
 * Utilise et complète les helpers (type.ts, schemas.ts).
 * voici la réponse de l'api pour cette id :
 * (json de la réponse joint)."
 * 
 * Résultat: OK - peut-être trop de modification dans schemas.ts et types.ts, 
 * mais le test est correct et passe.
 */

test('GET /track/1255632982 retourne des objets avec les champs attendus', async ({ request }) => {
  await label('AS_ID', 'API-track-TRK-001');
  const response = await request.get('/track/1255632982');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/json');

  const body = await response.json();
  const parsed = DeezerTrackDetailSchema.safeParse(body);

  expect(parsed.success, parsed.error?.issues.map((issue) => issue.message).join(', ')).toBe(true);

  const track = body as DeezerTrackDetail;

  expect(String(track.id)).toBe('1255632982');
  expect(track.title).toBe('Sunrise');
  expect(String(track.artist.id)).toBe('12481894');
  expect(track.artist.name).toBe('Shadowrunner');
  expect(String(track.album.id)).toBe('210322702');
  expect(track.album.title).toBe('Sunrise');
  expect(String(track.duration)).toBe('285');
  expect(track.release_date).toBe('2021-03-26');
  expect(track.preview).toContain('https://');
  expect(track.preview).toContain('.mp3');
});