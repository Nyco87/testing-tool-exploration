import { Page, expect } from '@playwright/test';
import { BasePage } from './base-page';

export class ArtistPage extends BasePage {

    constructor(page: Page) {
        super(page);
    }

    /**
     * Verify the right artist name is displayed in the title of Artist page.
     * @param artistName Artist name to verify 
     */
    async expectArtistNameTitle(artistName: string) {
        await expect(this.page.locator(`h2[title="${artistName}"]`)).toBeVisible({ timeout: 10_000 });
    }
}