import type { User, LinkedAccountWithMetadata } from '@privy-io/server-auth';

export type PrivyWebhookEvent =
    | { type: 'user.created'; user: User }
    | {
          type: 'user.authenticated';
          user: User;
          account: LinkedAccountWithMetadata;
      }
    | {
          type: 'user.linked_account';
          user: User;
          account: LinkedAccountWithMetadata;
      }
    | {
          type: 'user.unlinked_account';
          user: User;
          account: LinkedAccountWithMetadata;
      }
    | {
          type: 'user.updated_account';
          user: User;
          account: LinkedAccountWithMetadata;
      }
    | {
          type: 'user.transferred_account';
          fromUser: { id: string };
          toUser: User;
          account: LinkedAccountWithMetadata;
          deletedUser: boolean;
      }
    | { type: 'mfa.enabled' | 'mfa.disabled'; user_id: string; method: string }
    | {
          type:
              | 'private_key.exported'
              | 'wallet.recovery_setup'
              | 'wallet.recovered';
          user_id: string;
          wallet_id: string;
          wallet_address: string;
          method?: string;
      }
    | { type: 'privy.test'; message: string };
