/**
 * Reconciliation Engine
 * 
 * Core reconciliation logic independent of UI.
 * Compares platform transactions against bank settlements,
 * identifies discrepancies, classifies exceptions, and explains differences.
 * 
 * Uses decimal-safe arithmetic throughout via decimal.js.
 */

import Decimal from 'decimal.js';
import { RECONCILIATION_CONFIG } from '../data/config.js';
import { toDecimal, sum, subtract, roundDisplay, isWithinTolerance, abs } from '../utils/decimal.js';
import { isInReportingPeriod, isAfterReportingPeriod, formatDate, parseDate } from '../utils/dates.js';

const { statuses, transactionTypes, matching } = RECONCILIATION_CONFIG;

/**
 * Run full reconciliation between platform transactions and bank settlements.
 * 
 * @param {Array} platformTransactions - Array of platform transaction records
 * @param {Array} bankSettlements - Array of bank settlement records
 * @returns {Object} Full reconciliation result with summary, details, and exceptions
 */
export function reconcile(platformTransactions, bankSettlements) {
  // Step 1: Normalize platform records and build platform map
  const normalizedPlatform = normalizePlatformRecords(platformTransactions);
  const platformMap = buildPlatformMap(normalizedPlatform);

  // Step 2: Normalize bank records with proper transaction type classification (PAYMENT/REFUND)
  const normalizedBank = normalizeBankRecords(bankSettlements, platformMap);

  // Step 3: Detect duplicate bank settlements
  const { unique: uniqueBank, duplicates } = detectDuplicateBankEntries(normalizedBank);

  // Step 4: Build bank lookup map
  const bankMap = buildBankMap(uniqueBank);

  // Step 5: Match platform transactions to bank settlements
  const matchResults = matchTransactions(normalizedPlatform, uniqueBank, platformMap, bankMap);

  // Step 6: Identify orphan refunds
  const orphanRefunds = detectOrphanRefunds(normalizedPlatform, platformMap);

  // Step 7: Identify unmatched bank entries
  const unmatchedBank = findUnmatchedBankEntries(uniqueBank, matchResults.matchedBankRefs);

  // Step 8: Calculate totals (with proper payment/refund signed cash accounting and bridge)
  const totals = calculateTotals(normalizedPlatform, normalizedBank, uniqueBank, matchResults, duplicates, unmatchedBank);

  // Step 9: Build exception list
  const exceptions = buildExceptionList(matchResults, duplicates, orphanRefunds, unmatchedBank);

  // Step 10: Build reconciliation detail rows
  const details = buildDetailRows(normalizedPlatform, uniqueBank, matchResults, duplicates, orphanRefunds, unmatchedBank);

  // Step 11: Calculate breakdown explaining the difference with reconciliation bridge
  const breakdown = calculateBreakdown(matchResults, duplicates, orphanRefunds, unmatchedBank, totals);

  // Step 12: Determine overall status
  const overallStatus = determineOverallStatus(exceptions, totals);

  return {
    summary: {
      ...totals,
      overallStatus,
      reportingPeriod: RECONCILIATION_CONFIG.reportingPeriod.label,
      currency: RECONCILIATION_CONFIG.currency.code,
    },
    details,
    exceptions,
    breakdown,
    duplicates,
    orphanRefunds,
    matchResults: matchResults.results,
  };
}

/**
 * Normalize platform transaction records
 */
function normalizePlatformRecords(records) {
  return records.map(r => ({
    ...r,
    transactionId: String(r.transactionId).trim().toUpperCase(),
    type: String(r.type).trim().toUpperCase(),
    amount: toDecimal(r.amount),
    date: formatDate(parseDate(r.timestamp)),
    originalTransactionId: r.originalTransactionId
      ? String(r.originalTransactionId).trim().toUpperCase()
      : null,
  }));
}

/**
 * Normalize bank settlement records with type classification (PAYMENT/REFUND)
 */
function normalizeBankRecords(records, platformMap) {
  return records.map(r => {
    const transactionRef = String(r.transactionRef).trim().toUpperCase();
    const platformEntry = platformMap ? platformMap.get(transactionRef) : null;
    const type = r.type
      ? String(r.type).trim().toUpperCase()
      : (platformEntry && platformEntry.type
          ? platformEntry.type
          : (transactionRef.startsWith('REF') || (r.description && r.description.toUpperCase().includes('REFUND'))
              ? transactionTypes.REFUND
              : transactionTypes.PAYMENT));

    return {
      ...r,
      transactionRef,
      bankRef: String(r.bankRef).trim().toUpperCase(),
      amount: toDecimal(r.amount),
      date: formatDate(parseDate(r.settlementDate)),
      type,
    };
  });
}

/**
 * Detect duplicate entries in bank settlements.
 * A duplicate is identified when the same transactionRef appears more than once.
 * The first occurrence is kept; subsequent occurrences are marked as duplicates.
 */
export function detectDuplicateBankEntries(bankRecords) {
  const seen = new Map();
  const unique = [];
  const duplicates = [];

  for (const record of bankRecords) {
    const ref = record.transactionRef;
    if (seen.has(ref)) {
      duplicates.push({
        ...record,
        status: statuses.DUPLICATE,
        reason: `Duplicate bank settlement for transaction ${ref}. First entry: ${seen.get(ref).bankRef}, this entry: ${record.bankRef}.`,
        originalBankRef: seen.get(ref).bankRef,
        duplicateBankRef: record.bankRef,
      });
    } else {
      seen.set(ref, record);
      unique.push(record);
    }
  }

  return { unique, duplicates };
}

/**
 * Build a map of platform transactions by ID
 */
function buildPlatformMap(records) {
  const map = new Map();
  for (const r of records) {
    map.set(r.transactionId, r);
  }
  return map;
}

/**
 * Build a map of bank settlements by transactionRef
 */
function buildBankMap(records) {
  const map = new Map();
  for (const r of records) {
    map.set(r.transactionRef, r);
  }
  return map;
}

/**
 * Match platform transactions against bank settlements.
 * Classifies each match as: MATCHED, TIMING_DIFFERENCE, ROUNDING_DIFFERENCE, or MISSING_SETTLEMENT.
 */
function matchTransactions(platformRecords, bankRecords, platformMap, bankMap) {
  const results = [];
  const matchedBankRefs = new Set();

  for (const platform of platformRecords) {
    const txnId = platform.transactionId;
    const bankEntry = bankMap.get(txnId);

    // Check if this is an orphan refund (refund referencing missing original payment)
    const isOrphan = platform.type === transactionTypes.REFUND &&
      platform.originalTransactionId &&
      !platformMap.has(platform.originalTransactionId);

    if (isOrphan) {
      if (bankEntry) matchedBankRefs.add(txnId);
      const diff = bankEntry ? subtract(platform.amount, bankEntry.amount) : platform.amount;
      results.push({
        transactionId: txnId,
        type: platform.type,
        platformAmount: platform.amount,
        bankAmount: bankEntry ? bankEntry.amount : null,
        difference: diff,
        transactionDate: platform.date,
        settlementDate: bankEntry ? bankEntry.date : null,
        status: statuses.ORPHAN_REFUND,
        reason: `Refund ${txnId} references original transaction ${platform.originalTransactionId}, which does not exist in the platform dataset.`,
        bankRef: bankEntry ? bankEntry.bankRef : null,
        originalTransactionId: platform.originalTransactionId,
      });
      continue;
    }

    if (!bankEntry) {
      // No bank settlement found
      results.push({
        transactionId: txnId,
        type: platform.type,
        platformAmount: platform.amount,
        bankAmount: null,
        difference: platform.amount,
        transactionDate: platform.date,
        settlementDate: null,
        status: statuses.MISSING_SETTLEMENT,
        reason: `No bank settlement found for platform transaction ${txnId}.`,
        bankRef: null,
      });
      continue;
    }

    matchedBankRefs.add(txnId);

    const diff = subtract(platform.amount, bankEntry.amount);
    const absDiff = abs(diff);
    const settlementAfterPeriod = isAfterReportingPeriod(bankEntry.settlementDate);

    if (settlementAfterPeriod) {
      // Case A: Cross-month settlement
      results.push({
        transactionId: txnId,
        type: platform.type,
        platformAmount: platform.amount,
        bankAmount: bankEntry.amount,
        difference: diff,
        transactionDate: platform.date,
        settlementDate: bankEntry.date,
        status: statuses.TIMING_DIFFERENCE,
        reason: `Transaction ${txnId} was initiated on ${platform.date} but settled on ${bankEntry.date}, which is outside the reporting period (${RECONCILIATION_CONFIG.reportingPeriod.label}).`,
        bankRef: bankEntry.bankRef,
      });
    } else if (!diff.isZero() && isWithinTolerance(platform.amount, bankEntry.amount)) {
      // Case B: Rounding difference
      results.push({
        transactionId: txnId,
        type: platform.type,
        platformAmount: platform.amount,
        bankAmount: bankEntry.amount,
        difference: diff,
        transactionDate: platform.date,
        settlementDate: bankEntry.date,
        status: statuses.ROUNDING_DIFFERENCE,
        reason: `Amount mismatch of ${diff.toFixed(4)} for ${txnId}. Platform amount: ${platform.amount.toFixed(4)}, Bank amount: ${bankEntry.amount.toFixed(2)}. This arises from precision differences (platform uses 4dp, bank uses 2dp).`,
        bankRef: bankEntry.bankRef,
      });
    } else if (diff.isZero() || absDiff.lte(toDecimal('0.001'))) {
      // Exact match
      results.push({
        transactionId: txnId,
        type: platform.type,
        platformAmount: platform.amount,
        bankAmount: bankEntry.amount,
        difference: diff,
        transactionDate: platform.date,
        settlementDate: bankEntry.date,
        status: statuses.MATCHED,
        reason: 'Transaction and settlement amounts match.',
        bankRef: bankEntry.bankRef,
      });
    } else {
      // Large amount mismatch — treat as rounding but flag
      results.push({
        transactionId: txnId,
        type: platform.type,
        platformAmount: platform.amount,
        bankAmount: bankEntry.amount,
        difference: diff,
        transactionDate: platform.date,
        settlementDate: bankEntry.date,
        status: statuses.ROUNDING_DIFFERENCE,
        reason: `Amount mismatch of ${diff.toFixed(4)} for ${txnId}. Platform: ${platform.amount.toFixed(4)}, Bank: ${bankEntry.amount.toFixed(2)}.`,
        bankRef: bankEntry.bankRef,
      });
    }
  }

  return { results, matchedBankRefs };
}

/**
 * Detect orphan refunds — refunds whose original payment cannot be found.
 */
export function detectOrphanRefunds(platformRecords, platformMap) {
  const orphans = [];

  for (const record of platformRecords) {
    if (record.type === transactionTypes.REFUND && record.originalTransactionId) {
      if (!platformMap.has(record.originalTransactionId)) {
        orphans.push({
          transactionId: record.transactionId,
          originalTransactionId: record.originalTransactionId,
          amount: record.amount,
          date: record.date,
          status: statuses.ORPHAN_REFUND,
          reason: `Refund ${record.transactionId} references original transaction ${record.originalTransactionId}, which does not exist in the platform dataset.`,
        });
      }
    }
  }

  return orphans;
}

/**
 * Find bank entries that have no matching platform transaction.
 */
function findUnmatchedBankEntries(uniqueBank, matchedBankRefs) {
  return uniqueBank
    .filter(b => !matchedBankRefs.has(b.transactionRef))
    .map(b => ({
      transactionRef: b.transactionRef,
      bankRef: b.bankRef,
      amount: b.amount,
      date: b.date,
      status: statuses.UNMATCHED_BANK,
      reason: `Bank settlement ${b.bankRef} for transaction ${b.transactionRef} has no corresponding platform transaction.`,
    }));
}

/**
 * Calculate all summary totals.
 */
function calculateTotals(platformRecords, allBank, uniqueBank, matchResults, duplicates, unmatchedBank = []) {
  // Platform totals
  const platformPayments = platformRecords.filter(r => r.type === transactionTypes.PAYMENT);
  const platformRefunds = platformRecords.filter(r => r.type === transactionTypes.REFUND);

  const totalPlatformPayments = sum(platformPayments.map(r => r.amount));
  const totalPlatformRefunds = sum(platformRefunds.map(r => r.amount));
  const totalPlatformNet = subtract(totalPlatformPayments, totalPlatformRefunds);

  // Bank totals (all entries including duplicates) - proper signed cash flow (Credits/Payments - Debits/Refunds)
  const allBankPayments = allBank.filter(r => r.type === transactionTypes.PAYMENT);
  const allBankRefunds = allBank.filter(r => r.type === transactionTypes.REFUND);
  const totalBankAllPayments = sum(allBankPayments.map(r => r.amount));
  const totalBankAllRefunds = sum(allBankRefunds.map(r => r.amount));
  const totalBankAll = subtract(totalBankAllPayments, totalBankAllRefunds);

  // Bank totals (unique entries only — adjusted for duplicates)
  const uniqueBankPayments = uniqueBank.filter(r => r.type === transactionTypes.PAYMENT);
  const uniqueBankRefunds = uniqueBank.filter(r => r.type === transactionTypes.REFUND);
  const totalBankAdjustedPayments = sum(uniqueBankPayments.map(r => r.amount));
  const totalBankAdjustedRefunds = sum(uniqueBankRefunds.map(r => r.amount));
  const totalBankAdjusted = subtract(totalBankAdjustedPayments, totalBankAdjustedRefunds);

  // Duplicate adjustment (net amount excluded from bank totals)
  const duplicatePayments = duplicates.filter(r => r.type === transactionTypes.PAYMENT);
  const duplicateRefunds = duplicates.filter(r => r.type === transactionTypes.REFUND);
  const totalDuplicateAmount = sum(duplicates.map(r => r.amount));
  const netDuplicateAdjustment = subtract(sum(duplicatePayments.map(r => r.amount)), sum(duplicateRefunds.map(r => r.amount)));

  // Count matched
  const matched = matchResults.results.filter(r => r.status === statuses.MATCHED);
  const totalMatched = matched.length;

  // Reconciliation difference (Net Platform - Adjusted Net Bank)
  const reconciliationDiff = subtract(totalPlatformNet, totalBankAdjusted);

  // Explained variance components:
  // 1. Missing settlements: payments increase platform net relative to bank (+), refunds decrease platform net (-)
  const missingSettlements = matchResults.results.filter(r => r.status === statuses.MISSING_SETTLEMENT);
  const missingImpact = sum(missingSettlements.map(r => r.type === transactionTypes.REFUND ? toDecimal(r.platformAmount).neg() : toDecimal(r.platformAmount)));

  // 2. Unmatched bank credits increase bank relative to platform (-), unmatched debits/refunds decrease bank (+)
  const unmatchedImpact = sum(unmatchedBank.map(r => r.type === transactionTypes.REFUND ? toDecimal(r.amount).neg() : toDecimal(r.amount)));

  // 3. Rounding difference impact: (platformAmount - bankAmount)
  const roundingDiffs = matchResults.results.filter(r => r.status === statuses.ROUNDING_DIFFERENCE);
  const roundingImpact = sum(roundingDiffs.map(r => r.difference));

  // Total explained cash difference = missing - unmatched + rounding
  const explainedDifference = subtract(missingImpact, unmatchedImpact).plus(roundingImpact);
  const unexplainedDifference = subtract(reconciliationDiff, explainedDifference);

  // Count exceptions
  const nonMatchedPlatformCount = matchResults.results.filter(r => r.status !== statuses.MATCHED).length;
  const totalExceptions = nonMatchedPlatformCount + duplicates.length + unmatchedBank.length;

  return {
    totalPlatformTransactions: platformRecords.length,
    totalPlatformPayments,
    totalPlatformRefunds,
    totalPlatformNet,
    platformPaymentCount: platformPayments.length,
    platformRefundCount: platformRefunds.length,
    totalBankSettlements: allBank.length,
    totalBankPayments: totalBankAllPayments,
    totalBankRefunds: totalBankAllRefunds,
    totalBankAmount: totalBankAll,
    totalBankAdjustedPayments,
    totalBankAdjustedRefunds,
    totalBankAdjusted,
    totalDuplicateAmount,
    netDuplicateAdjustment,
    duplicateCount: duplicates.length,
    reconciliationDifference: reconciliationDiff,
    explainedDifference,
    unexplainedDifference,
    matchedCount: totalMatched,
    exceptionCount: totalExceptions,
  };
}

/**
 * Build a consolidated list of all exceptions.
 */
function buildExceptionList(matchResults, duplicates, orphanRefunds, unmatchedBank) {
  const exceptions = [];

  // Exceptions from match results (non-matched)
  for (const result of matchResults.results) {
    if (result.status !== statuses.MATCHED) {
      exceptions.push({
        id: result.transactionId,
        type: result.status,
        amount: result.platformAmount || result.bankAmount,
        difference: result.difference,
        date: result.transactionDate || result.settlementDate,
        reason: result.reason,
        suggestedAction: RECONCILIATION_CONFIG.suggestedActions[result.status],
        bankRef: result.bankRef,
      });
    }
  }

  // Duplicates
  for (const dup of duplicates) {
    exceptions.push({
      id: dup.transactionRef || dup.transactionId,
      type: statuses.DUPLICATE,
      amount: dup.amount,
      difference: dup.amount,
      date: dup.date,
      reason: dup.reason,
      suggestedAction: RECONCILIATION_CONFIG.suggestedActions[statuses.DUPLICATE],
      bankRef: dup.duplicateBankRef,
    });
  }

  // Orphan refunds (add if not already in matchResults)
  for (const orphan of orphanRefunds) {
    const alreadyListed = exceptions.some(e => e.id === orphan.transactionId && e.type === statuses.ORPHAN_REFUND);
    if (!alreadyListed) {
      exceptions.push({
        id: orphan.transactionId,
        type: statuses.ORPHAN_REFUND,
        amount: orphan.amount,
        difference: orphan.amount,
        date: orphan.date,
        reason: orphan.reason,
        suggestedAction: RECONCILIATION_CONFIG.suggestedActions[statuses.ORPHAN_REFUND],
        bankRef: null,
        originalTransactionId: orphan.originalTransactionId,
      });
    }
  }

  // Unmatched bank entries
  for (const entry of unmatchedBank) {
    exceptions.push({
      id: entry.transactionRef,
      type: statuses.UNMATCHED_BANK,
      amount: entry.amount,
      difference: entry.amount,
      date: entry.date,
      reason: entry.reason,
      suggestedAction: RECONCILIATION_CONFIG.suggestedActions[statuses.UNMATCHED_BANK],
      bankRef: entry.bankRef,
    });
  }

  return exceptions;
}

/**
 * Build detailed reconciliation rows for the transaction table.
 */
function buildDetailRows(platformRecords, uniqueBank, matchResults, duplicates, orphanRefunds, unmatchedBank) {
  const rows = [];

  // Add all match results
  for (const result of matchResults.results) {
    rows.push({
      transactionId: result.transactionId,
      bankRef: result.bankRef || '—',
      transactionDate: result.transactionDate,
      settlementDate: result.settlementDate || '—',
      platformAmount: result.platformAmount ? result.platformAmount.toFixed(4) : '—',
      bankAmount: result.bankAmount ? result.bankAmount.toFixed(2) : '—',
      difference: result.difference ? result.difference.toFixed(4) : '0.0000',
      status: result.status,
      statusLabel: RECONCILIATION_CONFIG.statusLabels[result.status],
      reason: result.reason,
      type: result.type,
    });
  }

  // Add duplicate entries
  for (const dup of duplicates) {
    rows.push({
      transactionId: dup.transactionRef,
      bankRef: dup.duplicateBankRef,
      transactionDate: '—',
      settlementDate: dup.date,
      platformAmount: '—',
      bankAmount: dup.amount.toFixed(2),
      difference: dup.amount.toFixed(2),
      status: statuses.DUPLICATE,
      statusLabel: RECONCILIATION_CONFIG.statusLabels[statuses.DUPLICATE],
      reason: dup.reason,
      type: dup.type || 'SETTLEMENT',
    });
  }

  // Add unmatched bank entries
  for (const entry of unmatchedBank) {
    rows.push({
      transactionId: entry.transactionRef,
      bankRef: entry.bankRef,
      transactionDate: '—',
      settlementDate: entry.date,
      platformAmount: '—',
      bankAmount: entry.amount.toFixed(2),
      difference: entry.amount.toFixed(2),
      status: statuses.UNMATCHED_BANK,
      statusLabel: RECONCILIATION_CONFIG.statusLabels[statuses.UNMATCHED_BANK],
      reason: entry.reason,
      type: entry.type || 'SETTLEMENT',
    });
  }

  return rows;
}

/**
 * Calculate the breakdown that explains the reconciliation difference.
 */
function calculateBreakdown(matchResults, duplicates, orphanRefunds, unmatchedBank, totals) {
  // Timing differences
  const timingDiffs = matchResults.results.filter(r => r.status === statuses.TIMING_DIFFERENCE);
  const timingTotal = sum(timingDiffs.map(r => r.platformAmount));

  // Rounding differences
  const roundingDiffs = matchResults.results.filter(r => r.status === statuses.ROUNDING_DIFFERENCE);
  const roundingTotal = sum(roundingDiffs.map(r => r.difference));

  // Missing settlements
  const missingSettlements = matchResults.results.filter(r => r.status === statuses.MISSING_SETTLEMENT);
  const missingTotal = sum(missingSettlements.map(r => r.platformAmount));

  // Duplicate amount
  const duplicateTotal = sum(duplicates.map(r => r.amount));

  // Unmatched bank entries
  const unmatchedTotal = sum(unmatchedBank.map(r => r.amount));

  // Orphan refund total
  const orphanTotal = sum(orphanRefunds.map(r => r.amount));

  return {
    timingDifferences: {
      count: timingDiffs.length,
      total: timingTotal,
      items: timingDiffs,
      description: 'Transactions initiated in October but settled after the reporting period.',
    },
    roundingDifferences: {
      count: roundingDiffs.length,
      total: roundingTotal,
      items: roundingDiffs,
      description: 'Differences due to precision gap between platform (4dp) and bank (2dp) rounding.',
    },
    missingSettlements: {
      count: missingSettlements.length,
      total: missingTotal,
      items: missingSettlements,
      description: 'Platform transactions with no corresponding bank settlement.',
    },
    duplicateSettlements: {
      count: duplicates.length,
      total: duplicateTotal,
      items: duplicates,
      description: 'Duplicate bank entries excluded from adjusted totals.',
    },
    unmatchedBankEntries: {
      count: unmatchedBank.length,
      total: unmatchedTotal,
      items: unmatchedBank,
      description: 'Bank settlements with no corresponding platform transaction.',
    },
    orphanRefunds: {
      count: orphanRefunds.length,
      total: orphanTotal,
      items: orphanRefunds,
      description: 'Refunds whose original payment transaction cannot be found.',
    },
    reconciliationBridge: {
      platformNet: totals.totalPlatformNet,
      bankAdjusted: totals.totalBankAdjusted,
      reconciliationDifference: totals.reconciliationDifference,
      missingImpact: missingTotal,
      missingTotal,
      unmatchedImpact: unmatchedTotal,
      unmatchedTotal,
      roundingImpact: roundingTotal,
      roundingTotal,
      explainedDifference: totals.explainedDifference,
      unexplainedDifference: totals.unexplainedDifference,
      isBalanced: totals.unexplainedDifference.abs().lte(toDecimal('0.0001')),
    },
  };
}

/**
 * Determine overall reconciliation status.
 */
function determineOverallStatus(exceptions, totals) {
  if (exceptions.length === 0 && totals.reconciliationDifference.isZero()) {
    return 'RECONCILED';
  }

  // Check if only timing/rounding differences exist (acceptable exceptions)
  const unresolvableExceptions = exceptions.filter(
    e => e.type !== statuses.TIMING_DIFFERENCE && e.type !== statuses.ROUNDING_DIFFERENCE
  );

  if (unresolvableExceptions.length === 0) {
    return 'RECONCILED_WITH_EXCEPTIONS';
  }

  return 'UNRECONCILED';
}

