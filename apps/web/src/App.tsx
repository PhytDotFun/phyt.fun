import { RouterProvider, createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';

import PrivyAppProvider from '@/context/PrivyProvider';
import { useAuth } from '@/hooks/useAuth';

const router = createRouter({
    routeTree,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    context: { authentication: undefined! },
    defaultPreload: 'intent',
    scrollRestoration: true,
    defaultStructuralSharing: true,
    defaultPreloadStaleTime: 0,
});

declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router;
    }
}

function AuthProvider() {
    const auth = useAuth();
    router.update({
        context: { authentication: auth }
    });

    return <RouterProvider router={router} />;
}

function App() {
    return (
        <PrivyAppProvider>
            <AuthProvider />
        </PrivyAppProvider>
    );
};

export default App;
