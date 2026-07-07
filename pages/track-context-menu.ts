import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';

export class TrackContextMenu extends BasePage {

  readonly contextMenuContent: Locator;
  readonly addToPlaylistOption: Locator;
  readonly searchbox: Locator;

  constructor(page: Page) {
    super(page);
    this.contextMenuContent = page.getByTestId('context-menu-content');
    this.addToPlaylistOption = this.contextMenuContent.getByText('Add to playlist');
    this.searchbox = this.contextMenuContent.getByRole('searchbox');
  }


  /**
   * Click "Add to playlist" in the opened context menu.
   */
  async clickAddToPlaylist() {
    await this.addToPlaylistOption.click();
  }

  /**
   * Search for a playlist by name and click on the matching result.
   * @param playlistName playlist name to search
   */
  async addToPlaylist(playlistName: string) {
    await this.searchbox.fill(playlistName);
    const playlistBtn = this.contextMenuContent.getByRole('button', { name: playlistName });
    await playlistBtn.waitFor({ state: 'attached' });
    await playlistBtn.dispatchEvent('click');
  }
}
