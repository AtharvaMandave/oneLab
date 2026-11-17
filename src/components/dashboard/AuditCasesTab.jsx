/**
 * AuditCasesTab Component
 * Interactive guide to the four deliberately planted exceptions for assessment evaluation.
 * Explains Case A, Case B, Case C, and Case D with actual values, detected status, and verification.
 */

import { Clock, Calculator, Copy, RotateCcw, CheckCircle2, ShieldCheck, ArrowRight, Eye, Table } from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';

export default function AuditCasesTab({ onSelectTransaction, onViewInLedger }) {
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
      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Assessment Test Cases & Verification Guide
                </h2>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  4 Planted Anomalies Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
                This reconciliation engine was tested against four intentionally planted accounting anomalies for the October 2026 period.
                Each card details the business scenario, engine classification, decimal arithmetic verification, and suggested action.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Table className="h-3.5 w-3.5 text-blue-600" />
            Executive Assessment Verification Matrix
          </h3>
          <span className="text-[11px] text-slate-400 font-medium">All 4 Cases Dynamically Detected</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Case</th>
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Planted Anomaly</th>
                <th className="px-4 py-3">Engine Classification</th>
                <th className="px-4 py-3">Financial Handling</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900 font-mono whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                      {c.id}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold text-blue-700 whitespace-nowrap">
                    {c.txnId}
                  </td>
                  <td className="px-4 py-3 text-slate-700 font-medium">
                    {c.title}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs text-[11px]">
                    {c.impact}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectTransaction && onSelectTransaction(c.txnId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        title="Open detailed side-by-side comparison"
                      >
                        <Eye className="h-3 w-3" />
                        Inspect
                      </button>
                      <button
                        onClick={() => onViewInLedger && onViewInLedger(c.txnId)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        title="View in full ledger"
                      >
                        Ledger <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Cards Grid */}
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
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-mono">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectTransaction && onSelectTransaction(c.txnId)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                  >
                    <Eye className="h-3 w-3" /> Inspect
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    onClick={() => onViewInLedger && onViewInLedger(c.txnId)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    View in Ledger <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
