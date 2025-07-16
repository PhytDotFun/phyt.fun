import { z } from 'zod';
import {
    PrivyClient,
    type User,
    type LinkedAccountWithMetadata
} from '@privy-io/server-auth';
import { cache } from '@phyt/redis/cache';
import {
    JobName,
    CreateWalletJobSchema,
    SyncPrivyUserJobSchema
} from '@phyt/m-queue/jobs';
import { addJobWithContext, type QueueFactory } from '@phyt/m-queue/queue';
import { Webhook } from 'svix';

import {
    IdempotencyManager,
    webhookResponse,
    type WebhookResponse
} from './helper';

type PrivyWebhookEvent = {
    type: string;
    user: User;
    account?: LinkedAccountWithMetadata;
};

interface HandlerConfig {
    privyClient: PrivyClient;
    secret: string;
    queueFactory: QueueFactory;
}

export class PrivyWebhookHandler {
    private readonly idemp = new IdempotencyManager(cache);

    constructor(private readonly cfg: HandlerConfig) {}

    async handle(
        rawBody: string,
        hdrs: {
            id: string;
            timestamp: string;
            signature: string;
            clientIp?: string;
        }
    ): Promise<
        WebhookResponse<{
            error?: string;
            message?: string;
            jobId?: string | number;
        }>
    > {
        console.log(
            `[Webhook] Processing ${hdrs.id} from ${hdrs.clientIp || 'unknown'}`
        );

        let event: PrivyWebhookEvent;
        try {
            // Use svix directly instead of Privy's wrapper
            const wh = new Webhook(this.cfg.secret);

            // Svix expects headers in the format: svix-id, svix-timestamp, svix-signature
            const svixHeaders = {
                'svix-id': hdrs.id,
                'svix-timestamp': hdrs.timestamp,
                'svix-signature': hdrs.signature
            };

            // Verify with svix directly
            event = wh.verify(rawBody, svixHeaders) as PrivyWebhookEvent;

            console.log(`[Webhook] ✓ Verified ${event.type} event`);
        } catch (error) {
            console.error(
                `[Webhook] ✗ Verification failed for ${hdrs.id}:`,
                error instanceof Error ? error.message : 'Unknown error'
            );
            if (error instanceof Error && error.stack) {
                console.error(`[Webhook] Stack trace:`, error.stack);
            }
            return webhookResponse.error('Invalid webhook signature', 401);
        }

        if (
            event.type !== 'user.created' &&
            event.type !== 'user.authenticated'
        ) {
            console.log(`[Webhook] ℹ Ignoring ${event.type} event`);
            return webhookResponse.success();
        }

        const { isDuplicate, key } = await this.idemp.checkAndMark(
            hdrs.id,
            event.type
        );
        if (isDuplicate) {
            console.log(`[Webhook] ⚠ Duplicate ${event.type} event ignored`);
            return webhookResponse.duplicate();
        }

        const basePayload = this.buildBasePayload(event.user, event.type);

        console.log(
            `[Webhook] → Processing ${event.type} for user ${event.user.id}`
        );

        try {
            const { jobName, payload } = this.selectJob(basePayload);

            const jobId = await addJobWithContext(
                this.cfg.queueFactory(),
                jobName,
                payload,
                {
                    jobId: `${jobName}-${event.user.id}-${Date.now().toString()}`,
                    removeOnComplete: { age: 3_600, count: 100 },
                    removeOnFail: { age: 86_400 }
                }
            );

            console.log(
                `[Webhook] ✓ Queued ${jobName} job (${String(jobId)}) for user ${event.user.id}`
            );
            return webhookResponse.accepted(jobId);
        } catch (err) {
            console.error(
                `[Webhook] ✗ Failed to queue job for user ${event.user.id}:`,
                err instanceof Error ? err.message : 'Unknown error'
            );
            await this.idemp.delete(key).catch(() => {});
            if (err instanceof z.ZodError) {
                return webhookResponse.error('Invalid webhook data', 400);
            }
            throw err;
        }
    }

    private buildBasePayload(
        user: User,
        eventType: 'user.created' | 'user.authenticated'
    ) {
        // Username must be <= 15 characters (varchar(15) in database)
        const username =
            user.twitter?.username?.slice(0, 15) ??
            user.farcaster?.username?.slice(0, 15) ??
            `user_${user.id.slice(0, 8)}`;

        const profilePictureUrl =
            user.twitter?.profilePictureUrl ??
            user.farcaster?.pfp ??
            'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFTTUitgzI9xWiHtmo3wu4PcnYaCGO1jX0bRBQ';

        return {
            privyDID: user.id,
            username,
            profilePictureUrl,
            walletAddress: user.wallet?.address ?? '',
            email: user.email?.address ?? null,
            role: 'user' as const,
            eventType
        };
    }

    private selectJob(
        data: ReturnType<PrivyWebhookHandler['buildBasePayload']>
    ):
        | {
              jobName: JobName.CREATE_WALLET;
              payload: z.infer<typeof CreateWalletJobSchema>;
          }
        | {
              jobName: JobName.SYNC_PRIVY_USER;
              payload: z.infer<typeof SyncPrivyUserJobSchema>;
          } {
        if (data.walletAddress.length === 0) {
            const {
                walletAddress: _walletAddress,
                eventType: _eventType,
                ...createWalletData
            } = data;
            const payload = CreateWalletJobSchema.parse(createWalletData);
            return { jobName: JobName.CREATE_WALLET, payload };
        }

        const { eventType: _eventType, ...syncUserData } = data;
        const payload = SyncPrivyUserJobSchema.parse(syncUserData);
        return { jobName: JobName.SYNC_PRIVY_USER, payload };
    }
}
