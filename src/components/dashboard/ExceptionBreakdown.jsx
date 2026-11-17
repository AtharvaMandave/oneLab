/**
 * ExceptionBreakdown Component
 * Professional exception breakdown panel with health bar, interactive category cards,
 * financial totals, and direct inspection triggers.
 */

import {
  Clock,
  Copy,
  Calculator,
  FileQuestion,
  Building2,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency } from '../../utils/decimal.js';
import { RECONCILIATION_CONFIG } from '../../data/config.js';

const categoryConfig = {
  timingDifferences: {
    label: 'Timing Differences',
    tag: 'Case A: Cross-Month',
    icon: Clock,
    color: 'amber',
    statusKey: 'TIMING_DIFFERENCE',
    actionText: 'Inspect in-transit settlement',
  },
  roundingDifferences: {
    label: 'Rounding Differences',
    tag: 'Case B: Precision Gap',
    icon: Calculator,
    color: 'amber',
    statusKey: 'ROUNDING_DIFFERENCE',
    actionText: 'Review precision variance',
  },
  duplicateSettlements: {
    label: 'Duplicate Settlements',
    tag: 'Case C: Bank Duplication',
    icon: Copy,
    color: 'rose',
    statusKey: 'DUPLICATE',
    actionText: 'Inspect bank duplicate',
  },
  orphanRefunds: {
    label: 'Orphan Refunds',
    tag: 'Case D: Missing Payment',
    icon: RotateCcw,
    color: 'rose',
    statusKey: 'ORPHAN_REFUND',
    actionText: 'Trace original transaction',
  },
  missingSettlements: {
    label: 'Missing Settlements',
    tag: 'Pending Bank Credit',
    icon: FileQuestion,
    color: 'rose',
    statusKey: 'MISSING_SETTLEMENT',
    actionText: 'Escalate to payment ops',
  },
  unmatchedBankEntries: {
    label: 'Unmatched Bank Entries',
    tag: 'Unknown Bank Credit',
    icon: Building2,
    color: 'rose',
    statusKey: 'UNMATCHED_BANK',
    actionText: 'Investigate unidentified credit',
  },
};

const colorStyles = {
  amber: {
    card: 'bg-gradient-to-br from-amber-50/40 via-white to-white border-amber-200/90 hover:border-amber-300 hover:shadow-md',
    icon: 'text-amber-700 bg-amber-100',
    count: 'text-amber-900',
    tag: 'bg-amber-100 text-amber-800 border-amber-200',
    amount: 'text-amber-900',
    arrow: 'text-amber-600',
  },
  rose: {
    card: 'bg-gradient-to-br from-rose-50/40 via-white to-white border-rose-200/90 hover:border-rose-300 hover:shadow-md',
    icon: 'text-rose-700 bg-rose-100',
    count: 'text-rose-900',
    tag: 'bg-rose-100 text-rose-800 border-rose-200',
    amount: 'text-rose-900',
    arrow: 'text-rose-600',
  },
  green: {
    card: 'bg-white border-slate-200 hover:border-slate-300',
    icon: 'text-emerald-700 bg-emerald-100',
    count: 'text-emerald-900',
    tag: 'bg-slate-100 text-slate-600 border-slate-200',
    amount: 'text-slate-400',
    arrow: 'text-slate-400',
  },
};

export default function ExceptionBreakdown({ breakdown, onCategoryClick }) {
  if (!breakdown) return null;

  const categories = Object.entries(categoryConfig);

  // Compute total exception items
  const totalExceptions = categories.reduce((acc, [k]) => acc + (breakdown[k]?.count || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            Exception Classification & Root-Cause Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click on any category card below to inspect individual transactions, discrepancy origins, and suggested accounting actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            {totalExceptions} Active Exceptions
          </span>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map(([key, config]) => {
          const data = breakdown[key];
          if (!data) return null;

          const Icon = config.icon;
          const hasExceptions = data.count > 0;
          const styles = hasExceptions ? colorStyles[config.color] : colorStyles.green;

          return (
            <button
              key={key}
              onClick={() => onCategoryClick && onCategoryClick(key, config.statusKey)}
              className={`text-left rounded-2xl border p-4 transition-all duration-200 flex flex-col justify-between group cursor-pointer ${styles.card}`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-xl ${styles.icon}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles.tag}`}>
                    {config.tag}
                  </span>
                </div>

                {/* Title & Count */}
                <div className="flex items-baseline justify-between mt-2">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {config.label}
                  </h3>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                    {data.count} {data.count === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Amount */}
                <p className={`text-xl font-bold mt-1.5 font-mono ${styles.amount}`}>
                  {hasExceptions ? formatCurrency(data.total) : '₹0.00'}
                </p>

                {/* Description */}
                <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                  {data.description}
                </p>
              </div>

              {/* Action trigger button */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-blue-600 transition-colors">
                <span>{config.actionText}</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
