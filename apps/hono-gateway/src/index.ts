import 'dotenv/config';
import { serve } from '@hono/node-server';
import chalk from 'chalk';

import { app } from './app';
import { env } from './env';

console.clear();

const startTime = process.hrtime.bigint();

serve(
    {
        fetch: app.fetch.bind(app),
        port: env.PORT
    },
    () => {
        setTimeout(() => {
            const endTime = process.hrtime.bigint();
            const elapsedTime = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
            console.log('');
            console.log(
                chalk.red('  HONO-GATEWAY v0.0.0  ') +
                    chalk.white(`ready in ${elapsedTime.toFixed(0)} ms`)
            );
            console.log('');

            console.log(
                chalk.red('  ➜') +
                    chalk.white('  Server:  ') +
                    chalk.redBright(`http://localhost:${env.PORT.toString()}/`)
            );
        }, 100);
    }
);
