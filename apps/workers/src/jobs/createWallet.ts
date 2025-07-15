import { Job } from 'bullmq';
import {
    CreateWalletJobSchema,
    CreateWalletJob,
    JobName,
    SyncPrivyUserJobSchema
} from '@phyt/m-queue/jobs';
import { addJobWithContext, authQueue } from '@phyt/m-queue/queue';

import { dependencies } from '@/di';

/**
 * Processor for create_wallet.
 * 1. Creates wallet via Privy.
 * 2. Enqueues sync_privy_user with wallet address.
 *
 * Uses DI pattern consistent with other job processors.
 */
export async function createWallet(
    job: Job<CreateWalletJob>
): Promise<{ ok: true }> {
    const data = CreateWalletJobSchema.parse(job.data);

    /* -- Create Privy wallet ------------------------------------------------ */
    const wallet = await dependencies.privy.walletApi.createWallet({
        chainType: 'ethereum',
        owner: { userId: data.privyDID }
    });

    /* -- Enqueue sync_privy_user ------------------------------------------- */
    const syncPayload = SyncPrivyUserJobSchema.parse({
        privyDID: data.privyDID,
        username: data.username,
        profilePictureUrl: data.profilePictureUrl,
        email: data.email,
        role: data.role,
        walletAddress: wallet.address
    });

    await addJobWithContext(authQueue, JobName.SYNC_PRIVY_USER, syncPayload, {
        jobId: `sync-${data.privyDID}-${Date.now().toString()}`,
        removeOnComplete: { age: 3_600, count: 100 },
        removeOnFail: { age: 86_400 }
    });

    return { ok: true };
}
