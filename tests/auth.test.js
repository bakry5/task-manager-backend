jest.mock('../models/userModel');
jest.mock('bcryptjs');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const app = require('../server');

describe('POST /api/v1/auth/signup', () => {
  afterEach(() => jest.clearAllMocks());

  test('creates a user and sets an httpOnly cookie', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: '64f000000000000000000001',
      name: 'Test User',
      email: 'test@example.com',
    });

    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.headers['set-cookie'][0]).toMatch(/^token=.*HttpOnly/);
    expect(res.body.data.email).toBe('test@example.com');
  });

  test('rejects signup with an email already in use', async () => {
    User.findOne.mockResolvedValue({ _id: 'existing', email: 'test@example.com' });

    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(400);
  });

  test('rejects signup with invalid payload', async () => {
    const res = await request(app).post('/api/v1/auth/signup').send({
      name: 'ab',
      email: 'not-an-email',
      password: '123',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/auth/login', () => {
  afterEach(() => jest.clearAllMocks());

  test('rejects an unknown email', async () => {
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'missing@example.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  test('rejects an incorrect password', async () => {
    const fakeUser = {
      _id: '64f000000000000000000001',
      email: 'test@example.com',
      password: 'hashed-password',
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('logs in with correct credentials and sets an httpOnly cookie', async () => {
    const fakeUser = {
      _id: '64f000000000000000000001',
      email: 'test@example.com',
      password: 'hashed-password',
    };
    User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(fakeUser) });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/^token=.*HttpOnly/);
  });
});

describe('GET /api/v1/auth/me', () => {
  test('rejects requests without a token cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/v1/auth/logout', () => {
  test('clears the token cookie', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'][0]).toMatch(/^token=;/);
  });
});
