import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import type { AuthContext } from '@/hooks/useAuth';
import { Header } from '@/modules/layout/ui/components/Header';

type RouterContext = {
    authentication: AuthContext;
};

export const Route = createRootRouteWithContext<RouterContext>()({
    component: () => (
        <>
            <Header />
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
});
