import { ApiError } from './ApiError';

describe('ApiError', () => {
  it('badRequest produces a 400 with the given message', () => {
    const err = ApiError.badRequest('Invalid input');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Invalid input');
    expect(err.isOperational).toBe(true);
  });

  it('unauthorized defaults to a generic message', () => {
    const err = ApiError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('Unauthorized');
  });

  it('notFound produces a 404', () => {
    const err = ApiError.notFound('Player not found');
    expect(err.statusCode).toBe(404);
  });

  it('conflict produces a 409 and preserves details', () => {
    const err = ApiError.conflict('Duplicate email', { field: 'email' });
    expect(err.statusCode).toBe(409);
    expect(err.details).toEqual({ field: 'email' });
  });

  it('internal marks the error as non-operational', () => {
    const err = ApiError.internal();
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(false);
  });

  it('is an instance of Error and preserves a stack trace', () => {
    const err = ApiError.badRequest('test');
    expect(err).toBeInstanceOf(Error);
    expect(err.stack).toBeDefined();
  });
});
