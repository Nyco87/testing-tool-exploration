import { label } from 'allure-js-commons';
import { test, expect } from '@playwright/test';
import { BasePage } from '../../pages/base-page';
import { HomePage } from '../../pages/home-page';
import { SearchPage } from '../../pages/search-page';
import { PlaylistCreationModal } from '../../pages/playlist-creation-modal';
import { PlaylistPage } from '../../pages/playlist-page';
import { TrackContextMenu } from '../../pages/track-context-menu';

const playlistName = `Playwright Test ${new Date().toISOString().replace(/[:.]/g, '-')}`;
const trackQuery = 'Du temps remix';
let trackTitle = '';

test('Create a playlist and add a track', async ({ page }) => {
  const basePage = new BasePage(page);
  const searchPage = new SearchPage(page);
  const playlistCreationModal = new PlaylistCreationModal(page);
  const playlistPage = new PlaylistPage(page);
  const trackContextMenu = new TrackContextMenu(page);
  const homePage = new HomePage(page);

  await label('AS_ID', 'E2E-create-playlist-add-track-001');
  let playlistUrl = '';

  await test.step('[Pre-requisit] User is logged in and home page is displayed', async () => {
    await basePage.goto('/');
    await expect(searchPage.searchField).toBeVisible();
  });

  await test.step('[Action] Click on "Create a playlist" button in sidebar', async () => {
    await homePage.clickCreatePlaylistInSidebar();
  });

  await test.step(
    '[Result] The playlist creation modal is displayed.',
    async () => {
      await playlistCreationModal.handlePlaylistTypeChoice();
    }
  );

  await test.step(
    `[Action] Select a cover, fill the title "${playlistName}" and confirm the creation`,
    async () => {
      await playlistCreationModal.selectCover();
      await playlistCreationModal.fillPlaylistName(playlistName);
      await playlistCreationModal.confirmCreation();
    }
  );

  await test.step(
    '[Result] The playlist is created — store the playlist ID from the current URL for later use',
    async () => {
      await playlistPage.expectPlaylistTitleVisible(playlistName);
      playlistUrl = playlistPage.getPlaylistUrlFromCurrentPage();
      await page.waitForLoadState('domcontentloaded');
    }
  );

  await test.step(`[Action] Search for a track "${trackQuery}"`, async () => {
    await searchPage.searchFor(trackQuery);
  });

  await test.step('[Result] Track results are displayed', async () => {
    await searchPage.expectTrackResultsAreVisible();
  });

  await test.step(
    `[Action] Open context menu of the first track in track results section and add it to "${playlistName}"`,
    async () => {
      await searchPage.scrollToSearchResultsSection('Tracks');
      trackTitle = await searchPage.getFirstTrackTitle();
      await searchPage.openFirstTrackContextMenu();
      await trackContextMenu.clickAddToPlaylist();
      await trackContextMenu.addToPlaylist(playlistName);
    }
  );

  await test.step(
    '[Result] The track is correctly added to the playlist — navigate to the stored playlist URL and verify the track is present',
    async () => {
      await playlistPage.goToPlaylist(playlistUrl);
      await playlistPage.expectTrackPresent(trackTitle);
    }
  );
});
