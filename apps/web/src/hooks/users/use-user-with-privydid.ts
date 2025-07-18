import { useQuery } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';

export function useUserWithPrivyDID(privyDID: string) {
    return useQuery(trpc.users.getUserByPrivyDID.queryOptions(privyDID));
}
