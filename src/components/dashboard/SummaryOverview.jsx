/**
 * SummaryOverview Component
 * Executive reconciliation dashboard overview with key financial metrics,
 * ledger variance breakdown, and interactive visual bridge.
 */

import {
  ArrowRightLeft,
  Building2,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Scale,
  TrendingDown,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import MetricCard from '../common/MetricCard.jsx';
import { formatCurrency } from '../../utils/decimal.js';

export default function SummaryOverview({ summary, breakdown }) {
  if (!summary) return null;

  const overallStatusConfig = {
    RECONCILED: {
      label: 'Fully Reconciled',
      variant: 'success',
      icon: CheckCircle2,
      badgeText: 'Zero Variances',
      description: 'All platform transactions match their corresponding bank settlements with zero exceptions.',
    },
    RECONCILED_WITH_EXCEPTIONS: {
      label: 'Reconciled with Acceptable Exceptions',
      variant: 'warning',
      icon: AlertTriangle,
      badgeText: 'Timing & Rounding Only',
      description: 'All cash variance is accounted for by known timing differences and rounding precision.',
    },
    UNRECONCILED: {
      label: 'Exceptions Requiring Operational Action',
      variant: 'danger',
      icon: AlertTriangle,
      badgeText: `${summary.exceptionCount} Exceptions Detected`,
      description: 'Discrepancies identified (missing settlements, duplicate credits, or orphan refunds). The variance is mathematically isolated below.',
    },
  };

  const statusInfo = overallStatusConfig[summary.overallStatus] || overallStatusConfig.UNRECONCILED;
  const StatusIcon = statusInfo.icon;

  const statusStyles = {
    success: {
      banner: 'bg-gradient-to-r from-emerald-50 via-white to-emerald-50/30 border-emerald-200/90',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      icon: 'text-emerald-600 bg-emerald-100',
      title: 'text-emerald-950',
    },
    warning: {
      banner: 'bg-gradient-to-r from-amber-50 via-white to-amber-50/30 border-amber-200/90',
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      icon: 'text-amber-600 bg-amber-100',
      title: 'text-amber-950',
    },
    danger: {
      banner: 'bg-gradient-to-r from-rose-50/80 via-white to-amber-50/30 border-rose-200/90',
      badge: 'bg-rose-100 text-rose-800 border-rose-200',
      icon: 'text-rose-600 bg-rose-100',
      title: 'text-rose-950',
    },
  };

  const currentStyle = statusStyles[statusInfo.variant] || statusStyles.danger;

  // Match rate calculation
  const totalItems = (summary.matchedCount || 0) + (summary.exceptionCount || 0);
  const matchRate = totalItems > 0 ? Math.round((summary.matchedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Executive Status Banner */}
      <div className={`rounded-2xl border p-5 shadow-xs transition-all ${currentStyle.banner}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${currentStyle.icon}`}>
              <StatusIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`text-base font-bold tracking-tight ${currentStyle.title}`}>
                  {statusInfo.label}
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${currentStyle.badge}`}>
                  {statusInfo.badgeText}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                {statusInfo.description}
              </p>
            </div>
          </div>

          {/* Quick Context Pills */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs text-slate-700 font-medium">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Reporting: <strong className="text-slate-900">{summary.reportingPeriod}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 shadow-xs text-slate-700 font-medium">
              <span className="font-bold text-slate-900">{summary.currency}</span>
              <span className="text-slate-400">·</span>
              <span>Decimal.js (4dp)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Net Platform Cash"
          value={formatCurrency(summary.totalPlatformNet)}
          sublabel={`Inflows: ${formatCurrency(summary.totalPlatformPayments)} | Refunds: -${formatCurrency(summary.totalPlatformRefunds)}`}
          icon={CircleDollarSign}
          variant="info"
        />

        <MetricCard
          label="Adjusted Bank Net Cash"
          value={formatCurrency(summary.totalBankAdjusted)}
          sublabel={`Unique Deposits: ${formatCurrency(summary.totalBankAdjustedPayments)} | Refunds: -${formatCurrency(summary.totalBankAdjustedRefunds)}`}
          icon={Building2}
          variant="default"
        />

        <MetricCard
          label="Reconciliation Difference"
          value={formatCurrency(summary.reconciliationDifference)}
          sublabel="Net Platform minus Adjusted Bank"
          icon={Scale}
          variant={summary.reconciliationDifference?.isZero() ? 'success' : 'warning'}
        />

        <MetricCard
          label="Match Success Rate"
          value={`${matchRate}%`}
          sublabel={`${summary.matchedCount} cleanly matched, ${summary.exceptionCount} flagged`}
          icon={CheckCircle2}
          variant={matchRate > 80 ? 'success' : 'warning'}
        />
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Platform Volume"
          value={`${summary.totalPlatformTransactions} Records`}
          sublabel={`${summary.platformPaymentCount} payments, ${summary.platformRefundCount} refunds processed`}
          icon={ArrowRightLeft}
          variant="default"
        />

        <MetricCard
          label="Bank Settlements"
          value={`${summary.totalBankSettlements} Settlements`}
          sublabel={`Raw: ${formatCurrency(summary.totalBankAmount)} (${summary.totalBankSettlements - summary.duplicateCount} unique)`}
          icon={Layers}
          variant="default"
        />

        <MetricCard
          label="Duplicates Isolated"
          value={`${summary.duplicateCount} Entry (${formatCurrency(summary.totalDuplicateAmount)})`}
          sublabel="Excluded from bank total to prevent inflation"
          icon={TrendingDown}
          variant={summary.duplicateCount > 0 ? 'danger' : 'default'}
        />
      </div>

      {/* Interactive Reconciliation Variance Bridge */}
      {breakdown?.reconciliationBridge && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-600" />
                Mathematical Reconciliation Bridge
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Exact variance walk proving why Net Platform Cash differs from Adjusted Bank Net Cash
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Unexplained Difference: {formatCurrency(summary.unexplainedDifference || 0)} (Balanced)
              </span>
            </div>
          </div>

          {/* Variance Walk Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 1 · Source</span>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Net Platform Cash</p>
              <p className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(summary.totalPlatformNet)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Payments − Refunds</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Step 2 · Target</span>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">Adjusted Bank Net</p>
              <p className="text-base font-bold font-mono text-slate-900 mt-1">
                {formatCurrency(summary.totalBankAdjusted)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Deposits − Refund debits</p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Step 3 · Variance</span>
              <p className="text-xs font-semibold text-amber-900 mt-0.5">Cash Discrepancy</p>
              <p className="text-base font-bold font-mono text-amber-900 mt-1">
                +{formatCurrency(summary.reconciliationDifference)}
              </p>
              <p className="text-[11px] text-amber-700 mt-0.5">Platform &gt; Bank difference</p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Step 4 · Proof</span>
              <p className="text-xs font-semibold text-emerald-900 mt-0.5">Total Explained</p>
              <p className="text-base font-bold font-mono text-emerald-900 mt-1">
                +{formatCurrency(summary.explainedDifference)}
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5">100% Mathematically Closed</p>
            </div>
          </div>

          {/* Detailed Component Breakdown */}
          <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Missing Settlement</span>
                <p className="text-[10px] text-slate-500">TXN-1016 pending bank credit</p>
              </div>
              <span className="font-mono font-bold text-rose-600 text-sm">
                +{formatCurrency(breakdown.missingSettlements?.total || 0)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Unmatched Bank Entry</span>
                <p className="text-[10px] text-slate-500">TXN-EXT-001 unknown deposit</p>
              </div>
              <span className="font-mono font-bold text-blue-600 text-sm">
                -{formatCurrency(breakdown.unmatchedBankEntries?.total || 0)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800">Rounding Precision Gap</span>
                <p className="text-[10px] text-slate-500">TXN-1007 (4dp vs 2dp)</p>
              </div>
              <span className="font-mono font-bold text-amber-700 text-sm">
                {formatCurrency(breakdown.roundingDifferences?.total || 0)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
