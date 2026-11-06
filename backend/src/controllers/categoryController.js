import Category from '../models/Category.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';

export const getCategories = async (req, res, next) => {
  try {
    const { type } = req.query;
    const query = { user: req.user._id };
    if (type) query.type = type;

    const categories = await Category.find(query).sort({ type: 1, name: 1 });
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    const existing = await Category.findOne({
      user: req.user._id,
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      type,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Category "${name}" already exists for ${type}.`,
      });
    }

    const category = await Category.create({
      user: req.user._id,
      name,
      type,
      icon: icon || 'Tag',
      color: color || '#8B5CF6',
      isDefault: false,
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const { name, icon, color } = req.body;
    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    // Safety rule: Prevent deletion if still referenced by transactions
    const txCount = await Transaction.countDocuments({
      user: req.user._id,
      category: category._id,
    });

    if (txCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is referenced by ${txCount} transaction(s). Please reassign them first.`,
      });
    }

    // Also check if tied to any budget
    await Budget.deleteMany({ user: req.user._id, category: category._id });

    await Category.deleteOne({ _id: category._id });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
