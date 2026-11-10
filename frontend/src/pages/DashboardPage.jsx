import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';
import { formatINR, formatDate, toRupees } from '../utils/formatters';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const CHART_COLORS = ['#8B5CF6', '#F09AB5', '#22C55E', '#60A5FA', '#FBBF24', '#A78BFA', '#EC4899'];

export const DashboardPage = () => {
  const { isDark } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('month'); // week, month, year

  const fetchDashboard = async (selectedPeriod = period) => {
    try {
      setLoading(true);
      const res = await apiRequest(`/analytics/dashboard?period=${selectedPeriod}`);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(period);
  }, [period]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const metrics = data?.metrics || {
    totalIncome: 0,
    totalExpenses: 0,
    netCashFlow: 0,
    savingsRate: 0,
  };
  const periodLabel = { week: 'this week', month: 'this month', year: 'this year' }[period] || `this ${period}`;
  const incomeShortfall = Math.max(0, metrics.totalExpenses - metrics.totalIncome);

  return (
    <AppLayout title="Financial Dashboard">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Overview & Cash Flow</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-tenant ledger with period metrics
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center p-1 rounded-xl glass-surface border border-white/10 text-xs font-semibold">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-3.5 py-1.5 rounded-lg capitalize transition-all ${
                period === p
                  ? 'bg-brand-primary text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              This {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Net Cash Flow */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-brand-primary/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Net Cash Flow ({period})
                </span>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    metrics.netCashFlow >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-white mb-1">
                {formatINR(metrics.netCashFlow, true)}
              </div>
              <p className="text-[11px] text-slate-400">Total period income minus expenses</p>
            </div>

            {/* Total Income */}
            <Link to="/transactions?type=income&action=add" aria-label="Add an income transaction" className="block p-6 rounded-2xl glass-card border border-white/10 hover:border-emerald-500/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Income
                </span>
                <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center" aria-hidden="true">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center" aria-hidden="true"><Plus className="w-4 h-4" /></span>
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-emerald-400 mb-1">
                {formatINR(metrics.totalIncome)}
              </div>
              <p className="text-[11px] text-slate-400">View or add income transactions</p>
            </Link>

            {/* Total Expenses */}
            <Link to="/transactions?type=expense&action=add" aria-label="Add an expense transaction" className="block p-6 rounded-2xl glass-card border border-white/10 hover:border-brand-rose/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-rose">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total Expenses
                </span>
                <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-pink-500/20 text-brand-rose flex items-center justify-center" aria-hidden="true">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
                <span className="w-8 h-8 rounded-lg bg-pink-500/15 text-brand-rose flex items-center justify-center" aria-hidden="true"><Plus className="w-4 h-4" /></span>
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-brand-rose mb-1">
                {formatINR(metrics.totalExpenses)}
              </div>
              <p className="text-[11px] text-slate-400">View or add expense transactions</p>
            </Link>

            {/* Savings Rate */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Savings Rate
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-brand-secondary flex items-center justify-center">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <div className={`text-2xl font-black tracking-tight mb-1 ${
                metrics.totalIncome > 0 && metrics.netCashFlow < 0
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-white'
              }`}>
                {metrics.totalIncome > 0 ? `${Number(metrics.savingsRate || 0).toFixed(2)}%` : '—'}
              </div>
              {metrics.totalIncome <= 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No income recorded {periodLabel}</p>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    {metrics.totalExpenses > 0
                      ? `${formatINR(metrics.totalExpenses)} in expenses recorded. Add income to calculate your savings rate.`
                      : 'Add income to calculate your savings rate.'}
                  </p>
                </div>
              ) : metrics.netCashFlow < 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-red-600 dark:text-red-400">Spending exceeds income</p>
                  <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                    You spent {formatINR(incomeShortfall)} more than your recorded income {periodLabel}.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 dark:text-slate-400">Net savings ÷ income for {periodLabel}</p>
              )}
            </div>
          </div>

          {/* Rule-Based Smart Insights Banner */}
          {data?.insights && data.insights.length > 0 && (
            <div className="glass-surface p-6 rounded-2xl border border-brand-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-brand-secondary" />
                <h3 className="text-base font-bold text-white">Smart Spending Insights</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-primary/20 text-brand-secondary border border-brand-primary/30">
                  Rule-Based Analysis
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-200">{insight.title}</span>
                        {insight.type === 'positive' && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-semibold">
                            {insight.metric}
                          </span>
                        )}
                        {insight.type === 'warning' && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold">
                            {insight.metric}
                          </span>
                        )}
                        {insight.type === 'danger' && (
                          <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded font-semibold">
                            {insight.metric}
                          </span>
                        )}
                        {insight.type === 'info' && (
                          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded font-semibold">
                            {insight.metric}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Category Expense Breakdown (Donut Chart) */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 lg:col-span-1 flex flex-col">
              <h3 className="text-sm font-bold text-white mb-1">Expense Breakdown</h3>
              <p className="text-xs text-slate-400 mb-4">Spending by category for {period}</p>

              {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="w-full h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.categoryBreakdown.map((c) => ({
                            name: c.name,
                            value: toRupees(c.total),
                            color: c.color,
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.categoryBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const entry = payload[0].payload;
                            return (
                              <div className={`rounded-lg border px-3 py-2 text-xs shadow-lg ${
                                isDark
                                  ? 'border-white/10 bg-[#191820] text-white'
                                  : 'border-slate-300 bg-white text-slate-900'
                              }`}>
                                <p className="font-semibold">{entry.name}</p>
                                <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                                  Spent: ₹{Number(entry.value).toLocaleString('en-IN')}
                                </p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full space-y-2 mt-4 max-h-40 overflow-y-auto pr-1">
                    {data.categoryBreakdown.map((item, idx) => (
                      <div key={item.categoryId} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: item.color || CHART_COLORS[idx % CHART_COLORS.length],
                            }}
                          />
                          <span className="truncate text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-semibold text-slate-100">{formatINR(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
                  No expense records in this timeframe.
                </div>
              )}
            </div>

            {/* Recent Activity List */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 lg:col-span-2 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Recent Transactions</h3>
                  <p className="text-xs text-slate-400">Latest recorded financial events</p>
                </div>
                <Link
                  to="/transactions"
                  className="text-xs font-semibold text-brand-secondary hover:text-white flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data?.recentTransactions && data.recentTransactions.length > 0 ? (
                <div className="divide-y divide-white/5 overflow-y-auto flex-1">
                  {data.recentTransactions.map((tx) => (
                    <div key={tx._id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-brand-rose/20 text-brand-rose'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">{tx.title}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{tx.category?.name || 'Uncategorized'}</span>
                            <span>•</span>
                            <span>{formatDate(tx.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`text-sm font-bold ${
                            tx.type === 'income' ? 'text-emerald-400' : 'text-slate-100'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}
                          {formatINR(tx.amount)}
                        </span>
                        {tx.paymentMethod && (
                          <p className="text-[10px] text-slate-400">{tx.paymentMethod.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-xs">
                  <p>No transactions recorded yet.</p>
                  <Link
                    to="/transactions"
                    className="mt-3 px-4 py-2 rounded-xl bg-brand-primary text-white font-medium hover:bg-purple-600"
                  >
                    Add First Transaction
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Budgets & Savings Goals Progress Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Budgets */}
            <div className="p-6 rounded-2xl glass-card border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Active Monthly Budgets</h3>
                <Link to="/budgets" className="text-xs text-brand-secondary hover:text-white">
                  Manage
                </Link>
              </div>

              {data?.activeBudgets && data.activeBudgets.length > 0 ? (
                <div className="space-y-4">
                  {data.activeBudgets.map((b) => (
                    <div key={b._id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">
                          {b.category ? b.category.name : 'Overall Limit'}
                        </span>
                        <span className="text-slate-400">{formatINR(b.spent)} / {formatINR(b.amount)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${b.isExceeded ? 'bg-red-500' : 'bg-brand-primary'}`}
                          style={{ width: `${Math.min(100, Math.max(0, b.percentageUsed || 0))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No budgets established for this month.</p>
              )}
            </div>

            {/* Savings Goals */}
            <div className="p-6 rounded-2xl glass-card border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Savings Targets</h3>
                <Link to="/goals" className="text-xs text-brand-secondary hover:text-white">
                  Manage
                </Link>
              </div>

              {data?.savingsGoals && data.savingsGoals.length > 0 ? (
                <div className="space-y-4">
                  {data.savingsGoals.map((g) => (
                    <div key={g._id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">{g.name}</span>
                        <span className="text-emerald-400 font-bold">{Number(g.percentage || 0).toFixed(2)}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.min(100, Math.max(0, Number(g.percentage) || 0))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 py-4">No savings goals created yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
