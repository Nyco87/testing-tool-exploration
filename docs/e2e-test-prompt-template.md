# Prompt Template for E2E test creation 

You are a Playwright TypeScript automation expert.

## Context
I am building an E2E test suite on deezer.com.
The user session is already loaded via storageState in playwright.config.ts — no login needed in the spec.
Use the following test as a reference for code style: [paste flow.spec.ts]

## Test to implement
File: tests/e2e/[filename].spec.ts

Title: [Test title]

[paste your steps here in this format]
Step 1 - [Pre-requisit] ...
Step 2 - [Action] ...
Step 3 - [Result] ...
Step 4 - [Action] ...
Step 5 - [Result] ...

## Variable
const [varName] = '[value]';
This variable must be used in step labels and selectors where relevant.

## Rules
- Create one test.step() per step — never merge an Action and a Result in the same step
- [Action] steps contain only Playwright interactions (click, fill, hover...)
- [Result] steps contain only assertions (expect())
- Use data-testid as first priority for selectors
- If data-testid is not available, use getByRole() with aria-label
- Never use CSS generated classes as selectors

## Screenshots
[attach DOM screenshots for each screen involved in the test]