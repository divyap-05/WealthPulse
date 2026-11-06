import React, { useState, useEffect } from 'react';
import {
  Plus,
  Repeat,
  Trash2,
  Edit2,
  Calendar,
  CheckCircle,
  Pause,
  Play,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';
import { formatINR, formatDate, toRupees } from '../utils/formatters';

export const RecurringPage = () => {
  const [recurringList, setRecurringList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    paymentMethod: '',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    note: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, catRes, pmRes] = await Promise.all([
        apiRequest('/recurring'),
        categories.length === 0 ? apiRequest('/categories') : Promise.resolve(null),
        paymentMethods.length === 0 ? apiRequest('/payment-methods') : Promise.resolve(null),
      ]);
      setRecurringList(recRes.data || []);
      if (catRes) setCategories(catRes.data || []);
      if (pmRes) setPaymentMethods(pmRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load recurring subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      amount: '',
      type: 'expense',
      category: categories.find((c) => c.type === 'expense')?._id || '',
      paymentMethod: paymentMethods[0]?._id || '',
      frequency: 'monthly',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      note: '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      amount: toRupees(item.amount),
      type: item.type,
      category: item.category?._id || '',
      paymentMethod: item.paymentMethod?._id || '',
      frequency: item.frequency,
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
      note: item.note || '',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'active' ? 'paused' : 'active';
    try {
      await apiRequest(`/recurring/${item._id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus }),
      });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.title || !formData.amount || !formData.category) {
      setModalError('Title, amount, and category are required.');
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
        frequency: formData.frequency,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        note: formData.note,
      };

      if (editingItem) {
        await apiRequest(`/recurring/${editingItem._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/recurring', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      setModalError(err.message || 'Failed to save recurring item.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this recurring rule? Existing generated transactions will be preserved.'))
      return;
    try {
      await apiRequest(`/recurring/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete rule.');
    }
  };

  const filteredCategories = categories.filter((c) => c.type === formData.type);

  return (
    <AppLayout title="Recurring Commitments">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Automated Rules</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage scheduled salaries, rent, subscriptions, and recurring invoices with duplicate prevention
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Recurring Rule</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/30">
          {error}
        </div>
      ) : recurringList.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-2xl border border-white/10 p-8">
          <Repeat className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No Recurring Rules Defined</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Schedule your monthly SIPs, Netflix, rent, or recurring clients to auto-log transactions without manual entry.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-xs hover:bg-purple-600"
          >
            Create First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recurringList.map((item) => (
            <div
              key={item._id}
              className={`p-6 rounded-2xl glass-card border transition-all flex flex-col justify-between ${
                item.status === 'paused'
                  ? 'border-white/5 opacity-60'
                  : 'border-white/10 hover:border-brand-primary/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-brand-secondary">
                    <Repeat className="w-3 h-3" />
                    <span>{item.frequency}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleStatus(item)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title={item.status === 'active' ? 'Pause' : 'Activate'}
                    >
                      {item.status === 'active' ? (
                        <Pause className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(item)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1 rounded text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-1 truncate">{item.title}</h3>

                <div className="flex items-baseline gap-2 mb-4">
                  <span
                    className={`text-2xl font-black ${
                      item.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {item.type === 'income' ? '+' : '-'}
                    {formatINR(item.amount)}
                  </span>
                  <span className="text-xs text-slate-400 capitalize">/ {item.frequency}</span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-400 border-t border-white/5 pt-3">
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="text-slate-200 font-medium">{item.category?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next Due Date:</span>
                    <span className="text-brand-secondary font-semibold">
                      {formatDate(item.nextDueDate)}
                    </span>
                  </div>
                  {item.lastGeneratedDate && (
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Last Logged:</span>
                      <span>{formatDate(item.lastGeneratedDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px]">
                <span
                  className={`font-semibold capitalize ${
                    item.status === 'active' ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  ● {item.status}
                </span>
                <span className="text-slate-500">{item.paymentMethod?.name || 'Manual Method'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Recurring Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md glass-surface p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingItem ? 'Edit Recurring Rule' : 'New Recurring Commitment'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">{modalError}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
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
                  Recurring Expense
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
                  Recurring Income
                </button>
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1.5">Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Indiranagar Rent, Spotify Subscription"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Amount (₹ INR)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="2500.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary font-bold"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="daily" className="bg-[#191820]">Daily</option>
                    <option value="weekly" className="bg-[#191820]">Weekly</option>
                    <option value="monthly" className="bg-[#191820]">Monthly</option>
                    <option value="yearly" className="bg-[#191820]">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
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
                    <option value="" className="bg-[#191820]">None / Default</option>
                    {paymentMethods.map((pm) => (
                      <option key={pm._id} value={pm._id} className="bg-[#191820]">
                        {pm.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">End Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

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
                  {modalLoading ? 'Saving...' : editingItem ? 'Update Rule' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
