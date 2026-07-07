import { createPlayerSchema, listPlayersSchema } from './player.validator';

describe('createPlayerSchema', () => {
  const validBody = {
    name: 'Magnus Carlsen',
    age: 33,
    gender: 'MALE',
    country: 'Norway',
    email: 'magnus@example.com',
    phone: '+4712345678',
  };

  it('accepts a valid player payload', () => {
    const result = createPlayerSchema.safeParse({ body: validBody });
    expect(result.success).toBe(true);
  });

  it('rejects a name shorter than 2 characters', () => {
    const result = createPlayerSchema.safeParse({ body: { ...validBody, name: 'M' } });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = createPlayerSchema.safeParse({ body: { ...validBody, email: 'not-an-email' } });
    expect(result.success).toBe(false);
  });

  it('rejects an age below the minimum', () => {
    const result = createPlayerSchema.safeParse({ body: { ...validBody, age: 2 } });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid phone number format', () => {
    const result = createPlayerSchema.safeParse({ body: { ...validBody, phone: 'abc-123' } });
    expect(result.success).toBe(false);
  });

  it('rejects a FIDE rating above the realistic maximum', () => {
    const result = createPlayerSchema.safeParse({ body: { ...validBody, fideRating: 5000 } });
    expect(result.success).toBe(false);
  });

  it('defaults status to ACTIVE and fideRating to 0 when omitted', () => {
    const result = createPlayerSchema.safeParse({ body: validBody });
    if (result.success) {
      expect(result.data.body.status).toBe('ACTIVE');
      expect(result.data.body.fideRating).toBe(0);
    }
  });
});

describe('listPlayersSchema', () => {
  it('applies default pagination when none is provided', () => {
    const result = listPlayersSchema.safeParse({ query: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.page).toBe(1);
      expect(result.data.query.limit).toBe(10);
      expect(result.data.query.sortOrder).toBe('desc');
    }
  });

  it('coerces string page/limit query params to numbers', () => {
    const result = listPlayersSchema.safeParse({ query: { page: '3', limit: '25' } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.page).toBe(3);
      expect(result.data.query.limit).toBe(25);
    }
  });

  it('rejects a limit above the maximum allowed', () => {
    const result = listPlayersSchema.safeParse({ query: { limit: '500' } });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid sortBy value', () => {
    const result = listPlayersSchema.safeParse({ query: { sortBy: 'notAField' } });
    expect(result.success).toBe(false);
  });
});
