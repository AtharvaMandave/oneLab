/**
 * App Component
 * Modern Financial Reconciliation & Exception Detection System.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Scale,
  Download,
  FileSpreadsheet,
  BarChart3,
  AlertTriangle,
  Database,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { useReconciliation } from './hooks/useReconciliation.js';
import SummaryOverview from './components/dashboard/SummaryOverview.jsx';
import ExceptionBreakdown from './components/dashboard/ExceptionBreakdown.jsx';
import ReconciliationTable from './components/dashboard/ReconciliationTable.jsx';
import ExceptionDetail from './components/exceptions/ExceptionDetail.jsx';
import ExceptionList from './components/exceptions/ExceptionList.jsx';
import DataManagement from './components/data/DataManagement.jsx';
import AuditCasesTab from './components/dashboard/AuditCasesTab.jsx';
import Toast from './components/common/Toast.jsx';
import { exportReconciliationCSV, exportExceptionsCSV } from './utils/csvExport.js';

export default function App() {
  const {
    platformData,
    bankData,
    result,
    uploadErrors,
    resetToDemo,
    uploadPlatformData,
    uploadBankData,
    setUploadErrors,
  } = useReconciliation();

  // Navigation, Search & Modals
  const [selectedRow, setSelectedRow] = useState(null);
  const [exceptionListModal, setExceptionListModal] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [tableSearch, setTableSearch] = useState('');
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Global Escape Key Listener for Modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedRow(null);
        setExceptionListModal(null);
        setExportMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 3500);
  }, []);

  const handleRowClick = useCallback((row) => {
    setSelectedRow(row);
  }, []);

  const handleCategoryClick = useCallback((categoryKey, statusKey) => {
    setExceptionListModal({ categoryKey, statusKey });
  }, []);

  // Look up full detail row for maximum inspector fidelity
  const handleExceptionClick = useCallback((exception) => {
    setExceptionListModal(null);
    if (!result) return;
    const realRow = result.details.find(d =>
      d.transactionId === exception.id || (exception.bankRef && d.bankRef === exception.bankRef)
    );
    if (realRow) {
      setSelectedRow(realRow);
    } else {
      setSelectedRow({
        transactionId: exception.id,
        bankRef: exception.bankRef || '—',
        type: exception.type === 'ORPHAN_REFUND' ? 'REFUND' : 'PAYMENT',
        transactionDate: exception.date,
        settlementDate: '—',
        platformAmount: exception.amount ? exception.amount.toFixed(4) : '—',
        bankAmount: '—',
        difference: exception.difference ? exception.difference.toFixed(4) : '—',
        status: exception.type,
        statusLabel: exception.type,
        reason: exception.reason,
      });
    }
  }, [result]);

  const handleSelectTransactionFromAudit = useCallback((txnId) => {
    if (!result) return;
    const row = result.details.find(d => d.transactionId === txnId);
    if (row) {
      setSelectedRow(row);
    }
  }, [result]);

  const handleViewInLedger = useCallback((txnId) => {
    setTableSearch(txnId);
    setActiveTab('transactions');
  }, []);

  const handleExport = (type) => {
    if (!result) return;
    if (type === 'reconciliation') {
      exportReconciliationCSV(result.details);
      showToast('Downloaded Reconciliation Report (CSV)', 'success');
    } else if (type === 'exceptions') {
      exportExceptionsCSV(result.exceptions);
      showToast('Downloaded Exception Report (CSV)', 'success');
    }
    setExportMenuOpen(false);
  };

  const handleResetData = () => {
    resetToDemo();
    setTableSearch('');
    showToast('Restored October 2026 assessment demo dataset', 'info');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle, count: result?.exceptions?.length },
    { id: 'transactions', label: 'Reconciliation Ledger', icon: FileSpreadsheet, count: result?.details?.length },
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'audit', label: 'Planted Test Cases', icon: ShieldCheck, badge: 'Cases A–D' },
  ];

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="p-4 rounded-2xl bg-blue-50 text-blue-600 inline-block animate-pulse">
            <Scale className="h-10 w-10" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Initializing Reconciliation Engine...</h2>
          <p className="text-xs text-slate-500">Normalizing transaction streams and computing cash variance</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo & Context */}
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white shadow-xs">
                <Scale className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 leading-tight tracking-tight">
                    Payment Reconciliation & Exception Detection
                  </h1>
                  <span className="hidden md:inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Engine Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Financial SaaS · Reporting Window: <span className="font-semibold text-slate-800">{result.summary.reportingPeriod}</span> · Currency: <span className="font-semibold text-slate-800">{result.summary.currency} (₹)</span>
                </p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-2.5">
              {/* Quick Reset Button */}
              <button
                onClick={handleResetData}
                title="Reset to synthetic test dataset"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                Reset Demo
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs rounded-xl transition-all cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                  <ChevronDown className="h-3 w-3 opacity-80" />
                </button>
                {exportMenuOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setExportMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95">
                      <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Download CSV Reports
                      </div>
                      <button
                        onClick={() => handleExport('reconciliation')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-blue-600" />
                        Full Reconciliation Report (CSV)
                      </button>
                      <button
                        onClick={() => handleExport('exceptions')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-700 hover:bg-slate-50 font-medium cursor-pointer"
                      >
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        Exception Investigation Log (CSV)
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto -mb-px pt-1 scrollbar-none">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-blue-600 text-blue-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold font-mono ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Page Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 flex-1 w-full">
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <SummaryOverview
              summary={result.summary}
              breakdown={result.breakdown}
              onInspectTxn={handleSelectTransactionFromAudit}
              onViewPlantedCases={() => setActiveTab('audit')}
            />
            <ExceptionBreakdown
              breakdown={result.breakdown}
              onCategoryClick={handleCategoryClick}
            />
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Recent Settlement Ledger</h3>
                  <p className="text-xs text-slate-500">Live matched entries and exceptions</p>
                </div>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  View full ledger ({result.details.length} records) →
                </button>
              </div>
              <ReconciliationTable
                details={result.details}
                onRowClick={handleRowClick}
                externalSearch={tableSearch}
                onSearchChange={setTableSearch}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Exceptions */}
        {activeTab === 'exceptions' && (
          <div className="space-y-6">
            <ExceptionBreakdown
              breakdown={result.breakdown}
              onCategoryClick={handleCategoryClick}
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-3 tracking-tight">Active Discrepancies Requiring Review</h3>
              <ReconciliationTable
                details={result.details.filter(d => d.status !== 'MATCHED')}
                onRowClick={handleRowClick}
                externalSearch={tableSearch}
                onSearchChange={setTableSearch}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Transactions */}
        {activeTab === 'transactions' && (
          <div className="space-y-4">
            <ReconciliationTable
              details={result.details}
              onRowClick={handleRowClick}
              externalSearch={tableSearch}
              onSearchChange={setTableSearch}
            />
          </div>
        )}

        {/* Tab 4: Data Management */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <DataManagement
              platformData={platformData}
              bankData={bankData}
              onUploadPlatform={(data) => {
                const ok = uploadPlatformData(data);
                if (ok) showToast('Platform transactions updated successfully', 'success');
                return ok;
              }}
              onUploadBank={(data) => {
                const ok = uploadBankData(data);
                if (ok) showToast('Bank settlements updated successfully', 'success');
                return ok;
              }}
              onReset={handleResetData}
              uploadErrors={uploadErrors}
              onClearErrors={() => setUploadErrors(null)}
            />
          </div>
        )}

        {/* Tab 5: Planted Test Cases */}
        {activeTab === 'audit' && (
          <AuditCasesTab
            onSelectTransaction={handleSelectTransactionFromAudit}
            onViewInLedger={handleViewInLedger}
          />
        )}
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Financial Systems Core v2.0</span>
            <span>·</span>
            <span>Decimal-safe arithmetic (decimal.js)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Period: October 2026</span>
            <span>·</span>
            <span>Currency: INR (₹)</span>
            <span>·</span>
            <span>Engine Status: Verified Balanced</span>
          </div>
        </div>
      </footer>

      {/* Detail Modal */}
      <ExceptionDetail
        isOpen={selectedRow !== null}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />

      {/* Exception Category List Modal */}
      <ExceptionList
        isOpen={exceptionListModal !== null}
        onClose={() => setExceptionListModal(null)}
        categoryKey={exceptionListModal?.categoryKey}
        statusKey={exceptionListModal?.statusKey}
        exceptions={result.exceptions}
        onExceptionClick={handleExceptionClick}
      />

      {/* Action Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
