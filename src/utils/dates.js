/**
 * Date utility functions for the reconciliation engine
 */

import { RECONCILIATION_CONFIG } from '../data/config.js';

/**
 * Parse a date string (YYYY-MM-DD or ISO 8601) into a Date object
 */
export function parseDate(dateStr) {
  if (dateStr instanceof Date) return dateStr;
  return new Date(dateStr);
}

/**
 * Format a date as YYYY-MM-DD
 */
export function formatDate(date) {
  const d = parseDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date as a human-readable string
 */
export function formatDateLong(date) {
  const d = parseDate(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a datetime as a human-readable string
 */
export function formatDateTime(date) {
  const d = parseDate(date);
  return d.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Check if a date falls within the reporting period (October 2026)
 */
export function isInReportingPeriod(date) {
  const d = parseDate(date);
  const { year, month } = RECONCILIATION_CONFIG.reportingPeriod;
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}

/**
 * Check if a date falls after the reporting period
 */
export function isAfterReportingPeriod(date) {
  const d = parseDate(date);
  const { year, month } = RECONCILIATION_CONFIG.reportingPeriod;
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999); // Last moment of October
  return d > periodEnd;
}

/**
 * Get the start date of the reporting period
 */
export function getReportingPeriodStart() {
  const { year, month } = RECONCILIATION_CONFIG.reportingPeriod;
  return new Date(year, month - 1, 1);
}

/**
 * Get the end date of the reporting period
 */
export function getReportingPeriodEnd() {
  const { year, month } = RECONCILIATION_CONFIG.reportingPeriod;
  return new Date(year, month, 0, 23, 59, 59, 999);
}

/**
 * Calculate business days between two dates (excluding weekends)
 */
export function businessDaysBetween(startDate, endDate) {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  let count = 0;
  const current = new Date(start);
  current.setDate(current.getDate() + 1);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

