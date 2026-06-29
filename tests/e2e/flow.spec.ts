import { label } from 'allure-js-commons';
import { test, expect } from '@playwright/test';

test('Play Flow from home page', async ({ page }) => {
  await label('AS_ID', 'E2E-flow-001');
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const flowCard = page.locator('[data-testid="flow-config-default"]');
  await flowCard.scrollIntoViewIfNeeded();
  await flowCard.hover();
  await flowCard.getByRole('button', { name: 'Play' }).click();

  await expect(flowCard.locator('[aria-label="Pause"]')).toBeVisible({ timeout: 10_000 });
});
