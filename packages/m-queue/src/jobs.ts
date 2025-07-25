import { z } from 'zod';
import { RunPostSchema } from '@phyt/data-access/models/runs';

export enum JobName {
    CREATE_WALLET = 'create_wallet',
    SYNC_PRIVY_USER = 'sync_privy_user',
    CHECK_RUNS_TO_POST = 'check_runs_to_post',
    POST_RUNS = 'post_runs'
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

export const CheckRunsToPostJobSchema = z.object({});
export type CheckRunsToPostJob = z.infer<typeof CheckRunsToPostJobSchema>;

// Queue-safe version of RunPostSchema that handles date strings from BullMQ serialization
const QueueRunPostSchema = RunPostSchema.extend({
    startTime: z.union([
        z.date(),
        z.string().transform((str) => new Date(str))
    ]),
    endTime: z.union([z.date(), z.string().transform((str) => new Date(str))])
});

export const PostRunsJobSchema = z.object({
    run: QueueRunPostSchema
});
export type PostRunsJob = z.infer<typeof PostRunsJobSchema>;
