import 'dotenv/config';
import chalk from 'chalk';

import { app } from './app';
import { env } from './env';

// Export for Bun hot reloading
export default {
    fetch: app.fetch,
    port: env.PORT,
    development: process.env.NODE_ENV === 'development'
};

console.log('');
console.log(chalk.bold.magenta('  HONO-GATEWAY ') + chalk.magenta(`v0.0.0`));

console.log('');
console.log(
    chalk.magenta('  ➜') +
        chalk.bold('  Server:  ') +
        chalk.yellow(`http://localhost:${env.PORT.toString()}/`)
);
console.log(
    chalk.magenta('  ➜') + chalk.bold('  Runtime: ') + chalk.yellow('Bun')
);
