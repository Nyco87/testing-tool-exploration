# Metrics

> Last updated: June 2026 — updated manually after each significant change.

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