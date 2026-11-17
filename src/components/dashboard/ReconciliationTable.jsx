/**
 * ReconciliationTable Component
 * High-performance, user-friendly transaction reconciliation table with quick pills,
 * instant search, case shortcuts, sorting, copy-to-clipboard, pagination, and direct inspection.
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Download,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge.jsx';
import { RECONCILIATION_CONFIG } from '../../data/config.js';
import { exportReconciliationCSV } from '../../utils/csvExport.js';

const { statusLabels } = RECONCILIATION_CONFIG;

export default function ReconciliationTable({
  details,
  onRowClick,
  externalSearch = '',
  onSearchChange,
}) {
  const [search, setSearch] = useState(externalSearch);
  const [quickFilter, setQuickFilter] = useState('ALL'); // 'ALL' | 'EXCEPTIONS' | 'MATCHED'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortField, setSortField] = useState('transactionId');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState(null);

  // Sync with external search if changed from parent
  useEffect(() => {
    if (externalSearch !== undefined && externalSearch !== search) {
      setSearch(externalSearch);
      setCurrentPage(1);
    }
  }, [externalSearch]);

  const handleSearchInput = (value) => {
    setSearch(value);
    setCurrentPage(1);
    if (onSearchChange) onSearchChange(value);
  };

  // Copy helper
  const handleCopy = (e, text, id) => {
    e.stopPropagation();
    if (!text || text === '—') return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    const s = new Set(details.map(d => d.status));
    return ['ALL', ...Array.from(s)];
  }, [details]);

  // Counts for quick pills
  const counts = useMemo(() => {
    const total = details.length;
    const matched = details.filter(d => d.status === 'MATCHED').length;
    const exceptions = total - matched;
    return { total, matched, exceptions };
  }, [details]);

  // Filter and sort
  const filtered = useMemo(() => {
    let rows = [...details];

    // Quick filter
    if (quickFilter === 'EXCEPTIONS') {
      rows = rows.filter(r => r.status !== 'MATCHED');
    } else if (quickFilter === 'MATCHED') {
      rows = rows.filter(r => r.status === 'MATCHED');
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      rows = rows.filter(r => r.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      rows = rows.filter(r => r.type === typeFilter);
    }

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(r =>
        r.transactionId.toLowerCase().includes(q) ||
        r.bankRef.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.platformAmount.includes(q) ||
        r.bankAmount.includes(q) ||
        (r.statusLabel && r.statusLabel.toLowerCase().includes(q))
      );
    }

    // Sort
    rows.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      // Numeric sort for amounts
      if (['platformAmount', 'bankAmount', 'difference'].includes(sortField)) {
        const aNum = parseFloat(aVal) || 0;
        const bNum = parseFloat(bVal) || 0;
        return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return rows;
  }, [details, quickFilter, statusFilter, typeFilter, search, sortField, sortDir]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleQuickFilterChange = (filter) => {
    setQuickFilter(filter);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const clearAllFilters = () => {
    handleSearchInput('');
    setQuickFilter('ALL');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setCurrentPage(1);
  };

  const handleQuickCaseClick = (txnId) => {
    if (search === txnId) {
      handleSearchInput('');
    } else {
      setQuickFilter('ALL');
      setStatusFilter('ALL');
      setTypeFilter('ALL');
      handleSearchInput(txnId);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 text-slate-400 opacity-60" />;
    return sortDir === 'asc'
      ? <ArrowUp className="h-3.5 w-3.5 text-blue-600 font-bold" />
      : <ArrowDown className="h-3.5 w-3.5 text-blue-600 font-bold" />;
  };

  const columns = [
    { key: 'transactionId', label: 'Transaction ID' },
    { key: 'bankRef', label: 'Bank Reference' },
    { key: 'type', label: 'Type' },
    { key: 'transactionDate', label: 'Txn Date' },
    { key: 'settlementDate', label: 'Settlement' },
    { key: 'platformAmount', label: 'Platform Amt' },
    { key: 'bankAmount', label: 'Bank Amt' },
    { key: 'difference', label: 'Variance' },
    { key: 'status', label: 'Recon Status' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header & Quick Filter Pills */}
      <div className="p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Reconciliation Ledger</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Line-by-line settlement matching between Platform transactions and Bank records
            </p>
          </div>

          {/* Quick Filter Pills */}
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl text-xs font-semibold">
            <button
              onClick={() => handleQuickFilterChange('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                quickFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Records ({counts.total})
            </button>
            <button
              onClick={() => handleQuickFilterChange('EXCEPTIONS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                quickFilter === 'EXCEPTIONS'
                  ? 'bg-rose-500 text-white shadow-2xs font-bold'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              Exceptions ({counts.exceptions})
            </button>
            <button
              onClick={() => handleQuickFilterChange('MATCHED')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                quickFilter === 'MATCHED'
                  ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Matched ({counts.matched})
            </button>
          </div>
        </div>

        {/* Search & Granular Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, Bank Ref, Amount, or Reason..."
              value={search}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50/50 hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {search && (
              <button
                onClick={() => handleSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Granular Status Select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableStatuses.map(s => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Specific Statuses' : statusLabels[s] || s}
                </option>
              ))}
            </select>
          </div>

          {/* Type Select */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="PAYMENT">Payments</option>
            <option value="REFUND">Refunds</option>
            <option value="SETTLEMENT">Bank Settlements</option>
          </select>

          {/* Quick Export Button */}
          <button
            onClick={() => exportReconciliationCSV(filtered)}
            title="Export filtered records to CSV"
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          {/* Active Filter Clear */}
          {(search || quickFilter !== 'ALL' || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <button
              onClick={clearAllFilters}
              className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Planted Test Cases Quick Jump Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Quick Test Cases:
          </span>
          <button
            onClick={() => handleQuickCaseClick('TXN-1020')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
              search === 'TXN-1020'
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-amber-50/70 text-amber-800 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            Case A: Cross-Month (TXN-1020)
          </button>
          <button
            onClick={() => handleQuickCaseClick('TXN-1007')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
              search === 'TXN-1007'
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-amber-50/70 text-amber-800 border-amber-200/80 hover:bg-amber-100'
            }`}
          >
            Case B: Rounding (TXN-1007)
          </button>
          <button
            onClick={() => handleQuickCaseClick('TXN-1003')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
              search === 'TXN-1003'
                ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                : 'bg-rose-50/70 text-rose-800 border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            Case C: Duplicate (TXN-1003)
          </button>
          <button
            onClick={() => handleQuickCaseClick('REF-5099')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
              search === 'REF-5099'
                ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                : 'bg-rose-50/70 text-rose-800 border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            Case D: Orphan Refund (REF-5099)
          </button>
          <button
            onClick={() => handleQuickCaseClick('TXN-1016')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
              search === 'TXN-1016'
                ? 'bg-rose-100 text-rose-900 border-rose-300 font-bold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            Missing Settlement (TXN-1016)
          </button>
          <button
            onClick={() => handleQuickCaseClick('TXN-EXT-001')}
            className={`px-2 py-0.5 rounded-lg border text-[11px] font-medium transition-all ${
              search === 'TXN-EXT-001'
                ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            Unmatched Bank (TXN-EXT-001)
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={`px-4 py-3 select-none hover:text-slate-900 cursor-pointer transition-colors whitespace-nowrap ${
                    ['platformAmount', 'bankAmount', 'difference'].includes(col.key) ? 'text-right' : ''
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className={`inline-flex items-center gap-1.5 ${
                    ['platformAmount', 'bankAmount', 'difference'].includes(col.key) ? 'justify-end' : ''
                  }`}>
                    {col.label}
                    <SortIcon field={col.key} />
                  </span>
                </th>
              ))}
              <th className="px-3 py-3 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.map((row, i) => {
              const diffNum = parseFloat(row.difference) || 0;
              const hasDiff = Math.abs(diffNum) > 0.00001;
              const isException = row.status !== 'MATCHED';
              const isFractional = row.platformAmount !== '—' && row.platformAmount.includes('.') && row.platformAmount.split('.')[1]?.length > 2;

              return (
                <tr
                  key={`${row.transactionId}-${row.bankRef}-${i}`}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`cursor-pointer transition-colors ${
                    isException
                      ? 'bg-rose-50/20 hover:bg-rose-50/40'
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Transaction ID */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono font-medium text-slate-900">
                    <div className="flex items-center gap-1.5 group">
                      <span>{row.transactionId}</span>
                      <button
                        title="Copy Transaction ID"
                        onClick={(e) => handleCopy(e, row.transactionId, `txn-${row.transactionId}-${i}`)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition-opacity"
                      >
                        {copiedId === `txn-${row.transactionId}-${i}` ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Bank Reference */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-600">
                    <div className="flex items-center gap-1.5 group">
                      <span>{row.bankRef}</span>
                      {row.bankRef !== '—' && (
                        <button
                          title="Copy Bank Ref"
                          onClick={(e) => handleCopy(e, row.bankRef, `bank-${row.bankRef}-${i}`)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 rounded transition-opacity"
                        >
                          {copiedId === `bank-${row.bankRef}-${i}` ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      row.type === 'REFUND' ? 'bg-purple-100 text-purple-800' :
                      row.type === 'SETTLEMENT' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {row.type}
                    </span>
                  </td>

                  {/* Dates */}
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{row.transactionDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-medium">
                    {row.settlementDate === '2026-11-02' ? (
                      <span className="text-amber-800 font-semibold flex items-center gap-1">
                        {row.settlementDate}
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-normal">Nov</span>
                      </span>
                    ) : (
                      row.settlementDate
                    )}
                  </td>

                  {/* Platform Amount */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-right font-medium text-slate-900">
                    <div className="flex items-center justify-end gap-1">
                      {row.platformAmount !== '—' ? `₹${parseFloat(row.platformAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : '—'}
                      {isFractional && (
                        <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800" title="Internal 4-decimal precision">
                          4dp
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Bank Amount */}
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-right font-medium text-slate-900">
                    {row.bankAmount !== '—' ? `₹${parseFloat(row.bankAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
                  </td>

                  {/* Difference */}
                  <td className={`px-4 py-3 whitespace-nowrap font-mono text-right font-semibold ${
                    hasDiff ? (diffNum > 0 ? 'text-rose-600' : 'text-amber-600') : 'text-slate-400'
                  }`}>
                    {hasDiff ? `${diffNum > 0 ? '+' : ''}₹${diffNum.toFixed(4)}` : '₹0.00'}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge status={row.status} />
                  </td>

                  {/* Action inspect */}
                  <td className="px-3 py-3 text-center">
                    <button
                      title="Inspect Transaction"
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-16 text-center">
                  <div className="max-w-xs mx-auto space-y-2">
                    <Search className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-sm font-semibold text-slate-700">No matching records found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search terms or clearing your status filters.</p>
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span>Showing</span>
          <span className="font-semibold text-slate-900">
            {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
          </span>
          <span>to</span>
          <span className="font-semibold text-slate-900">
            {Math.min(currentPage * pageSize, filtered.length)}
          </span>
          <span>of</span>
          <span className="font-semibold text-slate-900">{filtered.length} entries</span>
          {filtered.length !== details.length && (
            <span className="text-slate-400 font-normal">
              (filtered from {details.length} total)
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 rounded-md border border-slate-200 bg-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>All</option>
            </select>
          </div>

          {/* Page controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
