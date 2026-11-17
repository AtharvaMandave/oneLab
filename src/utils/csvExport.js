/**
 * CSV Export Utility
 * Exports reconciliation results and exception reports as CSV.
 */

import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import { RECONCILIATION_CONFIG } from '../data/config.js';

/**
 * Export reconciliation details as CSV
 */
export function exportReconciliationCSV(details, filename = 'reconciliation-report.csv') {
  const rows = details.map(d => ({
    'Transaction ID': d.transactionId,
    'Bank Reference': d.bankRef,
    'Type': d.type,
    'Transaction Date': d.transactionDate,
    'Settlement Date': d.settlementDate,
    'Platform Amount': d.platformAmount,
    'Bank Amount': d.bankAmount,
    'Difference': d.difference,
    'Status': d.statusLabel,
    'Reason': d.reason,
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, filename);
}

/**
 * Export exceptions as CSV
 */
export function exportExceptionsCSV(exceptions, filename = 'exception-report.csv') {
  const rows = exceptions.map(e => ({
    'Transaction ID': e.id,
    'Exception Type': RECONCILIATION_CONFIG.statusLabels[e.type],
    'Amount': e.amount ? e.amount.toFixed(4) : '—',
    'Difference': e.difference ? e.difference.toFixed(4) : '—',
    'Date': e.date,
    'Reason': e.reason,
    'Suggested Action': e.suggestedAction,
    'Bank Reference': e.bankRef || '—',
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, filename);
}

/**
 * Parse a CSV file and return rows
 */
export function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          data: results.data,
          errors: results.errors,
          meta: results.meta,
        });
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

