# Budget Planner

A personal budget planner that gives you a clear picture of your finances. Track bank accounts, income streams, and expenses at whatever granularity suits you. Includes an affordability calculator for modelling loans, mortgages, and "what if" scenarios against your existing budget.

## Features

- **Dashboard** — budget summary, savings rate, daily burn, category breakdown, cash flow projection
- **Accounts** — bank account management with balance history charts
- **Budget** — income and expense tracking with three entry modes (individual, category total, quick estimate)
- **Affordability** — loan calculator, full scenario builder (loan + budget changes + upfront costs + projection), and saved scenario comparison
- **Net worth** — daily snapshots with trend chart (assets minus liabilities)
- **Dual calculation modes** — Actual (date-aware proration for a selected period) and Run Rate (current ongoing baseline)
- **Period navigation** — browse weeks, fortnights, months, and financial years
- **Dark mode** — light, dark, and system theme support
- **Backup/restore** — full JSON export and import

## Setup

```bash
npm install
npm run build
```

## Running

Managed with PM2 on port 3012:

```bash
pm2 start server/index.js --name budget-planner
```

Or run directly:

```bash
node server/index.js
```

Then open [http://localhost:3012](http://localhost:3012).

## Development

```bash
npm run dev          # Vite dev server (proxies /api to :3012)
npm run quality      # lint + format:check + type-check + security audit
npm run format       # auto-fix formatting
```

## Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express (ES modules) + JSON file storage
- **State**: Zustand
- **Charts**: Recharts

## Calculation Model

### Two Modes

- **Actual** — date-aware totals for a selected period window (week, fortnight, month, or financial year). Amounts are prorated based on item start/end dates.
- **Run Rate** — current ongoing baseline. Excludes one-off items and anything not active today. Uses simple frequency conversion with no proration.

### Entry Types

| Type               | Frequency                                  | Actual mode                                              | Run Rate                           |
| ------------------ | ------------------------------------------ | -------------------------------------------------------- | ---------------------------------- |
| **Individual**     | User-chosen (daily, weekly, monthly, etc.) | Frequency-converted to display period, prorated at edges | Frequency-converted, static amount |
| **One-off**        | One-off                                    | Full amount in the period containing the date            | Excluded                           |
| **Category Total** | One-off (tied to statement month)          | Full amount in the period containing the statement month | Excluded                           |
| **Quick Estimate** | User-chosen                                | Same as Individual                                       | Same as Individual                 |

### Frequency Conversion

All conversions use an annual intermediary:

```
converted = amount × (periodsPerYear[from] / periodsPerYear[to])
```

Periods per year: daily=365, weekly=52, fortnightly=26, monthly=12, quarterly=4, annually=1.

Example: $10/day → weekly = $10 × 365/52 = $70.19/week.

### Proration (Actual Mode)

Proration determines how much of an item's cost falls within the selected period window.

**One-off items**: Full amount if the date falls within the window, zero otherwise.

**Daily items**: Exact day count × daily amount for the overlap between the item's active dates and the window.

**All other recurring items**: Converted to a monthly equivalent, then summed month-by-month across the overlap:

- **Start date**: Snapped to the 1st of its month (payment in advance — if you pay on the 15th, that month's full charge still occurred)
- **End date**: Uses the actual date. The final month is prorated by days active ÷ days in month
- **Full months**: Show the full monthly-equivalent amount (ratio = 1.0)
- **Partial final month**: e.g. item ending Jan 28 → January shows 28/31 of the monthly amount

**Example**: $100/month, started Jun 15, ended Mar 15 in a Jul–Jun financial year:

- Start snaps to Jun 1 → overlap begins Jul 1 (window start)
- Jul–Feb: 8 full months × $100 = $800
- Mar: 15/31 × $100 = $48.39
- **Total: $848.39**

### Net Worth

Assets (savings, transaction, investment, cash) minus liabilities (credit card, loan, mortgage). Daily snapshots are deduplicated server-side.

## Data

All data is stored as JSON files in `local_data/` (gitignored). No database required.

## License

MIT
