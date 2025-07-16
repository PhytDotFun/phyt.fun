import { Worker, Job } from 'bullmq';
import { redisBull } from '@phyt/redis/bull';
import { JobName, CreateWalletJob, SyncPrivyUserJob } from '@phyt/m-queue/jobs';

import { createWallet } from './jobs/createWallet';
import { syncPrivyUser } from './jobs/syncPrivyUser';

const worker = new Worker(
    'auth',
    async (job: Job) => {
        switch (job.name as JobName) {
            case JobName.CREATE_WALLET:
                return createWallet(job as Job<CreateWalletJob>);
            case JobName.SYNC_PRIVY_USER:
                return syncPrivyUser(job as Job<SyncPrivyUserJob>);
            default:
                throw new Error(`Unknown job: ${job.name}`);
        }
    },
    { connection: redisBull }
);

worker.on('completed', (job) => {
    console.log(`✅ ${job.name} (${job.id?.toString() ?? 'unknown'}) done`);
});
worker.on('failed', (job, err) => {
    console.error(
        `❌ ${job?.name ?? 'unknown'} (${job?.id?.toString() ?? 'unknown'}) failed:`,
        err
    );
});
