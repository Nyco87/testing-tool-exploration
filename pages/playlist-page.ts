import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class PlaylistPage extends BasePage {

  readonly isFullyFetched: Locator;

  constructor(page: Page) {
    super(page);
    this.isFullyFetched = page.getByTestId('is-fully-fetched');
  }

  /**
   * Verify that the playlist title is displayed.
   * @param playlistName playlist name
   */
  async expectPlaylistTitleVisible(playlistName: string) {
    await expect(this.page.locator(`h2[title="${playlistName}"]`)).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Extract the playlist URL (e.g. "/playlist/12345") from the current page URL.
   */
  getPlaylistUrlFromCurrentPage(): string {
    const playlistId = this.page.url().match(/playlist\/(\d+)/)?.[1];
    return `/playlist/${playlistId}`;
  }

  /**
   * Navigate to a previously stored playlist URL.
   * @param playlistUrl playlist URL to navigate to
   */
  async goToPlaylist(playlistUrl: string) {
    await this.page.goto(playlistUrl);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Verify that the given track is present in the playlist.
   * @param trackTitle track title
   */
  async expectTrackPresent(trackTitle: string) {
    await expect(this.isFullyFetched).toBeVisible({ timeout: 10_000 });
    await expect(this.isFullyFetched.getByTestId('title').first()).toHaveText(trackTitle);
  }
}
