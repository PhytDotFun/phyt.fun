import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { users } from './schema';

// SCHEMAS //
export const selectUserSchema = createSelectSchema(users);

export const insertUserSchema = createInsertSchema(users, {
    username: (schema) =>
        schema
            .min(3, 'Username must be at least 3 characters')
            .max(15, 'Username must be less than 15 characters'),
    walletAddress: (schema) => schema.length(42, 'Invalid wallet address'),
    email: (schema) => schema.email({ message: 'Invalid email address' })
}).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true
});

// TYPES //
export type SelectUser = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;
