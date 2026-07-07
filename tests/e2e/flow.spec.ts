import { label } from 'allure-js-commons';
import { test } from '@playwright/test';
import { HomePage } from '../../pages/home-page';

test('Play Flow from home page', async ({ page }) => {
  await label('AS_ID', 'E2E-flow-001');

  const homePage = new HomePage(page);

  await test.step('[Pre-requisit] User is logged in and home page is displayed', async () => {
    await homePage.goto('/');
  });

  await test.step('[Action] Play Flow', async () => {
    await homePage.playDefaultFlow();
  });

  await test.step('[Result] Flow is playing', async () => {
    await homePage.expectFlowPlaying();
  });
});
