import { Job } from 'bullmq';
import {
    CreateWalletJobSchema,
    CreateWalletJob,
    JobName,
    SyncPrivyUserJobSchema
} from '@phyt/m-queue/jobs';
import { addJobWithContext, authQueue } from '@phyt/m-queue/queue';

import { appDeps } from '../di';

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

    console.log(`[Worker] Creating wallet for user ${data.privyDID}`);

    try {
        // Create Privy wallet
        const wallet = await appDeps.privy.walletApi.createWallet({
            chainType: 'ethereum',
            owner: { userId: data.privyDID }
        });

        console.log(
            `[Worker] ✓ Created wallet ${wallet.address} for user ${data.privyDID}`
        );

        // Enqueue sync_privy_user
        const syncPayload = SyncPrivyUserJobSchema.parse({
            privyDID: data.privyDID,
            username: data.username,
            profilePictureUrl: data.profilePictureUrl,
            email: data.email,
            role: data.role,
            walletAddress: wallet.address
        });

        await addJobWithContext(
            authQueue,
            JobName.SYNC_PRIVY_USER,
            syncPayload,
            {
                jobId: `sync-${data.privyDID}-${Date.now().toString()}`,
                removeOnComplete: { age: 3_600, count: 100 },
                removeOnFail: { age: 86_400 }
            }
        );

        console.log(`[Worker] → Queued sync job for user ${data.privyDID}`);
        return { ok: true };
    } catch (error) {
        console.error(
            `[Worker] ✗ Failed to create wallet for user ${data.privyDID}:`,
            error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
    }
}
