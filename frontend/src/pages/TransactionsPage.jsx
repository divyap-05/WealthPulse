import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';
import { formatINR, formatDate, toRupees } from '../utils/formatters';

export const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
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

  const handleOpenAddModal = () => {
    setEditingTx(null);
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: categories.find((c) => c.type === 'expense')?._id || '',
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

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <AppLayout title="Transactions">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Ledger Records</h2>
          <p className="text-xs text-slate-400 mt-1">Manage personal income inflows and expense disbursements</p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Record Transaction</span>
        </button>
      </div>

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
