import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import { generateSmartInsights } from '../services/insightsService.js';
import { processRecurringTransactions } from '../services/recurringService.js';

export const getDashboardSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Trigger recurring engine
    await processRecurringTransactions(userId);

    const { period = 'month', startDate: qStart, endDate: qEnd } = req.query;
    const now = new Date();

    let startDate;
    let endDate;

    if (qStart && qEnd) {
      startDate = new Date(qStart);
      endDate = new Date(qEnd);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      // Default: current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // Aggregations for income and expenses
    const [incomeTotalRes, expenseTotalRes, categoryBreakdown, recentTransactions, activeBudgets, savingsGoals, insights] =
      await Promise.all([
        Transaction.aggregate([
          { $match: { user: userId, type: 'income', date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { user: userId, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        Transaction.aggregate([
          { $match: { user: userId, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
          { $group: { _id: '$category', total: { $sum: '$amount' } } },
          { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
          { $unwind: '$category' },
          { $sort: { total: -1 } },
        ]),
        Transaction.find({ user: userId })
          .populate('category', 'name type icon color')
          .populate('paymentMethod', 'name icon')
          .sort({ date: -1 })
          .limit(6)
          .lean(),
        Budget.find({
          user: userId,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        }).populate('category', 'name icon color'),
        SavingsGoal.find({ user: userId }).limit(4).lean(),
        generateSmartInsights(userId),
      ]);

    const totalIncome = incomeTotalRes.length > 0 ? incomeTotalRes[0].total : 0;
    const totalExpenses = expenseTotalRes.length > 0 ? expenseTotalRes[0].total : 0;
    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netCashFlow / totalIncome) * 100)) : 0;

    // Monthly spending trend over last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const monthlyTrends = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        metrics: {
          totalIncome,
          totalExpenses,
          netCashFlow, // Net cash flow for selected period
          savingsRate,
        },
        categoryBreakdown: categoryBreakdown.map((c) => ({
          categoryId: c._id,
          name: c.category.name,
          color: c.category.color,
          icon: c.category.icon,
          total: c.total,
        })),
        recentTransactions,
        activeBudgets,
        savingsGoals: savingsGoals.map((g) => ({
          ...g,
          percentage: g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0,
        })),
        monthlyTrends,
        insights,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getReportsAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { year = new Date().getFullYear() } = req.query;
    const targetYear = parseInt(year, 10);

    const yearStart = new Date(targetYear, 0, 1);
    const yearEnd = new Date(targetYear, 11, 31, 23, 59, 59, 999);

    // Monthly income vs expense for target year
    const monthlyAgg = await Transaction.aggregate([
      { $match: { user: userId, date: { $gte: yearStart, $lte: yearEnd } } },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Payment method breakdown
    const paymentMethodAgg = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } },
      { $lookup: { from: 'paymentmethods', localField: '_id', foreignField: '_id', as: 'pm' } },
      { $unwind: { path: '$pm', preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } },
    ]);

    // Spending by category for whole year
    const categoryYearAgg = await Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: yearStart, $lte: yearEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: '$category' },
      { $sort: { total: -1 } },
    ]);

    // Format monthly data for 12 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map((m, idx) => {
      const monthNum = idx + 1;
      const inc = monthlyAgg.find((item) => item._id.month === monthNum && item._id.type === 'income');
      const exp = monthlyAgg.find((item) => item._id.month === monthNum && item._id.type === 'expense');
      return {
        month: m,
        income: inc ? inc.total : 0,
        expense: exp ? exp.total : 0,
        savings: (inc ? inc.total : 0) - (exp ? exp.total : 0),
      };
    });

    res.status(200).json({
      success: true,
      year: targetYear,
      data: {
        monthlyData,
        paymentMethods: paymentMethodAgg.map((p) => ({
          name: p.pm ? p.pm.name : 'Unspecified',
          total: p.total,
        })),
        categoryBreakdown: categoryYearAgg.map((c) => ({
          name: c.category.name,
          color: c.category.color,
          total: c.total,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
