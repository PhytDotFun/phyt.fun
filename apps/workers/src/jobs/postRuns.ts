import { Job } from 'bullmq';
import { PostRunsJob, PostRunsJobSchema } from '@phyt/m-queue/jobs';

import { appDeps } from '../di';

/**
 * Processor for post_runs.
 * Handles the actual posting of runs to social media/feed.
 * This is where the actual posting logic would go.
 */
export async function postRuns(job: Job<PostRunsJob>): Promise<{ ok: true }> {
    const data = PostRunsJobSchema.parse(job.data);

    console.log(`[POSTS] Processing POST_RUNS for run ${data.run.id}`);

    try {
        const runId = appDeps.idEncoder.decode('runs', data.run.id);
        if (!runId) {
            throw new Error(`Invalid run ID: ${data.run.id}`);
        }

        console.log(`[POSTS] Posting run ${data.run.id} to feed...`);

        // Get the full run data from the database to access userId
        const fullRunData = await appDeps.runsRepository.findByRunId(runId);
        if (!fullRunData) {
            throw new Error(
                `Could not find run data for ID: ${runId.toString()}`
            );
        }

        // Create a post in the posts table using the post service
        const newPost = await appDeps.postsService.createPost({
            userId: fullRunData.userId,
            runId: runId,
            content: null, // No custom content for auto-generated posts
            visibility: 'public',
            isProfile: false
        });

        console.log(
            `[POSTS] Created post ${newPost.id} for run ${data.run.id}`
        );

        // Mark the run as posted in the database
        await appDeps.runsService.markRunAsPosted({
            id: data.run.id,
            toPost: false,
            isPosted: true
        });

        console.log(
            `[POSTS] Successfully posted run ${data.run.id} and marked as posted`
        );

        // TODO: Send notifications to followers about the new post
        // This could include:
        // - Push notifications to mobile apps
        // - Email notifications for digest subscribers
        // - In-app notification system updates

        return { ok: true };
    } catch (error) {
        console.error(
            `❌ [POSTS] Failed to post run ${data.run.id}:`,
            error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
    }
}
