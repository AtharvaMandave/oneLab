/**
 * DataManagement Component
 * Modern file upload, CSV schema reference, sample template generators,
 * raw dataset search/inspector, and demo data reset controls.
 */

import { useState } from 'react';
import {
  Upload,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  X,
  Download,
  FileText,
  Search,
  Database,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Table,
} from 'lucide-react';
import Modal from '../common/Modal.jsx';
import { parseCSVFile } from '../../utils/csvExport.js';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export default function DataManagement({
  platformData,
  bankData,
  onUploadPlatform,
  onUploadBank,
  onReset,
  uploadErrors,
  onClearErrors,
}) {
  const [viewModal, setViewModal] = useState(null); // 'platform' | 'bank' | null
  const [showSchema, setShowSchema] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadSuccess(null);

    try {
      const { data, errors } = await parseCSVFile(file);

      if (errors.length > 0) {
        console.error('CSV parse errors:', errors);
      }

      let success;
      if (type === 'platform') {
        success = onUploadPlatform(data);
      } else {
        success = onUploadBank(data);
      }

      setUploadSuccess(success ? type : null);
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Download template CSV helpers
  const handleDownloadTemplate = (type) => {
    if (type === 'platform') {
      const samplePlatform = [
        { transactionId: 'TXN-2001', type: 'PAYMENT', amount: '12500.0000', timestamp: '2026-10-01T10:00:00', description: 'Sample Payment', originalTransactionId: '' },
        { transactionId: 'REF-6001', type: 'REFUND', amount: '2500.0000', timestamp: '2026-10-04T12:00:00', description: 'Sample Refund', originalTransactionId: 'TXN-2001' },
      ];
      const csv = Papa.unparse(samplePlatform);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, 'platform-transactions-template.csv');
    } else {
      const sampleBank = [
        { transactionRef: 'TXN-2001', bankRef: 'BNK-20261002-001', amount: '12500.00', settlementDate: '2026-10-02T10:00:00', description: 'Bank Settlement' },
        { transactionRef: 'REF-6001', bankRef: 'BNK-20261005-001', amount: '2500.00', settlementDate: '2026-10-05T10:00:00', description: 'Refund Settlement' },
      ];
      const csv = Papa.unparse(sampleBank);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, 'bank-settlements-template.csv');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Data Sources & Dataset Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View loaded platform and bank records, upload custom CSV datasets, download templates, or reset to October 2026 demo data
          </p>
        </div>
        <button
          onClick={() => setShowSchema(!showSchema)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs self-start sm:self-center cursor-pointer"
        >
          <Table className="h-3.5 w-3.5 text-blue-600" />
          <span>{showSchema ? 'Hide Schema Guide' : 'CSV Schema Reference'}</span>
          {showSchema ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Expandable CSV Schema Guide */}
      {showSchema && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Supported CSV Schema Specifications</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Custom CSV files uploaded will be validated against these strict schemas using decimal-safe parsers:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Platform Schema */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-blue-700 flex items-center gap-1.5">
                <FileText className="h-4 w-4" /> Platform Transactions Schema
              </span>
              <ul className="space-y-1 text-slate-600 font-mono text-[11px]">
                <li><strong className="text-slate-900">transactionId</strong>: String, Unique ID (e.g. TXN-1001)</li>
                <li><strong className="text-slate-900">type</strong>: PAYMENT | REFUND</li>
                <li><strong className="text-slate-900">amount</strong>: Numeric (e.g. 12500.00 or 1499.9975, up to 4dp)</li>
                <li><strong className="text-slate-900">timestamp</strong>: ISO-8601 Date (e.g. 2026-10-01T10:00:00)</li>
                <li><strong className="text-slate-900">description</strong>: Text description (Optional)</li>
                <li><strong className="text-slate-900">originalTransactionId</strong>: String (Required for REFUND)</li>
              </ul>
            </div>

            {/* Bank Schema */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="font-bold text-indigo-700 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4" /> Bank Settlements Schema
              </span>
              <ul className="space-y-1 text-slate-600 font-mono text-[11px]">
                <li><strong className="text-slate-900">transactionRef</strong>: String, Platform Reference (e.g. TXN-1001)</li>
                <li><strong className="text-slate-900">bankRef</strong>: String, Bank Settlement Ref (e.g. BNK-20261002-001)</li>
                <li><strong className="text-slate-900">amount</strong>: Numeric (e.g. 12500.00, 2dp bank statement)</li>
                <li><strong className="text-slate-900">settlementDate</strong>: ISO-8601 Date (e.g. 2026-10-02T10:00:00)</li>
                <li><strong className="text-slate-900">description</strong>: Settlement description (Optional)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Platform Dataset Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                Internal Source
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Platform Transactions</h3>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{platformData.length} records</p>
            <p className="text-xs text-slate-500 mt-1">Processed payments and customer refunds</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => setViewModal('platform')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              View Data
            </button>
            <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Upload
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'platform')}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Bank Dataset Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                External Bank Feed
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Bank Settlements</h3>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{bankData.length} records</p>
            <p className="text-xs text-slate-500 mt-1">Actual settlements and credits received in bank</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              onClick={() => setViewModal('bank')}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              View Data
            </button>
            <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Upload
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'bank')}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Templates Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <Download className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                CSV Headers
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Download Templates</h3>
            <p className="text-xs text-slate-500 mt-1">Sample CSV files with valid columns for custom test runs</p>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-1.5">
            <button
              onClick={() => handleDownloadTemplate('platform')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-3 w-3" />
              Platform CSV Template
            </button>
            <button
              onClick={() => handleDownloadTemplate('bank')}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="h-3 w-3" />
              Bank CSV Template
            </button>
          </div>
        </div>

        {/* Reset to Demo Card */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-amber-300 transition-all">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
                <RotateCcw className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Assessment Data
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900">Reset Demo Data</h3>
            <p className="text-xs text-slate-600 mt-1">
              Restores the original 24 platform & 25 bank settlement records with all 4 planted test cases
            </p>
          </div>

          <div className="pt-2 border-t border-amber-200">
            <button
              onClick={() => { onReset(); setUploadSuccess(null); }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-900 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restore Assessment Dataset
            </button>
          </div>
        </div>
      </div>

      {/* Upload Feedback Banners */}
      {uploadSuccess && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              {uploadSuccess === 'platform' ? 'Platform transactions' : 'Bank settlements'} uploaded and validated successfully! Reconciliation has been recalculated dynamically.
            </span>
          </div>
          <button onClick={() => setUploadSuccess(null)} className="text-emerald-500 hover:text-emerald-700 cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {uploadErrors && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-rose-900">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Upload Validation Failed ({uploadErrors.errors.length} issue{uploadErrors.errors.length > 1 ? 's' : ''})</span>
            </div>
            <button onClick={onClearErrors} className="text-rose-500 hover:text-rose-700 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-rose-700">The uploaded file contains formatting or schema issues:</p>
          <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] max-h-32 overflow-y-auto">
            {uploadErrors.errors.slice(0, 10).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {uploadErrors.errors.length > 10 && (
              <li className="font-semibold text-rose-900">...and {uploadErrors.errors.length - 10} more rows</li>
            )}
          </ul>
        </div>
      )}

      {/* Raw Dataset Viewer Modal with Search */}
      <Modal
        isOpen={viewModal !== null}
        onClose={() => setViewModal(null)}
        title={viewModal === 'platform' ? 'Platform Transactions Ledger' : 'Bank Settlements Statement'}
        maxWidth="max-w-5xl"
      >
        {viewModal === 'platform' && <SearchableDataTable data={platformData} type="platform" />}
        {viewModal === 'bank' && <SearchableDataTable data={bankData} type="bank" />}
      </Modal>
    </div>
  );
}

function SearchableDataTable({ data, type }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!data || data.length === 0) {
    return <p className="text-center text-slate-500 py-8">No records loaded.</p>;
  }

  const columns = type === 'platform'
    ? ['transactionId', 'type', 'amount', 'timestamp', 'description', 'originalTransactionId']
    : ['transactionRef', 'bankRef', 'amount', 'settlementDate', 'description'];

  const filtered = data.filter(row => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return Object.values(row).some(v => String(v || '').toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search raw dataset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">{filtered.length} of {data.length} records</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[60vh] overflow-y-auto">
        <table className="w-full text-xs text-left">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 shadow-2xs z-10">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-3 py-2.5 font-bold text-slate-600 uppercase text-[10px] tracking-wider whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 font-mono text-[11px]">
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 text-slate-700 whitespace-nowrap">
                    {row[col] ? String(row[col]) : <span className="text-slate-300 font-sans">—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                  No records matching "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
