import PaymentMethod from '../models/PaymentMethod.js';
import Transaction from '../models/Transaction.js';

export const getPaymentMethods = async (req, res, next) => {
  try {
    const methods = await PaymentMethod.find({ user: req.user._id }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: methods,
    });
  } catch (error) {
    next(error);
  }
};

export const createPaymentMethod = async (req, res, next) => {
  try {
    const { name, icon } = req.body;

    const existing = await PaymentMethod.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Payment method "${name}" already exists.`,
      });
    }

    const method = await PaymentMethod.create({
      user: req.user._id,
      name,
      icon: icon || 'CreditCard',
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Payment method created.',
      data: method,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePaymentMethod = async (req, res, next) => {
  try {
    const method = await PaymentMethod.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        message: 'Payment method not found.',
      });
    }

    // Set null on transactions using this method
    await Transaction.updateMany(
      { user: req.user._id, paymentMethod: method._id },
      { $set: { paymentMethod: null } }
    );

    await PaymentMethod.deleteOne({ _id: method._id });

    res.status(200).json({
      success: true,
      message: 'Payment method deleted.',
    });
  } catch (error) {
    next(error);
  }
};
