import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { users } from '@/db/schema';

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export const InsertUserSchema = createInsertSchema(users);
export const UserSchema = createSelectSchema(users);

export const UserProfileSchema = z.object({
    walletAddress: z.string(),
    username: z.string(),
    profilePictureUrl: z.string(),
    role: z.enum(['user', 'runner', 'admin'])
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
