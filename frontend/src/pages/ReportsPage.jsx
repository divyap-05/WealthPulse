import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { AppLayout } from '../components/layout/AppLayout';
import { apiRequest } from '../services/api';
import { formatINR, toRupees } from '../utils/formatters';

const PIE_COLORS = ['#8B5CF6', '#F09AB5', '#22C55E', '#60A5FA', '#FBBF24', '#A78BFA', '#EC4899', '#14B8A6'];

export const ReportsPage = () => {
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await apiRequest(`/analytics/reports?year=${year}`);
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate financial reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [year]);

  return (
    <AppLayout title="Reports & Financial Analytics">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Performance Analytics</h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical comparisons, cash flow distributions, and payment methods
          </p>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 glass-surface p-1.5 rounded-xl border border-white/10 text-xs">
          <span className="text-slate-400 font-medium pl-2">Year:</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10))}
            className="bg-transparent text-white font-bold focus:outline-none pr-2"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y} className="bg-[#191820]">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-red-500/10 text-red-400 text-sm border border-red-500/30">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main 12-Month Inflow vs Outflow Bar Chart */}
          <div className="p-6 rounded-2xl glass-card border border-white/10">
            <h3 className="text-base font-bold text-white mb-1">Monthly Inflow vs Outflow ({year})</h3>
            <p className="text-xs text-slate-400 mb-6">Comparative income and expenditure over the calendar year</p>

            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.monthlyData?.map((m) => ({
                    month: m.month,
                    Income: toRupees(m.income),
                    Expense: toRupees(m.expense),
                    Savings: toRupees(m.savings),
                  }))}
                >
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                  <YAxis
                    stroke="#94A3B8"
                    fontSize={11}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                  />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`]}
                    contentStyle={{
                      background: '#191820',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Income" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#F09AB5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Secondary Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Annual Category Breakdown */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col">
              <h3 className="text-base font-bold text-white mb-1">Annual Spending by Category</h3>
              <p className="text-xs text-slate-400 mb-4">Cumulative expense distribution across {year}</p>

              {data?.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
                <div className="flex-1 flex flex-col items-center">
                  <div className="w-full h-60">
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
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.categoryBreakdown.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Spent']}
                          contentStyle={{
                            background: '#191820',
                            borderColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-2 mt-4 max-h-36 overflow-y-auto pr-1">
                    {data.categoryBreakdown.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-white/5">
                        <span className="truncate text-slate-300 mr-2">{item.name}</span>
                        <span className="font-bold text-slate-100 flex-shrink-0">{formatINR(item.total)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
                  No annual expense records for this year.
                </div>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className="p-6 rounded-2xl glass-card border border-white/10 flex flex-col">
              <h3 className="text-base font-bold text-white mb-1">Expenses by Payment Method</h3>
              <p className="text-xs text-slate-400 mb-4">Volume disbursed through UPI, Cards, and Cash</p>

              {data?.paymentMethods && data.paymentMethods.length > 0 ? (
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  {data.paymentMethods.map((pm, idx) => (
                    <div key={pm.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-300">{pm.name}</span>
                        <span className="font-bold text-slate-100">{formatINR(pm.total)}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(
                                (pm.total /
                                  data.paymentMethods.reduce((s, p) => s + p.total, 0)) *
                                  100
                              )
                            )}%`,
                            backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
                  No payment method data recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
