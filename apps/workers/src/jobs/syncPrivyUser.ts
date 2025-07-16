import { Job } from 'bullmq';
import { SyncPrivyUserJob, SyncPrivyUserJobSchema } from '@phyt/m-queue/jobs';
import { InsertUserSchema } from '@phyt/data-access/models/users';
import { UserService } from '@phyt/trpc-adapters/users/service';

import { dependencies } from '@/di';

/**
 * Processor for sync_privy_user.
 */
export async function syncPrivyUser(
    job: Job<SyncPrivyUserJob>
): Promise<{ ok: true }> {
    const data = SyncPrivyUserJobSchema.parse(job.data);

    console.log(
        `[Worker] Processing sync_privy_user for user ${data.privyDID}`
    );

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
