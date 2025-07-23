import { Job } from 'bullmq';
import {
    CheckRunsToPostJob,
    CheckRunsToPostJobSchema,
    JobName,
    PostRunsJobSchema
} from '@phyt/m-queue/jobs';
import { addJobWithContext, postsQueue } from '@phyt/m-queue/queue';
import { encodeRunId } from '@phyt/trpc-adapters/encoder';

import { appDeps } from '../di';

/**
 * Processor for check_runs_to_post.
 * Runs as a CRON job to check for runs that need posting.
 *
 * - Find runs where to_post = true
 * - If is_posted = false: queue for posting
 * - If is_posted = true: mark to_post = false (cleanup)
 */
export async function checkRunsToPost(
    job: Job<CheckRunsToPostJob>
): Promise<{ ok: true; queued: number; cleaned: number }> {
    CheckRunsToPostJobSchema.parse(job.data);

    console.log('[POSTS] Checking for runs that need to be posted...');

    try {
        const runsToCheck = await appDeps.runService.checkRunsToPost();

        let queuedCount = 0;
        let cleanedCount = 0;

        if (!runsToCheck) throw new Error('Error fetching runs to post');

        for (const run of runsToCheck) {
            if (!run.isPosted) {
                // Run needs to be posted - queue it
                const runPayload = {
                    id: encodeRunId(run.id),
                    startTime: run.startTime.toISOString(),
                    endTime: run.endTime.toISOString(),
                    duration: run.duration,
                    distance: run.distance,
                    averageSpeed: run.averageSpeed,
                    averagePace: run.averagePace,
                    averageHeartRate: run.averageHeartRate,
                    maxHeartRate: run.maxHeartRate,
                    isIndoor: run.isIndoor,
                    toPost: run.toPost,
                    isPosted: run.isPosted
                };

                const postRunsPayload = PostRunsJobSchema.parse({
                    run: runPayload
                });

                await addJobWithContext(
                    postsQueue,
                    JobName.POST_RUNS,
                    postRunsPayload,
                    {
                        jobId: `post-run-${run.id.toString()}-${Date.now().toString()}`,
                        removeOnComplete: { age: 3600, count: 100 },
                        removeOnFail: { age: 86400 }
                    }
                );

                queuedCount++;
                console.log(
                    `[POSTS] Queued run ${run.id.toString()} for posting`
                );
            } else {
                // Run is already posted but to_post is still true - clean it up
                await appDeps.runService.fixPostedRunToPost(run.id);

                cleanedCount++;
                console.log(
                    `[POSTS] Cleaned up posted run ${run.id.toString()} (marked to_post = false)`
                );
            }
        }

        console.log(
            `[POSTS] Check complete: ${queuedCount.toString()} runs queued for posting, ${cleanedCount.toString()} runs cleaned up`
        );

        return { ok: true, queued: queuedCount, cleaned: cleanedCount };
    } catch (error) {
        console.error(
            `❌ [POSTS] Failed to check runs to post:`,
            error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
    }
}
