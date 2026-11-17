/**
 * StatusBadge Component
 * Displays a modern colored status badge for reconciliation statuses.
 */

import { RECONCILIATION_CONFIG } from '../../data/config.js';

const { statusLabels, statusColors } = RECONCILIATION_CONFIG;

const colorClasses = {
  green: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 shadow-xs',
    dot: 'bg-emerald-500',
  },
  amber: {
    badge: 'bg-amber-50 text-amber-800 border-amber-200/80 shadow-xs',
    dot: 'bg-amber-500',
  },
  red: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80 shadow-xs',
    dot: 'bg-rose-500',
  },
};

export default function StatusBadge({ status, className = '', showDot = true }) {
  const label = statusLabels[status] || status;
  const color = statusColors[status] || 'amber';
  const styles = colorClasses[color] || colorClasses.amber;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles.badge} ${className}`}
    >
      {showDot && <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />}
      {label}
    </span>
  );
}
