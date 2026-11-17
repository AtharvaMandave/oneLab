/**
 * Decimal-safe arithmetic utilities using decimal.js
 * Prevents floating-point rounding errors in financial calculations.
 */

import Decimal from 'decimal.js';
import { RECONCILIATION_CONFIG } from '../data/config.js';

// Configure Decimal.js for financial calculations
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

const { internalPrecision, displayPrecision } = RECONCILIATION_CONFIG.currency;

/**
 * Create a Decimal from any numeric input
 */
export function toDecimal(value) {
  if (value instanceof Decimal) return value;
  if (value === null || value === undefined || value === '') return new Decimal(0);
  return new Decimal(String(value));
}

/**
 * Add two or more values with decimal safety
 */
export function add(...values) {
  return values.reduce((sum, v) => sum.plus(toDecimal(v)), new Decimal(0));
}

/**
 * Subtract b from a with decimal safety
 */
export function subtract(a, b) {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Sum an array of values
 */
export function sum(values) {
  return values.reduce((total, v) => total.plus(toDecimal(v)), new Decimal(0));
}

/**
 * Round to internal precision (4 decimal places)
 */
export function roundInternal(value) {
  return toDecimal(value).toDecimalPlaces(internalPrecision, Decimal.ROUND_HALF_UP);
}

/**
 * Round to display precision (2 decimal places)
 */
export function roundDisplay(value) {
  return toDecimal(value).toDecimalPlaces(displayPrecision, Decimal.ROUND_HALF_UP);
}

/**
 * Check if two amounts are equal within tolerance
 */
export function isWithinTolerance(a, b, tolerance) {
  const tol = tolerance !== undefined
    ? toDecimal(tolerance)
    : toDecimal(RECONCILIATION_CONFIG.matching.roundingTolerance);
  return toDecimal(a).minus(toDecimal(b)).abs().lte(tol);
}

/**
 * Format a decimal value as currency string
 */
export function formatCurrency(value) {
  const { symbol } = RECONCILIATION_CONFIG.currency;
  const num = roundDisplay(value);
  const isNegative = num.isNegative();
  const absValue = num.abs().toFixed(displayPrecision);
  const formatted = Number(absValue).toLocaleString('en-IN', {
    minimumFractionDigits: displayPrecision,
    maximumFractionDigits: displayPrecision,
  });
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

/**
 * Convert Decimal to plain number for display
 */
export function toNumber(value) {
  return toDecimal(value).toNumber();
}

/**
 * Absolute value
 */
export function abs(value) {
  return toDecimal(value).abs();
}

