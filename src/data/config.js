/**
 * Reconciliation Configuration
 * All configurable parameters for the reconciliation engine.
 */

export const RECONCILIATION_CONFIG = {
  // Reporting period
  reportingPeriod: {
    year: 2026,
    month: 10, // October (1-indexed)
    label: 'October 2026',
  },

  // Currency
  currency: {
    code: 'INR',
    symbol: '₹',
    // Internal precision: 4 decimal places for intermediate calculations
    internalPrecision: 4,
    // Display/reporting precision: 2 decimal places
    displayPrecision: 2,
  },

  // Matching rules
  matching: {
    // Rounding tolerance for amount matching (in currency units)
    // Amounts within this tolerance are considered matched with a rounding note
    roundingTolerance: 0.05,
    // Maximum settlement delay in business days
    maxSettlementDelayDays: 2,
  },

  // Transaction types
  transactionTypes: {
    PAYMENT: 'PAYMENT',
    REFUND: 'REFUND',
  },

  // Reconciliation statuses
  statuses: {
    MATCHED: 'MATCHED',
    TIMING_DIFFERENCE: 'TIMING_DIFFERENCE',
    DUPLICATE: 'DUPLICATE',
    ROUNDING_DIFFERENCE: 'ROUNDING_DIFFERENCE',
    MISSING_SETTLEMENT: 'MISSING_SETTLEMENT',
    UNMATCHED_BANK: 'UNMATCHED_BANK',
    ORPHAN_REFUND: 'ORPHAN_REFUND',
  },

  // Status labels for display
  statusLabels: {
    MATCHED: 'Matched',
    TIMING_DIFFERENCE: 'Timing Difference',
    DUPLICATE: 'Duplicate Settlement',
    ROUNDING_DIFFERENCE: 'Rounding Difference',
    MISSING_SETTLEMENT: 'Missing Settlement',
    UNMATCHED_BANK: 'Unmatched Bank Entry',
    ORPHAN_REFUND: 'Orphan Refund',
  },

  // Status colors for UI
  statusColors: {
    MATCHED: 'green',
    TIMING_DIFFERENCE: 'amber',
    DUPLICATE: 'red',
    ROUNDING_DIFFERENCE: 'amber',
    MISSING_SETTLEMENT: 'red',
    UNMATCHED_BANK: 'red',
    ORPHAN_REFUND: 'red',
  },

  // Suggested actions per exception type
  suggestedActions: {
    TIMING_DIFFERENCE: 'No action required. This transaction will reconcile in the next period (November 2026). Monitor to confirm settlement.',
    DUPLICATE: 'Investigate duplicate bank entry. Contact the bank to reverse the duplicate credit. Do not include in reconciled totals.',
    ROUNDING_DIFFERENCE: 'Review rounding methodology. The difference is within tolerance and arises from precision differences between platform (4dp) and bank (2dp) rounding.',
    MISSING_SETTLEMENT: 'Escalate to payment operations. Confirm with the bank whether the settlement is pending or failed. Initiate trace if older than 3 business days.',
    UNMATCHED_BANK: 'Investigate unmatched bank credit. This entry has no corresponding platform transaction. Contact the bank or check if it belongs to another merchant account.',
    ORPHAN_REFUND: 'Investigate orphan refund. The original payment transaction cannot be found. Verify if the original payment was recorded in a different period or system.',
  },
};

