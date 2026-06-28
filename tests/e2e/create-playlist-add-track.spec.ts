import { test, expect } from '@playwright/test';

const playlistName = `Playwright Test ${new Date().toISOString().replace(/[:.]/g, '-')}`;
const trackQuery = 'Du temps remix';
let trackTitle = '';

/**
 * You are a Playwright TypeScript automation expert.

## Context
I am building an E2E test suite on deezer.com.
The user session is already loaded via storageState in playwright.config.ts — no login needed in the spec.
Use the following test as a reference for code style: [search-artist.spec.ts]

## Test to implement
File: tests/e2e/create-playlist-add-track.spec.ts

Title: Create a playlist and add a track

## Variables
const playlistName = `Playwright Test ${new Date().toISOString().replace(/[:.]/g, '-')}`;
const trackQuery = 'Daft Punk';
These variables must be used in step labels and selectors where relevant.

## Steps
Step 1 - [Pre-requisit] User is logged in and home page is displayed
Step 2 - [Action] Click on "Créer une playlist" button in sidebar
Step 3 - [Result] A modal is displayed — if a choice modal appears (playlist vs AI playlist), select "playlist". The playlist creation modal is displayed.
Step 4 - [Action] Select a cover, fill the title "${playlistName}" and confirm the creation
Step 5 - [Result] The playlist is created — store the playlist ID from the current URL for later use
Step 6 - [Action] Search for a track "${trackQuery}"
Step 7 - [Result] Track results are displayed
Step 8 - [Action] Open context menu of the first track in track results section and add it to "${playlistName}"
Step 9 - [Result] The track is correctly added to the playlist — navigate to the stored playlist URL and verify the track is present

## Known selectors
- "Créer une playlist" button: getByRole('button', { name: 'Créer une playlist' })

## Rules
- Create one test.step() per step — never merge an Action and a Result in the same step
- [Action] steps contain only Playwright interactions (click, fill, hover...)
- [Result] steps contain only assertions (expect())
- Use data-testid as first priority for selectors
- If data-testid is not available, use getByRole() with aria-label
- Never use CSS generated classes as selectors
- For unique resource names, use timestamp-based variables

## Screenshots
[attach DOM screenshots for each screen involved in the test]

Résultat: le prompt est efficace maisbeaucoup d'instabilité sur le choix des sélecteurs,
beaucoup de retourches à faire pour que ça fonctionne. 
La solution "screenshot" a montré ses limites sur un cas plus complexe. 
 */

test('Create a playlist and add a track', async ({ page }) => {
  let playlistUrl = '';

  await test.step('[Pre-requisit] User is logged in and home page is displayed', async () => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('search_field')).toBeVisible();
  });

  await test.step('[Action] Click on "Create a playlist" button in sidebar', async () => {
    await page.getByRole('button', { name: 'Create a playlist' }).click();
  });

  await test.step(
    '[Result] The playlist creation modal is displayed.',
    async () => {
      // AI playlist is sometimes available and needs an extra click to reach the creation form
      try {
        await page.locator('#playlist_assistant_modal').waitFor({ state: 'visible', timeout: 3_000 });
        await page.getByTestId('modal_body').getByRole('group').first().click();
      } catch {
        // No choice modal appeared, creation form is shown directly
      }
      await expect(page.getByTestId('playlist_name_field')).toBeVisible({ timeout: 10_000 });
    }
  );

  await test.step(
    `[Action] Select a cover, fill the title "${playlistName}" and confirm the creation`,
    async () => {
      await page.getByTestId('modal_body').locator('img').first().click();
      await page.getByTestId('playlist_name_field').fill(playlistName);
      await page.getByTestId('playlist_create_button').click();
    }
  );

  await test.step(
    '[Result] The playlist is created — store the playlist ID from the current URL for later use',
    async () => {
      await expect(page.locator(`h2[title="${playlistName}"]`)).toBeVisible({ timeout: 10_000 });
      const playlistId = page.url().match(/playlist\/(\d+)/)?.[1];
      playlistUrl = `/playlist/${playlistId}`;
      await page.waitForLoadState('domcontentloaded');
    }
  );

  await test.step(`[Action] Search for a track "${trackQuery}"`, async () => {
    await page.getByTestId('search_field').fill(trackQuery);
  });

  await test.step('[Result] Track results are displayed', async () => {
    await expect(page.getByTestId('is-fully-fetched')).toBeVisible({ timeout: 10_000 });
    await page.waitForLoadState('domcontentloaded');
  });

  await test.step(
    `[Action] Open context menu of the first track in track results section and add it to "${playlistName}"`,
    async () => {
      await page.locator('[data-testid="section_title"]:has-text("Tracks")').evaluate(el =>
        el.scrollIntoView({ block: 'center' })  
      );
      trackTitle = await page.getByRole('gridcell').first().getByTestId('title').textContent() ?? '';
      await page.getByRole('gridcell').first().getByLabel('View menu').click();
      await page.getByTestId('context-menu-content').getByText('Add to playlist').click();
      await page.getByTestId('context-menu-content').getByRole('searchbox').fill(playlistName);
      const playlistBtn = page.getByTestId('context-menu-content').getByRole('button', { name: playlistName });
      await playlistBtn.waitFor({ state: 'attached' });
      await playlistBtn.dispatchEvent('click');
    }
  );

  await test.step(
    '[Result] The track is correctly added to the playlist — navigate to the stored playlist URL and verify the track is present',
    async () => {
      await page.goto(playlistUrl);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByTestId('is-fully-fetched')).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId('is-fully-fetched').getByTestId('title').first()).toHaveText(trackTitle!);    }
  );
});
