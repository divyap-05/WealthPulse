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

    test('Should reject unauthenticated access to protected routes', async () => {
      const res = await request(app).get('/api/transactions');
      assert.strictEqual(res.status, 401);
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
    });
  });

  describe('3. Demo Account Entry & Fresh Seeding', () => {
    test('1-Click Demo endpoint seeds and logs into isolated demo workspace', async () => {
      const res = await request(app).post('/api/demo/enter');

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.isDemo, true);
      assert.ok(res.headers['set-cookie']);

      const demoCookie = res.headers['set-cookie'][0];

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
});
