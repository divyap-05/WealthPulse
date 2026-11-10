import crypto from 'node:crypto';
import User from '../models/User.js';
import Category from '../models/Category.js';
import PaymentMethod from '../models/PaymentMethod.js';
import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import SavingsGoal from '../models/SavingsGoal.js';
import RecurringTransaction from '../models/RecurringTransaction.js';
import { seedUserDefaults } from '../services/userSeedService.js';
import { toPaise } from '../utils/currency.js';
import { generateToken, setAuthCookie } from '../utils/token.js';

export const DEMO_USER_EMAIL = 'demo@expensetracker.local';

let demoSeedInFlight = null;

const initializeDemoUserAndData = async () => {
  let demoUser = await User.findOne({ email: DEMO_USER_EMAIL });

  if (demoUser) {
    if (!demoUser.isDemo) {
      const error = new Error('Demo account setup is unavailable.');
      error.statusCode = 503;
      error.isOperational = true;
      throw error;
    }
    return demoUser;
  } else {
    demoUser = new User({
      name: 'Aarav Sharma (Demo)',
      email: DEMO_USER_EMAIL,
      // Demo users authenticate through the one-click endpoint, not a reusable source credential.
      password: crypto.randomBytes(48).toString('hex'),
      isVerified: true,
      isDemo: true,
      preferences: {
        currency: 'INR',
        theme: 'dark',
      },
    });
    try {
      await demoUser.save();
    } catch (error) {
      // Separate Vercel instances can receive the first demo request at once.
      // If another instance created the unique demo user first, reuse it.
      if (error.code !== 11000) throw error;
      demoUser = await User.findOne({ email: DEMO_USER_EMAIL });
      if (!demoUser) throw error;
      if (!demoUser.isDemo) {
        const unavailable = new Error('Demo account setup is unavailable.');
        unavailable.statusCode = 503;
        unavailable.isOperational = true;
        throw unavailable;
      }
      return demoUser;
    }
  }

  // Seed standard categories & payment methods
  await seedUserDefaults(demoUser._id);

  // Retrieve seeded categories and payment methods
  const [categories, paymentMethods] = await Promise.all([
    Category.find({ user: demoUser._id }),
    PaymentMethod.find({ user: demoUser._id }),
  ]);

  const findCat = (name, type) => categories.find((c) => c.name.toLowerCase().includes(name.toLowerCase()) && c.type === type)?._id;
  const findPm = (name) => paymentMethods.find((p) => p.name.toLowerCase().includes(name.toLowerCase()))?._id;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Create Realistic Demo Transactions
  const demoTransactions = [
    // Income
    {
      user: demoUser._id,
      title: 'Monthly Tech Salary - Inflow',
      amount: toPaise(145000),
      type: 'income',
      category: findCat('Salary', 'income'),
      paymentMethod: findPm('Bank Transfer'),
      date: new Date(currentYear, currentMonth, 1),
      note: 'Base salary credited after taxes and PF',
    },
    {
      user: demoUser._id,
      title: 'UI/UX Design Consulting Project',
      amount: toPaise(28000),
      type: 'income',
      category: findCat('Freelance', 'income'),
      paymentMethod: findPm('UPI'),
      date: new Date(currentYear, currentMonth, 10),
      note: 'Mobile app design deliverables milestone',
    },
    {
      user: demoUser._id,
      title: 'Mutual Fund Dividend',
      amount: toPaise(3500),
      type: 'income',
      category: findCat('Investments', 'income'),
      paymentMethod: findPm('Bank Transfer'),
      date: new Date(currentYear, currentMonth, 15),
      note: 'Nifty 50 Index Fund dividend payout',
    },
    // Expenses
    {
      user: demoUser._id,
      title: 'Apartment Rent & Maintenance',
      amount: toPaise(32000),
      type: 'expense',
      category: findCat('Housing', 'expense'),
      paymentMethod: findPm('Bank Transfer'),
      date: new Date(currentYear, currentMonth, 2),
      note: '2BHK Indiranagar, Bengaluru',
    },
    {
      user: demoUser._id,
      title: 'Nature Basket Organic Groceries',
      amount: toPaise(6450),
      type: 'expense',
      category: findCat('Groceries', 'expense'),
      paymentMethod: findPm('Credit Card'),
      date: new Date(currentYear, currentMonth, 5),
      note: 'Weekly essentials and fresh vegetables',
    },
    {
      user: demoUser._id,
      title: 'Dinner at Burma Burma',
      amount: toPaise(3280),
      type: 'expense',
      category: findCat('Dining', 'expense'),
      paymentMethod: findPm('Credit Card'),
      date: new Date(currentYear, currentMonth, 8),
      note: 'Weekend family celebration dinner',
    },
    {
      user: demoUser._id,
      title: 'Electricity & High-Speed Fiber Internet',
      amount: toPaise(2600),
      type: 'expense',
      category: findCat('Utilities', 'expense'),
      paymentMethod: findPm('UPI'),
      date: new Date(currentYear, currentMonth, 9),
      note: 'BESCOM bill and ACT Fibernet plan',
    },
    {
      user: demoUser._id,
      title: 'Fuel refill (Shell V-Power)',
      amount: toPaise(3800),
      type: 'expense',
      category: findCat('Transportation', 'expense'),
      paymentMethod: findPm('Debit Card'),
      date: new Date(currentYear, currentMonth, 12),
      note: 'Full tank fuel for road trip',
    },
    {
      user: demoUser._id,
      title: 'Annual Gym Membership Renewal',
      amount: toPaise(12000),
      type: 'expense',
      category: findCat('Personal Care', 'expense'),
      paymentMethod: findPm('Credit Card'),
      date: new Date(currentYear, currentMonth, 14),
      note: 'Cult.fit Elite pass 12-month extension',
    },
    {
      user: demoUser._id,
      title: 'Blinkit quick grocery order',
      amount: toPaise(890),
      type: 'expense',
      category: findCat('Groceries', 'expense'),
      paymentMethod: findPm('UPI'),
      date: new Date(currentYear, currentMonth, 18),
      note: 'Snacks, dairy and coffee beans',
    },
  ];

  await Transaction.insertMany(demoTransactions);

  // Demo Budgets
  const demoBudgets = [
    {
      user: demoUser._id,
      category: null, // Overall budget
      amount: toPaise(80000),
      month: currentMonth + 1,
      year: currentYear,
      alertThreshold: 80,
    },
    {
      user: demoUser._id,
      category: findCat('Dining', 'expense'),
      amount: toPaise(10000),
      month: currentMonth + 1,
      year: currentYear,
      alertThreshold: 75,
    },
    {
      user: demoUser._id,
      category: findCat('Groceries', 'expense'),
      amount: toPaise(15000),
      month: currentMonth + 1,
      year: currentYear,
      alertThreshold: 80,
    },
    {
      user: demoUser._id,
      category: findCat('Transportation', 'expense'),
      amount: toPaise(8000),
      month: currentMonth + 1,
      year: currentYear,
      alertThreshold: 85,
    },
  ];

  await Budget.insertMany(demoBudgets);

  // Demo Savings Goals
  const demoGoals = [
    {
      user: demoUser._id,
      name: 'Emergency Fund (6 Months Expenses)',
      targetAmount: toPaise(350000),
      currentAmount: toPaise(240000),
      targetDate: new Date(currentYear, 11, 31),
      color: '#22C55E',
      icon: 'Shield',
      isCompleted: false,
    },
    {
      user: demoUser._id,
      name: 'Japan Autumn Trip Fund',
      targetAmount: toPaise(180000),
      currentAmount: toPaise(115000),
      targetDate: new Date(currentYear, 9, 15),
      color: '#8B5CF6',
      icon: 'Plane',
      isCompleted: false,
    },
    {
      user: demoUser._id,
      name: 'MacBook Pro M-Series Tech Upgrade',
      targetAmount: toPaise(160000),
      currentAmount: toPaise(160000),
      targetDate: new Date(currentYear, currentMonth, 1),
      color: '#06B6D4',
      icon: 'Laptop',
      isCompleted: true,
    },
  ];

  await SavingsGoal.insertMany(demoGoals);

  // Demo Recurring Rule
  await RecurringTransaction.create({
    user: demoUser._id,
    title: 'Netflix Premium & Spotify Family',
    amount: toPaise(849),
    type: 'expense',
    category: findCat('Entertainment', 'expense'),
    paymentMethod: findPm('Credit Card'),
    frequency: 'monthly',
    startDate: new Date(currentYear, currentMonth - 2, 5),
    nextDueDate: new Date(currentYear, currentMonth + 1, 5),
    lastGeneratedDate: new Date(currentYear, currentMonth, 5),
    status: 'active',
    note: 'Digital entertainment subscriptions',
  });

  return demoUser;
};

export const seedDemoUserAndData = async () => {
  // Coalesce concurrent requests handled by the same warm serverless instance
  // so only one of them inserts the initial demo data.
  if (!demoSeedInFlight) {
    demoSeedInFlight = initializeDemoUserAndData().finally(() => {
      demoSeedInFlight = null;
    });
  }

  return demoSeedInFlight;
};

// Express endpoint for 1-click Demo Login
export const enterDemoAccount = async (req, res, next) => {
  try {
    const demoUser = await seedDemoUserAndData();
    const token = generateToken(demoUser._id, demoUser.authTokenVersion || 0);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Logged in as Demo User.',
      user: {
        id: demoUser._id,
        name: demoUser.name,
        email: demoUser.email,
        isVerified: true,
        preferences: demoUser.preferences,
        isDemo: true,
      },
    });
  } catch (error) {
    next(error);
  }
};
