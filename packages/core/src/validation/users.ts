import { z } from 'zod';

export const getUserSchema = z.object({
    id: z.number(),
    privyDID: z.string(),
    email: z.string().email(),
    username: z.string(),
    role: z.enum(['user', 'runner', 'admin']),
    stravaUsername: z.string().optional(),
    stravaID: z.number().optional(),
    profilePictureUrl: z.string().optional(),
    walletAddress: z.string(),
    createdAt: z.date(),
    updatedAt: z.date(),
    deletedAt: z.date().optional()
});

export const getMultipleUsersSchema = z.array(getUserSchema);
