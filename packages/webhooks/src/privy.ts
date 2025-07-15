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

import { IdempotencyManager, webhookResponse, WebhookResponse } from './index';

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
        /* -- Verify ----------------------------------------------------------- */
        let event: PrivyWebhookEvent;
        try {
            event = (await this.cfg.privyClient.verifyWebhook(
                rawBody,
                {
                    id: hdrs.id,
                    timestamp: hdrs.timestamp,
                    signature: hdrs.signature
                },
                this.cfg.secret
            )) as PrivyWebhookEvent;
        } catch {
            return webhookResponse.error('Invalid webhook', 401);
        }

        if (
            event.type !== 'user.created' &&
            event.type !== 'user.authenticated'
        ) {
            return webhookResponse.success();
        }

        /* -- Idempotency ------------------------------------------------------ */
        const { isDuplicate, key } = await this.idemp.checkAndMark(
            hdrs.id,
            event.type
        );
        if (isDuplicate) return webhookResponse.duplicate();

        /* -- Decide which job ------------------------------------------------- */
        const basePayload = this.buildBasePayload(event.user, event.type);

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

            return webhookResponse.accepted(jobId);
        } catch (err) {
            await this.idemp.delete(key).catch(() => {});
            if (err instanceof z.ZodError) {
                return webhookResponse.error('Invalid webhook data', 400);
            }
            throw err;
        }
    }

    /* ---------------------------------------------------------------------- */
    /*  Helpers                                                               */
    /* ---------------------------------------------------------------------- */
    private buildBasePayload(
        user: User,
        eventType: 'user.created' | 'user.authenticated'
    ) {
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
            // Remove walletAddress and eventType for CREATE_WALLET job
            const {
                walletAddress: _walletAddress,
                eventType: _eventType,
                ...createWalletData
            } = data;
            const payload = CreateWalletJobSchema.parse(createWalletData);
            return { jobName: JobName.CREATE_WALLET, payload };
        }

        // Remove eventType for SYNC_PRIVY_USER job
        const { eventType: _eventType, ...syncUserData } = data;
        const payload = SyncPrivyUserJobSchema.parse(syncUserData);
        return { jobName: JobName.SYNC_PRIVY_USER, payload };
    }
}

export { PrivyWebhookHandler as default };
