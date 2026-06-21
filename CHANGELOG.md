# Changelog

## [1.3.1] - 2026-06-21

### Fixed

- **Server crash risk**: all async Express routes now wrapped in error handler (uncaught promise rejections no longer crash the process)
- **Data corruption detection**: `readJSON` now distinguishes file-not-found from corrupted JSON — corrupted files are backed up and reset instead of silently returning null
- **Restore endpoint security**: restore now validates and whitelists fields per collection instead of accepting raw data
- **Division by zero**: `convertAmount` now guards against one-off frequency (returns amount unchanged)
- **Loan calculation guard**: `calculateLoanRepayment` returns zero for termYears ≤ 0 instead of NaN/Infinity
- **PERIODS_PER_YEAR consolidation**: single shared constant in `utils/constants.ts` used by money.ts, periodCalc.ts, and calculations.ts (previously duplicated 3x with inconsistent keys)
- **Store error handling**: all Zustand stores now catch fetch errors, set `loading: false`, and expose an `error` state instead of leaving loading stuck at true
- **Net worth initial state**: `networthStore` now starts with `loading: true` (was false, inconsistent with other stores)
- **Net worth snapshot trigger**: snapshots now trigger on balance changes, not just account count changes
- **CORS restriction**: server now only accepts requests from `localhost:3012` instead of all origins
- **Input validation**: server validates amount (non-negative number) and frequency (valid enum) on income and expense create/update
- **Stale scenario cleanup**: deleting an expense or income now removes its ID from any scenario's removedExpenseIds/removedIncomeIds
- **Settings debounce**: settings saves are debounced (300ms) to prevent rapid-fire API calls
- **Expense pause/resume**: now preserves unsaved form edits instead of discarding them
- **Category delete confirmation**: CategoryManager now shows a confirmation dialog before deleting
- **Category UUID**: new categories use server-generated UUID instead of name-derived ID
- **Currency symbol**: ExpenseForm quick-estimate preview uses configured currency symbol instead of hardcoded `$`
- **ScenarioBuilder keys**: expense/one-off lists use unique keys instead of array index
- **Atomic writes**: `writeJSON` now uses async `fs.rename` instead of sync `renameSync`
- **Concurrent write safety**: per-file mutex prevents read-modify-write race conditions from multiple tabs
- **Restore networth sanitization**: net worth history now field-whitelisted on restore (was the only unsanitized collection)
- **Category ID injection**: category POST always uses server-generated UUID (no longer accepts client-provided ID)
- **Settings debounce accumulation**: rapid changes to different settings fields are accumulated instead of losing intermediate changes
- **Express error handler**: custom error-handling middleware returns generic message instead of leaking stack traces
- **FY month validation**: server validates financialYearStartMonth is 1-12
- **Account type validation**: server validates account type against known types on create
- **Name validation**: server validates name is a non-empty string on income, expense, and account create

## [1.3.0] - 2026-06-21

### Added

- **Scenario Builder** — full affordability modelling tool with four sections:
  - Optional loan/mortgage calculator with auto-populated repayment
  - Budget items that would change (mark existing expenses/income as stopping)
  - New recurring expenses with frequency conversion
  - Upfront/one-off costs (application fees, moving costs, setup costs, etc.)
  - Live projection showing current surplus → new ongoing surplus + upfront costs
- Edit saved scenarios from the Saved Scenarios tab (loads back into Scenario Builder)
- Subcategory display in brackets next to category name in Budget expense table
- Custom `ConfirmDialog` component replacing all `window.confirm()` calls
- Two new expense categories: Travel & Holidays, Donations & Charity
- Expanded subcategories across all 15 categories
- Calculation model documentation in README

### Changed

- **Proration model**: start dates snap to 1st of month (payment in advance); end dates prorate the final month by days active / days in month
- **Budget line items**: show frequency-converted rates (not prorated amounts) — totals still use proration
- **Category-total expenses**: now saved as one-off items tied to a statement month
- **Expense form**: name field visible for all entry modes; start/end date fields hidden for category-total mode
- Affordability tabs renamed: Loan Calculator / Scenario Builder / Saved Scenarios
- Affordability tab state preserved when switching (CSS hidden instead of conditional rendering)
- Modal backdrops use `onMouseDown` instead of `onClick` to prevent drag-select from closing modals

### Removed

- Apply button from scenarios — scenarios are for modelling/calculation only
- Server route `POST /api/scenarios/:id/apply`

## [1.2.0] - 2026-06-21

### Added

- Shared `isActiveOnDate` helper for run-rate filtering across Dashboard, Budget, category breakdown, and Affordability
- PWA manifest, icons (SVG + PNG), apple-touch-icon, theme-color meta
- README with setup instructions
- MIT license

### Fixed

- Run Rate semantics: exclude one-off items and income/expenses not active today, preventing ended records from inflating surplus
- Actual mode preserved: continues using date-aware proration against the selected period window
- `isActiveOnDate` timezone bug: used UTC date via `toISOString()`, causing items to appear active/inactive one day off before 10am AEST — now uses local date
- Budget page run-rate list showed inactive/paused expenses (totals were correct, list was not)
- Income and expense forms accepted negative amounts and unconstrained tax rates
- Net worth snapshot race condition: `snapshot()` could run before history was fetched, creating duplicates
- Net worth snapshot server-side dedup: replaces same-day snapshot instead of appending duplicates
- Atomic file writes: `writeJSON` now writes to `.tmp` then renames, preventing data corruption on crash
- Field whitelisting on all API PUT endpoints: prevents `req.body` from overwriting protected fields (`id`, `createdAt`)
- Replaced dynamic `import('./data.js')` in restore endpoint with static import

### Removed

- Electron packaging (electron, electron-builder, build config, entitlements) — app is PM2-served only

### Security

- Updated dependency lockfile via `npm audit fix` — zero vulnerabilities

## [1.1.0] - 2026-05-09

- Date-aware period calculations: Actual mode prorates income/expenses based on start/end dates within the selected period window
- Dual calculation modes: Actual (date-aware, default) and Run Rate (simple frequency conversion)
- Configurable financial year start month with presets (Australia/UK/US)
- Period navigation: browse between weeks, fortnights, months, and financial years
- Cash flow projection now uses per-month calculations so items with end dates drop off correctly

## [1.0.0] - 2026-05-09

- Initial release — all 6 phases complete
- Account management with balance history charts
- Income tracking with gross/net toggle and tax rate
- Expense tracking with 3 entry modes (individual, category total, quick estimate)
- 13 default expense categories with subcategories
- Dashboard with budget summary, category breakdown, cash flow projection
- Loan/mortgage calculator with amortisation and affordability indicators
- What-if scenario builder with save, compare, and apply
- Net worth tracking with daily snapshots and trend chart
- Period normalisation (weekly/fortnightly/monthly/quarterly/annually)
- Dark mode with light/dark/system toggle
- Full backup/restore (JSON export/import)
- Keyboard navigation (D/A/B/F shortcuts)
- Electron desktop app config (signed + notarised macOS)
- Express server with JSON data layer and PM2 support (port 3012)
