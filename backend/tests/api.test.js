import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import Transaction from '../src/models/Transaction.js';
import Category from '../src/models/Category.js';

describe('Expense Tracker Backend Core Test Suite', () => {
  let mongod;
  let app;
  let user1Cookie;
  let user2Cookie;
  let user1Id;
  let user2Id;
  let user1Category;
  let user2Category;

  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    app = createApp();
  });

  after(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  describe('1. Authentication & Security', () => {
    test('Should register a new user successfully with hashed password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Johnson',
          email: 'alice@example.com',
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.user.email, 'alice@example.com');
      assert.strictEqual(res.body.user.password, undefined); // Never expose password

      user1Id = res.body.user.id;
      // Capture auth cookie
      const cookies = res.headers['set-cookie'];
      assert.ok(cookies);
      user1Cookie = cookies[0];

      // Verify password hashed in database
      const dbUser = await User.findById(user1Id).select('+password');
      assert.notStrictEqual(dbUser.password, 'Password123!');
      assert.ok(dbUser.password.startsWith('$2'));
    });

    test('Should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alice Duplicate',
          email: 'alice@example.com',
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.success, false);
    });

    test('Should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'WrongPassword!',
        });

      assert.strictEqual(res.status, 401);
    });

    test('Should login user and set auth cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alice@example.com',
          password: 'Password123!',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.headers['set-cookie']);
      user1Cookie = res.headers['set-cookie'][0];
    });

    test('Should access /api/auth/me with cookie', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', user1Cookie);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.email, 'alice@example.com');
    });

    test('Changing a password invalidates old sessions and keeps the current session signed in', async () => {
      const previousCookie = user1Cookie;
      const res = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', user1Cookie)
        .send({ currentPassword: 'Password123!', newPassword: 'Password456!' });

      assert.strictEqual(res.status, 200);
      assert.ok(res.headers['set-cookie']);
      user1Cookie = res.headers['set-cookie'][0];

      const oldSession = await request(app).get('/api/auth/me').set('Cookie', previousCookie);
      assert.strictEqual(oldSession.status, 401);

      const currentSession = await request(app).get('/api/auth/me').set('Cookie', user1Cookie);
      assert.strictEqual(currentSession.status, 200);
    });

    test('Should reject unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/transactions');
      assert.strictEqual(res.status, 401);
    });

    test('Password recovery is disabled without email delivery and creates no reset token', async () => {
      const existingAccount = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'alice@example.com' });
      const unknownAccount = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'unknown@example.com' });

      assert.strictEqual(existingAccount.status, 503);
      assert.strictEqual(unknownAccount.status, 503);
      assert.deepStrictEqual(existingAccount.body, unknownAccount.body);
      const user = await User.findOne({ email: 'alice@example.com' }).select('+resetPasswordToken');
      assert.strictEqual(user.resetPasswordToken, undefined);

      const resetAttempt = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'guessed-token', password: 'AttackerPassword!' });
      assert.strictEqual(resetAttempt.status, 503);
    });
  });

  describe('2. Multi-User Data Isolation', () => {
    before(async () => {
      // Register second user
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bob Smith',
          email: 'bob@example.com',
          password: 'PasswordBob456!',
        });
      user2Id = res.body.user.id;
      user2Cookie = res.headers['set-cookie'][0];

      // Retrieve default categories for both users
      const cat1 = await Category.findOne({ user: user1Id, type: 'expense' });
      user1Category = cat1._id;

      const cat2 = await Category.findOne({ user: user2Id, type: 'expense' });
      user2Category = cat2._id;
    });

    test('User 1 can create transaction with integer paise precision', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Cookie', user1Cookie)
        .send({
          title: 'Grocery Mart',
          amount: 1450.75, // in Rupees
          type: 'expense',
          category: user1Category.toString(),
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.data.amount, 145075); // Exactly 145075 paise
      assert.strictEqual(res.body.data.title, 'Grocery Mart');
    });

    test('User 2 CANNOT see User 1 transactions', async () => {
      const res = await request(app)
        .get('/api/transactions')
        .set('Cookie', user2Cookie);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.data.length, 0); // Bob has no transactions yet
    });

    test('User 2 CANNOT read, update, or delete User 1 transaction by ID', async () => {
      const user1Tx = await Transaction.findOne({ user: user1Id });
      assert.ok(user1Tx);

      // Attempt GET by Bob
      const getRes = await request(app)
        .get(`/api/transactions/${user1Tx._id}`)
        .set('Cookie', user2Cookie);
      assert.strictEqual(getRes.status, 404);

      // Attempt UPDATE by Bob
      const putRes = await request(app)
        .put(`/api/transactions/${user1Tx._id}`)
        .set('Cookie', user2Cookie)
        .send({ title: 'Hacked Title' });
      assert.strictEqual(putRes.status, 404);

      // Attempt DELETE by Bob
      const delRes = await request(app)
        .delete(`/api/transactions/${user1Tx._id}`)
        .set('Cookie', user2Cookie);
      assert.strictEqual(delRes.status, 404);

      // Confirm transaction unchanged in database
      const unchanged = await Transaction.findById(user1Tx._id);
      assert.strictEqual(unchanged.title, 'Grocery Mart');
    });

    test('User CANNOT assign another user category to their transaction', async () => {
      const res = await request(app)
        .post('/api/transactions')
        .set('Cookie', user1Cookie)
        .send({
          title: 'Illegal Category Test',
          amount: 500,
          type: 'expense',
          category: user2Category.toString(), // Belongs to Bob!
        });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.message, 'Invalid category for this user.');

      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Cookie', user1Cookie)
        .send({
          category: user2Category.toString(),
          amount: 500,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
        });
      assert.strictEqual(budgetRes.status, 400);

      const recurringRes = await request(app)
        .post('/api/recurring')
        .set('Cookie', user1Cookie)
        .send({
          title: 'Owned recurring rule',
          amount: 500,
          type: 'expense',
          category: user1Category.toString(),
          frequency: 'monthly',
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      assert.strictEqual(recurringRes.status, 201);

      const recurringUpdate = await request(app)
        .put(`/api/recurring/${recurringRes.body.data._id}`)
        .set('Cookie', user1Cookie)
        .send({ category: user2Category.toString() });
      assert.strictEqual(recurringUpdate.status, 400);
    });
  });

  describe('3. Demo Account Entry & Fresh Seeding', () => {
    test('1-Click Demo endpoint seeds and logs into isolated demo workspace', async () => {
      const res = await request(app).post('/api/demo/enter');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.isDemo, true);
      assert.ok(res.headers['set-cookie']);

      const demoCookie = res.headers['set-cookie'][0];
      const initialDemoTransactions = await Transaction.countDocuments({ user: res.body.user.id });

      const mutationRes = await request(app)
        .post('/api/transactions')
        .set('Cookie', demoCookie)
        .send({ title: 'Demo change', amount: 1, type: 'expense', category: user1Category.toString() });
      assert.strictEqual(mutationRes.status, 403);

      await request(app).post('/api/demo/enter');
      assert.strictEqual(
        await Transaction.countDocuments({ user: res.body.user.id }),
        initialDemoTransactions
      );

      // Test dashboard endpoint for demo user returns calculated figures
      const dashRes = await request(app)
        .get('/api/analytics/dashboard')
        .set('Cookie', demoCookie);

      assert.strictEqual(dashRes.status, 200);
      assert.ok(dashRes.body.data.metrics.totalIncome > 0);
      assert.ok(dashRes.body.data.metrics.totalExpenses > 0);
      assert.ok(dashRes.body.data.insights.length > 0);
    });
  });

  describe('4. Budget and savings progress precision', () => {
    test('Dashboard budget progress reflects spending below, at, and above the limit', async () => {
      const now = new Date();
      const budgetRes = await request(app)
        .post('/api/budgets')
        .set('Cookie', user1Cookie)
        .send({
          category: user1Category.toString(),
          amount: 2000,
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        });

      assert.strictEqual(budgetRes.status, 201);
      const budgetId = budgetRes.body.data._id;

      const getDashboardBudget = async () => {
        const response = await request(app)
          .get('/api/analytics/dashboard')
          .set('Cookie', user1Cookie);
        assert.strictEqual(response.status, 200);
        return response.body.data.activeBudgets.find((budget) => budget._id === budgetId);
      };

      let budget = await getDashboardBudget();
      assert.strictEqual(budget.spent, 145075);
      assert.strictEqual(budget.percentageUsed, 73);
      assert.strictEqual(budget.isExceeded, false);

      await request(app).put(`/api/budgets/${budgetId}`).set('Cookie', user1Cookie).send({ amount: 1450.75 });
      budget = await getDashboardBudget();
      assert.strictEqual(budget.percentageUsed, 100);
      assert.strictEqual(budget.isExceeded, false);

      await request(app).put(`/api/budgets/${budgetId}`).set('Cookie', user1Cookie).send({ amount: 1000 });
      budget = await getDashboardBudget();
      assert.strictEqual(budget.percentageUsed, 145);
      assert.strictEqual(budget.spent, 145075);
      assert.strictEqual(budget.amount, 100000);
      assert.strictEqual(budget.remaining, -45075);
      assert.strictEqual(budget.isExceeded, true);
      assert.strictEqual(Math.min(100, budget.percentageUsed), 100);
    });

    test('Savings goals retain two decimal places of percentage precision', async () => {
      const createRes = await request(app)
        .post('/api/goals')
        .set('Cookie', user1Cookie)
        .send({ name: 'Precision test', targetAmount: 1000000, currentAmount: 100 });

      assert.strictEqual(createRes.status, 201);
      const goalId = createRes.body.data._id;
      const expected = [
        [100, 0.01],
        [900, 0.09],
        [5000, 0.5],
        [50000, 5],
        [1000000, 100],
      ];

      for (const [currentAmount, percentage] of expected) {
        await request(app)
          .put(`/api/goals/${goalId}`)
          .set('Cookie', user1Cookie)
          .send({ currentAmount });
        const response = await request(app).get('/api/goals').set('Cookie', user1Cookie);
        assert.strictEqual(response.status, 200);
        const goal = response.body.data.find((item) => item._id === goalId);
        assert.strictEqual(goal.percentage, percentage);
      }
    });

    test('Dashboard savings rate reflects negative net savings and rounds to two decimals', async () => {
      const incomeCategory = await Category.findOne({ user: user1Id, type: 'income' });
      const incomeRes = await request(app)
        .post('/api/transactions')
        .set('Cookie', user1Cookie)
        .send({
          title: 'Monthly income',
          amount: 1000,
          type: 'income',
          category: incomeCategory._id.toString(),
        });

      assert.strictEqual(incomeRes.status, 201);
      const dashboardRes = await request(app)
        .get('/api/analytics/dashboard')
        .set('Cookie', user1Cookie);

      assert.strictEqual(dashboardRes.status, 200);
      assert.strictEqual(dashboardRes.body.data.metrics.savingsRate, -45.08);
    });
  });
});
