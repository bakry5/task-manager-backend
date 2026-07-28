const ApiError = require('../utils/apiError');

describe('ApiError', () => {
  test('marks 4xx codes as fail', () => {
    const err = new ApiError('Not found', 404);
    expect(err.statusCode).toBe(404);
    expect(err.status).toBe('fail');
    expect(err.isOperational).toBe(true);
  });

  test('marks 5xx codes as error', () => {
    const err = new ApiError('Server exploded', 500);
    expect(err.status).toBe('error');
  });

  test('keeps the message', () => {
    const err = new ApiError('Something specific went wrong', 400);
    expect(err.message).toBe('Something specific went wrong');
  });
});
