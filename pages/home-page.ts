import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class HomePage extends BasePage {

  readonly flowCardDefault: Locator;
  readonly flowDefaultPlayButton: Locator;
  readonly flowDefaultPauseButton: Locator;
  readonly createPlaylistButton: Locator;

  constructor(page: Page) {
    super(page);
    this.flowCardDefault = page.getByTestId('flow-config-default');
    this.flowDefaultPlayButton = this.flowCardDefault.getByRole('button', { name: 'Play' });
    this.flowDefaultPauseButton = this.flowCardDefault.locator('[aria-label="Pause"]');
    this.createPlaylistButton = page.getByRole('button', { name: 'Create a playlist' });
  }

  /**
   * Play the Flow (default) from its card displayed on the home page.
   */
  async playDefaultFlow() {
    await this.flowCardDefault.scrollIntoViewIfNeeded();
    await this.flowCardDefault.hover();
    await this.flowDefaultPlayButton.click();
  }

  /**
   * Verify the default Flow is currently playing (Pause button visible on its card).
   */
  async expectFlowPlaying() {
    await expect(this.flowDefaultPauseButton).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Click on the "Create a playlist" button in the sidebar.
   */
  async clickCreatePlaylistInSidebar() {
    await this.createPlaylistButton.click();
  }
}
