# Planted Exceptions — Detection & Analysis

This document describes the four deliberately planted exceptions in the synthetic dataset, explaining what each one is, how the system detects it, and the reconciliation impact.

---

## Case A: Cross-Month Settlement (Timing Difference)

### What was planted
- **Platform transaction**: `TXN-1020`, ₹17,650.00, initiated on **2026-10-31 at 22:45**
- **Bank settlement**: `BNK-20261102-001`, ₹17,650.00, settled on **2026-11-02**

### Why this happens in real life
Settlement processing takes 1–2 business days. A transaction initiated late on October 31st (Friday) would not reach the bank until the following Monday or Tuesday (November 2nd). This is a natural timing lag, not a missing payment.

### How the system detects it
1. The engine matches `TXN-1020` to its bank settlement by transaction ID
2. It checks whether the settlement date falls **after the reporting period** (October 31, 2026)
3. Since November 2 > October 31, the transaction is classified as `TIMING_DIFFERENCE` instead of `MATCHED` or `MISSING_SETTLEMENT`

### Reconciliation impact
The ₹17,650.00 appears in the platform total for October but the bank settlement belongs to November. This inflates the reconciliation difference but is **not an actual loss** — it will reconcile in the November period.

### Key assertion in tests
```javascript
expect(timing.status).toBe('TIMING_DIFFERENCE');
expect(timing.transactionDate).toBe('2026-10-31');
expect(timing.settlementDate).toBe('2026-11-02');
```

---

## Case B: Rounding Difference (Precision Gap)

### What was planted
- **Platform transaction**: `TXN-1007`, amount = **₹1,499.9975** (4 decimal places)
- **Bank settlement**: `BNK-20261009-001`, amount = **₹1,500.00** (2 decimal places)
- **Difference**: -₹0.0025

### Why this happens in real life
The platform records amounts at 4 decimal places for internal precision (e.g., when splitting a multi-item cart with fractional per-unit pricing). The bank rounds to 2 decimal places (standard financial reporting). Over aggregated transactions, these sub-cent differences accumulate.

### Precision assumption
- **Platform**: 4 decimal places (e.g., `1499.9975`)
- **Bank**: 2 decimal places (e.g., `1500.00`)
- **Rounding method**: `ROUND_HALF_UP` (banker's rounding)
- When bank receives `1499.9975`, it rounds to `1500.00`

### How the system detects it
1. The engine matches by ID and finds amounts differ: `1499.9975 ≠ 1500.00`
2. It calculates the absolute difference: `|1499.9975 - 1500.00| = 0.0025`
3. It checks this against the **rounding tolerance** (configurable, default ₹0.05)
4. Since `0.0025 ≤ 0.05`, it classifies as `ROUNDING_DIFFERENCE` rather than a true mismatch

### Reconciliation impact
The ₹0.0025 difference is within tolerance and arises from a known precision gap. No financial action is needed, but the rounding methodology should be documented for audit purposes.

### Key assertion in tests
```javascript
const diff = toDecimal(rounding.difference);
expect(diff.toNumber()).toBeCloseTo(-0.0025, 4);
expect(diff.isNegative()).toBe(true);
```

---

## Case C: Duplicate Bank Settlement

### What was planted
- **First settlement**: `BNK-20261005-001` for `TXN-1003`, ₹15,200.00 on 2026-10-05
- **Duplicate settlement**: `BNK-20261005-002` for `TXN-1003`, ₹15,200.00 on 2026-10-05

Both entries reference the **same platform transaction** (`TXN-1003`) but have **different bank reference numbers**, indicating the bank processed the settlement twice.

### Why this happens in real life
Duplicate settlements can occur due to:
- Bank processing errors
- Network timeouts causing retry
- Manual re-submission
- System glitches in the settlement pipeline

### How the system detects it
1. During the duplicate detection phase, the engine groups bank records by `transactionRef`
2. When `TXN-1003` appears twice, the first occurrence is kept in the unique set
3. The second occurrence is flagged as a **duplicate** with both bank references recorded
4. The duplicate amount (₹15,200.00) is **excluded from the adjusted bank total**

### Reconciliation impact
Without duplicate detection, the bank total would be inflated by ₹15,200.00, making reconciliation impossible. The system removes the duplicate from the adjusted total and flags it for investigation with the bank.

### Key assertion in tests
```javascript
expect(result.duplicates.length).toBe(1);
expect(result.summary.totalBankAdjusted.lt(result.summary.totalBankAmount)).toBe(true);
// Adjusted = Raw bank total - 15,200.00 (duplicate)
```

---

## Case D: Orphan Refund

### What was planted
- **Refund transaction**: `REF-5099`, ₹3,500.00, initiated on 2026-10-25
- **References original**: `TXN-9999` — which **does not exist** in the platform dataset
- **Bank settlement exists**: `BNK-20261027-R01` for `REF-5099`, ₹3,500.00

### Why this happens in real life
An orphan refund can occur when:
- The original payment was recorded in a different system or period
- The original transaction ID was entered incorrectly
- A refund was issued against a voided or deleted transaction
- Fraudulent refund processing

### How the system detects it
1. For every refund in the platform dataset, the engine checks if `originalTransactionId` exists in the platform transaction map
2. `REF-5099` references `TXN-9999`, which is not in the dataset
3. The refund is flagged as `ORPHAN_REFUND` with both the refund ID and the missing original ID recorded

### Reconciliation impact
The ₹3,500.00 refund reduces the net platform total, but since the original payment cannot be verified, there's an accountability gap. This requires manual investigation — either the original payment exists in another system/period, or the refund may be erroneous.

### Key assertion in tests
```javascript
expect(orphan.transactionId).toBe('REF-5099');
expect(orphan.originalTransactionId).toBe('TXN-9999');
expect(orphan.status).toBe('ORPHAN_REFUND');
```

---

## Summary of All Planted Exceptions

| Case | Type | Transaction | Amount (₹) | Detection Method |
|------|------|-------------|-----------|-----------------|
| A | Timing Difference | TXN-1020 | 17,650.00 | Settlement date > period end |
| B | Rounding Difference | TXN-1007 | 0.0025 (diff) | Amount diff ≤ tolerance |
| C | Duplicate Settlement | TXN-1003 | 15,200.00 | Same transactionRef, different bankRef |
| D | Orphan Refund | REF-5099 | 3,500.00 | originalTransactionId not found |

All four exceptions are detected automatically by the reconciliation engine and surfaced in the dashboard with:
- Clear categorisation
- Detailed reason text
- Reconciliation impact explanation
- Suggested corrective action

