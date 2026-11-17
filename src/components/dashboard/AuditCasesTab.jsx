/**
 * AuditCasesTab Component
 * Interactive guide to the four deliberately planted exceptions for assessment evaluation.
 * Explains Case A, Case B, Case C, and Case D with actual values, detected status, and verification.
 */

import { Clock, Calculator, Copy, RotateCcw, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';

export default function AuditCasesTab({ onSelectTransaction }) {
  const cases = [
    {
      id: 'Case A',
      title: 'Cross-Month Settlement (Timing Difference)',
      badge: 'TIMING_DIFFERENCE',
      txnId: 'TXN-1020',
      bankRef: 'BNK-20261102-001',
      amount: '₹17,650.00',
      dates: 'Platform: Oct 31, 2026 · Bank: Nov 02, 2026',
      icon: Clock,
      color: 'amber',
      problem: 'Transaction initiated late in October (Oct 31 at 22:45) settled in the bank on November 2 due to 1-2 business day settlement delay.',
      detection: 'Identified by settlement date falling after reporting period end (October 31). Classified as Timing Difference rather than an unexplained missing payment.',
      impact: 'Cash verified as settled in November period; does not represent lost funds.',
      status: 'TIMING_DIFFERENCE',
    },
    {
      id: 'Case B',
      title: 'Sub-Cent Rounding Difference (Precision Gap)',
      badge: 'ROUNDING_DIFFERENCE',
      txnId: 'TXN-1007',
      bankRef: 'BNK-20261009-001',
      amount: 'Platform: ₹1,499.9975 vs Bank: ₹1,500.00',
      dates: 'Platform: Oct 08, 2026 · Bank: Oct 09, 2026',
      icon: Calculator,
      color: 'amber',
      problem: 'Platform records internal transactions at 4 decimal places (fractional pricing/cart splits: 1499.9975), while bank statement rounds to 2 decimal places (1500.00).',
      detection: 'Difference (-₹0.0025) is detected, verified using decimal-safe arithmetic (decimal.js), and confirmed within configurable tolerance (₹0.05).',
      impact: 'Isolated to rounding precision; documented in the reconciliation bridge without distorting cash balances.',
      status: 'ROUNDING_DIFFERENCE',
    },
    {
      id: 'Case C',
      title: 'Duplicate Bank Settlement Entry',
      badge: 'DUPLICATE',
      txnId: 'TXN-1003',
      bankRef: 'BNK-20261005-001 & BNK-20261005-002',
      amount: '₹15,200.00 duplicate credit',
      dates: 'Settlement: Oct 05, 2026',
      icon: Copy,
      color: 'rose',
      problem: 'Bank settlement statement contains a duplicate entry for TXN-1003 with two distinct bank reference numbers.',
      detection: 'Grouped by transactionRef. The second occurrence is flagged as a duplicate and immediately excluded from the Adjusted Bank Total.',
      impact: 'Prevents the bank settlement balance from being artificially inflated by ₹15,200.00.',
      status: 'DUPLICATE',
    },
    {
      id: 'Case D',
      title: 'Orphan Customer Refund',
      badge: 'ORPHAN_REFUND',
      txnId: 'REF-5099',
      bankRef: 'BNK-20261027-R01',
      amount: '₹3,500.00 refund',
      dates: 'Initiated: Oct 25, 2026 · Bank: Oct 27, 2026',
      icon: RotateCcw,
      color: 'rose',
      problem: 'Customer refund was issued and settled through the bank, but references original payment TXN-9999 which does not exist in the platform dataset.',
      detection: 'Platform transaction graph analysis verifies parent transaction references. Flagged as Orphan Refund data-integrity exception.',
      impact: 'Isolated as an audit risk requiring payment operations investigation to trace the original charge.',
      status: 'ORPHAN_REFUND',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Assessment Test Cases & Verification Guide
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
              This system was tested against four intentionally planted reconciliation anomalies for the October 2026 period.
              Each case demonstrates how the engine handles real-world payment edge cases dynamically.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cases.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                    {c.id}
                  </span>
                  <StatusBadge status={c.status} />
                </div>

                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${c.color === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                    <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5">{c.txnId} · {c.amount}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="font-semibold text-slate-700">Root Cause:</span>
                    <p className="text-slate-600 mt-0.5">{c.problem}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Engine Detection:</span>
                    <p className="text-slate-600 mt-0.5">{c.detection}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Financial Impact:</span>
                    <p className="text-slate-600 mt-0.5">{c.impact}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">{c.dates}</span>
                <button
                  onClick={() => onSelectTransaction && onSelectTransaction(c.txnId)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Inspect in Ledger <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
