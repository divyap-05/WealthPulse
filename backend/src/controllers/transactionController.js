import Transaction from '../models/Transaction.js';
import Category from '../models/Category.js';
import PaymentMethod from '../models/PaymentMethod.js';
import { toPaise } from '../utils/currency.js';

export const getTransactions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      paymentMethod,
      search,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Strict multi-user ownership check
    const query = { user: req.user._id };

    if (type) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (search && search.trim()) {
      const literalSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: literalSearch, $options: 'i' } },
        { note: { $regex: literalSearch, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('category', 'name type icon color')
        .populate('paymentMethod', 'name icon')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict ownership check
    })
      .populate('category', 'name type icon color')
      .populate('paymentMethod', 'name icon');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const { title, amount, type, category, paymentMethod, date, note } = req.body;

    // Verify category belongs to user
    const cat = await Category.findOne({ _id: category, user: req.user._id });
    if (!cat) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category for this user.',
      });
    }

    // Verify payment method if provided
    if (paymentMethod) {
      const pm = await PaymentMethod.findOne({ _id: paymentMethod, user: req.user._id });
      if (!pm) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payment method for this user.',
        });
      }
    }

    const amountInPaise = toPaise(amount);

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      amount: amountInPaise,
      type,
      category,
      paymentMethod: paymentMethod || null,
      date: date ? new Date(date) : new Date(),
      note: note || '',
    });

    const populated = await Transaction.findById(transaction._id)
      .populate('category', 'name type icon color')
      .populate('paymentMethod', 'name icon');

    res.status(201).json({
      success: true,
      message: 'Transaction recorded successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id, // Strict ownership check
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    const { title, amount, type, category, paymentMethod, date, note } = req.body;

    if (category) {
      const cat = await Category.findOne({ _id: category, user: req.user._id });
      if (!cat) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category for this user.',
        });
      }
      transaction.category = category;
    }

    if (paymentMethod !== undefined) {
      if (paymentMethod) {
        const pm = await PaymentMethod.findOne({ _id: paymentMethod, user: req.user._id });
        if (!pm) {
          return res.status(400).json({
            success: false,
            message: 'Invalid payment method for this user.',
          });
        }
        transaction.paymentMethod = paymentMethod;
      } else {
        transaction.paymentMethod = null;
      }
    }

    if (title) transaction.title = title;
    if (amount !== undefined) transaction.amount = toPaise(amount);
    if (type) transaction.type = type;
    if (date) transaction.date = new Date(date);
    if (note !== undefined) transaction.note = note;

    await transaction.save();

    const populated = await Transaction.findById(transaction._id)
      .populate('category', 'name type icon color')
      .populate('paymentMethod', 'name icon');

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully.',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id, // Strict ownership check
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
