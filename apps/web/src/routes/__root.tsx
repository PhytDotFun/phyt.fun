import { Outlet, createRootRouteWithContext, redirect, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useEffect } from 'react';
import type { AuthContext } from '@/hooks/useAuth';
import PrivyAppProvider from '@/providers/PrivyProvider';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/modules/layout/ui/components/Header';
import { GridBackground } from '@/modules/layout/ui/components/Background';
import { router } from '@/App';

type RouterContext = {
    authentication: AuthContext;
};

export const Route = createRootRouteWithContext<RouterContext>()({
    beforeLoad: ({ context, location }) => {
        if (location.pathname === '/login') {
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (!context.authentication?.authenticated) {
            throw redirect({ to: '/login' });
        }
    },
    component: RootComponent,
});

function RootComponent() {
    return (
        <PrivyAppProvider>
            <InnerRoot />
        </PrivyAppProvider>
    );
}

function InnerRoot() {
    const location = useLocation();
    const isLoginPage = location.pathname === '/login';
    const authentication = useAuth();

    useEffect(() => {
        router.update({
            context: {
                authentication
            }
        });
    }, [authentication]);

    if (authentication.loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-main mx-auto mb-4"></div>
                    <p className="text-foreground font-heading">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <GridBackground />
            <div className="relative z-10">
                {!isLoginPage && <Header />}
                <main className={!isLoginPage ? "pt-20" : ""}>
                    <Outlet />
                </main>
            </div>
            <TanStackRouterDevtools />
        </>
    );
}
