import { useSuspenseQuery } from '@tanstack/react-query';

import { trpc } from '@/lib/trpc';

export function useCurrentUser() {
    return useSuspenseQuery(trpc.users.getCurrentUser.queryOptions());
}
