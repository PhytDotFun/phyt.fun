import {
    pgTable,
    pgEnum,
    uniqueIndex,
    integer,
    serial,
    timestamp,
    varchar,
    char
} from 'drizzle-orm/pg-core';

export const role = pgEnum('role', ['user', 'runner', 'admin']);

export const users = pgTable(
    'users',
    {
        id: serial('id').primaryKey(),
        privyDID: char('privy_did', { length: 35 }).unique().notNull(),
        email: varchar('email', { length: 255 }).unique(),
        username: char('username', { length: 15 }).notNull(),
        role: role('role').notNull().default('user'),
        stravaUsername: varchar('strava_username', { length: 255 }),
        stravaID: integer('strava_id'),
        profilePictureUrl: varchar('profile_picture_url')
            .notNull()
            .default(
                'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFTTUitgzI9xWiHtmo3wu4PcnYaCGO1jX0bRBQ'
            ),
        walletAddress: char('wallet_address', { length: 42 })
            .unique()
            .notNull(),
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
        deletedAt: timestamp('deleted_at')
    },
    (table) => [
        uniqueIndex('privy_did_idx').on(table.privyDID),
        uniqueIndex('username_idx').on(table.username),
        uniqueIndex('wallet_address_idx').on(table.walletAddress)
    ]
);
