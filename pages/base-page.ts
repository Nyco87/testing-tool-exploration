import { Page } from '@playwright/test';

export class BasePage {
  // "protected" = accessible dans cette classe et ses sous-classes, pas ailleurs
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a given path and wait for the page to load.
   * @param path path
   */
  async goto(path: string = '/') {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }
}