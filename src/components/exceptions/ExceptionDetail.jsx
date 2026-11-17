/**
 * ExceptionDetail Component
 * User-friendly, side-by-side transaction comparison and investigation modal.
 */

import { useState } from 'react';
import Modal from '../common/Modal.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { RECONCILIATION_CONFIG } from '../../data/config.js';
import {
  AlertCircle,
  Lightbulb,
  Info,
  Copy,
  Check,
  Building2,
  Laptop,
  ArrowRight,
} from 'lucide-react';

const { suggestedActions } = RECONCILIATION_CONFIG;

export default function ExceptionDetail({ isOpen, onClose, row }) {
  const [copiedField, setCopiedField] = useState(null);

  if (!row) return null;

  const action = suggestedActions[row.status] || '';

  const handleCopy = (text, field) => {
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const impactLabel = {
    MATCHED: 'No impact — transactions are fully balanced and verified between systems.',
    TIMING_DIFFERENCE: 'This settlement occurred in November 2026. It will automatically reconcile in the November reporting period and does not represent lost funds.',
    DUPLICATE: 'The duplicate entry inflates the raw bank total by the duplicate amount. It has been isolated and removed from the Adjusted Bank Total to prevent overstated ledger balances.',
    ROUNDING_DIFFERENCE: 'Arises from fractional unit pricing precision (platform 4 decimal places vs bank 2 decimal places). The sub-cent variance is well within configured tolerance (₹0.05).',
    MISSING_SETTLEMENT: 'Platform recorded the payment, but funds have not settled into the bank account. Directly contributes to the cash reconciliation gap until settled or resolved.',
    UNMATCHED_BANK: 'Bank received a credit that has no matching platform transaction record. Represents unexplained cash received requiring merchant account review.',
    ORPHAN_REFUND: 'A customer refund was issued and settled, but its parent payment transaction does not exist in the platform dataset. Represents an audit/integrity risk.',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transaction Reconciliation Inspector" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction Identifier</span>
            <div className="flex items-center gap-2 mt-1">
              <h4 className="text-xl font-bold text-slate-900 font-mono">{row.transactionId}</h4>
              <button
                onClick={() => handleCopy(row.transactionId, 'txnId')}
                className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                title="Copy Transaction ID"
              >
                {copiedField === 'txnId' ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <StatusBadge status={row.status} />
          </div>
        </div>

        {/* Side-by-Side Comparison: Platform vs Bank */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Platform Record Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Laptop className="h-4 w-4 text-blue-600" />
              Platform Transaction
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Transaction ID:</span>
                <span className="font-mono font-semibold text-slate-900">{row.transactionId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Transaction Type:</span>
                <span className="font-semibold text-slate-900">{row.type || 'PAYMENT'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Initiation Date:</span>
                <span className="font-medium text-slate-800">{row.transactionDate || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Platform Amount:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {row.platformAmount !== '—' ? `₹${row.platformAmount}` : '—'}
                </span>
              </div>
              {row.originalTransactionId && (
                <div className="flex justify-between py-1 border-b border-slate-50">
                  <span className="text-slate-500">Ref. Original Txn:</span>
                  <span className="font-mono font-bold text-rose-600">{row.originalTransactionId} (Missing)</span>
                </div>
              )}
            </div>
          </div>

          {/* Bank Settlement Card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Bank Settlement
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Bank Reference:</span>
                <div className="flex items-center gap-1">
                  <span className="font-mono font-semibold text-slate-900">{row.bankRef}</span>
                  {row.bankRef !== '—' && (
                    <button
                      onClick={() => handleCopy(row.bankRef, 'bankRef')}
                      className="text-slate-400 hover:text-blue-600"
                    >
                      {copiedField === 'bankRef' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Settlement Date:</span>
                <span className={`font-medium ${row.settlementDate === '2026-11-02' ? 'text-amber-700 font-bold' : 'text-slate-800'}`}>
                  {row.settlementDate || '—'}
                  {row.settlementDate === '2026-11-02' && ' (Post-Period)'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Settled Amount:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  {row.bankAmount !== '—' ? `₹${row.bankAmount}` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Net Variance (P - B):</span>
                <span className={`font-mono font-bold text-sm ${
                  row.difference !== '0.0000' && row.difference !== '0.00' ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {row.difference !== '0.0000' ? `₹${row.difference}` : '₹0.0000'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reason Card */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Root-Cause Analysis</p>
              <p className="text-xs text-blue-800 mt-1 leading-relaxed">{row.reason}</p>
            </div>
          </div>
        </div>

        {/* Reconciliation Impact */}
        {impactLabel[row.status] && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">Accounting Impact</p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">{impactLabel[row.status]}</p>
              </div>
            </div>
          </div>
        )}

        {/* Suggested Action */}
        {action && row.status !== 'MATCHED' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Recommended Action</p>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">{action}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </Modal>
  );
}
