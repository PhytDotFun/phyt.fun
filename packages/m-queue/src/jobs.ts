import { z } from 'zod';

export enum JobName {
    CREATE_WALLET = 'create_wallet',
    SYNC_PRIVY_USER = 'sync_privy_user'
}

export const CreateWalletJobSchema = z.object({
    privyDID: z.string(),
    username: z.string().min(3),
    profilePictureUrl: z.string().url(),
    email: z.string().email().nullable(),
    role: z.enum(['user', 'admin', 'runner'])
});
export type CreateWalletJob = z.infer<typeof CreateWalletJobSchema>;

export const SyncPrivyUserJobSchema = z.object({
    privyDID: z.string(),
    username: z.string().min(3),
    profilePictureUrl: z.string().url(),
    walletAddress: z.string().min(1),
    email: z.string().email().nullable(),
    role: z.enum(['user', 'admin', 'runner'])
});
export type SyncPrivyUserJob = z.infer<typeof SyncPrivyUserJobSchema>;
