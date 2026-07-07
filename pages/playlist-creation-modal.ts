import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class PlaylistCreationModal extends BasePage {

  readonly assistantModal: Locator;
  readonly modalBody: Locator;
  readonly playlistNameField: Locator;
  readonly playlistCreateButton: Locator;

  constructor(page: Page) {
    super(page);
    this.assistantModal = page.locator('#playlist_assistant_modal');
    this.modalBody = page.getByTestId('modal_body');
    this.playlistNameField = page.getByTestId('playlist_name_field');
    this.playlistCreateButton = page.getByTestId('playlist_create_button');
  }

  /**
   * Handle the optional "playlist vs AI playlist" choice modal, if it appears.
   * Then wait for the playlist creation form to be displayed.
   */
  async handlePlaylistTypeChoice() {
    // AI playlist is sometimes available and needs an extra click to reach the creation form
    try {
      await this.assistantModal.waitFor({ state: 'visible', timeout: 3_000 });
      await this.modalBody.getByRole('group').first().click();
    } catch {
      // No choice modal appeared, creation form is shown directly
    }
    await expect(this.playlistNameField).toBeVisible({ timeout: 10_000 });
  }

  /**
   * Select the first image cover for the playlist.
   */
  async selectCover() {
    await this.modalBody.locator('img').first().click();
  }

  /**
   * Fill the playlist name in the creation form.
   * @param playlistName playlist name to fill
   */
  async fillPlaylistName(playlistName: string) {
    await this.playlistNameField.fill(playlistName);
  }

  /**
   * Confirm the playlist creation by clicking the "Create" button.
   */
  async confirmCreation() {
    await this.playlistCreateButton.click();
  }
}
