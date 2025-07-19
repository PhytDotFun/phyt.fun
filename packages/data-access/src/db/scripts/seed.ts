/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { db, pgClient } from '../client';
import { users, runs, posts, comments, reactions } from '../schema';

// Sample data
const sampleUsers = [
    {
        privyDID: 'did:privy:cm123456789abcdef123456',
        email: 'alice.runner@example.com',
        username: 'alice_runs',
        role: 'runner' as const,
        stravaUsername: 'alice_strava',
        stravaID: 12345678,
        walletAddress: '0x1234567890123456789012345678901234567890'
    },
    {
        privyDID: 'did:privy:cm987654321fedcba098765',
        email: 'bob.fitness@example.com',
        username: 'bob_fit',
        role: 'user' as const,
        stravaUsername: 'bob_strava',
        stravaID: 87654321,
        walletAddress: '0x0987654321098765432109876543210987654321'
    },
    {
        privyDID: 'did:privy:cm456789012345678901',
        email: 'carol.admin@example.com',
        username: 'carol_admin',
        role: 'admin' as const,
        walletAddress: '0x4567890123456789012345678901234567890123'
    },
    {
        privyDID: 'did:privy:cm789012345678901234',
        email: 'david.jogger@example.com',
        username: 'david_jogs',
        role: 'user' as const,
        stravaUsername: 'david_jogs',
        stravaID: 45678901,
        walletAddress: '0x7890123456789012345678901234567890123456'
    },
    {
        privyDID: 'did:privy:cm345678901234567890',
        email: 'eve.marathon@example.com',
        username: 'eve_marathon',
        role: 'runner' as const,
        stravaUsername: 'eve_marathons',
        stravaID: 23456789,
        walletAddress: '0x3456789012345678901234567890123456789012'
    }
];

const generateRuns = (userIds: number[]) => [
    // Alice's runs
    {
        userId: userIds[0]!,
        startTime: new Date('2024-01-15T06:00:00Z'),
        endTime: new Date('2024-01-15T07:15:00Z'),
        duration: 4500, // 1h 15m
        distance: 12000, // 12km
        averageSpeed: 2.67, // m/s
        averagePace: 375, // seconds per km (6:15 pace)
        averageHeartRate: 155,
        maxHeartRate: 175,
        isIndoor: false,
        externalId: 'healthkit_workout_001',
        platform: 'apple_health',
        sourceApp: 'Apple Watch'
    },
    {
        userId: userIds[0]!,
        startTime: new Date('2024-01-17T06:30:00Z'),
        endTime: new Date('2024-01-17T07:00:00Z'),
        duration: 1800, // 30m
        distance: 5000, // 5km
        averageSpeed: 2.78, // m/s
        averagePace: 360, // seconds per km (6:00 pace)
        averageHeartRate: 165,
        maxHeartRate: 180,
        isIndoor: false,
        externalId: 'healthkit_workout_002',
        platform: 'apple_health',
        sourceApp: 'Apple Watch'
    },
    // Bob's runs
    {
        userId: userIds[1]!,
        startTime: new Date('2024-01-16T18:00:00Z'),
        endTime: new Date('2024-01-16T18:45:00Z'),
        duration: 2700, // 45m
        distance: 7500, // 7.5km
        averageSpeed: 2.78, // m/s
        averagePace: 360, // seconds per km
        averageHeartRate: 145,
        maxHeartRate: 165,
        isIndoor: true,
        externalId: 'strava_activity_12345',
        platform: 'strava',
        sourceApp: 'Strava'
    },
    // David's runs
    {
        userId: userIds[3]!,
        startTime: new Date('2024-01-18T07:00:00Z'),
        endTime: new Date('2024-01-18T08:00:00Z'),
        duration: 3600, // 1h
        distance: 10000, // 10km
        averageSpeed: 2.78, // m/s
        averagePace: 360, // seconds per km
        averageHeartRate: 150,
        maxHeartRate: 170,
        isIndoor: false,
        externalId: 'garmin_activity_9876',
        platform: 'garmin',
        sourceApp: 'Garmin Forerunner 945'
    },
    // Eve's marathon training run
    {
        userId: userIds[4]!,
        startTime: new Date('2024-01-20T05:00:00Z'),
        endTime: new Date('2024-01-20T07:30:00Z'),
        duration: 9000, // 2h 30m
        distance: 25000, // 25km
        averageSpeed: 2.78, // m/s
        averagePace: 360, // seconds per km
        averageHeartRate: 160,
        maxHeartRate: 175,
        isIndoor: false,
        externalId: 'strava_activity_54321',
        platform: 'strava',
        sourceApp: 'Strava'
    }
];

const generatePosts = (runIds: number[], userIds: number[]) => [
    {
        userId: userIds[0]!, // Alice
        runId: runIds[0]!,
        isProfile: false
    },
    {
        userId: userIds[0]!, // Alice
        runId: runIds[1]!,
        isProfile: true
    },
    {
        userId: userIds[1]!, // Bob
        runId: runIds[2]!,
        isProfile: false
    },
    {
        userId: userIds[3]!, // David
        runId: runIds[3]!,
        isProfile: false
    },
    {
        userId: userIds[4]!, // Eve
        runId: runIds[4]!,
        isProfile: true
    }
];

const generateComments = (postIds: number[], userIds: number[]) => [
    {
        userId: userIds[1]!, // Bob commenting on Alice's post
        contentType: 'post' as const,
        contentId: postIds[0]!,
        isProfile: false
    },
    {
        userId: userIds[3]!, // David commenting on Alice's post
        contentType: 'post' as const,
        contentId: postIds[0]!,
        isProfile: false
    },
    {
        userId: userIds[4]!, // Eve commenting on Bob's post
        contentType: 'post' as const,
        contentId: postIds[2]!,
        isProfile: false
    }
];

const generateReactions = (
    postIds: number[],
    commentIds: number[],
    userIds: number[]
) => [
    {
        contentType: 'post' as const,
        contentId: postIds[0]!,
        userId: userIds[1]!, // Bob likes Alice's post
        reactionType: 'like'
    },
    {
        contentType: 'post' as const,
        contentId: postIds[0]!,
        userId: userIds[3]!, // David likes Alice's post
        reactionType: 'like'
    },
    {
        contentType: 'post' as const,
        contentId: postIds[0]!,
        userId: userIds[4]!, // Eve likes Alice's post
        reactionType: 'fire'
    },
    {
        contentType: 'post' as const,
        contentId: postIds[2]!,
        userId: userIds[0]!, // Alice likes Bob's post
        reactionType: 'like'
    },
    {
        contentType: 'post' as const,
        contentId: postIds[4]!,
        userId: userIds[0]!, // Alice likes Eve's post
        reactionType: 'fire'
    },
    {
        contentType: 'comment' as const,
        contentId: commentIds[0]!,
        userId: userIds[0]!, // Alice likes Bob's comment
        reactionType: 'like'
    }
];

// Wrap the whole task in one async IIFE so ESLint is happy
await (async () => {
    try {
        console.log('Starting database seeding...');

        // 1) Insert users
        console.log('Seeding users...');
        const insertedUsers = await db
            .insert(users)
            .values(sampleUsers)
            .returning({ id: users.id });
        const userIds = insertedUsers.map((user) => user.id);
        console.log(`✓ Created ${userIds.length.toString()} users`);

        // 2) Insert runs
        console.log('Seeding runs...');
        const runsData = generateRuns(userIds);
        const insertedRuns = await db
            .insert(runs)
            .values(runsData)
            .returning({ id: runs.id });
        const runIds = insertedRuns.map((run) => run.id);
        console.log(`✓ Created ${runIds.length.toString()} runs`);

        // 3) Insert posts
        console.log('Seeding posts...');
        const postsData = generatePosts(runIds, userIds);
        const insertedPosts = await db
            .insert(posts)
            .values(postsData)
            .returning({ id: posts.id });
        const postIds = insertedPosts.map((post) => post.id);
        console.log(`✓ Created ${postIds.length.toString()} posts`);

        // 4) Insert comments
        console.log('Seeding comments...');
        const commentsData = generateComments(postIds, userIds);
        const insertedComments = await db
            .insert(comments)
            .values(commentsData)
            .returning({ id: comments.id });
        const commentIds = insertedComments.map((comment) => comment.id);
        console.log(`✓ Created ${commentIds.length.toString()} comments`);

        // 5) Insert reactions
        console.log('Seeding reactions...');
        const reactionsData = generateReactions(postIds, commentIds, userIds);
        await db.insert(reactions).values(reactionsData);
        console.log(`✓ Created ${reactionsData.length.toString()} reactions`);

        console.log('✅ Database seeded successfully!');
        console.log('\nSeeded data summary:');
        console.log(
            `- ${userIds.length.toString()} users (including runners, regular users, and admin)`
        );
        console.log(
            `- ${runIds.length.toString()} runs (from various platforms: Apple Health, Strava, Garmin)`
        );
        console.log(
            `- ${postIds.length.toString()} posts (mix of profile and feed posts)`
        );
        console.log(`- ${commentIds.length.toString()} comments`);
        console.log(
            `- ${reactionsData.length.toString()} reactions (likes, fire emojis)`
        );
    } catch (err) {
        console.error('Database seeding failed:', err);
        process.exitCode = 1; // set exit code, defer exit to finally
    } finally {
        // Always close the pg pool so Node can exit cleanly
        await pgClient.end();
        process.exit();
    }
})();
