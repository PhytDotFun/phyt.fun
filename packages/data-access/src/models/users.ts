import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { users } from '../db/schema';

export type SelectUser = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export const InsertUserSchema = createInsertSchema(users);
export const SelectUserSchema = createSelectSchema(users);

export const UserSchema = z.object({
    walletAddress: z.string(),
    username: z.string(),
    profilePictureUrl: z.string(),
    role: z.enum(['user', 'runner', 'admin'])
});
export type User = z.infer<typeof UserSchema>;
