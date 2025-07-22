import { Worker, Job, Queue } from 'bullmq';
import { redisBull } from '@phyt/redis/bull';
import {
    JobName,
    CreateWalletJob,
    SyncPrivyUserJob,
    CheckRunsToPostJob,
    PostRunsJob
} from '@phyt/m-queue/jobs';
import chalk from 'chalk';

import { createWallet } from './jobs/createWallet';
import { syncPrivyUser } from './jobs/syncPrivyUser';
import { checkRunsToPost } from './jobs/checkRunsToPost';
import { postRuns } from './jobs/postRuns';
import { env } from './env';

console.clear();

const startTime = process.hrtime.bigint();

// Auth worker - handles user authentication and wallet creation
const authWorker = new Worker(
    'auth',
    async (job: Job) => {
        switch (job.name as JobName) {
            case JobName.CREATE_WALLET:
                return createWallet(job as Job<CreateWalletJob>);
            case JobName.SYNC_PRIVY_USER:
                return syncPrivyUser(job as Job<SyncPrivyUserJob>);
            default:
                throw new Error(`Unknown auth job: ${job.name}`);
        }
    },
    {
        connection: redisBull,
        concurrency: env.WORKER_CONCURRENCY,
        limiter: {
            max: env.WORKER_RATE_LIMIT,
            duration: 1000
        }
    }
);

// Posts worker - handles run posting and related operations
const postsWorker = new Worker(
    'posts',
    async (job: Job) => {
        switch (job.name as JobName) {
            case JobName.CHECK_RUNS_TO_POST:
                return checkRunsToPost(job as Job<CheckRunsToPostJob>);
            case JobName.POST_RUNS:
                return postRuns(job as Job<PostRunsJob>);
            default:
                throw new Error(`Unknown posts job: ${job.name}`);
        }
    },
    {
        connection: redisBull,
        concurrency: env.WORKER_CONCURRENCY,
        limiter: {
            max: env.WORKER_RATE_LIMIT,
            duration: 1000
        }
    }
);

setTimeout(() => {
    const endTime = process.hrtime.bigint();
    const elapsedTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    console.log('');
    console.log(
        chalk.magenta('  WORKERS v0.0.0  ') +
            chalk.white(`ready in ${elapsedTime.toFixed(0)} ms`)
    );
    console.log('');

    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Concurrency: ') +
            chalk.yellow(env.WORKER_CONCURRENCY.toString()) +
            chalk.gray(' (per queue)')
    );
    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Rate Limit:  ') +
            chalk.yellow(`${env.WORKER_RATE_LIMIT.toString()} jobs/second`) +
            chalk.gray(' (per queue)')
    );
    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Auth Queue:  ') +
            chalk.yellow(`CREATE_WALLET, SYNC_PRIVY_USER`)
    );
    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Posts Queue: ') +
            chalk.yellow(`CHECK_RUNS_TO_POST, POST_RUNS`)
    );
}, 100);

// Setup CRON job for checking runs to post (every 10 minutes)
const setupCronJobs = async () => {
    const cronQueue = new Queue('posts', { connection: redisBull });

    // Add recurring job to check for runs that need posting every 10 minutes
    await cronQueue.add(
        JobName.CHECK_RUNS_TO_POST as string,
        {}, // Empty payload for CRON job
        {
            repeat: {
                pattern: '*/10 * * * *' // Every 10 minutes
            },
            jobId: 'check-runs-to-post-cron', // Unique ID to prevent duplicates
            removeOnComplete: { age: 3600, count: 10 },
            removeOnFail: { age: 86400, count: 5 }
        }
    );

    console.log(
        '📅 CRON job scheduled: check-runs-to-post every 10 minutes (posts queue)'
    );
};

// Initialize CRON jobs
setupCronJobs().catch(console.error);
// Setup event handlers for both workers
authWorker.on('completed', (job) => {
    console.log(
        `✅ [AUTH] ${job.name} (${job.id?.toString() ?? 'unknown'}) done`
    );
});
authWorker.on('failed', (job, err) => {
    console.error(
        `❌ [AUTH] ${job?.name ?? 'unknown'} (${job?.id?.toString() ?? 'unknown'}) failed:`,
        err
    );
});

postsWorker.on('completed', (job) => {
    console.log(
        `✅ [POSTS] ${job.name} (${job.id?.toString() ?? 'unknown'}) done`
    );
});
postsWorker.on('failed', (job, err) => {
    console.error(
        `❌ [POSTS] ${job?.name ?? 'unknown'} (${job?.id?.toString() ?? 'unknown'}) failed:`,
        err
    );
});
