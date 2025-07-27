import { Job } from 'bullmq';
import {
    CheckRunsToPostJob,
    CheckRunsToPostJobSchema,
    JobName,
    PostRunsJobSchema
} from '@phyt/m-queue/jobs';

import { appDeps } from '../di';

export async function checkRunsToPost(
    job: Job<CheckRunsToPostJob>
): Promise<{ ok: true; queued: number; cleaned: number }> {
    CheckRunsToPostJobSchema.parse(job.data);

    console.log('[CHECK RUNS JOB] Checking for runs that need to be posted...');

    try {
        const runsToCheck = await appDeps.runsService.checkRunsToPost();

        let queuedCount = 0;
        let cleanedCount = 0;

        if (!runsToCheck) throw new Error('Error fetching runs to post');

        for (const run of runsToCheck) {
            if (!run.isPosted) {
                // Run needs to be posted - queue it
                const runPayload = {
                    id: appDeps.idEncoder.encode('runs', run.id),
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

                await appDeps.postsQueue.addJobWithContext(
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
                    `[CHECK RUNS JOB] Queued run ${run.id.toString()} for posting`
                );
            } else {
                // Run is already posted but to_post is still true - clean it up
                await appDeps.runsService.fixPostedRunToPost(run.id);

                cleanedCount++;
                console.log(
                    `[CHECK RUNS JOB] Cleaned up posted run ${run.id.toString()} (marked to_post = false)`
                );
            }
        }

        console.log(
            `[CHECK RUNS JOB] Check complete: ${queuedCount.toString()} runs queued for posting, ${cleanedCount.toString()} runs cleaned up`
        );

        return { ok: true, queued: queuedCount, cleaned: cleanedCount };
    } catch (error) {
        console.error(
            `[CHECK RUNS JOB] Failed to check runs to post:`
            // error instanceof Error ? error.message : 'Unknown error'
        );
        throw error;
    }
}
