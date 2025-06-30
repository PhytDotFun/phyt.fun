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
        privyDID: char('privyDID', { length: 35 }).notNull(),
        email: varchar('email', { length: 255 }).unique(),
        username: char('username', { length: 15 }).notNull(),
        role: role('role').notNull().default('user'),
        stravaUsername: varchar('stravaUsername', { length: 255 }),
        stravaID: integer('stravaID'),
        profilePictureUrl: varchar('profilePictureUrl')
            .notNull()
            .default(
                'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFTTUitgzI9xWiHtmo3wu4PcnYaCGO1jX0bRBQ'
            ),
        walletAddress: char('walletAddress', { length: 42 }).notNull(),
        createdAt: timestamp('createdAt').notNull().defaultNow(),
        updatedAt: timestamp('updatedAt').notNull().defaultNow(),
        deletedAt: timestamp('deletedAt')
    },
    (table) => [
        uniqueIndex('privyDIDIdx').on(table.privyDID),
        uniqueIndex('emailIdx').on(table.email),
        uniqueIndex('usernameIdx').on(table.username),
        uniqueIndex('walletAddressIdx').on(table.walletAddress)
    ]
);
