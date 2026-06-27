import { test, expect } from '@playwright/test';

const artistName = 'Mylène Farmer';

test('Access to an Artist via the Search Best Result', async ({ page }) => {
  await test.step('[Pre-requisit] User is logged in and home page is displayed', async () => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('search_field')).toBeVisible();
  });

  await test.step(`[Action] Search for artist "${artistName}"`, async () => {
    await page.getByTestId('search_field').fill(artistName);
  });

  await test.step('[Result] Search result page is displayed and artist is found as Best Result', async () => {
    await expect(page.getByTestId('artist_top_result_block')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('artist_top_result_title')).toContainText(artistName);
  });

  await test.step('[Action] Click on Artist Best Result', async () => {
    await page.getByTestId('top_result_clickable_area').click();
  });

  await test.step('[Result] The right artist page is displayed', async () => {
    await expect(page.locator(`h2[title="${artistName}"]`)).toBeVisible({ timeout: 10_000 });
  });
});
