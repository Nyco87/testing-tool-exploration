import { test, expect } from '@playwright/test';

const artistName = 'Mylène Farmer';

/**
 * Tu es un expert automaticien Playwright TypeScript.

Je crée des tests E2E sur deezer.com. Voici un exemple de mon style de code : [colle flow.spec.ts]

Crée un fichier tests/e2e/search-artist.spec.ts

Title: Access to an Artist via the Search Best Result

La session est déjà chargée via storageState dans playwright.config.ts — pas de login dans la spec.

La query est variabilisée via une constante artistName en haut du test.
Cette variable est utilisée dans les sélecteurs et dans les libellés des steps.

Utilise un test.step() distinct pour chaque ligne ci-dessous, 
dans cet ordre exact — ne regroupe jamais une action et un résultat dans le même step :

Step 1 - [Pre-requisit] User is logged in and home page is displayed
Step 2 - [Action] Search for artist "${artistName}"
Step 3 - [Result] Search result page is displayed and artist is found as Best Result
Step 4 - [Action] Click on Artist Best Result
Step 5 - [Result] The right artist page is displayed

Contraintes :
- Utilise data-testid en priorité pour les sélecteurs
- Les steps [Action] contiennent uniquement les interactions Playwright
- Les steps [Result] contiennent uniquement les assertions expect()
- Suis scrupuleusement l'ordre des steps

[joins les screenshots]
 */

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
