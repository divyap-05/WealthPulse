import React, { useState, useEffect } from 'react';
import {
  Plus,
  Target,
  Edit2,
  Trash2,
  CheckCircle2,
  DollarSign,
  Calendar,
  X,
  TrendingUp,
  Minus,
} from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';
import { formatINR, formatDate, toRupees } from '../utils/formatters';

export const SavingsGoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    color: '#22C55E',
  });

  const [contributionData, setContributionData] = useState({
    amount: '',
    action: 'add', // add or withdraw
  });

  const loadGoals = async () => {
    try {
      setLoading(true);
      const res = await apiRequest('/goals');
      setGoals(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load savings targets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const handleOpenAddModal = () => {
    setSelectedGoal(null);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '0',
      targetDate: '',
      color: '#22C55E',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setSelectedGoal(goal);
    setFormData({
      name: goal.name,
      targetAmount: toRupees(goal.targetAmount),
      currentAmount: toRupees(goal.currentAmount),
      targetDate: goal.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
      color: goal.color || '#22C55E',
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenContributeModal = (goal) => {
    setSelectedGoal(goal);
    setContributionData({
      amount: '',
      action: 'add',
    });
    setModalError('');
    setIsContributeModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name || !formData.targetAmount) {
      setModalError('Goal name and target amount are required.');
      return;
    }

    setModalLoading(true);
    try {
      const payload = {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: parseFloat(formData.currentAmount || 0),
        targetDate: formData.targetDate || null,
        color: formData.color,
      };

      if (selectedGoal) {
        await apiRequest(`/goals/${selectedGoal._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/goals', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      loadGoals();
    } catch (err) {
      setModalError(err.message || 'Failed to save savings goal.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleContributionSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!contributionData.amount || parseFloat(contributionData.amount) <= 0) {
      setModalError('Enter a valid contribution amount.');
      return;
    }

    setModalLoading(true);
    try {
      await apiRequest(`/goals/${selectedGoal._id}/contribute`, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(contributionData.amount),
          action: contributionData.action,
        }),
      });

      setIsContributeModalOpen(false);
      loadGoals();
    } catch (err) {
      setModalError(err.message || 'Contribution failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      await apiRequest(`/goals/${id}`, { method: 'DELETE' });
      loadGoals();
    } catch (err) {
      alert(err.message || 'Failed to delete goal.');
    }
  };

  return (
    <AppLayout title="Savings Goals & Reserves">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Financial Milestones</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track dedicated allocations toward emergency funds, travel, or capital purchases
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Savings Goal</span>
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
      ) : goals.length === 0 ? (
        <div className="py-20 text-center glass-card rounded-2xl border border-white/10 p-8">
          <Target className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-200">No Savings Goals Defined</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Set deliberate savings targets with progress milestones and target dates.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="mt-5 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-semibold text-xs hover:bg-purple-600"
          >
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => (
            <div
              key={g._id}
              className="p-6 rounded-2xl glass-card border border-white/10 relative overflow-hidden flex flex-col justify-between hover:border-brand-primary/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: g.color || '#22C55E' }}
                    />
                    <h3 className="text-sm font-bold text-white truncate max-w-[180px]">{g.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(g)}
                      className="p-1 rounded text-slate-400 hover:text-white"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(g._id)}
                      className="p-1 rounded text-slate-400 hover:text-red-400"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-2xl font-black text-white">{formatINR(g.currentAmount)}</span>
                  <span className="text-xs text-slate-400">of {formatINR(g.targetAmount)}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden mb-3">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${g.percentage}%`,
                      backgroundColor: g.color || '#22C55E',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs mb-4">
                  <span className="font-bold text-slate-200">{g.percentage}% achieved</span>
                  {g.isCompleted ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Goal Reached!</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[11px]">{formatINR(g.remaining)} remaining</span>
                  )}
                </div>

                {g.targetDate && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-4">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Target: {formatDate(g.targetDate)}</span>
                  </div>
                )}
              </div>

              {/* Contribute / Adjust Button */}
              <button
                onClick={() => handleOpenContributeModal(g)}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <TrendingUp className="w-3.5 h-3.5 text-brand-secondary" />
                <span>Record Contribution / Withdrawal</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md glass-surface p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {selectedGoal ? 'Edit Savings Goal' : 'Establish New Goal'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">{modalError}</div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1.5">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Reserve, Goa Vacation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Target Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="100000"
                    value={formData.targetAmount}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary font-semibold"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Initial Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={formData.currentAmount}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Target Date</label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary"
                  />
                </div>
                <div>
                  <label className="block uppercase font-bold text-slate-400 mb-1.5">Theme Accent</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    {['#22C55E', '#8B5CF6', '#3B82F6', '#EC4899', '#F59E0B'].map((color) => (
                      <button
                        type="button"
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          formData.color === color ? 'scale-125 ring-2 ring-white' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
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
                  {modalLoading ? 'Saving...' : selectedGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Contribution / Withdrawal Modal */}
      {isContributeModalOpen && selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsContributeModalOpen(false)} />
          <div className="relative w-full max-w-sm glass-surface p-6 rounded-2xl border border-white/10 shadow-2xl z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Adjust Saved Funds</h3>
                <p className="text-xs text-slate-400 truncate">{selectedGoal.name}</p>
              </div>
              <button onClick={() => setIsContributeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">{modalError}</div>
            )}

            <form onSubmit={handleContributionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setContributionData({ ...contributionData, action: 'add' })}
                  className={`py-2 rounded-lg font-bold text-center transition-all ${
                    contributionData.action === 'add'
                      ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300'
                      : 'text-slate-400'
                  }`}
                >
                  Deposit Funds
                </button>
                <button
                  type="button"
                  onClick={() => setContributionData({ ...contributionData, action: 'withdraw' })}
                  className={`py-2 rounded-lg font-bold text-center transition-all ${
                    contributionData.action === 'withdraw'
                      ? 'bg-red-600/30 border border-red-500 text-red-300'
                      : 'text-slate-400'
                  }`}
                >
                  Withdraw
                </button>
              </div>

              <div>
                <label className="block uppercase font-bold text-slate-400 mb-1.5">Amount (₹ INR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="5000"
                  value={contributionData.amount}
                  onChange={(e) => setContributionData({ ...contributionData, amount: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-brand-primary font-bold text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsContributeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-white/5 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 rounded-xl bg-brand-primary hover:bg-purple-600 text-white font-semibold transition-all shadow-lg shadow-purple-500/20"
                >
                  {modalLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
