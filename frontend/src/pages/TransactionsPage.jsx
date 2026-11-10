import React, { useState, useEffect, Suspense } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  X,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Download,
  FileText,
  ScanLine,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { apiDownload, apiRequest } from '../services/api';
import { formatINR, formatDate, toRupees } from '../utils/formatters';
import { useSearchParams } from 'react-router-dom';

const ReceiptScanner = React.lazy(() => import('../components/transactions/ReceiptScanner').then((module) => ({ default: module.ReceiptScanner })));

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

const formatExportDate = (value) => new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${value}T00:00:00.000Z`));

export const TransactionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedType = ['income', 'expense'].includes(searchParams.get('type')) ? searchParams.get('type') : '';
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [exportMonth, setExportMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [exporting, setExporting] = useState(false);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(requestedType);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: requestedType || 'expense',
    category: '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit: 15,
        sortBy,
        sortOrder,
      });

      if (search) queryParams.append('search', search);
      if (typeFilter) queryParams.append('type', typeFilter);
      if (categoryFilter) queryParams.append('category', categoryFilter);

      const [txRes, catRes, pmRes] = await Promise.all([
        apiRequest(`/transactions?${queryParams.toString()}`),
        categories.length === 0 ? apiRequest('/categories') : Promise.resolve(null),
        paymentMethods.length === 0 ? apiRequest('/payment-methods') : Promise.resolve(null),
      ]);

      setTransactions(txRes.data || []);
      setPagination(txRes.pagination || { page: 1, totalPages: 1, total: 0 });

      if (catRes) setCategories(catRes.data || []);
      if (pmRes) setPaymentMethods(pmRes.data || []);
    } catch (err) {
      setError(err.message || 'Error fetching transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1);
  }, [search, typeFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    if (searchParams.get('action') !== 'add' || loading) return;
    setFormData((current) => ({
      ...current,
      type: requestedType || current.type,
      category: current.category || categories.find((category) => category.type === requestedType)?._id || '',
      paymentMethod: current.paymentMethod || paymentMethods[0]?._id || '',
    }));
    setIsModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, loading, categories, paymentMethods, requestedType]);

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setFormData({
      title: '',
      amount: '',
      type: typeFilter || 'expense',
      category: categories.find((c) => c.type === (typeFilter || 'expense'))?._id || '',
      paymentMethod: paymentMethods[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (tx) => {
    setEditingTx(tx);
    setFormData({
      title: tx.title,
      amount: toRupees(tx.amount),
      type: tx.type,
      category: tx.category?._id || '',
      paymentMethod: tx.paymentMethod?._id || '',
      date: new Date(tx.date).toISOString().split('T')[0],
      note: tx.note || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleAddScannedDrafts = async (drafts) => {
    const results = [];
    for (let start = 0; start < drafts.length; start += 5) {
      const chunk = drafts.slice(start, start + 5);
      const chunkResults = await Promise.all(chunk.map(async (draft) => {
        const category = categories.find((item) => item._id === draft.categoryId)
          || categories.find((item) => item.type === draft.type);
        if (!category) {
          return { scanId: draft.scanId, status: 'failed', message: `No ${draft.type} category is available.` };
        }
        try {
          await apiRequest('/transactions', {
            method: 'POST',
            body: JSON.stringify({
              title: draft.title,
              amount: draft.amount,
              type: draft.type,
              category: category._id,
              paymentMethod: paymentMethods[0]?._id || null,
              date: draft.date || new Date().toISOString().split('T')[0],
              note: draft.note || '',
            }),
          });
          return { scanId: draft.scanId, status: 'added' };
        } catch (err) {
          return { scanId: draft.scanId, status: 'failed', message: err.message || 'Could not save this entry.' };
        }
      }));
      results.push(...chunkResults);
    }
    await loadData(pagination.page);
    return results;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.title || !formData.amount || !formData.category) {
      setModalError('Please fill in title, amount, and select a category.');
      return;
    }
    setModalLoading(true);

    try {
      const payload = {
        title: formData.title,
        amount: parseFloat(formData.amount),
        type: formData.type,
        category: formData.category,
        paymentMethod: formData.paymentMethod || null,
        date: formData.date,
        note: formData.note,
      };

      if (editingTx) {
        await apiRequest(`/transactions/${editingTx._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/transactions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      loadData(pagination.page);
    } catch (err) {
      setModalError(err.message || 'Error saving transaction.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction permanently?')) return;
    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
      loadData(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to delete transaction.');
    }
  };

  const handleDownloadMonth = async () => {
    if (!exportMonth) return;
    setError('');
    setExporting(true);

    try {
      const [year, month] = exportMonth.split('-');
      const blob = await apiDownload(`/transactions/export.csv?month=${month}&year=${year}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `wealthpulse-transactions-${year}-${month}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setError(err.message || 'Unable to download transactions.');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!exportMonth) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Allow pop-ups to create the PDF.');
      return;
    }

    printWindow.opener = null;
    setError('');
    setExporting(true);

    try {
      const [year, month] = exportMonth.split('-');
      const response = await apiRequest(`/transactions/export.json?month=${month}&year=${year}`);
      const transactionsForPrint = response.data || [];
      const monthName = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const totals = transactionsForPrint.reduce((sum, transaction) => {
        if (transaction.type === 'income') sum.income += transaction.amount;
        if (transaction.type === 'expense') sum.expenses += transaction.amount;
        return sum;
      }, { income: 0, expenses: 0 });
      const netCashFlow = totals.income - totals.expenses;
      const tableRows = transactionsForPrint.map((transaction) => `
        <tr>
          <td class="date-cell">${escapeHtml(formatExportDate(transaction.date))}</td>
          <td>
            <div class="transaction-title">${escapeHtml(transaction.title)}</div>
            <div class="transaction-meta">
              <span class="type ${transaction.type === 'income' ? 'income' : 'expense'}">${escapeHtml(transaction.type)}</span>
              <span>${escapeHtml(transaction.category)}</span>
              <span>${escapeHtml(transaction.paymentMethod || 'No payment method')}</span>
            </div>
            ${transaction.note ? `<div class="transaction-note">${escapeHtml(transaction.note)}</div>` : ''}
          </td>
          <td class="amount">${escapeHtml(formatINR(transaction.amount))}</td>
        </tr>`).join('');
      const html = `<!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <meta name="referrer" content="no-referrer" />
            <title>WealthPulse Monthly Transactions ${escapeHtml(year)}-${escapeHtml(month)}</title>
            <style>
              @page { size: A4 portrait; margin: 13mm; }
              * { box-sizing: border-box; }
              html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              html, body { margin: 0; min-height: 100%; }
              body { background: #f1f5f9; color: #0f172a; font: 9.5pt Arial, sans-serif; padding: 68px 18px 18px; }
              .preview-toolbar { align-items: center; background: #fff; border-bottom: 1px solid #e2e8f0; box-shadow: 0 3px 12px rgba(15,23,42,.08); display: flex; justify-content: space-between; left: 0; padding: 10px 18px; position: fixed; right: 0; top: 0; z-index: 2; }
              .toolbar-title { color: #334155; font-size: 9pt; font-weight: 700; }
              .toolbar-help { color: #64748b; font-size: 8pt; margin-left: 10px; }
              .toolbar-actions { display: flex; gap: 8px; }
              .toolbar-button { background: #fff; border: 1px solid #cbd5e1; border-radius: 7px; color: #334155; cursor: pointer; font: 700 8.5pt Arial, sans-serif; padding: 8px 12px; }
              .toolbar-button.primary { background: #6d28d9; border-color: #6d28d9; color: white; }
              .report-page { background: #fff; box-shadow: 0 12px 34px rgba(15,23,42,.12); display: flex; flex-direction: column; margin: 0 auto; min-height: 297mm; padding: 13mm; width: min(100%, 210mm); }
              header { align-items: center; border-bottom: 2px solid #8B5CF6; display: flex; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; }
              .brand-lockup { align-items: center; display: flex; gap: 9px; }
              .brand-logo { height: 36px; width: 36px; }
              .brand-name { color: #4c1d95; font-size: 20pt; font-weight: 800; letter-spacing: -.04em; }
              .report-badge { background: #f3e8ff; border: 1px solid #e9d5ff; border-radius: 999px; color: #6d28d9; font-size: 8pt; font-weight: 700; letter-spacing: .08em; padding: 7px 10px; text-transform: uppercase; }
              h1 { color: #1e1b4b; font-size: 18pt; letter-spacing: -.03em; margin: 0 0 4px; }
              .subtitle { color: #64748b; margin: 0; }
              .report-title { margin: 0 0 14px; }
              .summary { display: flex; gap: 9px; margin: 13px 0 18px; }
              .summary-card { background: #faf8ff; border: 1px solid #e9d5ff; border-radius: 9px; flex: 1; min-width: 0; padding: 10px 11px; }
              .summary-card span { color: #64748b; display: block; font-size: 7.5pt; font-weight: 700; letter-spacing: .06em; margin-bottom: 5px; text-transform: uppercase; }
              .summary-card strong { color: #1e1b4b; font-size: 11pt; }
              table { border-collapse: collapse; table-layout: fixed; width: 100%; }
              th, td { border-bottom: 1px solid #e2e8f0; overflow-wrap: anywhere; padding: 9px 7px; text-align: left; vertical-align: top; }
              th { background: #4c1d95; color: #fff; font-size: 7.5pt; letter-spacing: .07em; text-transform: uppercase; }
              td { font-size: 8.5pt; }
              tbody tr:nth-child(even) { background: #faf8ff; }
              th:nth-child(1), td:nth-child(1) { white-space: nowrap; width: 19%; }
              th:nth-child(2), td:nth-child(2) { width: 57%; }
              th:nth-child(3), td:nth-child(3) { text-align: right; width: 24%; }
              tr { break-inside: avoid; }
              thead { display: table-header-group; }
              .date-cell { color: #475569; font-size: 8pt; }
              .transaction-title { color: #0f172a; font-size: 9pt; font-weight: 700; line-height: 1.35; }
              .transaction-meta { align-items: center; color: #64748b; display: flex; flex-wrap: wrap; font-size: 7.5pt; gap: 5px 8px; margin-top: 4px; }
              .type { border-radius: 999px; font-size: 7pt; font-weight: 700; padding: 2px 6px; text-transform: capitalize; }
              .type.income { background: #dcfce7; color: #166534; }
              .type.expense { background: #ffe4e6; color: #9f1239; }
              .income-total { color: #15803d !important; }
              .expense-total { color: #be123c !important; }
              .transaction-note { color: #64748b; font-size: 7.5pt; line-height: 1.35; margin-top: 4px; }
              .amount { color: #1e1b4b; font-size: 8.5pt; font-weight: 700; white-space: nowrap; }
              .empty { color: #64748b; padding: 18px 7px; }
              footer { border-top: 1px solid #e2e8f0; color: #64748b; display: flex; font-size: 7.5pt; justify-content: space-between; margin-top: auto; padding-top: 9px; }
              @media print {
                body { background: #fff; min-height: 0; padding: 0; }
                .preview-toolbar { display: none; }
                .report-page { box-shadow: none; display: block; margin: 0; min-height: 0; padding: 0; width: auto; }
                footer { margin-top: 15px; }
              }
              @media screen and (max-width: 620px) {
                body { padding: 62px 8px 8px; }
                .preview-toolbar { padding: 9px; }
                .toolbar-help { display: none; }
                .toolbar-button { padding: 8px; }
                .report-page { min-height: calc(100vh - 70px); padding: 18px 13px; }
                .summary { gap: 5px; }
                .summary-card { padding: 8px 6px; }
                .summary-card strong { font-size: 9pt; }
              }
            </style>
          </head>
          <body>
            <div class="preview-toolbar">
              <div><span class="toolbar-title">PDF preview</span><span class="toolbar-help">Use “Save as PDF” in the print dialog.</span></div>
              <div class="toolbar-actions">
                <button class="toolbar-button primary" id="save-pdf" type="button">Save as PDF</button>
                <button class="toolbar-button" id="close-preview" type="button">Close</button>
              </div>
            </div>
            <main class="report-page">
            <header>
              <div class="brand-lockup">
                <svg class="brand-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <defs><linearGradient id="wealthpulse-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#A78BFA"/></linearGradient></defs>
                  <rect width="32" height="32" rx="9" fill="url(#wealthpulse-gradient)"/>
                  <g transform="translate(4 4)" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></g>
                </svg>
                <span class="brand-name">WealthPulse</span>
              </div>
              <span class="report-badge">Monthly report</span>
            </header>
            <section class="report-title">
              <h1>Transactions</h1>
              <p class="subtitle">${escapeHtml(monthName)} · ${transactionsForPrint.length} transaction${transactionsForPrint.length === 1 ? '' : 's'} · Amounts in INR</p>
            </section>
            <section class="summary" aria-label="Monthly totals">
              <div class="summary-card"><span>Total income</span><strong class="income-total">${escapeHtml(formatINR(totals.income))}</strong></div>
              <div class="summary-card"><span>Total expenses</span><strong class="expense-total">${escapeHtml(formatINR(totals.expenses))}</strong></div>
              <div class="summary-card"><span>Net cash flow</span><strong class="${netCashFlow < 0 ? 'expense-total' : 'income-total'}">${escapeHtml(formatINR(netCashFlow))}</strong></div>
            </section>
            <table>
              <thead><tr><th>Date</th><th>Transaction details</th><th>Amount</th></tr></thead>
              <tbody>${tableRows || '<tr><td class="empty" colspan="3">No transactions for this month.</td></tr>'}</tbody>
            </table>
            <footer><span>WealthPulse · Monthly financial activity</span><span>${escapeHtml(monthName)}</span></footer>
            </main>
          </body>
        </html>`;

      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.document.getElementById('save-pdf')?.addEventListener('click', () => printWindow.print());
      printWindow.document.getElementById('close-preview')?.addEventListener('click', () => printWindow.close());
      printWindow.focus();
    } catch (err) {
      printWindow.close();
      setError(err.message || 'Unable to prepare the PDF.');
    } finally {
      setExporting(false);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <AppLayout title="Transactions">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Ledger Records</h2>
          <p className="text-xs text-slate-400 mt-1">Manage personal income inflows and expense disbursements</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="transaction-export-month" className="block mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Export month</label>
            <input
              id="transaction-export-month"
              type="month"
              min="2020-01"
              max="2100-12"
              value={exportMonth}
              onChange={(event) => setExportMonth(event.target.value)}
              className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300 focus:outline-none focus:border-brand-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleDownloadMonth}
            disabled={exporting || !exportMonth}
            className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 disabled:opacity-50 font-semibold text-sm transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Preparing…' : 'Download CSV'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={exporting || !exportMonth}
            className="px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 disabled:opacity-50 font-semibold text-sm transition-colors flex items-center gap-2"
            title="Opens the print dialog, where you can save the month as a PDF."
          >
            <FileText className="w-4 h-4" />
            <span>{exporting ? 'Preparing…' : 'Download PDF'}</span>
          </button>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-brand-primary/40 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary dark:text-brand-secondary font-semibold text-sm transition-all flex items-center gap-2"
          >
            <ScanLine className="w-4 h-4" />
            <span>Scan receipt</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record Transaction</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {scannerOpen && (
        <Suspense fallback={<div role="status" className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 text-white">Loading document scanner…</div>}>
          <ReceiptScanner onClose={() => setScannerOpen(false)} onAddDrafts={handleAddScannedDrafts} />
        </Suspense>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-surface p-4 rounded-2xl border border-white/10 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by title or note..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-brand-primary"
          >
            <option value="" className="bg-[#191820]">All Types</option>
            <option value="income" className="bg-[#191820]">Income Only</option>
            <option value="expense" className="bg-[#191820]">Expense Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-brand-primary"
          >
            <option value="" className="bg-[#191820]">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id} className="bg-[#191820]">
                {c.name} ({c.type})
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-brand-primary"
          >
            <option value="date-desc" className="bg-[#191820]">Date (Newest first)</option>
            <option value="date-asc" className="bg-[#191820]">Date (Oldest first)</option>
            <option value="amount-desc" className="bg-[#191820]">Amount (High to Low)</option>
            <option value="amount-asc" className="bg-[#191820]">Amount (Low to High)</option>
          </select>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <p className="text-sm font-medium">No transactions matched your criteria.</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or click "Record Transaction" above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-5">Details</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Payment Method</th>
                  <th className="py-3 px-5">Date</th>
                  <th className="py-3 px-5 text-right">Amount</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-200">{tx.title}</div>
                      {tx.note && <div className="text-[11px] text-slate-400 line-clamp-1">{tx.note}</div>}
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 font-medium">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tx.category?.color || '#8B5CF6' }}
                        />
                        <span>{tx.category?.name || 'Uncategorized'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-slate-400">
                      {tx.paymentMethod ? tx.paymentMethod.name : '—'}
                    </td>

                    <td className="py-3.5 px-5 text-slate-400 font-medium">
                      {formatDate(tx.date)}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <span
                        className={`font-bold text-sm ${
                          tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatINR(tx.amount)}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-secondary hover:bg-white/5 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-white/10 p-4 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadData(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-white/10 disabled:opacity-40 hover:bg-white/5"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadData(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-white/10 disabled:opacity-40 hover:bg-white/5"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg glass-surface p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingTx ? 'Edit Transaction' : 'Record New Transaction'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{modalError}</span>
              </div>
            )}


            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'expense',
                      category: categories.find((c) => c.type === 'expense')?._id || '',
                    });
                  }}
                  className={`py-2 rounded-lg font-bold text-center transition-all ${
                    formData.type === 'expense'
                      ? 'bg-pink-600/30 border border-pink-500 text-pink-300'
                      : 'text-slate-400'
                  }`}
                >
                  Expense Outflow
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      ...formData,
                      type: 'income',
                      category: categories.find((c) => c.type === 'income')?._id || '',
                    });
                  }}
                  className={`py-2 rounded-lg font-bold text-center transition-all ${
                    formData.type === 'income'
                      ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300'
                      : 'text-slate-400'
                  }`}
                >
                  Income Inflow
                </button>
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Title / Merchant</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swiggy food delivery"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Amount (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 450.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary font-semibold"
                  />
                </div>
              </div>

              {/* Category & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="" disabled className="bg-[#191820]">
                      Select category
                    </option>
                    {filteredCategories.map((c) => (
                      <option key={c._id} value={c._id} className="bg-[#191820]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="" className="bg-[#191820]">
                      None / Not Specified
                    </option>
                    {paymentMethods.map((pm) => (
                      <option key={pm._id} value={pm._id} className="bg-[#191820]">
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="Short description..."
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-300 hover:bg-white/5 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
                >
                  {modalLoading ? 'Saving...' : editingTx ? 'Update Record' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
