import { sql } from 'drizzle-orm';

import { db, pgClient } from '@/db/client';

const KEEP_TABLES = ['_drizzle_migrations'];

// Wrap the whole task in one async IIFE so ESLint is happy
await (async () => {
    try {
        // 1) Drop tables
        await db.execute(
            sql.raw(`
          DO $$
          DECLARE r RECORD;
          BEGIN
            FOR r IN
              SELECT tablename FROM pg_tables
              WHERE schemaname = 'public' AND tablename <> ALL('{${KEEP_TABLES.join(',')}}')
            LOOP
              EXECUTE format('DROP TABLE IF EXISTS "%I" CASCADE', r.tablename);
            END LOOP;
          END$$;
        `)
        );

        // 2) Drop sequences
        await db.execute(
            sql.raw(`
          DO $$
          DECLARE r RECORD;
          BEGIN
            FOR r IN
              SELECT sequence_name FROM information_schema.sequences
              WHERE sequence_schema = 'public'
            LOOP
              EXECUTE format('DROP SEQUENCE IF EXISTS "%I" CASCADE', r.sequence_name);
            END LOOP;
          END$$;
        `)
        );

        // 3) Drop enum types
        await db.execute(
            sql.raw(`
          DO $$
          DECLARE r RECORD;
          BEGIN
            FOR r IN
              SELECT t.typname
              FROM pg_type t
              JOIN pg_namespace n ON n.oid = t.typnamespace
              WHERE n.nspname = 'public' AND t.typtype = 'e'
            LOOP
              EXECUTE format('DROP TYPE IF EXISTS "%I" CASCADE', r.typname);
            END LOOP;
          END$$;
        `)
        );
        console.log('Database cleaned successfully.');
    } catch (err) {
        console.error('Database clean failed:', err);
        process.exitCode = 1; // set exit code, defer exit to finally
    } finally {
        // Always close the pg pool so Node can exit cleanly
        await pgClient.end();
        process.exit();
    }
})();
