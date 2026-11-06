import RecurringTransaction from '../models/RecurringTransaction.js';
import Category from '../models/Category.js';
import PaymentMethod from '../models/PaymentMethod.js';
import { toPaise } from '../utils/currency.js';
import { processRecurringTransactions } from '../services/recurringService.js';

export const getRecurringTransactions = async (req, res, next) => {
  try {
    // Proactively generate any pending due recurring items for this user
    await processRecurringTransactions(req.user._id);

    const recurring = await RecurringTransaction.find({ user: req.user._id })
      .populate('category', 'name icon color type')
      .populate('paymentMethod', 'name icon')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: recurring,
    });
  } catch (error) {
    next(error);
  }
};

export const createRecurringTransaction = async (req, res, next) => {
  try {
    const {
      title,
      amount,
      type,
      category,
      paymentMethod,
      frequency,
      startDate = new Date(),
      endDate,
      note,
    } = req.body;

    const cat = await Category.findOne({ _id: category, user: req.user._id });
    if (!cat) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for this user.',
      });
    }

    if (paymentMethod) {
      const pm = await PaymentMethod.findOne({ _id: paymentMethod, user: req.user._id });
      if (!pm) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method for this user.',
        });
      }
    }

    const start = new Date(startDate);

    const recurring = await RecurringTransaction.create({
      user: req.user._id,
      title,
      amount: toPaise(amount),
      type,
      category,
      paymentMethod: paymentMethod || null,
      frequency,
      startDate: start,
      nextDueDate: start, // Next run is starting date
      endDate: endDate ? new Date(endDate) : null,
      note: note || '',
      status: 'active',
    });

    // Run processor in case start date is today
    await processRecurringTransactions(req.user._id);

    const populated = await RecurringTransaction.findById(recurring._id)
      .populate('category', 'name icon color type')
      .populate('paymentMethod', 'name icon');

    res.status(201).json({
      success: true,
      message: 'Recurring rule created successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecurringTransaction = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Recurring rule not found.',
      });
    }

    const {
      title,
      amount,
      type,
      category,
      paymentMethod,
      frequency,
      startDate,
      endDate,
      status,
      note,
    } = req.body;

    if (title) item.title = title;
    if (amount !== undefined) item.amount = toPaise(amount);
    if (type) item.type = type;
    if (category) item.category = category;
    if (paymentMethod !== undefined) item.paymentMethod = paymentMethod || null;
    if (frequency) item.frequency = frequency;
    if (startDate) item.startDate = new Date(startDate);
    if (endDate !== undefined) item.endDate = endDate ? new Date(endDate) : null;
    if (status) item.status = status;
    if (note !== undefined) item.note = note;

    await item.save();

    const populated = await RecurringTransaction.findById(item._id)
      .populate('category', 'name icon color type')
      .populate('paymentMethod', 'name icon');

    res.status(200).json({
      success: true,
      message: 'Recurring rule updated.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecurringTransaction = async (req, res, next) => {
  try {
    const item = await RecurringTransaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Recurring rule not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recurring rule deleted.',
    });
  } catch (error) {
    next(error);
  }
};
