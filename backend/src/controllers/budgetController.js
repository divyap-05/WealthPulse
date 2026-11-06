import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import { toPaise } from '../utils/currency.js';

export const getBudgets = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const queryMonth = month ? parseInt(month, 10) : now.getMonth() + 1;
    const queryYear = year ? parseInt(year, 10) : now.getFullYear();

    const budgets = await Budget.find({
      user: req.user._id,
      month: queryMonth,
      year: queryYear,
    }).populate('category', 'name icon color');

    // Calculate actual spending for each budget
    const startDate = new Date(queryYear, queryMonth - 1, 1);
    const endDate = new Date(queryYear, queryMonth, 0, 23, 59, 59, 999);

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (b) => {
        const txQuery = {
          user: req.user._id,
          type: 'expense',
          date: { $gte: startDate, $lte: endDate },
        };

        if (b.category) {
          txQuery.category = b.category._id;
        }

        const spending = await Transaction.aggregate([
          { $match: txQuery },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]);

        const spent = spending.length > 0 ? spending[0].total : 0;
        const remaining = b.amount - spent;
        const percentageUsed = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;

        return {
          ...b.toObject(),
          spent,
          remaining,
          percentageUsed,
          isExceeded: spent > b.amount,
          isNearThreshold: percentageUsed >= b.alertThreshold && spent <= b.amount,
        };
      })
    );

    res.status(200).json({
      success: true,
      month: queryMonth,
      year: queryYear,
      data: budgetsWithSpent,
    });
  } catch (error) {
    next(error);
  }
};

export const createBudget = async (req, res, next) => {
  try {
    const { category, amount, month, year, alertThreshold } = req.body;

    const existing = await Budget.findOne({
      user: req.user._id,
      category: category || null,
      month,
      year,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A budget already exists for this category and month/year.',
      });
    }

    const budget = await Budget.create({
      user: req.user._id,
      category: category || null,
      amount: toPaise(amount),
      month,
      year,
      alertThreshold: alertThreshold || 80,
    });

    const populated = await Budget.findById(budget._id).populate('category', 'name icon color');

    res.status(201).json({
      success: true,
      message: 'Budget created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.',
      });
    }

    const { amount, alertThreshold } = req.body;
    if (amount !== undefined) budget.amount = toPaise(amount);
    if (alertThreshold !== undefined) budget.alertThreshold = alertThreshold;

    await budget.save();
    const populated = await Budget.findById(budget._id).populate('category', 'name icon color');

    res.status(200).json({
      success: true,
      message: 'Budget updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudget = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted.',
    });
  } catch (error) {
    next(error);
  }
};
