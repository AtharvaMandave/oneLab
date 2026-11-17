/**
 * Synthetic Dataset Generator
 * 
 * Generates realistic platform transactions and bank settlements for October 2026.
 * 
 * PLANTED PROBLEMS:
 * Case A: Cross-month settlement — TXN-1020 (Oct 31) settles on Nov 2
 * Case B: Rounding difference — TXN-1007 platform=1499.9975 → bank rounds to 1500.00 (diff=0.0025)
 * Case C: Duplicate settlement — TXN-1003 appears twice in bank with different bank refs
 * Case D: Orphan refund — REF-5099 references TXN-9999 which doesn't exist in platform data
 * 
 * PRECISION ASSUMPTIONS:
 * - Platform records amounts at 4 decimal places (internal precision)
 * - Bank settlements round to 2 decimal places
 * - This precision gap creates the rounding difference in Case B
 */

import { RECONCILIATION_CONFIG } from './config.js';

/**
 * Platform Transaction Records
 * 20+ records for October 2026 with a mix of payments and refunds
 */
export function generatePlatformTransactions() {
  return [
    // --- Regular payments (matched with bank) ---
    {
      transactionId: 'TXN-1001',
      type: 'PAYMENT',
      amount: '25000.0000',
      timestamp: '2026-10-01T09:15:00',
      description: 'Online purchase - Electronics',
    },
    {
      transactionId: 'TXN-1002',
      type: 'PAYMENT',
      amount: '8750.5000',
      timestamp: '2026-10-02T11:30:00',
      description: 'Subscription renewal - Annual plan',
    },
    {
      transactionId: 'TXN-1003',
      type: 'PAYMENT',
      amount: '15200.0000',
      timestamp: '2026-10-03T14:22:00',
      description: 'Invoice payment - Consulting services',
    },
    {
      transactionId: 'TXN-1004',
      type: 'PAYMENT',
      amount: '3400.7500',
      timestamp: '2026-10-05T08:45:00',
      description: 'Mobile recharge - Bulk',
    },
    {
      transactionId: 'TXN-1005',
      type: 'PAYMENT',
      amount: '62000.0000',
      timestamp: '2026-10-06T16:00:00',
      description: 'B2B vendor payment',
    },
    {
      transactionId: 'TXN-1006',
      type: 'PAYMENT',
      amount: '1250.0000',
      timestamp: '2026-10-07T10:10:00',
      description: 'Digital goods purchase',
    },
    // Case B: Rounding difference — platform stores 4dp, bank rounds to 2dp
    {
      transactionId: 'TXN-1007',
      type: 'PAYMENT',
      amount: '1499.9975',
      timestamp: '2026-10-08T13:45:00',
      description: 'Multi-item cart purchase (fractional pricing)',
    },
    {
      transactionId: 'TXN-1008',
      type: 'PAYMENT',
      amount: '45000.0000',
      timestamp: '2026-10-10T09:00:00',
      description: 'Premium membership upgrade',
    },
    {
      transactionId: 'TXN-1009',
      type: 'PAYMENT',
      amount: '7800.2500',
      timestamp: '2026-10-11T15:30:00',
      description: 'Service fee payment',
    },
    {
      transactionId: 'TXN-1010',
      type: 'PAYMENT',
      amount: '19999.9900',
      timestamp: '2026-10-12T11:15:00',
      description: 'Annual software license',
    },
    {
      transactionId: 'TXN-1011',
      type: 'PAYMENT',
      amount: '5500.0000',
      timestamp: '2026-10-14T08:20:00',
      description: 'Event registration fee',
    },
    {
      transactionId: 'TXN-1012',
      type: 'PAYMENT',
      amount: '33750.0000',
      timestamp: '2026-10-15T17:45:00',
      description: 'Equipment purchase',
    },
    {
      transactionId: 'TXN-1013',
      type: 'PAYMENT',
      amount: '2100.0000',
      timestamp: '2026-10-17T12:00:00',
      description: 'API usage charges',
    },
    {
      transactionId: 'TXN-1014',
      type: 'PAYMENT',
      amount: '88500.0000',
      timestamp: '2026-10-19T10:30:00',
      description: 'Enterprise contract payment',
    },
    {
      transactionId: 'TXN-1015',
      type: 'PAYMENT',
      amount: '4200.0000',
      timestamp: '2026-10-21T14:00:00',
      description: 'Cloud hosting payment',
    },
    // This payment has no bank settlement (Case: Missing Settlement)
    {
      transactionId: 'TXN-1016',
      type: 'PAYMENT',
      amount: '11300.0000',
      timestamp: '2026-10-22T09:45:00',
      description: 'Marketing services invoice',
    },
    {
      transactionId: 'TXN-1017',
      type: 'PAYMENT',
      amount: '6750.0000',
      timestamp: '2026-10-24T16:15:00',
      description: 'Training program fee',
    },
    {
      transactionId: 'TXN-1018',
      type: 'PAYMENT',
      amount: '28400.0000',
      timestamp: '2026-10-26T11:00:00',
      description: 'Hardware procurement',
    },
    {
      transactionId: 'TXN-1019',
      type: 'PAYMENT',
      amount: '950.0000',
      timestamp: '2026-10-28T08:30:00',
      description: 'Utility payment',
    },
    // Case A: Cross-month settlement — October transaction, settles in November
    {
      transactionId: 'TXN-1020',
      type: 'PAYMENT',
      amount: '17650.0000',
      timestamp: '2026-10-31T22:45:00',
      description: 'End-of-month vendor settlement',
    },

    // --- Refunds ---
    {
      transactionId: 'REF-5001',
      type: 'REFUND',
      amount: '25000.0000',
      timestamp: '2026-10-04T10:00:00',
      description: 'Full refund - Order cancelled',
      originalTransactionId: 'TXN-1001',
    },
    {
      transactionId: 'REF-5002',
      type: 'REFUND',
      amount: '1250.0000',
      timestamp: '2026-10-09T14:30:00',
      description: 'Refund - Duplicate charge',
      originalTransactionId: 'TXN-1006',
    },
    {
      transactionId: 'REF-5003',
      type: 'REFUND',
      amount: '2100.0000',
      timestamp: '2026-10-20T09:00:00',
      description: 'Service credit issued',
      originalTransactionId: 'TXN-1013',
    },
    // Case D: Orphan refund — references TXN-9999 which doesn't exist
    {
      transactionId: 'REF-5099',
      type: 'REFUND',
      amount: '3500.0000',
      timestamp: '2026-10-25T11:30:00',
      description: 'Refund for missing transaction',
      originalTransactionId: 'TXN-9999',
    },
  ];
}

/**
 * Bank Settlement Records
 * 20+ records corresponding to October 2026 platform transactions
 */
export function generateBankSettlements() {
  return [
    // Matched settlements (1–2 day delay)
    {
      transactionRef: 'TXN-1001',
      bankRef: 'BNK-20261002-001',
      amount: '25000.00',
      settlementDate: '2026-10-02T10:00:00',
      description: 'Settlement - TXN-1001',
    },
    {
      transactionRef: 'TXN-1002',
      bankRef: 'BNK-20261003-001',
      amount: '8750.50',
      settlementDate: '2026-10-03T10:00:00',
      description: 'Settlement - TXN-1002',
    },
    {
      transactionRef: 'TXN-1003',
      bankRef: 'BNK-20261005-001',
      amount: '15200.00',
      settlementDate: '2026-10-05T10:00:00',
      description: 'Settlement - TXN-1003',
    },
    // Case C: Duplicate settlement — same transactionRef, different bankRef
    {
      transactionRef: 'TXN-1003',
      bankRef: 'BNK-20261005-002',
      amount: '15200.00',
      settlementDate: '2026-10-05T10:00:00',
      description: 'Settlement - TXN-1003 (DUPLICATE)',
    },
    {
      transactionRef: 'TXN-1004',
      bankRef: 'BNK-20261006-001',
      amount: '3400.75',
      settlementDate: '2026-10-06T10:00:00',
      description: 'Settlement - TXN-1004',
    },
    {
      transactionRef: 'TXN-1005',
      bankRef: 'BNK-20261007-001',
      amount: '62000.00',
      settlementDate: '2026-10-07T10:00:00',
      description: 'Settlement - TXN-1005',
    },
    {
      transactionRef: 'TXN-1006',
      bankRef: 'BNK-20261008-001',
      amount: '1250.00',
      settlementDate: '2026-10-08T10:00:00',
      description: 'Settlement - TXN-1006',
    },
    // Case B: Bank rounds 1499.9975 to 1500.00
    {
      transactionRef: 'TXN-1007',
      bankRef: 'BNK-20261009-001',
      amount: '1500.00',
      settlementDate: '2026-10-09T10:00:00',
      description: 'Settlement - TXN-1007',
    },
    {
      transactionRef: 'TXN-1008',
      bankRef: 'BNK-20261012-001',
      amount: '45000.00',
      settlementDate: '2026-10-12T10:00:00',
      description: 'Settlement - TXN-1008',
    },
    {
      transactionRef: 'TXN-1009',
      bankRef: 'BNK-20261013-001',
      amount: '7800.25',
      settlementDate: '2026-10-13T10:00:00',
      description: 'Settlement - TXN-1009',
    },
    {
      transactionRef: 'TXN-1010',
      bankRef: 'BNK-20261014-001',
      amount: '19999.99',
      settlementDate: '2026-10-14T10:00:00',
      description: 'Settlement - TXN-1010',
    },
    {
      transactionRef: 'TXN-1011',
      bankRef: 'BNK-20261015-001',
      amount: '5500.00',
      settlementDate: '2026-10-15T10:00:00',
      description: 'Settlement - TXN-1011',
    },
    {
      transactionRef: 'TXN-1012',
      bankRef: 'BNK-20261016-001',
      amount: '33750.00',
      settlementDate: '2026-10-16T10:00:00',
      description: 'Settlement - TXN-1012',
    },
    {
      transactionRef: 'TXN-1013',
      bankRef: 'BNK-20261018-001',
      amount: '2100.00',
      settlementDate: '2026-10-18T10:00:00',
      description: 'Settlement - TXN-1013',
    },
    {
      transactionRef: 'TXN-1014',
      bankRef: 'BNK-20261020-001',
      amount: '88500.00',
      settlementDate: '2026-10-20T10:00:00',
      description: 'Settlement - TXN-1014',
    },
    {
      transactionRef: 'TXN-1015',
      bankRef: 'BNK-20261022-001',
      amount: '4200.00',
      settlementDate: '2026-10-22T10:00:00',
      description: 'Settlement - TXN-1015',
    },
    // TXN-1016 is intentionally MISSING from bank (Missing Settlement case)
    {
      transactionRef: 'TXN-1017',
      bankRef: 'BNK-20261026-001',
      amount: '6750.00',
      settlementDate: '2026-10-26T10:00:00',
      description: 'Settlement - TXN-1017',
    },
    {
      transactionRef: 'TXN-1018',
      bankRef: 'BNK-20261027-001',
      amount: '28400.00',
      settlementDate: '2026-10-27T10:00:00',
      description: 'Settlement - TXN-1018',
    },
    {
      transactionRef: 'TXN-1019',
      bankRef: 'BNK-20261029-001',
      amount: '950.00',
      settlementDate: '2026-10-29T10:00:00',
      description: 'Settlement - TXN-1019',
    },
    // Case A: Cross-month — TXN-1020 settled in November
    {
      transactionRef: 'TXN-1020',
      bankRef: 'BNK-20261102-001',
      amount: '17650.00',
      settlementDate: '2026-11-02T10:00:00',
      description: 'Settlement - TXN-1020 (delayed)',
    },

    // Refund settlements
    {
      transactionRef: 'REF-5001',
      bankRef: 'BNK-20261005-R01',
      amount: '25000.00',
      settlementDate: '2026-10-05T10:00:00',
      description: 'Refund settlement - REF-5001',
    },
    {
      transactionRef: 'REF-5002',
      bankRef: 'BNK-20261010-R01',
      amount: '1250.00',
      settlementDate: '2026-10-10T10:00:00',
      description: 'Refund settlement - REF-5002',
    },
    {
      transactionRef: 'REF-5003',
      bankRef: 'BNK-20261021-R01',
      amount: '2100.00',
      settlementDate: '2026-10-21T10:00:00',
      description: 'Refund settlement - REF-5003',
    },
    // Case D: Orphan refund settlement (original TXN-9999 missing)
    {
      transactionRef: 'REF-5099',
      bankRef: 'BNK-20261027-R01',
      amount: '3500.00',
      settlementDate: '2026-10-27T10:00:00',
      description: 'Refund settlement - REF-5099',
    },
    // Unmatched bank entry (no platform transaction)
    {
      transactionRef: 'TXN-EXT-001',
      bankRef: 'BNK-20261023-X01',
      amount: '4500.00',
      settlementDate: '2026-10-23T10:00:00',
      description: 'Unknown credit - possibly another merchant',
    },
  ];
}

/**
 * Get the full demo dataset
 */
export function getDemoData() {
  return {
    platformTransactions: generatePlatformTransactions(),
    bankSettlements: generateBankSettlements(),
  };
}

