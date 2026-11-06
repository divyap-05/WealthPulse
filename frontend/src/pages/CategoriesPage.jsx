import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Tags, CreditCard, X, AlertCircle } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';

const PALETTE = ['#8B5CF6', '#F09AB5', '#22C55E', '#60A5FA', '#FBBF24', '#EC4899', '#14B8A6', '#F97316'];

export const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catFormData, setCatFormData] = useState({ name: '', type: 'expense', color: '#8B5CF6' });

  // Payment Method Modal
  const [pmModalOpen, setPmModalOpen] = useState(false);
  const [pmFormData, setPmFormData] = useState({ name: '' });

  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [cRes, pmRes] = await Promise.all([apiRequest('/categories'), apiRequest('/payment-methods')]);
      setCategories(cRes.data || []);
      setPaymentMethods(pmRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleOpenCatModal = (cat = null) => {
    setEditingCategory(cat);
    setCatFormData({
      name: cat ? cat.name : '',
      type: cat ? cat.type : 'expense',
      color: cat ? cat.color : '#8B5CF6',
    });
    setModalError('');
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      if (editingCategory) {
        await apiRequest(`/categories/${editingCategory._id}`, {
          method: 'PUT',
          body: JSON.stringify(catFormData),
        });
      } else {
        await apiRequest('/categories', {
          method: 'POST',
          body: JSON.stringify(catFormData),
        });
      }
      setCatModalOpen(false);
      loadAll();
    } catch (err) {
      setModalError(err.message || 'Failed to save category.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This action cannot be undone.`)) return;
    try {
      await apiRequest(`/categories/${cat._id}`, { method: 'DELETE' });
      loadAll();
    } catch (err) {
      alert(err.message || 'Cannot delete category. Ensure no transactions are assigned to it.');
    }
  };

  const handleSavePaymentMethod = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalLoading(true);

    try {
      await apiRequest('/payment-methods', {
        method: 'POST',
        body: JSON.stringify(pmFormData),
      });
      setPmModalOpen(false);
      loadAll();
    } catch (err) {
      setModalError(err.message || 'Failed to save payment method.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (pm) => {
    if (!window.confirm(`Delete payment method "${pm.name}"?`)) return;
    try {
      await apiRequest(`/payment-methods/${pm._id}`, { method: 'DELETE' });
      loadAll();
    } catch (err) {
      alert(err.message || 'Failed to delete payment method.');
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <AppLayout title="Categories & Payment Methods">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Classification Taxonomies</h2>
          <p className="text-xs text-slate-400 mt-1">
            Personalize your income, expense categories, and payment instruments
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenCatModal()}
            className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold text-xs transition-all shadow-lg shadow-purple-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => {
              setPmFormData({ name: '' });
              setModalError('');
              setPmModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Method</span>
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
      ) : (
        <div className="space-y-8">
          {/* Expense Categories */}
          <div className="p-6 rounded-2xl glass-card border border-white/10">
            <h3 className="text-base font-bold text-white mb-1">Expense Categories</h3>
            <p className="text-xs text-slate-400 mb-5">Classification for outflows and budget limits</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {expenseCategories.map((c) => (
                <div
                  key={c._id}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color || '#8B5CF6' }}
                    />
                    <span className="text-xs font-semibold text-slate-200 truncate">{c.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCatModal(c)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c)}
                      className="p-1 rounded text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Income Categories */}
          <div className="p-6 rounded-2xl glass-card border border-white/10">
            <h3 className="text-base font-bold text-white mb-1">Income Categories</h3>
            <p className="text-xs text-slate-400 mb-5">Classification for earnings, salary, and capital inflows</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {incomeCategories.map((c) => (
                <div
                  key={c._id}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: c.color || '#22C55E' }}
                    />
                    <span className="text-xs font-semibold text-slate-200 truncate">{c.name}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenCatModal(c)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(c)}
                      className="p-1 rounded text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-6 rounded-2xl glass-card border border-white/10">
            <h3 className="text-base font-bold text-white mb-1">Payment Methods</h3>
            <p className="text-xs text-slate-400 mb-5">Instruments used to pay or receive funds</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {paymentMethods.map((pm) => (
                <div
                  key={pm._id}
                  className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between hover:border-white/15 transition-all"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CreditCard className="w-4 h-4 text-brand-secondary flex-shrink-0" />
                    <span className="text-xs font-semibold text-slate-200 truncate">{pm.name}</span>
                  </div>

                  <button
                    onClick={() => handleDeletePaymentMethod(pm)}
                    className="p-1 rounded text-slate-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCatModalOpen(false)} />
          <div className="relative w-full max-w-sm glass-surface p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? 'Edit Category' : 'Create Custom Category'}
              </h3>
              <button onClick={() => setCatModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">{modalError}</div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1.5">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pet Care, Cloud Hosting"
                  value={catFormData.name}
                  onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              {!editingCategory && (
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Category Type</label>
                  <select
                    value={catFormData.type}
                    onChange={(e) => setCatFormData({ ...catFormData, type: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  >
                    <option value="expense" className="bg-[#191820]">Expense</option>
                    <option value="income" className="bg-[#191820]">Income</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1.5">Color Accent</label>
                <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                  {PALETTE.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setCatFormData({ ...catFormData, color })}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        catFormData.color === color ? 'scale-125 ring-2 ring-white' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
                >
                  {modalLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Method Modal */}
      {pmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setPmModalOpen(false)} />
          <div className="relative w-full max-w-sm glass-surface p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Add Custom Payment Method</h3>
              <button onClick={() => setPmModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">{modalError}</div>
            )}

            <form onSubmit={handleSavePaymentMethod} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1.5">Method Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary Account, Forex Card"
                  value={pmFormData.name}
                  onChange={(e) => setPmFormData({ name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPmModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
                >
                  {modalLoading ? 'Saving...' : 'Create Method'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
