import { test, expect } from '@playwright/test';

test('should play Flow from home', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const flowCard = page.locator('[data-testid="flow-config-default"]');
  await flowCard.scrollIntoViewIfNeeded();
  await flowCard.hover();
  await flowCard.getByRole('button', { name: 'Play' }).click();

  await expect(flowCard.locator('[aria-label="Pause"]')).toBeVisible({ timeout: 10_000 });
});
