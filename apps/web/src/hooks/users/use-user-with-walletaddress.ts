import { useQuery } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';

export function useUserWithWalletAddress(walletAddress: string) {
    return useQuery(
        trpc.users.getUserByWalletAddress.queryOptions(walletAddress)
    );
}
