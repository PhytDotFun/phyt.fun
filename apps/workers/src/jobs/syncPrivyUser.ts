import { Job } from 'bullmq';
import { SyncPrivyUserJob, SyncPrivyUserJobSchema } from '@phyt/m-queue/jobs';
import { InsertUserSchema } from '@phyt/data-access/models/users';
import { UserService } from '@phyt/trpc-adapters/users/service';
import { cache } from '@phyt/redis/cache';

import { dependencies } from '../di';

/**
 * Processor for sync_privy_user.
 */
export async function syncPrivyUser(
    job: Job<SyncPrivyUserJob>
): Promise<{ ok: true }> {
    const data = SyncPrivyUserJobSchema.parse(job.data);

    console.log(
        `[Worker] Processing SYNC_PRIVY_USER for user ${data.privyDID}`
    );

    // Check cache to see if data has changed
    const cacheKey = `sync_privy_user:${data.privyDID}`;
    const cachedData = await cache.get<SyncPrivyUserJob>(
        cacheKey,
        SyncPrivyUserJobSchema
    );

    // Compare cached data with incoming data
    if (
        cachedData &&
        cachedData.privyDID === data.privyDID &&
        cachedData.username === data.username &&
        cachedData.profilePictureUrl === data.profilePictureUrl &&
        cachedData.walletAddress === data.walletAddress &&
        cachedData.email === data.email &&
        cachedData.role === data.role
    ) {
        console.log(
            `[Worker] ⚡ Skipping sync for user ${data.username} (${data.privyDID}) - no changes detected`
        );
        return { ok: true };
    }

    const record = {
        privyDID: data.privyDID,
        username: data.username,
        profilePictureUrl: data.profilePictureUrl,
        walletAddress: data.walletAddress,
        email: data.email,
        role: data.role
    };

    try {
        const newUser = InsertUserSchema.parse(record);
        await new UserService(dependencies).syncPrivyData(newUser);

        // Cache the successfully processed data (24 hour TTL)
        await cache.set(cacheKey, data, 86400);

        console.log(
            `[Worker] ✓ Synced user ${data.username} (${data.privyDID})`
        );
        return { ok: true };
    } catch (error) {
        console.error(
            `[Worker] ✗ Failed to sync user ${data.privyDID}:`,
            error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
    }
}
