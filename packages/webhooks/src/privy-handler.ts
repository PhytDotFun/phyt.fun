/*
DATA STRUCTURE RETURNED BY PRIVY
{
  created_at: 1752651651,
  has_accepted_terms: false,
  id: 'did:privy:cmd5njhqh00a3ld0loi2xjkp1',
  is_guest: false,
  linked_accounts: [
    {
      first_verified_at: 1752651651,
      latest_verified_at: 1752652109,
      name: 'will',
      profile_picture_url: 'https://pbs.twimg.com/profile_images/1884817300034846720/AlMXbR0n_normal.jpg',
      subject: '1874956412339781632',
      type: 'twitter_oauth',
      username: 'nicsickwilly',
      verified_at: 1752651651
    },
    {
      address: '0xEbC2866CBe8508b38F5cd96B34cf04275956c2D9',
      chain_id: 'eip155:1',
      chain_type: 'ethereum',
      connector_type: 'embedded',
      delegated: false,
      first_verified_at: 1752651652,
      id: 'gs8f2vblt1iqs0ldh590rf5l',
      imported: false,
      latest_verified_at: 1752651652,
      recovery_method: 'privy-v2',
      type: 'wallet',
      verified_at: 1752651652,
      wallet_client: 'privy',
      wallet_client_type: 'privy',
      wallet_index: 0
    }
}
*/

import { z } from 'zod';
import type { User, LinkedAccountWithMetadata } from '@privy-io/server-auth';
import {
    JobName,
    CreateWalletJobSchema,
    SyncPrivyUserJobSchema
} from '@phyt/m-queue/jobs';
import { Webhook } from 'svix';
import type { Dependencies } from '@phyt/core/di';

import { webhookResponse, type WebhookResponse } from './ops';

// Runtime data structure interfaces (snake_case from Privy API)
interface PrivyLinkedAccount {
    first_verified_at: number;
    latest_verified_at: number;
    name?: string;
    profile_picture_url?: string;
    subject: string;
    type:
        | 'twitter_oauth'
        | 'farcaster'
        | 'email'
        | 'wallet'
        | 'google_oauth'
        | 'discord_oauth'
        | 'github_oauth'
        | 'linkedin_oauth'
        | 'spotify_oauth'
        | 'tiktok_oauth'
        | 'apple_oauth';
    username?: string;
    address?: string;
    verified_at: number;
}

interface PrivyUserRuntime {
    id: string;
    linked_accounts?: PrivyLinkedAccount[];
    [key: string]: unknown;
}

type PrivyWebhookEvent = {
    type: string;
    user: User;
    account?: LinkedAccountWithMetadata;
};

interface PrivyWebhookHandlerDeps {
    secret: string;
    privy: Dependencies['privy'];
    authQueue: Dependencies['authQueue'];
    idempotency: Dependencies['idempotency'];
}

export class PrivyWebhookHandler {
    constructor(private readonly deps: PrivyWebhookHandlerDeps) {}

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
            event = this.verifySvix(rawBody, hdrs);
        } catch {
            return webhookResponse.error('Invalid webhook signature', 401);
        }

        // Check for auth event
        if (
            event.type !== 'user.created' &&
            event.type !== 'user.authenticated'
        ) {
            console.log(`[Webhook] ℹ Ignoring ${event.type} event`);
            return webhookResponse.success();
        }

        // Check for duplicate event
        const { isDuplicate, key } = await this.deps.idempotency.checkAndMark(
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

            const job = await this.deps.authQueue.add(jobName, payload, {
                jobId: `${jobName}-${event.user.id}-${Date.now().toString()}`,
                removeOnComplete: { age: 3600, count: 100 },
                removeOnFail: { age: 86400 }
            });

            console.log(
                `[Webhook] ✓ Queued ${jobName} job (${String(job.id)}) for user ${event.user.id}`
            );
            return webhookResponse.accepted(job.id);
        } catch (err) {
            console.error(
                `[Webhook] ✗ Failed to queue job for user ${event.user.id}:`,
                err instanceof Error ? err.message : 'Unknown error'
            );
            await this.deps.idempotency.delete(key).catch(() => {});
            if (err instanceof z.ZodError) {
                return webhookResponse.error('Invalid webhook data', 400);
            }
            throw err;
        }
    }

    private verifySvix(
        rawBody: string,
        hdrs: {
            id: string;
            timestamp: string;
            signature: string;
            clientIp?: string;
        }
    ): PrivyWebhookEvent {
        try {
            // Use svix directly instead of Privy's wrapper
            const wh = new Webhook(this.deps.secret);

            // Svix expects headers in the format: svix-id, svix-timestamp, svix-signature
            const svixHeaders = {
                'svix-id': hdrs.id,
                'svix-timestamp': hdrs.timestamp,
                'svix-signature': hdrs.signature
            };

            // Verify with svix directly
            const event = wh.verify(rawBody, svixHeaders) as PrivyWebhookEvent;
            console.log(`[Webhook] ✓ Verified ${event.type} event`);

            return event;
        } catch (error) {
            console.error(
                `[Webhook] ✗ Verification failed for ${hdrs.id}:`,
                error instanceof Error ? error.message : 'Unknown error'
            );
            if (error instanceof Error && error.stack) {
                console.error(`[Webhook] Stack trace:`, error.stack);
            }
            throw new Error('Invalid webhook signature');
        }
    }

    private buildBasePayload(
        user: User,
        eventType: 'user.authenticated' | 'user.created'
    ) {
        // Access the actual snake_case field from runtime data
        const runtimeUser = user as unknown as PrivyUserRuntime;
        const linkedAccounts = runtimeUser.linked_accounts || [];

        const twitterAccount = linkedAccounts.find(
            (account) => account.type === 'twitter_oauth'
        );

        const wallet = linkedAccounts.find(
            (account) => account.type === 'wallet'
        );

        // Username must be <= 15 characters (varchar(15) in database)
        const username =
            twitterAccount?.username?.slice(0, 15) ??
            `user_${user.id.slice(10, 18)}`;

        const profilePictureUrl =
            twitterAccount?.profile_picture_url ??
            'https://rsg5uys7zq.ufs.sh/f/AMgtrA9DGKkFTTUitgzI9xWiHtmo3wu4PcnYaCGO1jX0bRBQ';

        const walletAddress = wallet?.address;

        return {
            privyDID: user.id,
            username,
            profilePictureUrl,
            walletAddress: walletAddress ?? '',
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
