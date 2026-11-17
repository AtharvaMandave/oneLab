/**
 * Toast Component
 * Lightweight notification toast for user feedback (copy, export, reset, upload).
 */

import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
  };

  const styles = {
    success: 'bg-slate-900 text-white border-slate-700',
    error: 'bg-red-900 text-white border-red-700',
    info: 'bg-blue-900 text-white border-blue-700',
  };

  const iconColors = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    info: 'text-blue-400',
  };

  const Icon = icons[toast.type || 'info'];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 bg-slate-900 text-white border-slate-700 max-w-md">
      <Icon className={`h-4 w-4 flex-shrink-0 ${iconColors[toast.type || 'info']}`} />
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
