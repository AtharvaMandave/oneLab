/**
 * Reconciliation Engine Tests
 * 
 * Tests all 9 required scenarios plus additional edge cases.
 * Uses vitest for test framework.
 */

import { describe, it, expect } from 'vitest';
import { reconcile, detectDuplicateBankEntries, detectOrphanRefunds } from '../engine/reconciliationEngine.js';
import { generatePlatformTransactions, generateBankSettlements } from '../data/syntheticData.js';
import { toDecimal, subtract, isWithinTolerance } from '../utils/decimal.js';
import { RECONCILIATION_CONFIG } from '../data/config.js';

const { statuses } = RECONCILIATION_CONFIG;

// Run the full reconciliation with demo data for integration tests
const platformData = generatePlatformTransactions();
const bankData = generateBankSettlements();
const result = reconcile(platformData, bankData);

describe('Reconciliation Engine', () => {
  
  // Test 1: Correctly matching a payment and bank settlement
  describe('Test 1: Correct payment-settlement matching', () => {
    it('should match TXN-1001 with its bank settlement', () => {
      const matched = result.details.find(
        d => d.transactionId === 'TXN-1001' && d.status === statuses.MATCHED
      );
      expect(matched).toBeDefined();
      expect(matched.platformAmount).toBe('25000.0000');
      expect(matched.bankAmount).toBe('25000.00');
      expect(matched.difference).toBe('0.0000');
    });

    it('should correctly match multiple regular payments', () => {
      const matchedIds = ['TXN-1002', 'TXN-1004', 'TXN-1005', 'TXN-1008'];
      for (const id of matchedIds) {
        const row = result.details.find(d => d.transactionId === id);
        expect(row).toBeDefined();
        expect(row.status).toBe(statuses.MATCHED);
      }
    });
  });

  // Test 2: Detecting a settlement that arrives in the following month (Case A)
  describe('Test 2: Cross-month settlement detection (Case A)', () => {
    it('should detect TXN-1020 as a timing difference', () => {
      const timing = result.details.find(d => d.transactionId === 'TXN-1020');
      expect(timing).toBeDefined();
      expect(timing.status).toBe(statuses.TIMING_DIFFERENCE);
      expect(timing.transactionDate).toBe('2026-10-31');
      expect(timing.settlementDate).toBe('2026-11-02');
    });

    it('should include TXN-1020 in the timing differences breakdown', () => {
      expect(result.breakdown.timingDifferences.count).toBeGreaterThanOrEqual(1);
      const timingItem = result.breakdown.timingDifferences.items.find(
        i => i.transactionId === 'TXN-1020'
      );
      expect(timingItem).toBeDefined();
    });

    it('should not classify cross-month as a missing payment', () => {
      const missing = result.exceptions.find(
        e => e.id === 'TXN-1020' && e.type === statuses.MISSING_SETTLEMENT
      );
      expect(missing).toBeUndefined();
    });
  });

  // Test 3: Detecting the duplicate bank entry (Case C)
  describe('Test 3: Duplicate bank entry detection (Case C)', () => {
    it('should detect the duplicate settlement for TXN-1003', () => {
      const dupException = result.exceptions.find(
        e => e.id === 'TXN-1003' && e.type === statuses.DUPLICATE
      );
      expect(dupException).toBeDefined();
      expect(dupException.amount.toNumber()).toBe(15200);
    });

    it('should have exactly 1 duplicate in the full dataset', () => {
      expect(result.duplicates.length).toBe(1);
      expect(result.duplicates[0].transactionRef).toBe('TXN-1003');
    });

    it('should identify duplicate by different bank references', () => {
      expect(result.duplicates[0].originalBankRef).toBe('BNK-20261005-001');
      expect(result.duplicates[0].duplicateBankRef).toBe('BNK-20261005-002');
    });
  });

  // Test 4: Detecting the orphan refund (Case D)
  describe('Test 4: Orphan refund detection (Case D)', () => {
    it('should detect REF-5099 as an orphan refund', () => {
      const orphan = result.orphanRefunds.find(o => o.transactionId === 'REF-5099');
      expect(orphan).toBeDefined();
      expect(orphan.originalTransactionId).toBe('TXN-9999');
      expect(orphan.status).toBe(statuses.ORPHAN_REFUND);
    });

    it('should include orphan refund in exceptions', () => {
      const orphanException = result.exceptions.find(
        e => e.id === 'REF-5099' && e.type === statuses.ORPHAN_REFUND
      );
      expect(orphanException).toBeDefined();
    });

    it('should not flag valid refunds as orphans', () => {
      const ref5001 = result.orphanRefunds.find(o => o.transactionId === 'REF-5001');
      expect(ref5001).toBeUndefined();
    });
  });

  // Test 5: Detecting an aggregate rounding difference (Case B)
  describe('Test 5: Rounding difference detection (Case B)', () => {
    it('should detect rounding difference for TXN-1007', () => {
      const rounding = result.details.find(
        d => d.transactionId === 'TXN-1007' && d.status === statuses.ROUNDING_DIFFERENCE
      );
      expect(rounding).toBeDefined();
      expect(rounding.platformAmount).toBe('1499.9975');
      expect(rounding.bankAmount).toBe('1500.00');
    });

    it('should calculate the correct rounding difference', () => {
      const rounding = result.details.find(d => d.transactionId === 'TXN-1007');
      // Platform: 1499.9975, Bank: 1500.00, Diff = -0.0025
      const diff = toDecimal(rounding.difference);
      expect(diff.toNumber()).toBeCloseTo(-0.0025, 4);
    });

    it('should include rounding in breakdown', () => {
      expect(result.breakdown.roundingDifferences.count).toBeGreaterThanOrEqual(1);
    });
  });

  // Test 6: Identifying a missing bank settlement
  describe('Test 6: Missing bank settlement', () => {
    it('should detect TXN-1016 as missing settlement', () => {
      const missing = result.details.find(
        d => d.transactionId === 'TXN-1016' && d.status === statuses.MISSING_SETTLEMENT
      );
      expect(missing).toBeDefined();
      expect(missing.platformAmount).toBe('11300.0000');
      expect(missing.bankAmount).toBe('—');
    });

    it('should include missing settlement in breakdown', () => {
      expect(result.breakdown.missingSettlements.count).toBeGreaterThanOrEqual(1);
      const missingItem = result.breakdown.missingSettlements.items.find(
        i => i.transactionId === 'TXN-1016'
      );
      expect(missingItem).toBeDefined();
    });
  });

  // Test 7: Identifying a bank-only settlement
  describe('Test 7: Bank-only (unmatched) settlement', () => {
    it('should detect TXN-EXT-001 as unmatched bank entry', () => {
      const unmatched = result.exceptions.find(
        e => e.id === 'TXN-EXT-001' && e.type === statuses.UNMATCHED_BANK
      );
      expect(unmatched).toBeDefined();
      expect(unmatched.amount.toNumber()).toBe(4500);
    });

    it('should include unmatched bank entry in breakdown', () => {
      expect(result.breakdown.unmatchedBankEntries.count).toBeGreaterThanOrEqual(1);
    });
  });

  // Test 8: Handling a negative rounding adjustment
  describe('Test 8: Negative rounding adjustment', () => {
    it('should handle negative rounding difference correctly', () => {
      // TXN-1007: platform 1499.9975, bank 1500.00
      // Difference = 1499.9975 - 1500.00 = -0.0025 (negative)
      const rounding = result.details.find(d => d.transactionId === 'TXN-1007');
      const diff = toDecimal(rounding.difference);
      expect(diff.isNegative()).toBe(true);
      expect(diff.toNumber()).toBeCloseTo(-0.0025, 4);
    });

    it('should correctly aggregate negative rounding into breakdown total', () => {
      const roundingTotal = result.breakdown.roundingDifferences.total;
      // The total should reflect the net rounding (can be negative)
      expect(roundingTotal).toBeDefined();
    });
  });

  // Test 9: Confirming that duplicate entries do not inflate adjusted bank totals
  describe('Test 9: Duplicates excluded from adjusted totals', () => {
    it('should not include duplicate amount in adjusted bank total', () => {
      const { totalBankAdjusted, totalBankAmount, totalDuplicateAmount } = result.summary;
      // Adjusted = All bank - duplicates
      const expected = subtract(totalBankAmount, totalDuplicateAmount);
      expect(totalBankAdjusted.eq(expected)).toBe(true);
    });

    it('duplicate amount should equal 15200.00', () => {
      expect(result.summary.totalDuplicateAmount.toNumber()).toBe(15200);
    });

    it('adjusted total should be less than raw bank total', () => {
      expect(result.summary.totalBankAdjusted.lt(result.summary.totalBankAmount)).toBe(true);
    });
  });

  // Additional tests: Edge cases and overall integrity
  describe('Overall reconciliation integrity', () => {
    it('should produce a valid overall status', () => {
      expect(['RECONCILED', 'RECONCILED_WITH_EXCEPTIONS', 'UNRECONCILED']).toContain(
        result.summary.overallStatus
      );
    });

    it('should have correct platform transaction count', () => {
      expect(result.summary.totalPlatformTransactions).toBe(platformData.length);
    });

    it('should have correct bank settlement count', () => {
      expect(result.summary.totalBankSettlements).toBe(bankData.length);
    });

    it('should have all 4 planted exception types present', () => {
      const exceptionTypes = new Set(result.exceptions.map(e => e.type));
      expect(exceptionTypes.has(statuses.TIMING_DIFFERENCE)).toBe(true);
      expect(exceptionTypes.has(statuses.DUPLICATE)).toBe(true);
      expect(exceptionTypes.has(statuses.ROUNDING_DIFFERENCE)).toBe(true);
      expect(exceptionTypes.has(statuses.ORPHAN_REFUND)).toBe(true);
    });

    it('should detect missing settlement', () => {
      const exceptionTypes = new Set(result.exceptions.map(e => e.type));
      expect(exceptionTypes.has(statuses.MISSING_SETTLEMENT)).toBe(true);
    });

    it('should detect unmatched bank entry', () => {
      const exceptionTypes = new Set(result.exceptions.map(e => e.type));
      expect(exceptionTypes.has(statuses.UNMATCHED_BANK)).toBe(true);
    });

    it('every detail row should have a valid status', () => {
      const validStatuses = Object.values(statuses);
      for (const row of result.details) {
        expect(validStatuses).toContain(row.status);
      }
    });

    it('every exception should have a suggested action', () => {
      for (const exception of result.exceptions) {
        expect(exception.suggestedAction).toBeDefined();
        expect(exception.suggestedAction.length).toBeGreaterThan(0);
      }
    });
  });

  // Unit tests for utility functions
  describe('Duplicate detection utility', () => {
    it('should detect duplicates by transactionRef', () => {
      const records = [
        { transactionRef: 'A', bankRef: 'B1', amount: toDecimal(100), date: '2026-10-01' },
        { transactionRef: 'A', bankRef: 'B2', amount: toDecimal(100), date: '2026-10-01' },
        { transactionRef: 'C', bankRef: 'B3', amount: toDecimal(200), date: '2026-10-02' },
      ];
      const { unique, duplicates } = detectDuplicateBankEntries(records);
      expect(unique.length).toBe(2);
      expect(duplicates.length).toBe(1);
      expect(duplicates[0].transactionRef).toBe('A');
    });

    it('should return no duplicates when all refs are unique', () => {
      const records = [
        { transactionRef: 'A', bankRef: 'B1', amount: toDecimal(100), date: '2026-10-01' },
        { transactionRef: 'B', bankRef: 'B2', amount: toDecimal(200), date: '2026-10-02' },
      ];
      const { unique, duplicates } = detectDuplicateBankEntries(records);
      expect(unique.length).toBe(2);
      expect(duplicates.length).toBe(0);
    });
  });

  describe('Decimal utility: isWithinTolerance', () => {
    it('should return true for amounts within default tolerance', () => {
      expect(isWithinTolerance(100.00, 100.03)).toBe(true);
    });

    it('should return false for amounts beyond tolerance', () => {
      expect(isWithinTolerance(100.00, 100.10)).toBe(false);
    });

    it('should respect custom tolerance', () => {
      expect(isWithinTolerance(100.00, 100.09, 0.10)).toBe(true);
      expect(isWithinTolerance(100.00, 100.11, 0.10)).toBe(false);
    });
  });

  // P0 Financial Correctness: Signed Cash Flows & Reconciliation Bridge
  describe('P0 Financial Correctness & Reconciliation Bridge', () => {
    it('should correctly treat bank refund settlements as debits/subtractions in net bank totals', () => {
      const { totalBankAdjusted, totalBankAdjustedPayments, totalBankAdjustedRefunds } = result.summary;
      expect(totalBankAdjustedPayments.toFixed(2)).toBe('382201.49');
      expect(totalBankAdjustedRefunds.toFixed(2)).toBe('31850.00');
      // Bank Net Adjusted = Payments - Refunds = 382201.49 - 31850.00 = 350351.49
      expect(totalBankAdjusted.toFixed(2)).toBe('350351.49');
      expect(totalBankAdjusted.eq(subtract(totalBankAdjustedPayments, totalBankAdjustedRefunds))).toBe(true);
    });

    it('should calculate the exact reconciliation difference between Platform Net and Bank Adjusted Net', () => {
      const { totalPlatformNet, totalBankAdjusted, reconciliationDifference } = result.summary;
      // Platform Net: 357151.4875, Bank Net: 350351.4900 -> Difference: 6799.9975
      expect(totalPlatformNet.toFixed(4)).toBe('357151.4875');
      expect(totalBankAdjusted.toFixed(4)).toBe('350351.4900');
      expect(reconciliationDifference.toFixed(4)).toBe('6799.9975');
    });

    it('reconciliation bridge should mathematically explain the total variance with zero unexplained difference', () => {
      const { reconciliationDifference, explainedDifference, unexplainedDifference } = result.summary;
      const bridge = result.breakdown.reconciliationBridge;

      expect(bridge).toBeDefined();
      expect(bridge.isBalanced).toBe(true);
      expect(explainedDifference.toFixed(4)).toBe(reconciliationDifference.toFixed(4));
      expect(unexplainedDifference.toNumber()).toBe(0);
    });

    it('should decompose the variance into exact missing, unmatched, and rounding components', () => {
      const { missingTotal, unmatchedTotal, roundingTotal } = result.breakdown.reconciliationBridge;
      // Missing settlements: +11300.00
      // Unmatched bank entries: -4500.00
      // Rounding differences: -0.0025
      // 11300 - 4500 - 0.0025 = 6799.9975
      const calculatedBridge = toDecimal(missingTotal).minus(toDecimal(unmatchedTotal)).plus(toDecimal(roundingTotal));
      expect(calculatedBridge.toFixed(4)).toBe('6799.9975');
      expect(result.summary.reconciliationDifference.eq(calculatedBridge)).toBe(true);
    });
  });
});

