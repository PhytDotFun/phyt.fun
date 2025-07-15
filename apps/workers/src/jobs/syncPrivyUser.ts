import { Job } from 'bullmq';
import { SyncPrivyUserJob, SyncPrivyUserJobSchema } from '@phyt/m-queue';
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

    const record = {
        privyDID: data.privyDID,
        username: data.username,
        profilePictureUrl: data.profilePictureUrl,
        walletAddress: data.walletAddress,
        email: data.email,
        role: data.role
    };

    const newUser = InsertUserSchema.parse(record);
    await new UserService(dependencies).syncPrivyData(newUser);

    return { ok: true };
}
