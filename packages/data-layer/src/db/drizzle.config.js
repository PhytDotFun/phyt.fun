import { defineConfig } from 'drizzle-kit';
import { z } from 'zod';

/**
NOTE: drizzle-kit is fucking ass and (still) doesn't seem to support esm.
See https://www.answeroverflow.com/m/1117734960703479881.

Ideally use the t3 env schema from @phyt/core, however this throws a 'No "exports" main defined in .../node_modules/@phyt/core/package.json' error. 

So will just have to live with doing env validation within the drizzle.config file.

In the end this shouldn't matter (just drives anyone with OCD crazy), given that DATABASE_URL used anywhere else besides here is from @phyt/core, since doing the validation here exclusively for drizzle-kit doesn't come with any of the drawbacks that t3 fixes (https://env.t3.gg/docs/introduction)
 */

const dbUrlSchema = z.object({
    DATABASE_URL: z.string().url()
});

dbUrlSchema.parse(process.env);

export default defineConfig({
    out: './src/db/drizzle',
    schema: './src/db/schema.ts',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL
    }
});
