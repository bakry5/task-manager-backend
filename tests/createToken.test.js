const jwt = require('jsonwebtoken');
const createToken = require('../utils/createToken');

describe('createToken', () => {
  test('produces a token that decodes to the given userId', () => {
    const token = createToken('user123');
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    expect(decoded.userId).toBe('user123');
  });

  test('throws when verified with the wrong secret', () => {
    const token = createToken('user123');
    expect(() => jwt.verify(token, 'wrong_secret')).toThrow();
  });
});
