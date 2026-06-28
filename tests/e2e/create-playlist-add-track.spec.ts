import { test, expect } from '@playwright/test';

const playlistName = `Playwright Test ${new Date().toISOString().replace(/[:.]/g, '-')}`;
const trackQuery = 'Du temps remix';
let trackTitle = '';

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
