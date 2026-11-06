import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertTriangle, CheckCircle, PieChart as PieIcon, X } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';
import { formatINR, toRupees } from '../utils/formatters';

export const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    category: '', // empty string for overall monthly budget
    amount: '',
    alertThreshold: 80,
  });

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const [bRes, catRes] = await Promise.all([
        apiRequest(`/budgets?month=${selectedMonth}&year=${selectedYear}`),
        categories.length === 0 ? apiRequest('/categories?type=expense') : Promise.resolve(null),
      ]);
      setBudgets(bRes.data || []);
      if (catRes) setCategories(catRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load budgets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [selectedMonth, selectedYear]);

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setFormData({
      category: '',
      amount: '',
      alertThreshold: 80,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category?._id || '',
      amount: toRupees(budget.amount),
      alertThreshold: budget.alertThreshold || 80,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setModalError('Please specify a valid budget amount.');
      return;
    }

    setModalLoading(true);
    try {
      if (editingBudget) {
        await apiRequest(`/budgets/${editingBudget._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            amount: parseFloat(formData.amount),
            alertThreshold: parseInt(formData.alertThreshold, 10),
          }),
        });
      } else {
        await apiRequest('/budgets', {
          method: 'POST',
          body: JSON.stringify({
            category: formData.category || null,
            amount: parseFloat(formData.amount),
            month: selectedMonth,
            year: selectedYear,
            alertThreshold: parseInt(formData.alertThreshold, 10),
          }),
        });
      }
      setIsModalOpen(false);
      loadBudgets();
    } catch (err) {
      setModalError(err.message || 'Failed to save budget.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await apiRequest(`/budgets/${id}`, { method: 'DELETE' });
      loadBudgets();
    } catch (err) {
      alert(err.message || 'Failed to delete budget.');
    }
  };

  return (
    <AppLayout title="Budgets & Spending Limits">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Monthly Budgets</h2>
          <p className="text-xs text-slate-400 mt-1">
            Establish disciplined ceilings for categories or overall monthly expenditures
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month / Year Filter */}
          <div className="flex items-center gap-2 glass-surface p-1.5 rounded-xl border border-white/10 text-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-semibold focus:outline-none"
            >
              {[
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December',
              ].map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-[#191820]">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-transparent text-white font-semibold focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-[#191820]">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/30">
          {error}
        </div>
      ) : budgets.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-2xl border border-white/10 p-8">
          <PieIcon className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No Budgets Set For This Period</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Setting budget targets helps automate warning alerts when your spending nears defined thresholds.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-xs hover:bg-purple-600"
          >
            Create Your First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const isExceeded = b.isExceeded;
            const isNear = b.isNearThreshold;

            return (
              <div
                key={b._id}
                className="p-6 rounded-2xl glass-card border border-white/10 relative overflow-hidden flex flex-col justify-between hover:border-brand-primary/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {b.category ? b.category.name : 'Overall Monthly Budget'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(b)}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="p-1 rounded text-slate-400 hover:text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-2xl font-black text-white">{formatINR(b.spent)}</span>
                    <span className="text-xs text-slate-400">of {formatINR(b.amount)} limit</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-3">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isExceeded
                          ? 'bg-red-500'
                          : isNear
                          ? 'bg-amber-400'
                          : 'bg-brand-primary'
                      }`}
                      style={{ width: `${Math.min(100, b.percentageUsed)}%` }}
                    />
                  </div>

                  {/* Warning Badges */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{b.percentageUsed}% used</span>
                    {isExceeded ? (
                      <span className="inline-flex items-center gap-1 text-red-400 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Over Limit</span>
                      </span>
                    ) : isNear ? (
                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Near Limit ({b.alertThreshold}%)</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-semibold text-[11px]">
                        {formatINR(b.remaining)} remaining
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md glass-surface p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingBudget ? 'Edit Budget' : 'Establish New Budget'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {!editingBudget && (
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Scope / Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="" className="bg-[#191820]">
                      Overall Monthly Budget (All Expenses)
                    </option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id} className="bg-[#191820]">
                        Category: {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1.5">Limit Amount (₹ INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 25000.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="uppercase font-bold text-slate-400">Warning Alert Threshold</label>
                  <span className="font-bold text-brand-secondary">{formData.alertThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={formData.alertThreshold}
                  onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                  className="w-full accent-purple-500 cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  You will receive alert notices once spending surpasses this percentage.
                </p>
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
                  {modalLoading ? 'Saving...' : editingBudget ? 'Update Budget' : 'Save Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
