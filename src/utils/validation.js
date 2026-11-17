/**
 * Data validation utilities
 * Validates uploaded CSV data and normalizes records.
 */

import { RECONCILIATION_CONFIG } from '../data/config.js';
import { toDecimal } from './decimal.js';
import { parseDate, formatDate } from './dates.js';

const { transactionTypes } = RECONCILIATION_CONFIG;

/**
 * Required fields for platform transactions
 */
const PLATFORM_REQUIRED_FIELDS = [
  'transactionId',
  'type',
  'amount',
  'timestamp',
];

/**
 * Required fields for bank settlements
 */
const BANK_REQUIRED_FIELDS = [
  'transactionRef',
  'bankRef',
  'amount',
  'settlementDate',
];

/**
 * Validate and normalize a platform transaction record
 * Returns { valid: boolean, record: object|null, errors: string[] }
 */
export function validatePlatformTransaction(row, rowIndex) {
  const errors = [];
  const record = {};

  // Check required fields
  for (const field of PLATFORM_REQUIRED_FIELDS) {
    if (!row[field] && row[field] !== 0) {
      errors.push(`Row ${rowIndex}: Missing required field "${field}"`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, record: null, errors };
  }

  // Normalize transaction ID
  record.transactionId = String(row.transactionId).trim().toUpperCase();
  if (!record.transactionId) {
    errors.push(`Row ${rowIndex}: Transaction ID is empty`);
  }

  // Validate type
  const type = String(row.type).trim().toUpperCase();
  if (!Object.values(transactionTypes).includes(type)) {
    errors.push(`Row ${rowIndex}: Invalid transaction type "${row.type}". Must be PAYMENT or REFUND.`);
  }
  record.type = type;

  // Validate amount
  try {
    const amount = toDecimal(row.amount);
    if (amount.isNaN() || !amount.isFinite()) {
      errors.push(`Row ${rowIndex}: Invalid amount "${row.amount}"`);
    } else if (amount.lte(0)) {
      errors.push(`Row ${rowIndex}: Amount must be positive (got ${row.amount})`);
    }
    record.amount = amount.toFixed(4);
  } catch {
    errors.push(`Row ${rowIndex}: Cannot parse amount "${row.amount}"`);
  }

  // Validate timestamp
  const date = parseDate(row.timestamp);
  if (isNaN(date.getTime())) {
    errors.push(`Row ${rowIndex}: Invalid timestamp "${row.timestamp}"`);
  }
  record.timestamp = row.timestamp;
  record.date = formatDate(date);

  // Optional: description
  record.description = row.description || '';

  // Optional: originalTransactionId (for refunds)
  if (type === transactionTypes.REFUND) {
    record.originalTransactionId = row.originalTransactionId
      ? String(row.originalTransactionId).trim().toUpperCase()
      : null;
  }

  return {
    valid: errors.length === 0,
    record: errors.length === 0 ? record : null,
    errors,
  };
}

/**
 * Validate and normalize a bank settlement record
 * Returns { valid: boolean, record: object|null, errors: string[] }
 */
export function validateBankSettlement(row, rowIndex) {
  const errors = [];
  const record = {};

  // Check required fields
  for (const field of BANK_REQUIRED_FIELDS) {
    if (!row[field] && row[field] !== 0) {
      errors.push(`Row ${rowIndex}: Missing required field "${field}"`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, record: null, errors };
  }

  // Normalize transaction reference
  record.transactionRef = String(row.transactionRef).trim().toUpperCase();
  if (!record.transactionRef) {
    errors.push(`Row ${rowIndex}: Transaction reference is empty`);
  }

  // Bank reference
  record.bankRef = String(row.bankRef).trim().toUpperCase();
  if (!record.bankRef) {
    errors.push(`Row ${rowIndex}: Bank reference is empty`);
  }

  // Validate amount
  try {
    const amount = toDecimal(row.amount);
    if (amount.isNaN() || !amount.isFinite()) {
      errors.push(`Row ${rowIndex}: Invalid amount "${row.amount}"`);
    }
    record.amount = amount.toFixed(4);
  } catch {
    errors.push(`Row ${rowIndex}: Cannot parse amount "${row.amount}"`);
  }

  // Validate settlement date
  const date = parseDate(row.settlementDate);
  if (isNaN(date.getTime())) {
    errors.push(`Row ${rowIndex}: Invalid settlement date "${row.settlementDate}"`);
  }
  record.settlementDate = row.settlementDate;
  record.date = formatDate(date);

  // Optional: description
  record.description = row.description || '';

  return {
    valid: errors.length === 0,
    record: errors.length === 0 ? record : null,
    errors,
  };
}

/**
 * Validate an array of platform transactions
 * Returns { valid: object[], invalid: { row: number, errors: string[] }[], allErrors: string[] }
 */
export function validatePlatformDataset(rows) {
  const valid = [];
  const invalid = [];
  const allErrors = [];

  rows.forEach((row, index) => {
    const result = validatePlatformTransaction(row, index + 1);
    if (result.valid) {
      valid.push(result.record);
    } else {
      invalid.push({ row: index + 1, errors: result.errors });
      allErrors.push(...result.errors);
    }
  });

  return { valid, invalid, allErrors };
}

/**
 * Validate an array of bank settlements
 * Returns { valid: object[], invalid: { row: number, errors: string[] }[], allErrors: string[] }
 */
export function validateBankDataset(rows) {
  const valid = [];
  const invalid = [];
  const allErrors = [];

  rows.forEach((row, index) => {
    const result = validateBankSettlement(row, index + 1);
    if (result.valid) {
      valid.push(result.record);
    } else {
      invalid.push({ row: index + 1, errors: result.errors });
      allErrors.push(...result.errors);
    }
  });

  return { valid, invalid, allErrors };
}

