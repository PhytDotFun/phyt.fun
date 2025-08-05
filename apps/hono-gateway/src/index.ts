import 'dotenv/config';
import chalk from 'chalk';
import { serve } from '@hono/node-server';

import { app } from './app';
import { env } from './env';

console.log('');
console.log(chalk.bold.magenta('  HONO-GATEWAY ') + chalk.magenta(`v0.0.0`));

console.log('');
console.log(
    chalk.magenta('  ➜') +
        chalk.bold('  Server:  ') +
        chalk.yellow(`http://localhost:${env.PORT.toString()}/`)
);
console.log(
    chalk.magenta('  ➜') + chalk.bold('  Runtime: ') + chalk.yellow('Node.js')
);

serve({
    fetch: app.fetch,
    port: env.PORT
});
