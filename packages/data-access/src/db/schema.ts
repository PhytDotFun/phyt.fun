import {
    pgTable,
    pgEnum,
    uniqueIndex,
    integer,
    timestamp,
    varchar,
    bigint,
    boolean,
    jsonb,
    real,
    index,
    char
} from 'drizzle-orm/pg-core';

export const role = pgEnum('role', ['user', 'runner', 'admin']);

export const contentType = pgEnum('content_type', ['post', 'comment']);

export const users = pgTable(
    'users',
    {
        id: bigint('id', { mode: 'number' })
            .primaryKey()
            .generatedByDefaultAsIdentity(),
        privyDID: varchar('privy_did', { length: 35 }).unique().notNull(),
        email: varchar('email', { length: 255 }).unique(),
        username: varchar('username', { length: 15 }).notNull(),
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
    (table) => [uniqueIndex('username_idx').on(table.username)]
);

export const runs = pgTable(
    'runs',
    {
        id: bigint('id', { mode: 'number' })
            .primaryKey()
            .generatedByDefaultAsIdentity(),
        userId: bigint('user_id', { mode: 'number' })
            .references(() => users.id)
            .notNull(),
        startTime: timestamp('start_time').notNull(),
        endTime: timestamp('end_time').notNull(),
        duration: integer('duration').notNull(), // seconds
        distance: real('distance').notNull(), // meters
        averageSpeed: real('average_speed'), // meters per second
        averagePace: real('average_pace'), // seconds per meter
        averageHeartRate: integer('average_heart_rate').notNull(), // bpm
        maxHeartRate: integer('max_heart_rate').notNull(), // bpm
        isIndoor: boolean('is_indoor').default(false), // treadmill?
        routeData: jsonb('route_data'),
        externalId: varchar('external_id', { length: 255 }).notNull(), // healthKidUUid, etc.
        platform: varchar('platform', { length: 50 }).notNull(), // 'apple_health', 'garmin', 'strava', 'fitbit', etc.
        sourceApp: varchar('source_app', { length: 100 }), // "Apple Watch", "Garmin Forerunner 945", "Strava", etc.
        createdAt: timestamp('created_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
        deletedAt: timestamp('deleted_at')
    },
    (table) => [
        uniqueIndex('unique_external_workout').on(
            table.externalId,
            table.platform
        ),
        index('start_time_idx').on(table.startTime),
        index('user_runs_idx').on(table.userId)
    ]
);

export const posts = pgTable('posts', {
    id: bigint('id', { mode: 'number' })
        .primaryKey()
        .generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
        .references(() => users.id)
        .notNull(),
    runId: bigint('run_id', { mode: 'number' })
        .references(() => runs.id)
        .notNull(),
    isProfile: boolean('is_profile').default(false).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at')
});

export const comments = pgTable('comments', {
    id: bigint('id', { mode: 'number' })
        .primaryKey()
        .generatedByDefaultAsIdentity(),
    userId: bigint('user_id', { mode: 'number' })
        .references(() => users.id)
        .notNull(),
    isProfile: boolean('is_profile').default(false).notNull(),
    contentType: contentType('content_type').notNull(),
    contentId: bigint('content_id', { mode: 'number' }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at')
});

export const reactions = pgTable('reactions', {
    id: bigint('id', { mode: 'number' })
        .primaryKey()
        .generatedByDefaultAsIdentity(),
    contentType: contentType('content_type').notNull(),
    contentId: bigint('content_id', { mode: 'number' }).notNull(),
    userId: bigint('user_id', { mode: 'number' })
        .references(() => users.id)
        .notNull(),
    reactionType: varchar('reaction_type', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at')
});
