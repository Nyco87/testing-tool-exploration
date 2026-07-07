import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class SearchPage extends BasePage {
  
  readonly searchField: Locator;
  readonly artistTopResultBlock: Locator;
  readonly artistTopResultTitle: Locator; 
  readonly topResultClickable: Locator;

  constructor(page: Page) {
    super(page); 
    this.searchField = page.getByTestId('search_field');
    this.artistTopResultBlock = page.getByTestId('artist_top_result_block'); 
    this.artistTopResultTitle = page.getByTestId('artist_top_result_title'); 
    this.topResultClickable = page.getByTestId('top_result_clickable_area'); 
  }

  /**
   * Search for a content using the search field.
   * @param query search query to fill
   */
  async searchFor(query: string) {
    await this.searchField.fill(query);
  }

  /**
   * Verify that the artist is found as the top result in the search results.
   * @param artistName Artist name 
   */
  async expectArtistTopResult(artistName: string) {
    await expect(this.artistTopResultBlock).toBeVisible({ timeout: 10_000 });
    await expect(this.artistTopResultTitle).toContainText(artistName);
  }

  /**
   * Click on the top result.
   */
  async clickTopResult() {
    await this.topResultClickable.click();
  }

  /**
   * Scroll to a specified search results section.
   * @param sectionTitle title of the search results section
   */
  async scrollToSearchResultsSection(sectionTitle: string) {
      await this.page.locator(`[data-testid="section_title"]:has-text("${sectionTitle}")`).evaluate(el =>
        el.scrollIntoView({ block: 'center' })
      );
  }

  /**
   * Verify that the track results section is fully loaded and visible.
   */
  async expectTrackResultsAreVisible() {
    await expect(this.page.getByTestId('is-fully-fetched')).toBeVisible({ timeout: 10_000 });
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Get the title of the first track in the track results section.
   * Note: temporary workaround, should be moved to a future DataGridPage.
   */
  async getFirstTrackTitle(): Promise<string> {
    return (await this.page.getByRole('gridcell').first().getByTestId('title').textContent()) ?? '';
  }

  /**
   * Open the "View menu" context menu of the first track in the track results section.
   * Note: temporary workaround, should be moved to a future DataGridPage.
   */
  async openFirstTrackContextMenu() {
    await this.page.getByRole('gridcell').first().getByLabel('View menu').click();
  }
}