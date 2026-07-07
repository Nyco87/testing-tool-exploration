import { label } from 'allure-js-commons';
import { test, expect } from '@playwright/test';
import { SearchPage } from '../../pages/search-page';
import { ArtistPage } from '../../pages/artist-page';
import { BasePage } from '../../pages/base-page';

const artistName = 'Mylène Farmer';

/**
 * Prompt orignial pour générer le test. 

Tu es un expert automaticien Playwright TypeScript.
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

Résultat: j'ai eu juste besoin de retravailler les steps mais le test était green. 

 * Refactorisation manuelle avec Page Object Model (POM)
 */

test('Access to an Artist via the Search Best Result', async ({ page }) => {
  const searchPage = new SearchPage(page);
  const artistPage = new ArtistPage(page);
  const basePage = new BasePage(page);
  
  await label('AS_ID', 'E2E-search-artist-001');
  await test.step('[Pre-requisit] User is logged in and home page is displayed', async () => {
    await basePage.goto('/');
    await expect(searchPage.searchField).toBeVisible();
  });

  await test.step(`[Action] Search for artist "${artistName}"`, async () => {
    await searchPage.searchFor(artistName);
  });

  await test.step('[Result] Search result page is displayed and artist is found as Best Result', async () => {
    await searchPage.expectArtistTopResult(artistName);
  });

  await test.step('[Action] Click on Artist Best Result', async () => {
    await searchPage.clickTopResult();
  });

  await test.step('[Result] The right artist page is displayed', async () => {
    await artistPage.expectArtistNameTitle(artistName);
  });
});
