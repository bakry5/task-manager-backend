const { allowedTo } = require('../services/authService');

describe('allowedTo', () => {
  test('calls next with no error when the role is allowed', () => {
    const req = { user: { role: 'admin' } };
    const next = jest.fn();

    allowedTo('admin')(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });

  test('calls next with a 403 error when the role is not allowed', () => {
    const req = { user: { role: 'member' } };
    const next = jest.fn();

    allowedTo('admin')(req, {}, next);

    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(403);
  });

  test('accepts multiple allowed roles', () => {
    const req = { user: { role: 'member' } };
    const next = jest.fn();

    allowedTo('admin', 'member')(req, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
