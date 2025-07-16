import { Worker, Job } from 'bullmq';
import { redisBull } from '@phyt/redis/bull';
import { JobName, CreateWalletJob, SyncPrivyUserJob } from '@phyt/m-queue/jobs';
import chalk from 'chalk';

import { createWallet } from './jobs/createWallet';
import { syncPrivyUser } from './jobs/syncPrivyUser';
import { env } from './env';

console.clear();

const startTime = process.hrtime.bigint();

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
            chalk.yellow(env.WORKER_CONCURRENCY.toString())
    );
    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Rate Limit:  ') +
            chalk.yellow(`${env.WORKER_RATE_LIMIT.toString()} jobs/second`)
    );
    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Jobs:        ') +
            chalk.yellow(`CREATE_WALLET, SYNC_PRIVY_USER`)
    );
}, 100);

worker.on('completed', (job) => {
    console.log(`✅ ${job.name} (${job.id?.toString() ?? 'unknown'}) done`);
});
worker.on('failed', (job, err) => {
    console.error(
        `❌ ${job?.name ?? 'unknown'} (${job?.id?.toString() ?? 'unknown'}) failed:`,
        err
    );
});
