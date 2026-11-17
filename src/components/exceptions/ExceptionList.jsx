/**
 * ExceptionList Component
 * Shows filtered exception list when a category is selected.
 */

import Modal from '../common/Modal.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { formatCurrency } from '../../utils/decimal.js';
import { RECONCILIATION_CONFIG } from '../../data/config.js';

export default function ExceptionList({ isOpen, onClose, categoryKey, statusKey, exceptions, onExceptionClick }) {
  if (!exceptions) return null;

  const filteredExceptions = statusKey
    ? exceptions.filter(e => e.type === statusKey)
    : exceptions;

  const categoryLabel = RECONCILIATION_CONFIG.statusLabels[statusKey] || categoryKey;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${categoryLabel} — ${filteredExceptions.length} exception(s)`} maxWidth="max-w-3xl">
      <div className="space-y-3">
        {filteredExceptions.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No exceptions in this category.</p>
        ) : (
          filteredExceptions.map((exception, i) => (
            <button
              key={`${exception.id}-${i}`}
              onClick={() => onExceptionClick && onExceptionClick(exception)}
              className="w-full text-left rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {exception.id}
                    </span>
                    <StatusBadge status={exception.type} />
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{exception.reason}</p>
                  <p className="text-xs text-slate-400 mt-1">Date: {exception.date}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-900 font-mono">
                    {formatCurrency(exception.amount)}
                  </p>
                  {exception.bankRef && (
                    <p className="text-xs text-slate-500 mt-1">Ref: {exception.bankRef}</p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </Modal>
  );
}

