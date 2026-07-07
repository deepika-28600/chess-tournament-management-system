import { z } from 'zod';

const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
const statusEnum = z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'BANNED']);

export const createPlayerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
    age: z.coerce.number().int().min(4, 'Age must be at least 4').max(120),
    gender: genderEnum,
    country: z.string().trim().min(2).max(60),
    state: z.string().trim().max(60).optional(),
    city: z.string().trim().max(60).optional(),
    email: z.string().trim().toLowerCase().email('Invalid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number'),
    fideRating: z.coerce.number().int().min(0).max(3500).optional().default(0),
    experienceYears: z.coerce.number().int().min(0).max(100).optional().default(0),
    photoUrl: z.string().url().optional(),
    status: statusEnum.optional().default('ACTIVE'),
  }),
});

export const updatePlayerSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid player id') }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    age: z.coerce.number().int().min(4).max(120).optional(),
    gender: genderEnum.optional(),
    country: z.string().trim().min(2).max(60).optional(),
    state: z.string().trim().max(60).optional(),
    city: z.string().trim().max(60).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[0-9]{7,15}$/, 'Invalid phone number')
      .optional(),
    fideRating: z.coerce.number().int().min(0).max(3500).optional(),
    experienceYears: z.coerce.number().int().min(0).max(100).optional(),
    photoUrl: z.string().url().optional(),
    status: statusEnum.optional(),
  }),
});

export const listPlayersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    search: z.string().trim().optional(),
    country: z.string().trim().optional(),
    status: statusEnum.optional(),
    gender: genderEnum.optional(),
    minRating: z.coerce.number().int().optional(),
    maxRating: z.coerce.number().int().optional(),
    sortBy: z
      .enum(['name', 'fideRating', 'currentRank', 'wins', 'createdAt', 'age'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.string().uuid('Invalid player id') }),
});
