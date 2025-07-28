import 'dotenv/config';
import chalk from 'chalk';

import { app } from './app';
import { env } from './env';

const startTime = process.hrtime.bigint();

// Export for Bun hot reloading
export default {
    fetch: app.fetch,
    port: env.PORT,
    development: process.env.NODE_ENV === 'development'
};

setTimeout(() => {
    const endTime = process.hrtime.bigint();
    const elapsedTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
    console.log('');
    console.log(
        chalk.magenta('  HONO-GATEWAY v0.0.0  ') +
            chalk.white(`ready in ${elapsedTime.toFixed(0)} ms`)
    );
    console.log('');

    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Server:  ') +
            chalk.yellow(`http://localhost:${env.PORT.toString()}/`)
    );
    console.log(
        chalk.magenta('  ➜') +
            chalk.white('  Runtime: ') +
            chalk.yellow('Bun native')
    );
}, 100);
