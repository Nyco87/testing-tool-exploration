import { test as setup, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.join('auth', 'session.json');

async function handleCookies(page: Page): Promise<void> {
  try {
    await page.locator('[data-testid="gdpr-btn-refuse-all"]').click({ timeout: 3000 });
  } catch {
    // banner absent, nothing to do
  }
}

setup('authenticate', async ({ page }) => {
  const email = process.env.DEEZER_EMAIL;
  const password = process.env.DEEZER_PASSWORD;

  if (!email || !password) {
    throw new Error('DEEZER_EMAIL and DEEZER_PASSWORD environment variables must be set');
  }

  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto('https://www.deezer.com');
  await handleCookies(page);

  await page.goto('https://account.deezer.com/login');
  await page.waitForLoadState('domcontentloaded');
  await handleCookies(page);
  console.log('URL actuelle:', page.url());

  await page.locator('[data-testid="email-field"]').fill(email);
  await page.locator('[data-testid="password-field"]').fill(password);
  await page.locator('[data-testid="login-button"]').click();

  const securityFrame = page.frameLocator('#sec-cpt-if');
  const securityCheck = securityFrame.locator('#custom-message-title');

  let hasSecurityCheck = false;
  try {
    await securityCheck.waitFor({ timeout: 5_000 });
    hasSecurityCheck = true;
  } catch {
    // pas de security check
  }

  if (hasSecurityCheck) {
    await securityCheck.waitFor({ state: 'hidden', timeout: 40_000 });
    await page.locator('[data-testid="login-button"]').click();
  }

  await page.waitForURL('https://www.deezer.com/**', { timeout: 30_000 });

  await page.context().storageState({ path: authFile });
});
