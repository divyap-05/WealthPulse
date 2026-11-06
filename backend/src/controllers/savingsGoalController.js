import SavingsGoal from '../models/SavingsGoal.js';
import { toPaise } from '../utils/currency.js';

export const getSavingsGoals = async (req, res, next) => {
  try {
    const goals = await SavingsGoal.find({ user: req.user._id }).sort({ createdAt: -1 });

    const processed = goals.map((g) => {
      const percentage = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);
      return {
        ...g.toObject(),
        percentage,
        remaining,
      };
    });

    res.status(200).json({
      success: true,
      data: processed,
    });
  } catch (error) {
    next(error);
  }
};

export const createSavingsGoal = async (req, res, next) => {
  try {
    const { name, targetAmount, currentAmount = 0, targetDate, color, icon } = req.body;

    const goal = await SavingsGoal.create({
      user: req.user._id,
      name,
      targetAmount: toPaise(targetAmount),
      currentAmount: toPaise(currentAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
      color: color || '#22C55E',
      icon: icon || 'Target',
      isCompleted: toPaise(currentAmount) >= toPaise(targetAmount),
    });

    res.status(201).json({
      success: true,
      message: 'Savings goal created.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.',
      });
    }

    const { name, targetAmount, currentAmount, targetDate, color, icon, isCompleted } = req.body;

    if (name) goal.name = name;
    if (targetAmount !== undefined) goal.targetAmount = toPaise(targetAmount);
    if (currentAmount !== undefined) goal.currentAmount = toPaise(currentAmount);
    if (targetDate !== undefined) goal.targetDate = targetDate ? new Date(targetDate) : null;
    if (color) goal.color = color;
    if (icon) goal.icon = icon;
    if (isCompleted !== undefined) goal.isCompleted = isCompleted;

    // Auto mark completed if current >= target
    if (goal.currentAmount >= goal.targetAmount) {
      goal.isCompleted = true;
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Savings goal updated.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const contributeSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.',
      });
    }

    const { amount, action = 'add' } = req.body;
    const amountInPaise = toPaise(amount);

    if (action === 'withdraw') {
      goal.currentAmount = Math.max(0, goal.currentAmount - amountInPaise);
      goal.isCompleted = false;
    } else {
      goal.currentAmount += amountInPaise;
      if (goal.currentAmount >= goal.targetAmount) {
        goal.isCompleted = true;
      }
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: action === 'withdraw' ? 'Amount withdrawn from goal.' : 'Contribution added to goal.',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSavingsGoal = async (req, res, next) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Savings goal not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Savings goal deleted.',
    });
  } catch (error) {
    next(error);
  }
};
