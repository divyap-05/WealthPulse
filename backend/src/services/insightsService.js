import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import { toRupees } from '../utils/currency.js';

export const generateSmartInsights = async (userId) => {
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // 1. Current month vs prev month spending
  const [currExpenses, prevExpenses, currIncome] = await Promise.all([
    Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
    ]),
    Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'expense',
          date: { $gte: prevMonthStart, $lte: prevMonthEnd },
        },
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
        },
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'categoryInfo',
        },
      },
      { $unwind: '$categoryInfo' },
    ]),
    Transaction.aggregate([
      {
        $match: {
          user: userId,
          type: 'income',
          date: { $gte: currentMonthStart, $lte: currentMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  const insights = [];

  const totalCurrentExpense = currExpenses.reduce((sum, item) => sum + item.total, 0);
  const totalPrevExpense = prevExpenses.reduce((sum, item) => sum + item.total, 0);
  const totalCurrentIncome = currIncome.length > 0 ? currIncome[0].total : 0;

  // Insight 1: Savings rate & Cash Flow semantics
  if (totalCurrentIncome > 0) {
    const netSavings = totalCurrentIncome - totalCurrentExpense;
    const savingsRate = Math.round((netSavings / totalCurrentIncome) * 100);

    if (netSavings === 0) {
      insights.push({
        id: 'cashflow-breakeven',
        type: 'info',
        title: 'Break-Even Cash Flow',
        message: `Your total income and expenses are currently balanced at ₹${toRupees(totalCurrentIncome).toLocaleString('en-IN')}. There is no deficit or surplus this period.`,
        metric: '0% Net Savings',
      });
    } else if (netSavings > 0) {
      if (savingsRate >= 20) {
        insights.push({
          id: 'savings-rate-healthy',
          type: 'positive',
          title: 'Strong Savings Rate',
          message: `You are currently saving ${savingsRate}% of your income this month. Financial advisors commonly recommend aiming for at least 20%.`,
          metric: `${savingsRate}% saved`,
        });
      } else {
        insights.push({
          id: 'savings-rate-moderate',
          type: 'info',
          title: 'Moderate Savings Rate',
          message: `Your current savings rate is ${savingsRate}%. Maintaining tight control over non-essential expenses could help reach a 20% target.`,
          metric: `${savingsRate}% saved`,
        });
      }
    } else {
      // Net deficit (expenses > income)
      const excessAmount = Math.abs(netSavings);
      insights.push({
        id: 'savings-rate-negative',
        type: 'warning',
        title: 'Spending Exceeds Income',
        message: `Expenses this month exceed income by ₹${toRupees(excessAmount).toLocaleString('en-IN')}. Consider reviewing discretionary purchases.`,
        metric: `-₹${toRupees(excessAmount).toLocaleString('en-IN')}`,
      });
    }
  }

  // Insight 2: Top spending category
  if (currExpenses.length > 0 && totalCurrentExpense > 0) {
    const sortedCategories = [...currExpenses].sort((a, b) => b.total - a.total);
    const topCat = sortedCategories[0];
    const percentageOfTotal = Math.round((topCat.total / totalCurrentExpense) * 100);

    insights.push({
      id: 'top-spending-category',
      type: 'info',
      title: `Top Expense: ${topCat.categoryInfo.name}`,
      message: `${topCat.categoryInfo.name} accounts for ${percentageOfTotal}% (₹${toRupees(topCat.total).toLocaleString('en-IN')}) of your total monthly spending so far.`,
      metric: `${percentageOfTotal}% of expenses`,
    });

    // Check if category increased significantly compared to last month
    const prevMatch = prevExpenses.find((p) => String(p._id) === String(topCat._id));
    if (prevMatch && prevMatch.total > 0) {
      const diff = topCat.total - prevMatch.total;
      const pctChange = Math.round((diff / prevMatch.total) * 100);
      if (pctChange >= 25) {
        insights.push({
          id: 'category-increase',
          type: 'warning',
          title: `Spending Surge in ${topCat.categoryInfo.name}`,
          message: `Spending in ${topCat.categoryInfo.name} is ${pctChange}% higher than at this stage last month.`,
          metric: `+${pctChange}% change`,
        });
      }
    }
  }

  // Insight 3: Budgets near or over threshold
  const activeBudgets = await Budget.find({
    user: userId,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  }).populate('category', 'name');

  for (const b of activeBudgets) {
    const catName = b.category ? b.category.name : 'Overall Monthly Budget';
    let spent = 0;

    if (b.category) {
      const found = currExpenses.find((c) => String(c._id) === String(b.category._id));
      if (found) spent = found.total;
    } else {
      spent = totalCurrentExpense;
    }

    if (b.amount > 0) {
      const rawPct = Math.round((spent / b.amount) * 100);
      const excessAmount = spent - b.amount;

      if (spent > b.amount) {
        insights.push({
          id: `budget-exceeded-${b._id}`,
          type: 'danger',
          title: `Budget Exceeded: ${catName}`,
          message: `Spending (₹${toRupees(spent).toLocaleString('en-IN')}) has exceeded your ₹${toRupees(b.amount).toLocaleString('en-IN')} limit by ₹${toRupees(excessAmount).toLocaleString('en-IN')} (${rawPct}% of budgeted allocation).`,
          metric: `Over by ₹${toRupees(excessAmount).toLocaleString('en-IN')}`,
        });
      } else if (rawPct >= b.alertThreshold) {
        insights.push({
          id: `budget-warning-${b._id}`,
          type: 'warning',
          title: `Approaching Budget Limit: ${catName}`,
          message: `You have consumed ${rawPct}% of your ₹${toRupees(b.amount).toLocaleString('en-IN')} budget for ${catName}.`,
          metric: `${rawPct}% used`,
        });
      }
    }
  }

  // Insight 4: Upcoming recurring payments
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const dueSoon = await RecurringTransaction.find({
    user: userId,
    status: 'active',
    type: 'expense',
    nextDueDate: { $gte: now, $lte: nextWeek },
  }).populate('category', 'name');

  if (dueSoon.length > 0) {
    const dueTotal = dueSoon.reduce((s, r) => s + r.amount, 0);
    insights.push({
      id: 'recurring-due-soon',
      type: 'info',
      title: `${dueSoon.length} Recurring Bill${dueSoon.length > 1 ? 's' : ''} Due in 7 Days`,
      message: `Upcoming subscriptions & bills total ₹${toRupees(dueTotal).toLocaleString('en-IN')} this coming week.`,
      metric: `₹${toRupees(dueTotal).toLocaleString('en-IN')}`,
    });
  }

  return insights;
};
