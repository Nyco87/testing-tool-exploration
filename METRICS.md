# Metrics

> Last updated: August 2026 — updated manually after each significant change.

## Test Suite

| Metric | Value |
|---|---|
| Total tests | 25 |
| Spec files | 6 |
| Endpoints covered | 4 (`/search`, `/artist`, `/album`, `/chart`) |
| Data-driven cases | 13 (3 manual + 10 AI-generated) |

## Endpoint Coverage

| Metric | Value |
|---|---|
| Total major endpoints | 14 |
| Endpoints covered | 4 |
| Coverage | ~29% |

| Endpoint | Tests | Type |
|---|---|---|
| /search | ~12 | functional, data-driven, response-time |
| /artist | ~5 | functional, response-time |
| /album | ~4 | functional, response-time |
| /chart | ~1 | functional |

## Response Time (latest run)

| Endpoint | Duration | Threshold | Status |
|---|---|---|---|
| /search | ~290ms | 300ms | ✅ |
| /artist | ~170ms | 300ms | ✅ |
| /album | ~182ms | 300ms | ✅ |

## AI-Assisted Testing

| Metric | Value |
|---|---|
| AI-generated test | 6 |
| AI-generated fixtures | 10 |
| Manual fixtures | 3 |
| Scripts powered by AI | 2 (`generate-fixtures.ts`, `analyze-specs.ts`) |
| Allure IDs auto-generated | 25 |

## E2E Test Suite — Page Object Model

| Metric | Value |
|---|---|
| E2E spec files | 3 |
| Page Objects created | 7 |
| Total encapsulated methods | 22 |
| Total encapsulated locators | 16 |
| Raw selectors remaining in specs | 0 |
| E2E test steps (`test.step()`) | 17 |

### Page Objects breakdown

| Page Object | Locators | Methods | Used in specs |
|---|---|---|---|
| `BasePage` | 0 | 1 | 3/3 (via inheritance) |
| `HomePage` | 4 | 3 | 2/3 |
| `SearchPage` | 4 | 7 | 2/3 |
| `ArtistPage` | 0 | 1 | 1/3 |
| `PlaylistCreationModal` | 4 | 4 | 1/3 |
| `PlaylistPage` | 1 | 4 | 1/3 |
| `TrackContextMenu` | 3 | 2 | 1/3 |

> `SearchPage` est le Page Object le plus mutualisé (recherche, résultats artiste et tracks) — 3 méthodes y sont temporairement portées (`getFirstTrackTitle`, `openFirstTrackContextMenu`, `scrollToSearchResultsSection`) en attendant l'extraction d'une future `DataGridPage` dédiée à la grille de résultats.

## Performance Testing — k6

| Metric | Value |
|---|---|
| Scripts | 4 (`search.js`, `artist.js`, `charts.js`, `traffic-spike.js`) |
| Load profile (nominal) | 10 VUs, 30s, `sleep(1)` |
| Load profile (spike) | ramp-up 1→50 VUs over 2min |

### Nominal load — p95 vs threshold

| Endpoint | p95 observed | Threshold | Status |
|---|---|---|---|
| /search | ~250ms | 500ms | ✅ |
| /artist | ~240ms | 500ms | ✅ |
| /chart | ~437ms | 1000ms | ✅ |

### Traffic spike scenario

| Metric | Value |
|---|---|
| Max VUs reached | 49 |
| Rate limit hits | up to 58% of requests |
| True errors (5xx, timeouts, malformed JSON) | 0% |
| CI-blocking threshold | `true_errors rate < 1%` |

> L'API Deezer applique un rate limit non documenté (HTTP 200 + `error.code: 4`, pas de 429) — le scénario de pic distingue ce throttling propre d'une vraie panne, et ne fait échouer la CI que sur les vraies erreurs.