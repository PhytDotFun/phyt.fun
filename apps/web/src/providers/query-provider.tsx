import { QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import { queryClient } from '@/lib/trpc';

export default function QueryClientAppProvider({
    children
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
