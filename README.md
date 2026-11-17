# Payment Reconciliation & Exception Detection System

A professional financial reconciliation dashboard that compares platform transaction records against bank settlement data, identifies discrepancies, classifies exceptions, and provides explainable breakdowns of why the books don't balance.

## Problem Statement

A payments company experiences month-end accounting mismatches between:

1. **Platform Transactions** — Records every payment and refund processed through the payment platform
2. **Bank Settlements** — Records actual money received in the company's bank account

The mismatch occurs because:
- Settlement processing takes 1–2 business days (cross-month timing)
- Precision differences between systems cause rounding gaps
- Duplicate bank entries can inflate totals
- Orphan refunds reference non-existent original payments
- Some settlements have no corresponding platform transactions

This system automates the comparison, categorises every discrepancy, and produces an auditable reconciliation report.

## Business Workflow

```
Platform Transactions                Bank Settlements
       │                                    │
       ▼                                    ▼
  ┌─────────┐                        ┌─────────┐
  │Normalize│                        │Normalize│
  │ & Parse │                        │ & Parse │
  └────┬────┘                        └────┬────┘
       │                                    │
       ▼                                    ▼
  ┌──────────────────────────────────────────────┐
  │         Reconciliation Engine                 │
  │                                               │
  │  1. Detect duplicate bank entries             │
  │  2. Match transactions by ID                  │
  │  3. Classify: Matched / Timing / Rounding     │
  │  4. Detect missing settlements                │
  │  5. Detect orphan refunds                     │
  │  6. Detect unmatched bank entries             │
  │  7. Calculate totals with decimal precision   │
  │  8. Produce explainable breakdown             │
  └──────────────────────────────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │   Dashboard & Export  │
  │  Summary │ Exceptions │
  │  Table   │ CSV Export  │
  └──────────────────────┘
```

## Architecture

```
src/
├── data/
│   ├── config.js           # All configurable parameters
│   └── syntheticData.js    # Demo dataset generator (20+ platform, 20+ bank records)
├── engine/
│   └── reconciliationEngine.js  # Core reconciliation logic (UI-independent)
├── utils/
│   ├── decimal.js          # Decimal-safe arithmetic (decimal.js wrapper)
│   ├── dates.js            # Date parsing, formatting, period checks
│   ├── validation.js       # CSV upload validation
│   └── csvExport.js        # Export to CSV
├── hooks/
│   └── useReconciliation.js # React state management hook
├── components/
│   ├── common/
│   │   ├── StatusBadge.jsx
│   │   ├── MetricCard.jsx
│   │   └── Modal.jsx
│   ├── dashboard/
│   │   ├── SummaryOverview.jsx
│   │   ├── ExceptionBreakdown.jsx
│   │   └── ReconciliationTable.jsx
│   ├── exceptions/
│   │   ├── ExceptionDetail.jsx
│   │   └── ExceptionList.jsx
│   └── data/
│       └── DataManagement.jsx
├── test/
│   ├── setup.js
│   └── reconciliation.test.js  # 36 automated tests
├── App.jsx
├── main.jsx
└── index.css
```

**Key design decision**: The reconciliation engine (`src/engine/reconciliationEngine.js`) is completely independent of React and the UI. It accepts arrays of transaction objects, performs all logic using decimal.js for precision, and returns a pure data result. This makes it testable, portable, and reusable.

## Technology Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Build tool and dev server |
| Tailwind CSS 4 | Utility-first styling |
| Lucide React | Icon library |
| decimal.js | Decimal-safe financial arithmetic |
| PapaParse | CSV parsing (upload) |
| FileSaver.js | CSV export (download) |
| Vitest | Test framework |

## Synthetic Data Assumptions

1. **Reporting period**: October 2026
2. **Currency**: INR (Indian Rupees)
3. **Timezone**: All timestamps are interpreted in the same local timezone (IST)
4. **Platform precision**: 4 decimal places (internal precision for fractional pricing)
5. **Bank precision**: 2 decimal places (standard bank statement precision)
6. **Settlement delay**: 1–2 business days from platform transaction date
7. **Transaction IDs**: Format `TXN-NNNN` for payments, `REF-NNNN` for refunds
8. **Bank references**: Format `BNK-YYYYMMDD-NNN` with date and sequence

### Dataset Size
- **24 platform transactions** (20 payments + 4 refunds)
- **25 bank settlements** (including 1 duplicate and 1 unmatched entry)

### Planted Problems
See [PLANTED_EXCEPTIONS.md](./PLANTED_EXCEPTIONS.md) for detailed documentation of all four deliberately planted exceptions.

## Reconciliation Methodology

### Step-by-step Process

1. **Normalize** — Standardise transaction IDs (uppercase, trimmed), parse dates, convert amounts to Decimal objects
2. **Duplicate Detection** — Group bank settlements by `transactionRef`; first occurrence kept, subsequent marked as duplicates
3. **Transaction Matching** — For each platform transaction, look up the corresponding bank settlement by ID
4. **Classification**:
   - **Matched**: Amounts identical (within 0.001)
   - **Timing Difference**: Bank settlement date falls after reporting period end (October 31)
   - **Rounding Difference**: Amounts differ but within configured tolerance (default: ₹0.05)
   - **Missing Settlement**: No bank entry found for the platform transaction
5. **Orphan Refund Detection** — Refunds whose `originalTransactionId` doesn't exist in the platform dataset
6. **Unmatched Bank Entries** — Bank settlements with no corresponding platform transaction
7. **Totals Calculation** — All arithmetic uses `decimal.js` with `ROUND_HALF_UP`; signed cash flow is enforced (payments add, refunds subtract on both platform and bank sides); duplicate settlements are excluded from adjusted bank totals.
8. **Reconciliation Bridge** — Mathematical variance decomposition proving `Reconciliation Difference = Missing Settlements - Unmatched Bank Entries + Rounding Adjustments`, with zero unexplained variance.

### Matching Rules (Configurable)

| Parameter | Default | Location |
|---|---|---|
| Rounding tolerance | ₹0.05 | `src/data/config.js` → `matching.roundingTolerance` |
| Internal precision | 4 decimal places | `src/data/config.js` → `currency.internalPrecision` |
| Display precision | 2 decimal places | `src/data/config.js` → `currency.displayPrecision` |
| Max settlement delay | 2 business days | `src/data/config.js` → `matching.maxSettlementDelayDays` |

## Setup and Execution

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+

### Installation

```bash
cd onelabVen
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

### Run Tests

```bash
npm test
```

For watch mode:
```bash
npm run test:watch
```

### Production Build

```bash
npm run build
npm run preview
```

The built output is in the `dist/` directory and can be deployed to any static hosting (Netlify, Vercel, GitHub Pages, S3, etc.).

## Deployment

The application is a static single-page application with no backend. To deploy:

1. Run `npm run build`
2. Upload the `dist/` directory to any static hosting provider

For example, with **Netlify**:
```bash
npm run build
npx netlify deploy --dir=dist --prod
```

For **Vercel**:
```bash
npm run build
npx vercel --prod
```

For **GitHub Pages**, add a `base` path in `vite.config.js` and deploy the `dist` folder.

## Known Limitations

1. **No persistent storage** — Data resets on page reload (by design for this assessment; uses in-memory state)
2. **Single-period reconciliation** — Currently configured for October 2026 only; extending to multi-period would require a period selector and data partitioning
3. **Matching by ID only** — Transactions are matched by exact ID; fuzzy matching (amount + date heuristics) is not implemented
4. **No authentication** — The dashboard is accessible without login
5. **CSV-only upload** — Does not support Excel, JSON, or API-based data import
6. **No audit trail** — Exception resolutions and manual overrides are not persisted
7. **Client-side only** — All processing happens in the browser; very large datasets (10,000+ records) may impact performance
# oneLab
