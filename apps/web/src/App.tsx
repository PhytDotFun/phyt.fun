import { RouterProvider } from '@tanstack/react-router';
import { useEffect } from 'react';

import PrivyAppProvider from './providers/privy-provider';
import QueryClientAppProvider from './providers/query-provider';
import { router } from './router';
import { useAuth } from './hooks/auth/use-auth';
import { Loader } from './components/loading';
import { trpc, queryClient } from './lib/trpc';

function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <Loader />
                <p className="text-black">LOADING</p>
            </div>
        </div>
    );
}

function InnerApp() {
    const authentication = useAuth();

    // Prefetch user data when authenticated
    useEffect(() => {
        if (authentication.authenticated && authentication.ready) {
            // Prefetch the current user data so it's ready for components that need it
            queryClient
                .prefetchQuery(trpc.users.getCurrentUser.queryOptions())
                .catch((error: unknown) => {
                    // Silently handle prefetch errors - the actual components will handle errors properly
                    console.warn('Failed to prefetch current user:', error);
                });
        }
    }, [authentication.authenticated, authentication.ready]);

    if (!authentication.ready) {
        return <Loading />;
    }

    return <RouterProvider router={router} context={{ authentication }} />;
}

function App() {
    return (
        <PrivyAppProvider>
            <QueryClientAppProvider>
                <InnerApp />
            </QueryClientAppProvider>
        </PrivyAppProvider>
    );
}

export default App;
