/**
 * MetricCard Component
 * Displays a single metric with label, value, and optional icon in clean SaaS style.
 */

export default function MetricCard({
  label,
  value,
  sublabel,
  icon: Icon,
  variant = 'default',
  className = '',
  trend,
}) {
  const variants = {
    default: 'bg-white border-slate-200/90 hover:border-slate-300 shadow-xs',
    success: 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-200/90 shadow-xs',
    warning: 'bg-gradient-to-br from-amber-50/60 to-white border-amber-200/90 shadow-xs',
    danger: 'bg-gradient-to-br from-rose-50/60 to-white border-rose-200/90 shadow-xs',
    info: 'bg-gradient-to-br from-blue-50/60 to-white border-blue-200/90 shadow-xs',
  };

  const iconVariants = {
    default: 'text-slate-600 bg-slate-100',
    success: 'text-emerald-700 bg-emerald-100',
    warning: 'text-amber-700 bg-amber-100',
    danger: 'text-rose-700 bg-rose-100',
    info: 'text-blue-700 bg-blue-100',
  };

  return (
    <div className={`rounded-xl border p-5 transition-all duration-150 ${variants[variant]} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 tracking-tight font-mono">{value}</p>
          {sublabel && (
            <p className="mt-1.5 text-xs text-slate-500 font-medium">{sublabel}</p>
          )}
          {trend && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs font-semibold">
              {trend}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`flex-shrink-0 p-2.5 rounded-lg ${iconVariants[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}
