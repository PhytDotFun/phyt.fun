import { z } from 'zod';

export const SyncPrivyUserJobSchema = z.object({
    privyDID: z.string(),
    username: z.string(),
    profilePictureUrl: z.string().url(),
    walletAddress: z.string(),
    email: z.string().email().nullable(),
    role: z.enum(['user', 'runner', 'admin']),
    eventType: z.enum(['user.created', 'user.authenticated'])
});

export const CreateWalletJobSchema = z.object({
    privyDID: z.string(),
    chainType: z.string()
});

export type SendPrivyUserJob = z.infer<typeof SyncPrivyUserJobSchema>;
export type CreateWalletJob = z.infer<typeof CreateWalletJobSchema>;

export enum JobName {
    SYNC_PRIVY_USER = 'sync-privy-user',
    CREATE_WALLET = 'create_wallet'
}
